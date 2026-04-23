// pages/api/neighborhoods-lookup.js
//
// Queries OpenStreetMap Overpass API for neighborhoods in a given city.
// Called by the onboarding screen when a user selects a city.
//
// GET /api/neighborhoods-lookup?city=Chicago&state=IL&lat=41.8781&lng=-87.6298
//
// Returns: { neighborhoods: [{ name, lat, lng }] }

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { city, state, lat, lng } = req.query;
  if (!city || !lat || !lng) {
    return res.status(400).json({ error: "city, lat and lng are required" });
  }

  const latitude  = parseFloat(lat);
  const longitude = parseFloat(lng);

  // Build Overpass query
  // Searches for place=neighbourhood/suburb/quarter within ~15km of city center
  // Uses around filter centered on city coordinates
  const query = `
    [out:json][timeout:25];
    (
      node["place"="neighbourhood"](around:20000,${latitude},${longitude});
      node["place"="suburb"](around:20000,${latitude},${longitude});
      node["place"="quarter"](around:20000,${latitude},${longitude});
    );
    out body;
  `;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    "data=" + encodeURIComponent(query),
      signal:  AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    const elements = data.elements || [];

    // Extract neighborhood names and deduplicate
    const seen = new Set();
    const neighborhoods = elements
      .filter(el => el.tags?.name && el.lat && el.lon)
      .map(el => ({
        name: el.tags.name,
        lat:  el.lat,
        lng:  el.lon,
      }))
      .filter(n => {
        if (seen.has(n.name)) return false;
        seen.add(n.name);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    // If Overpass returned nothing try a wider search with area name
    if (neighborhoods.length === 0) {
      return res.status(200).json({
        neighborhoods: [],
        message:       "No neighborhoods found in OpenStreetMap for this city. You can create one.",
        source:        "overpass",
      });
    }

    return res.status(200).json({
      neighborhoods,
      count:  neighborhoods.length,
      source: "overpass",
    });

  } catch (err) {
    console.error("Overpass API error:", err.message);

    // Fail gracefully — return empty so onboarding can still proceed
    return res.status(200).json({
      neighborhoods: [],
      message:       "Could not load neighborhoods automatically. You can enter yours manually.",
      source:        "error",
      error:         err.message,
    });
  }
}
