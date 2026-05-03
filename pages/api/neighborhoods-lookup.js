// pages/api/neighborhoods-lookup.js
//
// Finds neighborhoods within a given city, including real polygon boundaries.
//
// Layer 1: Overpass API (OpenStreetMap) — fetches ways/relations with full geometry
//          so we get actual polygon boundaries, not just centroids.
//          These are stored in neighborhoods.boundary (PostGIS geography column)
//          enabling real ZK proof generation.
//
// Layer 2: Hardcoded name list for major US cities (no polygon geometry available)
//          Falls back to bounding-box approximation in zk-neighborhood.js
//
// Layer 3: Nominatim fallback — centroids only, same fallback for ZK
//
// GET /api/neighborhoods-lookup?city=Chicago&state=IL&lat=41.8781&lng=-87.6298
//
// Returns:
// {
//   neighborhoods: [
//     {
//       name: "Lincoln Park",
//       lat: 41.921,          // centroid lat
//       lng: -87.634,         // centroid lng
//       polygon: [            // OSM polygon vertices — null if unavailable
//         { lat: 41.930, lng: -87.650 },
//         ...
//       ]
//     }
//   ],
//   source: "overpass" | "fallback" | "nominatim" | "empty"
// }

const CITY_NEIGHBORHOODS = {
  "New York City": ["Astoria","Battery Park","Bedford-Stuyvesant","Bensonhurst","Bronx Park","Brooklyn Heights","Bushwick","Carroll Gardens","Chelsea","Chinatown","Clinton Hill","Cobble Hill","Crown Heights","East Harlem","East Village","Financial District","Flatbush","Flushing","Forest Hills","Fort Greene","Greenpoint","Greenwich Village","Harlem","Hell's Kitchen","Jackson Heights","Jamaica","Kensington","Long Island City","Lower East Side","Midtown","Murray Hill","NoHo","Nolita","Park Slope","Prospect Heights","Queens Village","Red Hook","Ridgewood","SoHo","Sunnyside","Sunset Park","Tribeca","Upper East Side","Upper West Side","Washington Heights","Williamsburg","Woodside"],
  "Los Angeles": ["Baldwin Hills","Bel Air","Boyle Heights","Brentwood","Canoga Park","Chatsworth","Chinatown","Culver City","Downtown","Eagle Rock","Echo Park","El Sereno","Encino","Granada Hills","Highland Park","Hollywood","Koreatown","Little Tokyo","Los Feliz","Mar Vista","Mid-City","Mid-Wilshire","Mission Hills","North Hollywood","Northridge","Pacific Palisades","Pacoima","Palms","Pico-Robertson","Playa del Rey","Porter Ranch","Reseda","San Pedro","Santa Monica","Sherman Oaks","Silver Lake","Studio City","Sun Valley","Sylmar","Tarzana","Toluca Lake","Van Nuys","Venice","West Adams","West Hollywood","West Los Angeles","Westchester","Westwood","Woodland Hills"],
  "Chicago": ["Albany Park","Andersonville","Avondale","Beverly","Boystown","Bridgeport","Brighton Park","Bronzeville","Bucktown","Burnside","Chatham","Chinatown","Douglas","Dunning","East Garfield Park","Edison Park","Edgewater","Englewood","Forest Glen","Fuller Park","Gage Park","Garfield Ridge","Gold Coast","Grand Crossing","Greektown","Hegewisch","Humboldt Park","Hyde Park","Irving Park","Jefferson Park","Kenwood","Lake View","Lincoln Park","Lincoln Square","Little Italy","Little Village","Logan Square","Loop","Morgan Park","Mount Greenwood","Near North Side","Near South Side","Near West Side","Noble Square","North Center","North Park","Norwood Park","Pilsen","Portage Park","Pullman","Ravenswood","River North","Rogers Park","Roseland","Roscoe Village","South Loop","South Shore","Ukrainian Village","Uptown","West Loop","West Ridge","West Town","Wicker Park","Wrigleyville"],
  "Houston": ["Acres Homes","Alief","Bellaire","Braeswood","Clear Lake","Cypress","Downtown","East End","Energy Corridor","Fifth Ward","Galleria","Garden Oaks","Greater Heights","Greenway Plaza","Heights","Hermann Park","Humble","Kingwood","Magnolia Park","Meyerland","Midtown","Montrose","Museum District","Near Northside","Northside","Oak Forest","River Oaks","Second Ward","Sharpstown","Sunnyside","Tanglewood","Third Ward","Timbergrove","University Place","Upper Kirby","Westheimer","Westwood"],
  "Phoenix": ["Ahwatukee","Arcadia","Biltmore","Camelback East","Central City","Deer Valley","Desert View","Downtown","Encanto","Estrella","Laveen","Maryvale","Moon Valley","North Gateway","North Mountain","Paradise Valley","South Mountain","Sunnyslope"],
  "Philadelphia": ["Bella Vista","Brewerytown","Cedar Park","Chestnut Hill","Chinatown","Cobbs Creek","East Falls","East Passyunk","Fairmount","Fishtown","Frankford","Germantown","Graduate Hospital","Italian Market","Kensington","Manayunk","Mayfair","Newbold","Northern Liberties","Old City","Oxford Circle","Passyunk Square","Point Breeze","Port Richmond","Queen Village","Rittenhouse Square","Roxborough","Society Hill","South Philly","Spring Garden","Strawberry Mansion","University City","West Philly","Wissahickon"],
  "San Antonio": ["Alamo Heights","Castle Hills","Downtown","East Side","Hill Country Village","King William","Lackland","Leon Valley","Medical Center","Monte Vista","North Side","Northside","Shavano Park","South Side","Terrell Hills","Tobin Hill","West Side","Windcrest"],
  "San Diego": ["Balboa Park","Barrio Logan","Bay Park","Carmel Valley","Clairemont","College Area","Downtown","East Village","Encanto","Gaslamp Quarter","Golden Hill","Hillcrest","Kearny Mesa","La Jolla","Linda Vista","Little Italy","Logan Heights","Mission Hills","Mission Valley","North Park","Normal Heights","Ocean Beach","Old Town","Pacific Beach","Point Loma","Rancho Bernardo","Serra Mesa","South Park","Tierrasanta","University City","University Heights"],
  "Dallas": ["Arts District","Bishop Arts","Deep Ellum","Design District","Downtown","East Dallas","Fair Park","Highland Park","Knox-Henderson","Lakewood","Lake Highlands","Lower Greenville","M Streets","North Dallas","Oak Cliff","Oak Lawn","Old East Dallas","Park Cities","Pleasant Grove","Prestonwood","South Dallas","Swiss Avenue","Trinity Groves","Turtle Creek","Uptown","University Park","Victory Park","White Rock Lake"],
  "Seattle": ["Ballard","Beacon Hill","Belltown","Capitol Hill","Central District","Columbia City","Crown Hill","Delridge","Downtown","Eastlake","First Hill","Fremont","Georgetown","Green Lake","Greenwood","International District","Lake City","Leschi","Madison Park","Madrona","Magnolia","Maple Leaf","Mount Baker","Northgate","Phinney Ridge","Pioneer Square","Queen Anne","Rainier Beach","Rainier Valley","Ravenna","SoDo","South Lake Union","South Park","University District","Wallingford","Wedgwood","West Seattle"],
  "San Francisco": ["Alamo Square","Bayview","Bernal Heights","Castro","Chinatown","Civic Center","Cow Hollow","Diamond Heights","Dogpatch","Downtown","Duboce Triangle","Excelsior","Financial District","Glen Park","Haight-Ashbury","Hayes Valley","Inner Richmond","Inner Sunset","Japantown","Lower Haight","Marina","Mission","Nob Hill","Noe Valley","North Beach","Outer Richmond","Outer Sunset","Pacific Heights","Portola","Potrero Hill","Presidio","Russian Hill","SoMa","Sunset","Tenderloin","Twin Peaks","Union Square","Visitacion Valley","Western Addition"],
  "Austin": ["Allandale","Barton Hills","Bouldin Creek","Brentwood","Cherrywood","Clarksville","Crestview","Downtown","East Austin","East Cesar Chavez","Govalle","Highland","Holly","Hyde Park","Mueller","North Loop","North Shoal Creek","Northwest Hills","Oak Hill","Old West Austin","Rosedale","Rundberg","South Austin","South Congress","Tarrytown","Travis Heights","West Austin","Windsor Park","Wooten"],
  "Denver": ["Athmar Park","Baker","Barnum","Berkeley","Capitol Hill","Central Park","Cherry Creek","Cole","Congress Park","Curtis Park","East Colfax","Five Points","Golden Triangle","Hale","Hampden","Harvey Park","Highland","Hilltop","Lincoln Park","Lodo","Montbello","Montclair","North Park Hill","Overland","Park Hill","Platt Park","RiNo","Rosedale","Ruby Hill","Sloan Lake","Sunnyside","Union Station","University","Washington Park","Westwood"],
  "Boston": ["Allston","Back Bay","Bay Village","Beacon Hill","Brighton","Charlestown","Chinatown","Dorchester","Downtown","East Boston","Fenway","Hyde Park","Jamaica Plain","Kenmore","Longwood","Mattapan","Mission Hill","North End","Roslindale","Roxbury","Seaport","South Boston","South End","West End","West Roxbury"],
  "Lakewood": ["Cedarbridge","Downtown Lakewood","East Lakewood","Forest Hills","Lakewood Heights","North Lakewood","Pine Park","River Avenue","South Lakewood","West Lakewood","Windsor Park","Oak Street","Madison Avenue","Clifton Avenue","Cross Street","Lanes Mill","Four Corners","Pine Lake Park","Pleasant Plains"],
  "Toms River": ["Beachwood","Cedar Crest","Downtown","East Dover","Gilford Park","Greenville","Hickory Hill","North Dover","Ortley Beach","Pine Beach","Silver Bay","South Toms River","Toms River Heights","West Dover"],
  "Newark": ["Ironbound","North Ward","South Ward","West Ward","Central Ward","East Ward","Down Neck","Forest Hill","Roseville","Vailsburg","Weequahic"],
  "Jersey City": ["Bergen-Lafayette","Downtown","Greenville","Hamilton Park","Heights","Journal Square","McGinley Square","Newport","Paulus Hook","Van Vorst Park","West Bergen","West Side"],
  "Trenton": ["Chambersburg","Downtown","East Trenton","Glen Afton","Hiltonia","Mill Hill","North Trenton","South Trenton","Villa Park","Wilbur"],
  "Paterson": ["Bunker Hill","Downtown","Eastside","Fairlawn","Hillcrest","Northside","Riverside","Sandy Hill","Upper Eastside","Westside"],
  "Elizabeth": ["Bayway","Downtown","Elmora","Midtown","North Elizabeth","Peterstown"],
  "Jackson": ["Cassville","Cassville Heights","Downtown Jackson","Four Corners","Harmony Farms","New Egypt Road","North Jackson","Oak Ridge","Pleasant Plains","Prospertown","Tin Brook","Whitesville"],
};

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { city, state, lat, lng } = req.query;
  if (!city || !lat || !lng) return res.status(400).json({ error: "city, lat and lng required" });

  const latitude  = parseFloat(lat);
  const longitude = parseFloat(lng);

  // ── Layer 1: Overpass API with full polygon geometry ──────────────────────
  // Query ways and relations (which carry polygon geometry), not just nodes.
  // out geom; returns all node coordinates inline — no second request needed.
  try {
    const query = `
      [out:json][timeout:25];
      (
        way["place"~"neighbourhood|suburb|quarter|district"](around:25000,${latitude},${longitude});
        relation["place"~"neighbourhood|suburb|quarter|district"](around:25000,${latitude},${longitude});
        node["place"~"neighbourhood|suburb|quarter|district"](around:25000,${latitude},${longitude});
      );
      out geom;
    `;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method:  "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body:    "data=" + encodeURIComponent(query),
      signal:  controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const seen = new Set();
      const neighborhoods = [];

      for (const el of data.elements || []) {
        const name = el.tags?.name;
        if (!name || seen.has(name)) continue;
        seen.add(name);

        let polygon = null;
        let centerLat, centerLng;

        if (el.type === "way" && el.geometry?.length >= 3) {
          // Way: geometry is [{lat, lon}...] forming the boundary ring
          const coords = el.geometry.map(n => ({ lat: n.lat, lng: n.lon }));
          polygon   = simplifyPolygon(coords, 8);
          centerLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
          centerLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;

        } else if (el.type === "relation" && el.members) {
          // Relation: find the outer ring member
          const outer = el.members.find(m => m.role === "outer" && m.geometry?.length >= 3);
          if (outer) {
            const coords = outer.geometry.map(n => ({ lat: n.lat, lng: n.lon }));
            polygon   = simplifyPolygon(coords, 8);
            centerLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
            centerLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
          } else {
            centerLat = el.center?.lat ?? latitude;
            centerLng = el.center?.lon ?? longitude;
          }

        } else if (el.type === "node") {
          // Node: point only — no polygon geometry available
          centerLat = el.lat;
          centerLng = el.lon;
        }

        if (!centerLat || !centerLng) continue;

        neighborhoods.push({ name, lat: centerLat, lng: centerLng, polygon });
      }

      if (neighborhoods.length > 0) {
        neighborhoods.sort((a, b) => a.name.localeCompare(b.name));
        res.setHeader("Cache-Control", "public, max-age=86400");
        return res.status(200).json({ neighborhoods, source: "overpass" });
      }
    }
  } catch (err) {
    console.log("Overpass failed:", err.message);
  }

  // ── Layer 2: Hardcoded name list (no polygon geometry) ────────────────────
  const cityKey = Object.keys(CITY_NEIGHBORHOODS).find(k =>
    k.toLowerCase() === city.toLowerCase() ||
    city.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(city.toLowerCase())
  );

  if (cityKey) {
    const names = CITY_NEIGHBORHOODS[cityKey];
    const neighborhoods = names.map((name, i) => {
      const angle  = (i / names.length) * 2 * Math.PI;
      const radius = 0.02 + (i % 3) * 0.01;
      return {
        name,
        lat:     latitude  + Math.sin(angle) * radius,
        lng:     longitude + Math.cos(angle) * radius,
        polygon: null,
      };
    });
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(200).json({ neighborhoods, source: "fallback" });
  }

  // ── Layer 3: Nominatim centroids only ────────────────────────────────────
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

    const nomRes = await fetch(
      `${baseUrl}/api/city-search?q=${encodeURIComponent(city + " neighborhoods " + state)}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const nomData = await nomRes.json();
    const results = nomData.results || [];
    const seen = new Set();
    const neighborhoods = results
      .filter(r => ["suburb","neighbourhood","quarter","village","hamlet"].includes(r.type))
      .map(r => ({
        name:    r.address?.suburb || r.address?.neighbourhood || r.name,
        lat:     parseFloat(r.lat),
        lng:     parseFloat(r.lon),
        polygon: null,
      }))
      .filter(n => n.name && !isNaN(n.lat) && !seen.has(n.name) && seen.add(n.name));

    if (neighborhoods.length > 0) {
      return res.status(200).json({ neighborhoods, source: "nominatim" });
    }
  } catch (err) {
    console.log("Nominatim fallback failed:", err.message);
  }

  return res.status(200).json({
    neighborhoods: [],
    message: `No neighborhoods found for ${city}. You can create one.`,
    source: "empty",
  });
}

// ── Simplify polygon to exactly N vertices ────────────────────────────────────
// Uses Douglas-Peucker to keep geometrically significant vertices.
function simplifyPolygon(coords, targetN) {
  // Remove duplicate closing vertex if present
  let ring = coords;
  const first = coords[0], last = coords[coords.length - 1];
  if (Math.abs(first.lat - last.lat) < 1e-7 && Math.abs(first.lng - last.lng) < 1e-7) {
    ring = coords.slice(0, -1);
  }

  if (ring.length <= targetN) {
    const padded = [...ring];
    while (padded.length < targetN) padded.push(ring[ring.length - 1]);
    return padded;
  }

  // Progressive simplification until we're at or below targetN
  let simplified = ring;
  let tolerance = 0.0005;
  while (simplified.length > targetN && tolerance < 2) {
    simplified = douglasPeucker(ring, tolerance);
    tolerance *= 2;
  }

  // Even sample if still too many
  if (simplified.length > targetN) {
    const step = simplified.length / targetN;
    simplified = Array.from({ length: targetN }, (_, i) =>
      simplified[Math.min(Math.floor(i * step), simplified.length - 1)]
    );
  }

  // Pad to exactly targetN
  while (simplified.length < targetN) {
    simplified.push(simplified[simplified.length - 1]);
  }

  return simplified.slice(0, targetN);
}

function douglasPeucker(points, tolerance) {
  if (points.length <= 2) return points;
  const first = points[0];
  const last  = points[points.length - 1];
  let maxDist = 0, maxIdx = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > tolerance) {
    const left  = douglasPeucker(points.slice(0, maxIdx + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIdx), tolerance);
    return [...left.slice(0, -1), ...right];
  }
  return [first, last];
}

function perpendicularDistance(point, lineStart, lineEnd) {
  const dx = lineEnd.lng - lineStart.lng;
  const dy = lineEnd.lat - lineStart.lat;
  if (dx === 0 && dy === 0) {
    return Math.sqrt(Math.pow(point.lat - lineStart.lat, 2) + Math.pow(point.lng - lineStart.lng, 2));
  }
  const t = ((point.lng - lineStart.lng) * dx + (point.lat - lineStart.lat) * dy) / (dx * dx + dy * dy);
  return Math.sqrt(
    Math.pow(point.lat - lineStart.lat - t * dy, 2) +
    Math.pow(point.lng - lineStart.lng - t * dx, 2)
  );
}
