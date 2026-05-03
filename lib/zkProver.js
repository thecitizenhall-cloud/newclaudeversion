// lib/zkProver.js
//
// Client-side ZK proof generation for Townhall Café residency verification.
// Runs entirely in the browser — GPS coordinates NEVER leave the user's device.
//
// USAGE
// -----
// import { generateResidencyProof } from "../lib/zkProver";
//
// const result = await generateResidencyProof({
//   lat: 40.103,                    // decimal degrees
//   lng: -74.349,                   // decimal degrees
//   neighborhoodId: "<uuid>",       // Supabase neighborhood ID
//   polygonVertices: [              // from neighborhoods.boundary
//     { lat: 40.108, lng: -74.358 },
//     { lat: 40.108, lng: -74.340 },
//     // ... 8 vertices total (pad with last vertex if fewer)
//   ],
// });
//
// result = {
//   proof: { pi_a, pi_b, pi_c, protocol, curve },
//   publicSignals: [commitment_hash, boundary_hash],
//   commitmentHash: "<hex>",
//   boundaryHash: "<hex>",
// }

const SCALE = 1_000_000;       // multiply lat/lng by this to get integers
const N_VERTICES = 8;          // fixed polygon size in circuit

// ── Load snarkjs from CDN (avoids bundling the large WASM runtime) ────────────
let snarkjsLoaded = false;
async function loadSnarkjs() {
  if (snarkjsLoaded) return window.snarkjs;
  if (typeof window === "undefined") throw new Error("zkProver must run in browser");

  if (window.snarkjs) { snarkjsLoaded = true; return window.snarkjs; }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/snarkjs@0.7.4/build/snarkjs.min.js";
    script.onload = () => {
      snarkjsLoaded = true;
      resolve(window.snarkjs);
    };
    script.onerror = () => reject(new Error("Failed to load snarkjs"));
    document.head.appendChild(script);
  });
}

// ── Convert decimal degrees to scaled integers for circuit ────────────────────
function scaleCoord(val) {
  return Math.round(val * SCALE);
}

// ── Pad polygon to exactly N_VERTICES by repeating the last vertex ─────────────
function padPolygon(vertices) {
  if (vertices.length > N_VERTICES) {
    // Simplify to N vertices using Douglas-Peucker or just take evenly spaced
    const step = vertices.length / N_VERTICES;
    return Array.from({ length: N_VERTICES }, (_, i) =>
      vertices[Math.min(Math.floor(i * step), vertices.length - 1)]
    );
  }
  const padded = [...vertices];
  while (padded.length < N_VERTICES) {
    padded.push(vertices[vertices.length - 1]);
  }
  return padded;
}

// ── Generate a random 128-bit nonce ───────────────────────────────────────────
function generateNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return BigInt("0x" + hex).toString();
}

// ── Main proof generation function ────────────────────────────────────────────
export async function generateResidencyProof({
  lat,
  lng,
  neighborhoodId,
  polygonVertices,
  onProgress = () => {},
}) {
  if (typeof window === "undefined") {
    throw new Error("generateResidencyProof must be called in the browser");
  }

  // ── Step 1: Load snarkjs ───────────────────────────────────────────────────
  onProgress({ step: "loading", message: "Loading proof engine…" });
  const snarkjs = await loadSnarkjs();

  // ── Step 2: Prepare inputs ─────────────────────────────────────────────────
  onProgress({ step: "preparing", message: "Preparing circuit inputs…" });

  const latScaled = scaleCoord(lat);
  const lngScaled = scaleCoord(lng);
  const nonce     = generateNonce();
  const padded    = padPolygon(polygonVertices);

  const input = {
    lat:      latScaled,
    lng:      lngScaled,
    nonce,
    poly_lat: padded.map(v => scaleCoord(v.lat)),
    poly_lng: padded.map(v => scaleCoord(v.lng)),
  };

  // ── Step 3: Generate proof ─────────────────────────────────────────────────
  onProgress({ step: "proving", message: "Generating cryptographic proof…" });

  // Circuit artifacts are served from /zk/ (committed to public/)
  const wasmUrl = "/zk/residency.wasm";
  const zkeyUrl = "/zk/residency.zkey";

  let proof, publicSignals;
  try {
    ({ proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmUrl,
      zkeyUrl,
    ));
  } catch (err) {
    // The most common failure: point is outside the polygon
    // The circuit enforces this — a proof literally cannot be generated for
    // coordinates outside the neighborhood boundary
    if (err.message?.includes("Assert Failed") || err.message?.includes("constraint")) {
      throw new Error(
        "Your GPS location does not appear to be inside this neighborhood. " +
        "Make sure location access is enabled and you are in the correct area."
      );
    }
    throw new Error("Proof generation failed: " + err.message);
  }

  // ── Step 4: Return result ──────────────────────────────────────────────────
  onProgress({ step: "done", message: "Proof generated" });

  return {
    proof,
    publicSignals,
    commitmentHash: publicSignals[0],  // Poseidon(lat, lng, nonce) — your residency commitment
    boundaryHash:   publicSignals[1],  // Poseidon(polygon) — identifies the neighborhood
    neighborhoodId,
    // nonce is NOT returned — it stays in memory only during this call
    // The commitment hash is what gets stored; it cannot be reversed to recover lat/lng
  };
}

// ── Fetch polygon vertices for a neighborhood from Supabase ──────────────────
// Converts PostGIS geography → array of { lat, lng } objects
export function parsePolygonVertices(boundaryGeoJSON) {
  // Supabase returns geography as GeoJSON via ST_AsGeoJSON()
  // Format: { type: "Polygon", coordinates: [[[lng, lat], [lng, lat], ...]] }
  if (!boundaryGeoJSON?.coordinates?.[0]) {
    throw new Error("Invalid polygon GeoJSON");
  }

  // GeoJSON is [lng, lat] order
  return boundaryGeoJSON.coordinates[0]
    .slice(0, -1)  // Remove closing vertex (same as first)
    .map(([lng, lat]) => ({ lat, lng }));
}

// ── Verify a proof client-side (optional, for debugging) ─────────────────────
export async function verifyProofLocally({ proof, publicSignals }) {
  const snarkjs = await loadSnarkjs();

  // Fetch vkey from our API
  const res = await fetch("/api/zk-vkey");
  const vkey = await res.json();

  return snarkjs.groth16.verify(vkey, publicSignals, proof);
}
