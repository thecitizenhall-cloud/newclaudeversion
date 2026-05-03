// pages/api/save-neighborhoods.js
//
// Saves a batch of neighborhoods returned from /api/neighborhoods-lookup into Supabase.
// Called by OnboardingScreen after the user picks their city.
//
// Now also stores OSM polygon geometry in the `boundary` column (PostGIS geography)
// when available, enabling real ZK proof generation via /api/zk-neighborhood.
//
// POST /api/save-neighborhoods
// Body: {
//   cityId: string,
//   neighborhoods: [
//     {
//       name: string,
//       lat: number,
//       lng: number,
//       slug?: string,
//       polygon?: [{ lat, lng }, ...]   // 8-vertex OSM polygon or null
//     }
//   ]
// }
//
// Returns: { saved: number, errors: number }

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { cityId, neighborhoods } = req.body;

  if (!cityId || !Array.isArray(neighborhoods) || neighborhoods.length === 0) {
    return res.status(400).json({ error: "cityId and neighborhoods[] required" });
  }

  let saved = 0;
  let errors = 0;

  for (const n of neighborhoods) {
    if (!n.name || isNaN(n.lat) || isNaN(n.lng)) {
      errors++;
      continue;
    }

    const slug = n.slug || n.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    // Convert polygon [{lat, lng}...] to PostGIS WKT POLYGON string
    // PostGIS requires: SRID=4326;POLYGON((lng lat, lng lat, ...))
    // The ring must close — first and last point must be identical
    let boundaryWkt = null;
    if (Array.isArray(n.polygon) && n.polygon.length >= 3) {
      const ring = n.polygon.map(p => `${p.lng} ${p.lat}`);
      // Close the ring if not already closed
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first !== last) ring.push(first);
      boundaryWkt = `SRID=4326;POLYGON((${ring.join(",")}))`;
    }

    const record = {
      name:        n.name,
      slug:        slug,
      city_id:     cityId,
      center_lat:  n.lat,
      center_lng:  n.lng,
    };

    // Only include boundary if we have a valid polygon
    // The boundary column is type geography(Polygon,4326) — pass WKT string
    if (boundaryWkt) {
      record.boundary = boundaryWkt;
    }

    const { error } = await supabase
      .from("neighborhoods")
      .upsert(record, { onConflict: "city_id,slug", ignoreDuplicates: false });

    if (error) {
      console.error(`save-neighborhoods error for ${n.name}:`, error.message);
      errors++;
    } else {
      saved++;
    }
  }

  return res.status(200).json({ saved, errors });
}
