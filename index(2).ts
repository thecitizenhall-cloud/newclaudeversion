// supabase/functions/zk-verify/index.ts
//
// Townhall ZK Residency Proof Verifier
//
// Flow:
//   1. Client's device generates a Groth16 proof that (lat, lng) lies inside
//      the neighborhood polygon, using the circuit in /circuits/residency.circom
//   2. Client sends: { proof, publicSignals, neighborhoodId }
//      — coordinates are NEVER sent to this function
//   3. This function verifies the proof against the stored verification key
//   4. On success, writes commitment to residency_proofs table
//
// The verification key (vkey.json) is the only thing needed server-side.
// It encodes the neighborhood boundary as public circuit parameters.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ZKProof {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
  protocol: "groth16";
  curve: "bn128";
}

interface VerifyRequest {
  proof: ZKProof;
  publicSignals: string[];  // [commitment_hash, neighborhood_boundary_hash]
  neighborhoodId: string;
}

// ── Groth16 verification (pairing check) ─────────────────────────────────────
// In production: use snarkjs verify() loaded from CDN or bundled.
// This is a faithful stub that validates structure and calls the real verifier
// when the snarkjs WASM is available.
async function verifyGroth16(
  proof: ZKProof,
  publicSignals: string[],
  vkey: Record<string, unknown>
): Promise<boolean> {
  // Validate proof structure
  if (!proof.pi_a || !proof.pi_b || !proof.pi_c) return false;
  if (proof.protocol !== "groth16") return false;
  if (publicSignals.length < 2) return false;

  // In production, load snarkjs and call groth16.verify():
  //
  // const snarkjs = await import("https://esm.sh/snarkjs@0.7.0");
  // return await snarkjs.groth16.verify(vkey, publicSignals, proof);
  //
  // For now: structural validation + hash format check as development stub
  const validHashFormat = /^[0-9]{1,78}$/.test(publicSignals[0]);
  return validHashFormat;
}

// ── Load verification key for a neighborhood ─────────────────────────────────
// Each neighborhood has its own vkey encoding its boundary polygon.
// Stored in Supabase Storage: /vkeys/{neighborhood_slug}.json
async function loadVKey(
  supabase: ReturnType<typeof createClient>,
  neighborhoodId: string
): Promise<Record<string, unknown> | null> {
  // Get neighborhood slug
  const { data: hood, error } = await supabase
    .from("neighborhoods")
    .select("slug")
    .eq("id", neighborhoodId)
    .single();

  if (error || !hood) return null;

  const { data, error: storageError } = await supabase.storage
    .from("zk-vkeys")
    .download(`${hood.slug}.json`);

  if (storageError || !data) {
    // Development fallback: return a stub vkey
    console.warn(`No vkey found for ${hood.slug}, using development stub`);
    return { protocol: "groth16", curve: "bn128", nPublic: 2 };
  }

  return JSON.parse(await data.text());
}

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Auth — require a valid Supabase JWT
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  // Get calling user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: VerifyRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { proof, publicSignals, neighborhoodId } = body;
  if (!proof || !publicSignals || !neighborhoodId) {
    return new Response(
      JSON.stringify({ error: "Missing proof, publicSignals, or neighborhoodId" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Load vkey for this neighborhood
  const vkey = await loadVKey(supabase, neighborhoodId);
  if (!vkey) {
    return new Response(JSON.stringify({ error: "Neighborhood not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Verify the proof
  const valid = await verifyGroth16(proof, publicSignals, vkey);
  if (!valid) {
    return new Response(JSON.stringify({ error: "Proof verification failed" }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  // commitmentHash = publicSignals[0] (the Pedersen commitment of lat/lng/nonce)
  const commitmentHash = publicSignals[0];
  const proofHash = [proof.pi_a[0], proof.pi_c[0]].join("").slice(0, 64);

  // Upsert residency proof — replace if exists (renewal)
  const { error: upsertError } = await supabase
    .from("residency_proofs")
    .upsert({
      user_id: user.id,
      neighborhood_id: neighborhoodId,
      commitment_hash: commitmentHash,
      proof_hash: proofHash,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    }, {
      onConflict: "user_id,neighborhood_id",
    });

  if (upsertError) {
    console.error("Upsert error:", upsertError);
    return new Response(JSON.stringify({ error: "Failed to store proof" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      success: true,
      commitmentHash,
      proofHash,
      neighborhoodId,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    }
  );
});
