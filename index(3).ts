// supabase/functions/vote-gate/index.ts
//
// Townhall ZK Vote Gate
//
// A resident votes on a civic issue by submitting their residency proof_hash.
// This function:
//   1. Checks the proof_hash exists in residency_proofs and hasn't expired
//   2. Checks the proof_hash hasn't already been used to vote on this issue
//   3. Verifies the neighborhood matches the issue's neighborhood
//   4. Records the vote anonymously
//
// The vote row stores user_id for moderation but that column is never
// exposed through the public API — only the aggregate counts are public.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface VoteRequest {
  issueId: string;
  proofHash: string;  // From the user's residency_proofs row
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401, headers: { "Content-Type": "application/json" },
    });
  }

  let body: VoteRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  const { issueId, proofHash } = body;
  if (!issueId || !proofHash) {
    return new Response(
      JSON.stringify({ error: "Missing issueId or proofHash" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // 1. Verify the proof is valid and not expired
  const { data: proof, error: proofError } = await supabase
    .from("residency_proofs")
    .select("user_id, neighborhood_id, expires_at")
    .eq("proof_hash", proofHash)
    .eq("user_id", user.id)
    .single();

  if (proofError || !proof) {
    return new Response(
      JSON.stringify({ error: "Invalid or unknown residency proof" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  if (new Date(proof.expires_at) < new Date()) {
    return new Response(
      JSON.stringify({ error: "Residency proof has expired — please renew" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 2. Get the issue and check neighborhood match
  const { data: issue, error: issueError } = await supabase
    .from("civic_issues")
    .select("id, neighborhood_id, status")
    .eq("id", issueId)
    .single();

  if (issueError || !issue) {
    return new Response(
      JSON.stringify({ error: "Issue not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // For city-wide issues, any verified resident can vote
  // For neighborhood issues, must be from that neighborhood
  const isNeighborhoodMatch = issue.neighborhood_id === proof.neighborhood_id;
  const isCityWide = issue.status === "city_wide";

  if (!isNeighborhoodMatch && !isCityWide) {
    return new Response(
      JSON.stringify({ error: "You must be a verified resident of this neighborhood to vote" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // 3. Check for duplicate vote (by user or by proof_hash — belt and braces)
  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .or(`user_id.eq.${user.id},proof_hash.eq.${proofHash}`)
    .eq("issue_id", issueId)
    .maybeSingle();

  if (existing) {
    return new Response(
      JSON.stringify({ error: "You have already voted on this issue" }),
      { status: 409, headers: { "Content-Type": "application/json" } }
    );
  }

  // 4. Record the vote
  const { error: voteError } = await supabase
    .from("votes")
    .insert({
      user_id: user.id,
      issue_id: issueId,
      proof_hash: proofHash,
    });

  if (voteError) {
    if (voteError.code === "23505") {
      return new Response(
        JSON.stringify({ error: "You have already voted on this issue" }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    console.error("Vote insert error:", voteError);
    return new Response(
      JSON.stringify({ error: "Failed to record vote" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // 5. Award trust points for civic participation
  await supabase
    .from("profiles")
    .update({
      trust_score: supabase.rpc("increment_trust", { user_id: user.id, points: 5 }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  // Fetch updated issue stats to return
  const { data: updated } = await supabase
    .from("civic_issues")
    .select("voice_count, priority_pct")
    .eq("id", issueId)
    .single();

  return new Response(
    JSON.stringify({
      success: true,
      voteRecorded: true,
      anonymous: true,
      issueId,
      voiceCount: updated?.voice_count,
      priorityPct: updated?.priority_pct,
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
