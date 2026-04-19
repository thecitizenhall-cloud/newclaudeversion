// pages/api/civic-lookup.js
//
// Server-side proxy for Google Civic Information API.
// Keeps the API key off the client.
//
// GET /api/civic-lookup?name=Jane+Smith&address=123+Main+St+Springfield+IL
//
// Returns: { match: {...} | null, candidates: [...] }

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name, address } = req.query;
  if (!name || !address) {
    return res.status(400).json({ error: "name and address are required" });
  }

  const apiKey = process.env.GOOGLE_CIVIC_API_KEY;
  if (!apiKey) {
    // No API key configured — return unverified so admin can review manually
    return res.status(200).json({ match: null, candidates: [], manualReview: true });
  }

  try {
    // Google Civic Information API — representatives by address
    const url = new URL("https://civicinfo.googleapis.com/civicinfo/v2/representatives");
    url.searchParams.set("address", address);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      return res.status(200).json({ match: null, candidates: [], manualReview: true });
    }

    const data = await response.json();

    // Flatten officials from all offices
    const officials = [];
    const offices = data.offices || [];
    const officialsData = data.officials || [];

    offices.forEach(office => {
      (office.officialIndices || []).forEach(idx => {
        const official = officialsData[idx];
        if (official) {
          officials.push({
            name:         official.name,
            office:       office.name,
            party:        official.party,
            phones:       official.phones || [],
            emails:       official.emails || [],
            urls:         official.urls || [],
            photoUrl:     official.photoUrl,
            divisionId:   office.divisionId,
          });
        }
      });
    });

    // Try to find a name match (case-insensitive, partial)
    const searchName = name.toLowerCase().trim();
    const candidates = officials.filter(o =>
      o.name.toLowerCase().includes(searchName) ||
      searchName.includes(o.name.toLowerCase().split(" ").pop()) // last name match
    );

    const exactMatch = officials.find(o =>
      o.name.toLowerCase() === searchName
    );

    return res.status(200).json({
      match:      exactMatch || candidates[0] || null,
      candidates: candidates.slice(0, 5),
      total:      officials.length,
      manualReview: candidates.length === 0,
    });

  } catch (err) {
    console.error("Civic API error:", err);
    // Fail gracefully — send to manual review
    return res.status(200).json({ match: null, candidates: [], manualReview: true });
  }
}
