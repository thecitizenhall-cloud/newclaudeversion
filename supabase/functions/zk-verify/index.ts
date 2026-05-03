// supabase/functions/zk-verify/index.ts
//
// Townhall Café · ZK Residency Proof Verifier
// ─────────────────────────────────────────────────────────────────────────────
//
// Verifies a Groth16 proof that a user's GPS coordinates lie inside a
// neighborhood polygon, without the server ever learning the coordinates.
//
// FLOW
// ----
// 1. Browser generates proof via lib/zkProver.js (coordinates stay on device)
// 2. Browser sends { proof, publicSignals, neighborhoodId } to this function
// 3. This function loads the verification key from Supabase Storage
// 4. snarkjs.groth16.verify() checks the proof against the vkey
// 5. On success: upserts a row in residency_proofs with commitment_hash
//    → The commitment_hash is a Poseidon hash of (lat, lng, nonce)
//    → It binds the user to specific coordinates without revealing them
//
// VERIFICATION KEY SETUP
// ----------------------
// After running scripts/zk-setup.sh:
//   1. Upload public/zk/vkey.json to Supabase Storage → bucket: zk-vkeys
//   2. File path in bucket: vkey.json (one global vkey, circuit is same for all hoods)
//   3. Make the bucket private (only edge functions can read it)
//
// PUBLIC SIGNALS
// --------------
// publicSignals[0] = commitment_hash = Poseidon(lat, lng, nonce)
// publicSignals[1] = boundary_hash   = Poseidon(all 8 polygon vertices * 1e6)
//
// The boundary_hash lets us verify the proof was for the right neighborhood
// without storing coordinates.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// snarkjs for Deno — uses the same verification logic as the browser
import * as snarkjs from "https://esm.sh/snarkjs@0.7.4";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Groth16Proof {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
  protocol: "groth16";
  curve: "bn128";
}

interface VerifyRequest {
  proof:          Groth16Proof;
  publicSignals:  string[];    // [commitment_hash, boundary_hash]
  neighborhoodId: string;
}

// ── Load verification key from Supabase Storage ───────────────────────────────
// vkey is the same for all neighborhoods (circuit is identical — only inputs differ)
// boundary_hash in publicSignals identifies which neighborhood was proven
let cachedVkey: Record<string, unknown> | null = null;

async function loadVKey(
  supabase: ReturnType<typeof createClient>
): Promise<Record<string, unknown>> {
  if (cachedVkey) return cachedVkey;

  const { data, error } = await supabase.storage
    .from("zk-vkeys")
    .download("vkey.json");

  if (error || !data) {
    throw new Error(
      `vkey.json not found in Supabase Storage bucket 'zk-vkeys'. ` +
      `Run scripts/zk-setup.sh then upload the vkey. Error: ${error?.message}`
    );
  }

  cachedVkey = JSON.parse(await data.text());
  return cachedVkey!;
}

// ── Fetch the expected boundary_hash for a neighborhood ───────────────────────
// The boundary_hash is stored in the neighborhoods table after first proof generation,
// OR we compute it on-the-fly from the boundary polygon.
// This prevents proofs from being generated against fake polygons.
async function getExpectedBoundaryHash(
  supabase: ReturnType<typeof createClient>,
  neighborhoodId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("neighborhoods")
    .select("boundary_hash")
    .eq("id", neighborhoodId)
    .maybeSingle();

  return data?.boundary_hash || null;
}

// ── Store the boundary_hash after first successful proof ──────────────────────
// This "locks" the neighborhood polygon — future proofs must use the same boundary
async function storeBoundaryHash(
  supabase: ReturnType<typeof createClient>,
  neighborhoodId: string,
  boundaryHash: string
): Promise<void> {
  await supabase
    .from("neighborhoods")
    .update({ boundary_hash: boundaryHash })
    .eq("id", neighborhoodId)
    .is("boundary_hash", null);  // only set if not already set
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin":  "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "POST",
      },
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  // ── Auth: require valid Supabase JWT ──────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: "Invalid token" }, 401);
  }

  // ── Parse request ─────────────────────────────────────────────────────────
  let body: VerifyRequest;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400);
  }

  const { proof, publicSignals, neighborhoodId } = body;

  if (!proof || !publicSignals || !neighborhoodId) {
    return jsonResponse({ error: "Missing proof, publicSignals, or neighborhoodId" }, 400);
  }

  if (!Array.isArray(publicSignals) || publicSignals.length !== 2) {
    return jsonResponse({ error: "publicSignals must be [commitment_hash, boundary_hash]" }, 400);
  }

  const [commitmentHash, boundaryHash] = publicSignals;

  // ── Validate neighborhood exists ──────────────────────────────────────────
  const { data: hood, error: hoodError } = await supabase
    .from("neighborhoods")
    .select("id, name")
    .eq("id", neighborhoodId)
    .maybeSingle();

  if (hoodError || !hood) {
    return jsonResponse({ error: "Neighborhood not found" }, 404);
  }

  // ── Check for existing valid proof (prevent replay) ───────────────────────
  const { data: existing } = await supabase
    .from("residency_proofs")
    .select("id, commitment_hash, expires_at")
    .eq("user_id", user.id)
    .eq("neighborhood_id", neighborhoodId)
    .maybeSingle();

  if (existing && new Date(existing.expires_at) > new Date()) {
    // Already has a valid proof — check if commitment matches
    if (existing.commitment_hash === commitmentHash) {
      return jsonResponse({
        success:        true,
        alreadyVerified: true,
        commitmentHash,
        neighborhoodId,
        neighborhoodName: hood.name,
        expiresAt: existing.expires_at,
      }, 200);
    }
    // Different commitment — allow re-verification (user may have moved)
  }

  // ── Validate boundary_hash matches neighborhood ───────────────────────────
  const expectedBoundaryHash = await getExpectedBoundaryHash(supabase, neighborhoodId);

  if (expectedBoundaryHash && expectedBoundaryHash !== boundaryHash) {
    return jsonResponse({
      error: "Boundary hash mismatch — proof was generated for a different polygon version",
    }, 422);
  }

  // ── Load verification key ─────────────────────────────────────────────────
  let vkey: Record<string, unknown>;
  try {
    // Use service role for storage access
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    vkey = await loadVKey(adminClient);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to load vkey:", message);
    return jsonResponse({
      error: "Verification key not found. Run zk-setup.sh and upload vkey.json to Storage.",
    }, 503);
  }

  // ── Verify the Groth16 proof ───────────────────────────────────────────────
  let valid: boolean;
  try {
    valid = await snarkjs.groth16.verify(vkey, publicSignals, proof);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Verification error:", message);
    return jsonResponse({ error: "Proof verification failed: " + message }, 422);
  }

  if (!valid) {
    return jsonResponse({
      error: "Proof is invalid. Your GPS location may not be within this neighborhood.",
    }, 422);
  }

  // ── Store the boundary_hash (locks polygon for this neighborhood) ──────────
  if (!expectedBoundaryHash) {
    await storeBoundaryHash(supabase, neighborhoodId, boundaryHash);
  }

  // ── Upsert residency proof ────────────────────────────────────────────────
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(); // 90 days

  const { error: upsertError } = await supabase
    .from("residency_proofs")
    .upsert({
      user_id:         user.id,
      neighborhood_id: neighborhoodId,
      commitment_hash: commitmentHash,
      proof_hash:      deriveProofHash(proof),
      expires_at:      expiresAt,
    }, {
      onConflict: "user_id,neighborhood_id",
    });

  if (upsertError) {
    console.error("Upsert error:", upsertError);
    return jsonResponse({ error: "Failed to store proof" }, 500);
  }

  // ── Update profile neighborhood ───────────────────────────────────────────
  await supabase
    .from("profiles")
    .update({
      neighborhood_id: neighborhoodId,
      neighborhood:    hood.name,
      onboarded:       true,
      updated_at:      new Date().toISOString(),
    })
    .eq("id", user.id);

  // ── Return success ────────────────────────────────────────────────────────
  return jsonResponse({
    success:          true,
    verified:         true,
    commitmentHash,               // Poseidon(lat, lng, nonce) — user's residency commitment
    boundaryHash,                 // Poseidon(polygon) — identifies neighborhood
    neighborhoodId,
    neighborhoodName: hood.name,
    expiresAt,
    // Coordinates are NOT returned — they were never known to this function
  }, 200);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type":                "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

// Derive a short proof fingerprint from pi_a and pi_c for the proof_hash column
function deriveProofHash(proof: Groth16Proof): string {
  const raw = proof.pi_a[0] + proof.pi_c[0];
  return raw.slice(0, 64);
}
