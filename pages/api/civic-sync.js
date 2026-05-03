// pages/api/civic-sync.js
//
// Background sync job — fetches civic data and posts new items as native
// Supabase posts attributed to the Townhall bot user.
//
// Vercel Cron (vercel.json): runs every 2 hours automatically
// Manual test: GET /api/civic-sync?secret=<CRON_SECRET>

import { createClient } from "@supabase/supabase-js";
import { getCivicItems } from "./civic-feed";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BOT_USER_ID         = process.env.TOWNHALL_BOT_USER_ID    || "00000000-0000-0000-0000-000000000001";
const DEFAULT_HOOD_ID     = process.env.DEFAULT_NEIGHBORHOOD_ID || "58e6f680-8339-4787-abf2-1773f757da0b";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth check — cron header (Vercel sets this automatically) OR secret param
  const secret     = req.query.secret || req.headers["x-cron-secret"];
  const cronHeader = req.headers["x-vercel-cron"];
  if (!cronHeader && secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized — provide ?secret= or call via Vercel cron" });
  }

  const {
    neighborhood_id = DEFAULT_HOOD_ID,
    city  = "Jackson",
    state = "NJ",
    lat   = "40.1",
    lng   = "-74.35",
  } = req.query;

  try {
    // 1. Fetch civic items directly (no internal HTTP call)
    const items = await getCivicItems({
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      city,
      state,
    });

    if (!items?.length) {
      return res.status(200).json({ synced: 0, message: "No items returned from sources" });
    }

    // 2. Find which external_ids already exist
    const externalIds = items.map(i => i.external_id).filter(Boolean);
    const { data: existing } = await supabaseAdmin
      .from("posts")
      .select("external_id")
      .in("external_id", externalIds);

    const existingIds = new Set((existing || []).map(p => p.external_id));
    const newItems = items.filter(i => i.external_id && !existingIds.has(i.external_id));

    if (!newItems.length) {
      return res.status(200).json({ synced: 0, message: "All items already synced" });
    }

    // 3. Insert new posts as the bot user
    const posts = newItems.map(item => ({
      author_id:       BOT_USER_ID,
      neighborhood_id,
      body:            formatBody(item),
      tags:            [item.tag || "bulletin"],
      upvote_count:    0,
      escalated:       false,
      external_id:     item.external_id,
      source_url:      item.url || null,
      source_name:     item.source_label || sourceName(item.source),
      created_at:      clampDate(item.created_at),
    }));

    const { data: inserted, error } = await supabaseAdmin
      .from("posts")
      .insert(posts)
      .select("id, external_id");

    if (error) throw new Error(error.message);

    return res.status(200).json({
      synced:  inserted?.length || 0,
      city,
      sources: [...new Set(newItems.map(i => i.source))],
      items:   newItems.length,
      ids:     inserted?.map(p => p.id),
    });

  } catch (err) {
    console.error("[civic-sync] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

function formatBody(item) {
  const parts = [item.body || item.title];
  if (item.url) parts.push("\n🔗 " + item.url);
  parts.push("\n— " + (item.source_label || sourceName(item.source)));
  return parts.join("").slice(0, 2000);
}

function sourceName(source) {
  return {
    seeclickfix: "SeeClickFix · 311",
    township:    "Jackson Township",
    noaa:        "National Weather Service",
  }[source] || "Townhall";
}

function clampDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  return isNaN(d) || d > now ? now.toISOString() : d.toISOString();
}
