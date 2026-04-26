// pages/api/save-neighborhoods.js
//
// Server-side endpoint to save neighborhoods from Overpass/Nominatim to Supabase.
// Uses service role key to bypass RLS — safe because this only inserts neighborhood names.
//
// POST /api/save-neighborhoods
// Body: { neighborhoods: [{ name, lat, lng }], city_id: uuid }
// Returns: { saved: [{ id, name, center_lat, center_lng }] }

import { createClient } from "@supabase/supabase-js";

// Service role key bypasses RLS — only use server-side, never expose to client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { neighborhoods, city_id } = req.body;

  if (!neighborhoods?.length || !city_id) {
    return res.status(400).json({ error: "neighborhoods and city_id required" });
  }

  // Validate city_id is a real UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(city_id)) {
    return res.status(400).json({ error: "Invalid city_id" });
  }

  try {
    const toInsert = neighborhoods.map(n => ({
      name:       n.name,
      slug:       `${n.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${city_id.slice(0, 8)}`,
      city_id,
      center_lat: n.lat || null,
      center_lng: n.lng || null,
    }));

    const { data, error } = await supabaseAdmin
      .from("neighborhoods")
      .upsert(toInsert, { onConflict: "slug", ignoreDuplicates: true })
      .select("id, name, center_lat, center_lng");

    if (error) {
      console.error("Neighborhood save error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ saved: data || [] });
  } catch (err) {
    console.error("Save neighborhoods error:", err);
    return res.status(500).json({ error: err.message });
  }
}
