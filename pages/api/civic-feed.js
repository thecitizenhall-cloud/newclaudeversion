// pages/api/civic-feed.js
//
// Aggregates real civic data for a neighborhood from multiple public sources:
//   1. SeeClickFix — real 311 complaints filed by residents
//   2. Jackson Township meeting agendas
//   3. NOAA weather/emergency alerts for Ocean County NJ
//
// GET /api/civic-feed?neighborhood_id=<uuid>&city=Jackson&state=NJ&lat=40.1&lng=-74.35
//
// Returns: { items: [{ source, type, title, body, url, created_at, tag, address }] }
//
// Called by the sync job (/api/civic-sync) which posts these as native Supabase posts.

const OCEAN_COUNTY_NWS_ZONE = "NJZ022";
const JACKSON_LAT = 40.1;
const JACKSON_LNG = -74.35;
const JACKSON_ZOOM = 13; // SeeClickFix zoom level for city-sized area

// Named export for direct use by civic-sync (avoids internal HTTP call)
export async function getCivicItems({ lat = 40.1, lng = -74.35, city = "Jackson", state = "NJ" } = {}) {
  const [scfResult, agendaResult, alertResult] = await Promise.allSettled([
    fetchSeeClickFix(lat, lng),
    fetchMeetingAgendas(city, state),
    fetchWeatherAlerts(),
  ]);
  if (scfResult.status === "rejected")    console.error("SeeClickFix:", scfResult.reason?.message);
  if (agendaResult.status === "rejected") console.error("Agendas:", agendaResult.reason?.message);
  if (alertResult.status === "rejected")  console.error("Alerts:", alertResult.reason?.message);
  return [
    ...(scfResult.status  === "fulfilled" ? scfResult.value  : []),
    ...(agendaResult.status === "fulfilled" ? agendaResult.value : []),
    ...(alertResult.status === "fulfilled" ? alertResult.value  : []),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { lat = JACKSON_LAT, lng = JACKSON_LNG, city = "Jackson", state = "NJ" } = req.query;

  const [scfResult, agendaResult, alertResult] = await Promise.allSettled([
    fetchSeeClickFix(parseFloat(lat), parseFloat(lng)),
    fetchMeetingAgendas(city, state),
    fetchWeatherAlerts(),
  ]);

  const items = [
    ...(scfResult.status === "fulfilled" ? scfResult.value : []),
    ...(agendaResult.status === "fulfilled" ? agendaResult.value : []),
    ...(alertResult.status === "fulfilled" ? alertResult.value : []),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Log errors silently — partial results are fine
  if (scfResult.status === "rejected") console.error("SeeClickFix error:", scfResult.reason?.message);
  if (agendaResult.status === "rejected") console.error("Agenda error:", agendaResult.reason?.message);
  if (alertResult.status === "rejected") console.error("Alert error:", alertResult.reason?.message);

  // Cache: 15 min (issues change slowly, alerts are time-sensitive)
  res.setHeader("Cache-Control", "public, max-age=900, stale-while-revalidate=1800");
  return res.status(200).json({ items, city, state, sources: {
    seeclickfix: scfResult.status,
    agendas: agendaResult.status,
    alerts: alertResult.status,
  }});
}

// ── SeeClickFix 311 complaints ────────────────────────────────────────────────
async function fetchSeeClickFix(lat, lng) {
  // Try place_url first, fall back to lat/lng
  const urls = [
    `https://seeclickfix.com/api/v2/issues?place_url=jackson-nj&per_page=20&status=open&sort=updated_at`,
    `https://seeclickfix.com/api/v2/issues?lat=${lat}&lng=${lng}&zoom=${JACKSON_ZOOM}&per_page=20&status=open&sort=updated_at`,
    `https://seeclickfix.com/api/v2/issues?place_url=ocean-county-nj&per_page=20&status=open&sort=updated_at`,
  ];

  let data = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "TownhallCafe/1.0 (hello@townhallcafe.org)" },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.issues?.length) { data = json; break; }
      }
    } catch(e) { continue; }
  }

  if (!data?.issues?.length) return [];

  return data.issues.map(issue => {
    const type = issue.request_type?.title || "General Issue";
    const tag = classifyScfType(type);
    const address = issue.address || "";
    const body = [
      issue.description ? issue.description.slice(0, 300) : "",
      address ? `📍 ${address}` : "",
      `Status: ${issue.status || "Open"} · ${issue.comments_count || 0} comments`,
      `Originally filed on SeeClickFix`,
    ].filter(Boolean).join("\n");

    return {
      source: "seeclickfix",
      external_id: `scf_${issue.id}`,
      tag,
      title: issue.summary || type,
      body: `[${type}] ${issue.summary || "Community issue reported"}\n\n${body}`,
      url: issue.url || `https://seeclickfix.com/issues/${issue.id}`,
      address,
      created_at: issue.created_at,
      image_url: issue.media?.image_square_100x100 || null,
    };
  });
}

function classifyScfType(type) {
  const t = type.toLowerCase();
  if (t.includes("pothole") || t.includes("road") || t.includes("sidewalk") || t.includes("traffic")) return "issue";
  if (t.includes("light") || t.includes("sign") || t.includes("signal")) return "issue";
  if (t.includes("tree") || t.includes("debris") || t.includes("snow") || t.includes("flood")) return "issue";
  if (t.includes("graffiti") || t.includes("dump") || t.includes("abandon")) return "issue";
  if (t.includes("noise") || t.includes("animal") || t.includes("park")) return "issue";
  return "issue"; // all 311 complaints are issues by default
}

// ── Township meeting agendas ──────────────────────────────────────────────────
async function fetchMeetingAgendas(city, state) {
  // Jackson NJ township website — look for upcoming meeting notices
  const urls = [
    `https://www.twp.jackson.nj.us/government/township-council`,
    `https://www.twp.jackson.nj.us/`,
  ];

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "TownhallCafe/1.0 (hello@townhallcafe.org)" },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      const meetings = parseAgendaHtml(html, url, city);
      if (meetings.length) return meetings;
    } catch(e) { continue; }
  }

  // Fallback: generate upcoming known meeting dates (Jackson council meets 2nd & 4th Tuesday)
  return generateKnownMeetings(city, state);
}

function parseAgendaHtml(html, sourceUrl, city) {
  const items = [];
  const now = new Date();

  // Look for meeting-related content: dates + meeting keywords
  // Common patterns on NJ municipal sites
  const meetingPatterns = [
    /(?:council|planning|zoning|board)\s+meeting[^<]{0,200}/gi,
    /(?:agenda|minutes)\s+(?:for\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[^<]{0,100}/gi,
  ];

  // Extract PDF links with meeting-related names
  const pdfLinks = [...html.matchAll(/href="([^"]*\.pdf[^"]*)"[^>]*>([^<]{1,100})<\/a>/gi)];
  for (const [, href, text] of pdfLinks) {
    const t = text.toLowerCase();
    if (!t.includes("agenda") && !t.includes("meeting") && !t.includes("council") && !t.includes("minutes")) continue;
    const fullUrl = href.startsWith("http") ? href : new URL(href, sourceUrl).href;
    items.push({
      source: "township",
      external_id: `agenda_${Buffer.from(fullUrl).toString("base64").slice(0, 20)}`,
      tag: "bulletin",
      title: `${city} Township — ${text.trim()}`,
      body: `📋 Township document available: ${text.trim()}\n\nAccess the full document on the ${city} Township website.`,
      url: fullUrl,
      address: `${city}, NJ`,
      created_at: now.toISOString(),
      image_url: null,
    });
  }

  return items.slice(0, 5);
}

function generateKnownMeetings(city, state) {
  // Jackson NJ Council meets 2nd and 4th Tuesday of each month
  // Planning Board meets 1st and 3rd Wednesday
  const now = new Date();
  const meetings = [];

  // Find next few meeting dates
  const upcomingDates = getUpcomingMeetings(now);

  for (const meeting of upcomingDates.slice(0, 3)) {
    const dateStr = meeting.date.toLocaleDateString("en-US", { weekday:"long", month:"long", day:"numeric" });
    meetings.push({
      source: "township",
      external_id: `meeting_${meeting.type}_${meeting.date.toISOString().slice(0,10)}`,
      tag: "bulletin",
      title: `${city} ${meeting.label} — ${dateStr}`,
      body: `📋 ${meeting.label}\n📅 ${dateStr} at ${meeting.time}\n📍 ${meeting.location}\n\nView agendas and information on the Jackson Township website.`,
      url: `https://www.twp.jackson.nj.us/government/township-council`,
      address: `${city}, ${state}`,
      created_at: now.toISOString(),
      image_url: null,
    });
  }

  return meetings;
}

function getUpcomingMeetings(from) {
  const meetings = [];
  const date = new Date(from);

  for (let i = 0; i < 60; i++) {
    date.setDate(date.getDate() + 1);
    const dow = date.getDay(); // 0=Sun, 2=Tue, 3=Wed
    const weekOfMonth = Math.ceil(date.getDate() / 7);

    // Jackson Council: 2nd & 4th Tuesday
    if (dow === 2 && (weekOfMonth === 2 || weekOfMonth === 4)) {
      meetings.push({
        date: new Date(date),
        type: "council",
        label: "Township Council Meeting",
        time: "7:00 PM",
        location: "Jackson Municipal Building, 95 W Veterans Hwy",
      });
    }

    // Planning Board: 1st & 3rd Wednesday
    if (dow === 3 && (weekOfMonth === 1 || weekOfMonth === 3)) {
      meetings.push({
        date: new Date(date),
        type: "planning",
        label: "Planning Board Meeting",
        time: "7:00 PM",
        location: "Jackson Municipal Building, 95 W Veterans Hwy",
      });
    }

    if (meetings.length >= 4) break;
  }

  return meetings;
}

// ── NOAA Weather / Emergency Alerts ──────────────────────────────────────────
async function fetchWeatherAlerts() {
  // NWS CAP alerts for NJ — filter to Ocean County zone
  const url = `https://api.weather.gov/alerts/active?zone=${OCEAN_COUNTY_NWS_ZONE}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "TownhallCafe/1.0 (hello@townhallcafe.org)",
      "Accept": "application/geo+json",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return [];

  const data = await res.json();
  const features = data.features || [];

  // Only show significant alerts — not every minor notice
  const significantTypes = new Set([
    "Tornado Warning", "Tornado Watch",
    "Flash Flood Warning", "Flash Flood Watch", "Flood Warning", "Flood Watch",
    "Winter Storm Warning", "Winter Storm Watch", "Blizzard Warning",
    "Hurricane Warning", "Hurricane Watch", "Tropical Storm Warning",
    "Severe Thunderstorm Warning", "Severe Thunderstorm Watch",
    "Heat Advisory", "Excessive Heat Warning",
    "Freeze Warning", "Hard Freeze Warning",
    "Special Weather Statement",
  ]);

  return features
    .filter(f => significantTypes.has(f.properties?.event))
    .map(f => {
      const p = f.properties;
      const severity = p.severity || "Unknown";
      const emoji = alertEmoji(p.event);
      return {
        source: "noaa",
        external_id: `alert_${p.id}`,
        tag: "bulletin",
        title: `${emoji} ${p.event} — Ocean County`,
        body: [
          p.headline || p.event,
          "",
          p.description ? p.description.slice(0, 400) : "",
          "",
          p.instruction ? `⚠️ ${p.instruction.slice(0, 200)}` : "",
          "",
          `Expires: ${p.expires ? new Date(p.expires).toLocaleString("en-US", { month:"short", day:"numeric", hour:"numeric", minute:"2-digit" }) : "See NWS"}`,
          `Source: National Weather Service`,
        ].filter(l => l !== null).join("\n").trim(),
        url: p.web || "https://www.weather.gov/phi/",
        address: "Ocean County, NJ",
        created_at: p.sent || p.effective || new Date().toISOString(),
        image_url: null,
      };
    });
}

function alertEmoji(event) {
  const e = event?.toLowerCase() || "";
  if (e.includes("tornado")) return "🌪️";
  if (e.includes("flood")) return "🌊";
  if (e.includes("winter") || e.includes("blizzard") || e.includes("freeze")) return "❄️";
  if (e.includes("hurricane") || e.includes("tropical")) return "🌀";
  if (e.includes("thunder") || e.includes("lightning")) return "⛈️";
  if (e.includes("heat")) return "🌡️";
  return "⚠️";
}
