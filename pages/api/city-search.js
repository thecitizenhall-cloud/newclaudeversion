// pages/api/city-search.js
// Proxies Nominatim requests server-side to avoid CORS and rate limiting issues

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { q, lat, lon } = req.query;

  try {
    let url;
    if (lat && lon) {
      // Reverse geocode — coordinates to city name
      url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    } else if (q) {
      // Forward search — city name to coordinates
      url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ", USA")}&format=json&addressdetails=1&limit=10&featuretype=city`;
    } else {
      return res.status(400).json({ error: "Provide q or lat+lon" });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "TownhallCafe/1.0 (hello@townhallcafe.org)",
        "Accept-Language": "en",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return res.status(200).json({ results: [], error: `Nominatim ${response.status}` });
    }

    const data = await response.json();

    // Cache for 1 hour — reduces hammering Nominatim
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.status(200).json({ results: Array.isArray(data) ? data : [data] });

  } catch (err) {
    console.error("city-search error:", err.message);
    return res.status(200).json({ results: [], error: err.message });
  }
}
