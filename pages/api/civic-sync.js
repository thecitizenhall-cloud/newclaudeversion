// pages/api/civic-sync.js
//
// Background sync job — fetches civic-feed and posts new items as native 
// Supabase posts attributed to the Townhall bot user.
//
// Call this via a cron job:
//   Vercel Cron (vercel.json): "0 */30 * * * *"  — every 30 minutes
//   Or: call manually from admin panel
//
// GET /api/civic-sync?secret=<CRON_SECRET>&neighborhood_id=<uuid>&city=Jackson&state=NJ&lat=40.1&lng=-74.35
//
// The bot user must be pre-created in Supabase:
//   See setup SQL below (supabase/seed_bot_user.sql)

import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Bot user ID — must match what's seeded in Supabase
// This is a fixed well-known UUID for the Townhall system user
const BOT_USER_ID = process.env.TOWNHALL_BOT_USER_ID || "00000000-0000-0000-0000-000000000001";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Protect the endpoint — only callable with secret or from Vercel cron
  const secret = req.query.secret || req.headers["x-cron-secret"];
  const cronHeader = req.headers["x-vercel-cron"];
  if (!cronHeader && secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const {
    neighborhood_id = process.env.DEFAULT_NEIGHBORHOOD_ID,
    city = "Jackson",
    state = "NJ",
    lat = "40.1",
    lng = "-74.35",
  } = req.query;

  if (!neighborhood_id) {
    return res.status(400).json({ error: "neighborhood_id required" });
  }

  try {
    // 1. Fetch civic feed
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const feedRes = await fetch(
      `${baseUrl}/api/civic-feed?city=${encodeURIComponent(city)}&state=${encodeURIComponent(state)}&lat=${lat}&lng=${lng}`
    );
    if (!feedRes.ok) throw new Error(`Civic feed failed: ${feedRes.status}`);
    const { items } = await feedRes.json();

    if (!items?.length) {
      return res.status(200).json({ synced: 0, message: "No items to sync" });
    }

    // 2. Check which external_ids already exist to avoid duplicates
    const externalIds = items.map(i => i.external_id).filter(Boolean);
    const { data: existing } = await supabaseAdmin
      .from("posts")
      .select("external_id")
      .in("external_id", externalIds);

    const existingIds = new Set((existing || []).map(p => p.external_id));

    // 3. Filter to new items only
    const newItems = items.filter(item =>
      item.external_id && !existingIds.has(item.external_id)
    );

    if (!newItems.length) {
      return res.status(200).json({ synced: 0, message: "All items already synced" });
    }

    // 4. Insert new posts as the bot user
    const posts = newItems.map(item => ({
      author_id:     BOT_USER_ID,
      neighborhood_id,
      body:          formatPostBody(item),
      tags:          [item.tag || "bulletin"],
      upvote_count:  0,
      escalated:     false,
      external_id:   item.external_id,
      source_url:    item.url || null,
      source_name:   sourceName(item.source),
      created_at:    clampDate(item.created_at), // don't post future dates
    }));

    const { data: inserted, error } = await supabaseAdmin
      .from("posts")
      .insert(posts)
      .select("id, external_id");

    if (error) throw new Error(error.message);

    console.log(`[civic-sync] Synced ${inserted?.length || 0} new posts for ${city}, ${state}`);

    return res.status(200).json({
      synced: inserted?.length || 0,
      city,
      sources: [...new Set(newItems.map(i => i.source))],
      ids: inserted?.map(p => p.id),
    });

  } catch (err) {
    console.error("[civic-sync] Error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

function formatPostBody(item) {
  const source = sourceName(item.source);
  const lines = [item.body || item.title];

  if (item.url) {
    lines.push(`\n🔗 ${item.url}`);
  }

  lines.push(`\n— ${source}`);
  return lines.join("").slice(0, 2000);
}

function sourceName(source) {
  const names = {
    seeclickfix: "SeeClickFix · 311",
    township:    "Jackson Township",
    noaa:        "National Weather Service",
    reddit:      "Reddit · Local",
    news:        "Local News",
  };
  return names[source] || "Townhall";
}

function clampDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  // Don't use future dates — post as now
  return date > now ? now.toISOString() : date.toISOString();
}
