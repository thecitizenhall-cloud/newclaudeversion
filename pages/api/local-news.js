// pages/api/local-news.js
//
// Fetches hyperlocal news for a given city from:
// 1. Google News RSS (broad coverage, any US city)
// 2. Patch.com RSS (hyperlocal community news)
//
// GET /api/local-news?city=Jackson&state=NJ
// Returns: { articles: [{ title, summary, url, source, publishedAt }] }

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { city, state } = req.query;
  if (!city) return res.status(400).json({ error: "city is required" });

  const cityState = state ? `${city} ${state}` : city;

  // Fetch both sources in parallel
  const [googleResult, patchResult] = await Promise.allSettled([
    fetchGoogleNews(cityState),
    fetchPatch(city, state),
  ]);

  const googleArticles = googleResult.status === "fulfilled" ? googleResult.value : [];
  const patchArticles  = patchResult.status  === "fulfilled" ? patchResult.value  : [];

  // Merge, deduplicate by title, sort by date
  const seen = new Set();
  const articles = [...patchArticles, ...googleArticles]
    .filter(a => {
      const key = a.title.toLowerCase().slice(0, 40);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 10);

  // Cache 30 minutes — fresh enough, not hammering RSS feeds
  res.setHeader("Cache-Control", "public, max-age=1800, stale-while-revalidate=3600");
  return res.status(200).json({ articles, city: cityState });
}

async function fetchGoogleNews(cityState) {
  const query = encodeURIComponent(`${cityState} local news`);
  const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;

  const res = await fetch(url, {
    headers: { "User-Agent": "TownhallCafe/1.0 (hello@townhallcafe.org)" },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];

  const xml = await res.text();
  return parseRSS(xml, "Google News");
}

async function fetchPatch(city, state) {
  // Patch uses city-state slug format
  const slug = `${city}-${state || ""}`.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const url = `https://patch.com/rss/${slug}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "TownhallCafe/1.0 (hello@townhallcafe.org)" },
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return [];

    const xml = await res.text();
    return parseRSS(xml, "Patch");
  } catch {
    return [];
  }
}

function parseRSS(xml, source) {
  const articles = [];

  // Extract items using regex — no XML parser needed
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];

    const title     = extractTag(item, "title");
    const link      = extractTag(item, "link") || extractTag(item, "guid");
    const pubDate   = extractTag(item, "pubDate");
    const desc      = extractTag(item, "description");

    if (!title || !link) continue;

    // Clean HTML from description
    const summary = desc
      ? desc.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").slice(0, 200).trim()
      : "";

    articles.push({
      title:       cleanText(title),
      summary,
      url:         link.trim(),
      source,
      publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
    });
  }

  return articles.slice(0, 8);
}

function extractTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return match ? (match[1] || match[2] || "").trim() : null;
}

function cleanText(text) {
  return text
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}
