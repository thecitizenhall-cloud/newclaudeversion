// pages/api/neighborhoods-lookup.js
//
// Queries OpenStreetMap for neighborhoods in a given city.
// Uses Overpass API with Nominatim as fallback.
//
// GET /api/neighborhoods-lookup?city=Chicago&state=IL&lat=41.8781&lng=-87.6298

// Hardcoded neighborhoods for major US cities as fallback
// when OSM APIs are slow or unavailable
const CITY_NEIGHBORHOODS = {
  "New York City": ["Astoria","Battery Park","Bedford-Stuyvesant","Bensonhurst","Bronx Park","Brooklyn Heights","Bushwick","Carroll Gardens","Chelsea","Chinatown","Clinton Hill","Cobble Hill","Crown Heights","East Harlem","East Village","Financial District","Flatbush","Flushing","Forest Hills","Fort Greene","Greenpoint","Greenwich Village","Harlem","Hell's Kitchen","Jackson Heights","Jamaica","Kensington","Long Island City","Lower East Side","Midtown","Murray Hill","NoHo","Nolita","Park Slope","Prospect Heights","Queens Village","Red Hook","Ridgewood","Riverdale","SoHo","Sunnyside","Sunset Park","Tribeca","Upper East Side","Upper West Side","Washington Heights","Williamsburg","Woodside"],
  "Los Angeles": ["Baldwin Hills","Bel Air","Boyle Heights","Brentwood","Burbank","Canoga Park","Chatsworth","Chinatown","Culver City","Downtown","Eagle Rock","Echo Park","El Sereno","Encino","Granada Hills","Highland Park","Hollywood","Inglewood","Koreatown","Little Tokyo","Los Feliz","Mar Vista","Mid-City","Mid-Wilshire","Mission Hills","North Hollywood","Northridge","Pacific Palisades","Pacoima","Palms","Pico-Robertson","Playa del Rey","Porter Ranch","Reseda","San Pedro","Santa Monica","Sherman Oaks","Silver Lake","Studio City","Sun Valley","Sylmar","Tarzana","Toluca Lake","Van Nuys","Venice","West Adams","West Hollywood","West Los Angeles","Westchester","Westwood","Woodland Hills"],
  "Chicago": ["Albany Park","Andersonville","Avondale","Beverly","Boystown","Bridgeport","Brighton Park","Bronzeville","Bucktown","Burnside","Chatham","Chinatown","Douglas","Dunning","East Garfield Park","Edison Park","Edgewater","Englewood","Forest Glen","Fuller Park","Gage Park","Garfield Ridge","Gold Coast","Grand Crossing","Greektown","Hegewisch","Humboldt Park","Hyde Park","Irving Park","Jefferson Park","Kenwood","Lake View","Lincoln Park","Lincoln Square","Little Italy","Little Village","Logan Square","Loop","Morgan Park","Mount Greenwood","Near North Side","Near South Side","Near West Side","Noble Square","North Center","North Park","Norwood Park","Oak Lawn","Pilsen","Portage Park","Pullman","Ravenswood","River North","River West","Rogers Park","Roseland","Roscoe Village","South Lawndale","South Loop","South Shore","Ukrainian Village","Uptown","West Loop","West Ridge","West Town","Wicker Park","Wrigleyville"],
  "Houston": ["Acres Homes","Alief","Astrodome","Bellaire","Braeswood","Clear Lake","Cypress","Downtown","East End","East Houston","Eldridge","Energy Corridor","Fifth Ward","First Ward","Fondren Southwest","Galleria","Garden Oaks","Glenbrook Valley","Greater Heights","Greenway Plaza","Heights","Hermann Park","Houston Heights","Humble","Hunting Bayou","Kingwood","Lindale Park","Magnolia Park","Manvel","Meadowbrook","Meyerland","Midtown","Montrose","Museum District","Near Northside","Northside","Northside Village","Oak Forest","Pecan Park","Pleasantville","River Oaks","Second Ward","Sharpstown","Sunnyside","Sugarland","Tanglewood","Third Ward","Timbergrove","Tomball","University Place","Upper Kirby","Westheimer","Westwood"],
  "Phoenix": ["Ahwatukee","Arcadia","Biltmore","Camelback East","Cave Creek","Central City","Deer Valley","Desert View","Downtown","Encanto","Estrella","Laveen","Maryvale","Moon Valley","North Gateway","North Mountain","Paradise Valley","Rio Vista","South Mountain","Sunnyslope"],
  "Philadelphia": ["Bella Vista","Brewerytown","Bridesburg","Cedar Park","Chestnut Hill","Chinatown","Cobbs Creek","East Falls","East Kensington","East Passyunk","Fairmount","Falls of Schuylkill","Fishtown","Frankford","Francisville","Germantown","Graduate Hospital","Gray's Ferry","Italian Market","Kensington","Manayunk","Mayfair","Moyamensing","Newbold","Northern Liberties","Old City","Oxford Circle","Passyunk Square","Point Breeze","Port Richmond","Queen Village","Rhawnhurst","Rittenhouse Square","Roxborough","Society Hill","South Philly","Spring Garden","Strawberry Mansion","Temple University","Tioga","University City","West Kensington","West Passyunk","West Philly","Wissinoming","Wissahickon"],
  "San Antonio": ["Alamo Heights","Castle Hills","China Grove","Downtown","East Side","Helotes","Hill Country Village","King William","Lackland","Leon Valley","Mahncke Park","Medical Center","Monte Vista","New Braunfels","North Side","Northside","Oak Park","San Marcos","Schertz","Shavano Park","South Side","Terrell Hills","Tobin Hill","West Side","Windcrest"],
  "San Diego": ["Balboa Park","Barrio Logan","Bay Park","Bonita","Carmel Valley","Clairemont","College Area","Del Mar","Downtown","East Village","El Cajon","Encanto","Escondido","Gaslamp Quarter","Golden Hill","Grant Hill","Hillcrest","Kearny Mesa","La Jolla","La Mesa","Lemon Grove","Linda Vista","Little Italy","Logan Heights","Midway","Mission Hills","Mission Valley","North Park","Normal Heights","Ocean Beach","Old Town","Pacific Beach","Point Loma","Rancho Bernardo","Rancho Peñasquitos","Santee","Serra Mesa","South Park","Tierrasanta","University City","University Heights","Uptown","Vista"],
  "Dallas": ["Addison","Arts District","Bishop Arts","Casa Linda","Cedar Crest","Cockrell Hill","Deep Ellum","Design District","Desoto","Downtown","East Dallas","Elmwood","Expo Park","Fair Park","Far East Dallas","Farmers Branch","Forest Hills","Garland","Glencoe Park","Greenland Hills","Highland Park","Hollywood Heights","Irving","Knox-Henderson","Lakewood","Lake Highlands","Lancaster","Little Forest Hills","Lower Greenville","Mesquite","M Streets","North Dallas","Oak Cliff","Oak Lawn","Old East Dallas","Park Cities","Pleasant Grove","Prestonwood","Redbird","Richardson","Rowlett","Skillman Corridor","South Dallas","Swiss Avenue","Trinity Groves","Turtle Creek","Uptown","University Park","Victory Park","White Rock Lake"],
  "Seattle": ["Ballard","Beacon Hill","Belltown","Brighton","Broadway","Capitol Hill","Central District","Columbia City","Crown Hill","Delridge","Downtown","Eastlake","First Hill","Fremont","Genesee","Georgetown","Green Lake","Greenwood","Hillman City","International District","Judkins Park","Lake City","Leschi","Madison Park","Madrona","Magnolia","Maple Leaf","Mount Baker","North Beacon Hill","Northgate","Phinney Ridge","Pioneer Square","Queen Anne","Rainier Beach","Rainier Valley","Ravenna","Sand Point","Seward Park","SoDo","South Lake Union","South Park","University District","Wallingford","Wedgwood","West Seattle","Westlake","Whittier Heights"],
  "San Francisco": ["Alamo Square","Bayview","Bernal Heights","Castro","Chinatown","Civic Center","Cow Hollow","Crocker Amazon","Diamond Heights","Dogpatch","Downtown","Duboce Triangle","Embarcadero","Excelsior","Financial District","Fisherman's Wharf","Glen Park","Haight-Ashbury","Hayes Valley","Hunters Point","Inner Richmond","Inner Sunset","Japantown","Lower Haight","Lower Nob Hill","Lower Pacific Heights","Marina","Mission","Mission Dolores","Nob Hill","Noe Valley","North Beach","Outer Mission","Outer Richmond","Outer Sunset","Pacific Heights","Panhandle","Parkside","Portola","Potrero Hill","Presidio","Russian Hill","SoMa","Silver Terrace","Sunset","Tenderloin","Twin Peaks","Union Square","Upper Market","Visitacion Valley","Western Addition"],
  "Austin": ["Allandale","Anderson Mill","Barton Hills","Bouldin Creek","Brentwood","Bryan Oaks","Bryker Woods","Cherrywood","Clarksville","Crestview","Domain","Downtown","East Austin","East Cesar Chavez","Galindo","Georgetown","Govalle","Highland","Holly","Hyde Park","Johnston Terrace","Lamar Heights","Leander","Manor","Mueller","North Loop","North Shoal Creek","North University","Northwest Hills","Oak Hill","Old West Austin","Pflugerville","Rosedale","Round Rock","Rundberg","Seton Medical","South Austin","South Congress","Tarrytown","Travis Heights","University Hills","West Austin","Windsor Park","Windsor Road","Wooten"],
  "Denver": ["Athmar Park","Baker","Barnum","Berkeley","Capitol Hill","Central Park","Cherry Creek","Clayton","Cole","Congress Park","Country Club","Curtis Park","East Colfax","Elyria-Swansea","Five Points","Globeville","Golden Triangle","Hale","Hampden","Harvey Park","Highland","Hilltop","Lincoln Park","Lodo","Montbello","Montclair","North Park Hill","Overland","Park Hill","Platt Park","Potter-Highlands","Regis","RiNo","Rosedale","Ruby Hill","Skyland","Sloan Lake","Sunnyside","Swansea","Union Station","University","University Hills","University Park","Virginia Village","Washington Park","Whittier","Windsor","Westwood"],
  "Boston": ["Allston","Back Bay","Bay Village","Beacon Hill","Brighton","Charlestown","Chinatown","Dorchester","Downtown","East Boston","Fenway","Financial District","Fort Hill","Harbor Islands","Hyde Park","Jamaica Plain","Kenmore","Leather District","Longwood","Mattapan","Mission Hill","North End","Roslindale","Roxbury","Seaport","South Boston","South End","Theater District","West End","West Roxbury","Wharf District"],
  "Lakewood": ["Cedarbridge","Downtown Lakewood","East Lakewood","Forest Hills","Lakewood Heights","North Lakewood","Pine Park","River Avenue","South Lakewood","West Lakewood","Windsor Park","Oak Street","Madison Avenue","Clifton Avenue","Cross Street","Lanes Mill","Scully","Four Corners","Pine Lake Park","Pleasant Plains"],
  "Toms River": ["Beachwood","Cedar Crest","Downtown","East Dover","Gilford Park","Greenville","Hickory Hill","North Dover","Ortley Beach","Pine Beach","Silver Bay","South Toms River","Toms River Heights","West Dover"],
  "Newark": ["Ironbound","North Ward","South Ward","West Ward","Central Ward","East Ward","Down Neck","Forest Hill","Roseville","Vailsburg","Weequahic","Springfield"],
  "Jersey City": ["Bergen-Lafayette","Downtown","Greenville","Hamilton Park","Heights","Journal Square","McGinley Square","Newport","Paulus Hook","Van Vorst Park","West Bergen","West Side"],
  "Trenton": ["Chambersburg","Downtown","East Trenton","Glen Afton","Hiltonia","Kingsbury","Mill Hill","North Trenton","South Trenton","The Island","Villa Park","Wilbur"],
  "Paterson": ["Bunker Hill","Downtown","Eastside","Fairlawn","Hillcrest","Little Lima","Northside","Riverside","Sandy Hill","Totowa","Upper Eastside","Westside"],
  "Elizabeth": ["Bayway","Downtown","Elmora","Frog Hollow","Keighler","Midtown","North Elizabeth","Port","Peterstown","Winfield Park"],
  "Edison": ["Avenel","Clara Barton","Colonia","Iselin","Metuchen","North Edison","Oak Tree","South Edison","Woodbridge"],
  "Woodbridge": ["Avenel","Colonia","Fords","Hopelawn","Iselin","Keasbey","Port Reading","Sewaren","Woodbridge"],
  "Hamilton": ["Groveville","Mercerville","Nottingham","Slackwood","Steinert","Whitehorse","Yardville"],
  "Clifton": ["Allwood","Botany","Delawanna","Lakeview","Main","Montclair Heights","Richfield","Styertowne","Van Houten Fields","Westwood"],
  "Camden": ["Beideman","Cooper Grant","Davis","East Camden","Fairview","Gateway","Lanning Square","Morgan Village","Parkside","Whitman Park"],
};

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

  // ── Try Overpass API first ────────────────────────────────────────────
  try {
    const query = `
      [out:json][timeout:20];
      (
        node["place"="neighbourhood"](around:25000,${latitude},${longitude});
        node["place"="suburb"](around:25000,${latitude},${longitude});
        node["place"="quarter"](around:25000,${latitude},${longitude});
        node["place"="district"](around:25000,${latitude},${longitude});
      );
      out body;
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
      const elements = data.elements || [];

      const seen = new Set();
      const neighborhoods = elements
        .filter(el => el.tags?.name && el.lat && el.lon)
        .map(el => ({ name: el.tags.name, lat: el.lat, lng: el.lon }))
        .filter(n => { if (seen.has(n.name)) return false; seen.add(n.name); return true; })
        .sort((a, b) => a.name.localeCompare(b.name));

      if (neighborhoods.length > 0) {
        console.log(`Overpass returned ${neighborhoods.length} neighborhoods for ${city}`);
        return res.status(200).json({ neighborhoods, source: "overpass" });
      }
    }
  } catch (err) {
    console.log("Overpass failed, trying fallback:", err.message);
  }

  // ── Fallback: hardcoded major city list ───────────────────────────────
  const cityKey = Object.keys(CITY_NEIGHBORHOODS).find(k =>
    k.toLowerCase() === city.toLowerCase() ||
    city.toLowerCase().includes(k.toLowerCase()) ||
    k.toLowerCase().includes(city.toLowerCase())
  );

  if (cityKey) {
    const neighborhoods = CITY_NEIGHBORHOODS[cityKey].map((name, i) => ({
      name,
      lat: latitude + (Math.random() - 0.5) * 0.1,
      lng: longitude + (Math.random() - 0.5) * 0.1,
    }));
    console.log(`Fallback: returning ${neighborhoods.length} neighborhoods for ${city}`);
    return res.status(200).json({ neighborhoods, source: "fallback" });
  }

  // ── Nothing found ─────────────────────────────────────────────────────
  return res.status(200).json({
    neighborhoods: [],
    message: `No neighborhoods found for ${city}. You can create one.`,
    source: "empty",
  });
}
