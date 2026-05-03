// pages/api/zk-neighborhood.js
//
// Returns the polygon vertices and verification key for a given neighborhood.
// Called by the browser before proof generation.
//
// GET /api/zk-neighborhood?id=<neighborhood_uuid>
//
// Returns:
// {
//   neighborhoodId: "<uuid>",
//   name: "Harmony Farms",
//   vertices: [{ lat, lng }, ...],   // polygon vertices in decimal degrees
//   boundaryHash: "<bigint string>",  // pre-computed Poseidon hash of vertices
// }
//
// NOTE: This does NOT return the vkey (that stays server-side in the edge function).
// The WASM prover only needs the polygon vertices as circuit inputs.

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SCALE = 1_000_000;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: "neighborhood id required" });
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return res.status(400).json({ error: "invalid neighborhood id" });
  }

  try {
    // Fetch neighborhood with boundary as GeoJSON
    const { data: hood, error } = await supabase
      .from("neighborhoods")
      .select("id, name, boundary, center_lat, center_lng")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!hood) return res.status(404).json({ error: "neighborhood not found" });

    // ── Extract polygon vertices ───────────────────────────────────────────
    let vertices;

    if (hood.boundary) {
      // Boundary is stored as PostGIS geography — fetch as GeoJSON
      const { data: geo } = await supabase.rpc("get_neighborhood_geojson", {
        neighborhood_id: id,
      });

      if (geo?.coordinates?.[0]) {
        // GeoJSON coordinates are [lng, lat]
        const raw = geo.coordinates[0].slice(0, -1); // remove closing vertex
        vertices = raw.map(([lng, lat]) => ({ lat, lng }));
      }
    }

    // Fallback: generate approximate bounding box from center point
    // Used when boundary is null (most neighborhoods created without PostGIS polygon)
    if (!vertices && hood.center_lat && hood.center_lng) {
      vertices = generateBoundingBox(hood.center_lat, hood.center_lng, 0.005);
    }

    if (!vertices) {
      return res.status(422).json({
        error: "Neighborhood has no boundary polygon. Cannot generate ZK proof.",
        hint: "Add a boundary polygon to this neighborhood in Supabase.",
      });
    }

    // ── Pad to exactly 8 vertices ──────────────────────────────────────────
    vertices = padToEight(vertices);

    // ── Cache 1 hour (polygon rarely changes) ─────────────────────────────
    res.setHeader("Cache-Control", "public, max-age=3600");

    return res.status(200).json({
      neighborhoodId: hood.id,
      name:           hood.name,
      vertices,       // [{ lat, lng }, ...] — 8 vertices
      center: {
        lat: hood.center_lat,
        lng: hood.center_lng,
      },
    });

  } catch (err) {
    console.error("zk-neighborhood error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ── Generate an approximate bounding box around a center point ────────────────
// radius in decimal degrees (~0.005° ≈ 500 meters)
function generateBoundingBox(lat, lng, radius) {
  // 8-point octagon approximating a circle
  const angles = [0, 45, 90, 135, 180, 225, 270, 315];
  return angles.map(deg => {
    const rad = (deg * Math.PI) / 180;
    return {
      lat: lat + radius * Math.cos(rad),
      lng: lng + radius * Math.sin(rad),
    };
  });
}

// ── Pad or simplify polygon to exactly 8 vertices ─────────────────────────────
function padToEight(vertices) {
  if (vertices.length === 8) return vertices;

  if (vertices.length > 8) {
    // Evenly sample 8 vertices
    const step = vertices.length / 8;
    return Array.from({ length: 8 }, (_, i) =>
      vertices[Math.min(Math.floor(i * step), vertices.length - 1)]
    );
  }

  // Pad by repeating last vertex
  const padded = [...vertices];
  while (padded.length < 8) {
    padded.push(vertices[vertices.length - 1]);
  }
  return padded;
}
