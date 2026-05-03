pragma circom 2.0.0;

// ─────────────────────────────────────────────────────────────────────────────
// Townhall Café · Residency Proof Circuit
// ─────────────────────────────────────────────────────────────────────────────
//
// WHAT THIS PROVES
// ----------------
// "I have GPS coordinates (lat, lng) that lie inside neighborhood polygon P,
//  without revealing (lat, lng) to the server."
//
// APPROACH
// --------
// Ray-casting point-in-polygon algorithm, implemented as R1CS constraints.
// Coordinates are scaled by 1e6 and treated as integers to avoid floating point.
//
// PUBLIC INPUTS (known to verifier / server):
//   commitment_hash  — Poseidon(lat, lng, nonce): binds prover to specific coords
//   boundary_hash    — Poseidon(all vertex coords): identifies the neighborhood
//
// PRIVATE INPUTS (known only to prover / user's device):
//   lat, lng         — GPS coordinates scaled by 1e6 (e.g. 40.1°N → 40100000)
//   nonce            — random 128-bit value preventing replay
//
// POLYGON
// -------
// Fixed 8-vertex polygon. Smaller polygons pad by repeating the last vertex.
// All vertex coordinates are PUBLIC inputs (they define the neighborhood boundary).
//
// CONSTRAINT COUNT: ~900 — fits in 2^10 Powers of Tau
// ─────────────────────────────────────────────────────────────────────────────

include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";
include "circomlib/circuits/mux1.circom";

// ── Helper: LessThan for signed integers ─────────────────────────────────────
// circomlib's LessThan only handles unsigned. We add an offset to handle negatives.
// Offset = 2^32 (coordinates scaled by 1e6 fit well within ±180*1e6 = ±180,000,000)
template SignedLessThan(n) {
    signal input a;
    signal input b;
    signal output out;

    // Shift both values into unsigned range by adding 2^32
    var OFFSET = 4294967296; // 2^32
    component lt = LessThan(64);
    lt.in[0] <== a + OFFSET;
    lt.in[1] <== b + OFFSET;
    out <== lt.out;
}

// ── Helper: IsEqual for integers ─────────────────────────────────────────────
template IntIsEqual() {
    signal input a;
    signal input b;
    signal output out;
    component eq = IsEqual();
    eq.in[0] <== a;
    eq.in[1] <== b;
    out <== eq.out;
}

// ── Edge crossing check ───────────────────────────────────────────────────────
// For a horizontal ray from (px, py) going right (+x direction),
// check whether edge (x1,y1)→(x2,y2) crosses the ray.
//
// Crossing conditions (integer version of ray-casting):
//   1. The edge straddles the ray horizontally: min(y1,y2) <= py < max(y1,y2)
//   2. The intersection x-coordinate is >= px
//
// Returns 1 if crossing, 0 if not.
template EdgeCrossing() {
    signal input px;       // point x (lng * 1e6)
    signal input py;       // point y (lat * 1e6)
    signal input x1;       // edge start x
    signal input y1;       // edge start y
    signal input x2;       // edge end x
    signal input y2;       // edge end y
    signal output crosses; // 1 if ray crosses this edge

    // ── Condition 1: does edge straddle py? ──────────────────────────────────
    // y1 < py <= y2  OR  y2 < py <= y1
    // i.e. (y1 < py AND py <= y2) OR (y2 < py AND py <= y1)

    component y1_lt_py    = SignedLessThan(64);
    component py_leq_y2   = SignedLessThan(64);
    component y2_lt_py    = SignedLessThan(64);
    component py_leq_y1   = SignedLessThan(64);

    y1_lt_py.a  <== y1;  y1_lt_py.b  <== py;
    py_leq_y2.a <== py;  py_leq_y2.b <== y2 + 1;  // py <= y2 ↔ py < y2+1
    y2_lt_py.a  <== y2;  y2_lt_py.b  <== py;
    py_leq_y1.a <== py;  py_leq_y1.b <== y1 + 1;

    signal straddle_fwd <== y1_lt_py.out * py_leq_y2.out;   // y1 < py <= y2
    signal straddle_bwd <== y2_lt_py.out * py_leq_y1.out;   // y2 < py <= y1
    signal straddles    <== straddle_fwd + straddle_bwd - straddle_fwd * straddle_bwd;

    // ── Condition 2: is intersection x >= px? ────────────────────────────────
    // Intersection x = x1 + (py - y1) * (x2 - x1) / (y2 - y1)
    // Without division: x * (y2 - y1) = x1 * (y2 - y1) + (py - y1) * (x2 - x1)
    // We want: x * (y2 - y1) >= px * (y2 - y1)
    // Rearranged: (x1*(y2-y1) + (py-y1)*(x2-x1)) >= px*(y2-y1)
    //
    // But sign of (y2-y1) flips the inequality direction.
    // Case A: y2 > y1 → (y2-y1) > 0 → inequality direction preserved
    // Case B: y2 < y1 → (y2-y1) < 0 → inequality direction flips
    // Case C: y2 == y1 → edge is horizontal → we skip (straddles = 0 anyway)

    signal dy <== y2 - y1;
    signal dx <== x2 - x1;
    signal lhs <== x1 * dy + (py - y1) * dx;  // intersection_x * dy
    signal rhs <== px * dy;                    // px * dy

    // For case A (dy > 0): crossing if lhs >= rhs ↔ lhs - rhs >= 0
    component dy_positive = SignedLessThan(64);
    dy_positive.a <== 0;
    dy_positive.b <== dy;  // 0 < dy means dy is positive

    // For case B (dy < 0): crossing if lhs <= rhs ↔ rhs - lhs >= 0
    component lhs_geq_rhs = SignedLessThan(64);
    lhs_geq_rhs.a <== rhs - 1;  // lhs >= rhs ↔ rhs-1 < lhs
    lhs_geq_rhs.b <== lhs;

    component rhs_geq_lhs = SignedLessThan(64);
    rhs_geq_lhs.a <== lhs - 1;  // rhs >= lhs ↔ lhs-1 < rhs
    rhs_geq_lhs.b <== rhs;

    // Select the correct comparison based on dy sign
    signal x_ok_pos <== dy_positive.out * lhs_geq_rhs.out;    // case A
    signal dy_negative <== 1 - dy_positive.out;
    signal x_ok_neg <== dy_negative * rhs_geq_lhs.out;         // case B
    signal x_ok     <== x_ok_pos + x_ok_neg;

    // Final: edge crosses if it straddles py AND intersection is to the right
    crosses <== straddles * x_ok;
}

// ── Main residency circuit ────────────────────────────────────────────────────
// N = 8: fixed polygon size. Pad smaller polygons by repeating the last vertex.
template Residency(N) {
    // ── Private inputs ────────────────────────────────────────────────────────
    signal input lat;     // latitude  * 1,000,000 (integer, e.g. 40100000)
    signal input lng;     // longitude * 1,000,000 (integer, e.g. -74350000)
    signal input nonce;   // random 128-bit value

    // ── Public inputs ─────────────────────────────────────────────────────────
    // Polygon vertices (lat/lng * 1e6, interleaved: lat0, lng0, lat1, lng1, ...)
    signal input poly_lat[N];
    signal input poly_lng[N];

    // ── Public outputs ────────────────────────────────────────────────────────
    signal output commitment_hash;  // Poseidon(lat, lng, nonce)
    signal output boundary_hash;    // Poseidon(all poly vertices)

    // ── Step 1: Compute commitment hash ──────────────────────────────────────
    component commit = Poseidon(3);
    commit.inputs[0] <== lat;
    commit.inputs[1] <== lng;
    commit.inputs[2] <== nonce;
    commitment_hash <== commit.out;

    // ── Step 2: Compute boundary hash (proves which neighborhood) ─────────────
    component boundary = Poseidon(2 * N);
    for (var i = 0; i < N; i++) {
        boundary.inputs[2*i]   <== poly_lat[i];
        boundary.inputs[2*i+1] <== poly_lng[i];
    }
    boundary_hash <== boundary.out;

    // ── Step 3: Ray-casting point-in-polygon ──────────────────────────────────
    // Cast ray from (lng, lat) in the +x direction (east)
    // Count edge crossings — odd means inside

    component edge[N];
    signal crossing[N];
    signal running_xor[N + 1];
    running_xor[0] <== 0;

    for (var i = 0; i < N; i++) {
        var j = (i + 1) % N;  // next vertex (wraps around)

        edge[i] = EdgeCrossing();
        edge[i].px <== lng;          // x-axis is longitude
        edge[i].py <== lat;          // y-axis is latitude
        edge[i].x1 <== poly_lng[i];
        edge[i].y1 <== poly_lat[i];
        edge[i].x2 <== poly_lng[j];
        edge[i].y2 <== poly_lat[j];

        crossing[i] <== edge[i].crosses;

        // XOR accumulator: odd crossings → inside
        // XOR(a, b) = a + b - 2*a*b
        running_xor[i+1] <== running_xor[i] + crossing[i] - 2 * running_xor[i] * crossing[i];
    }

    // ── Step 4: Assert point is inside polygon ────────────────────────────────
    // running_xor[N] must be 1 (odd number of crossings = inside)
    running_xor[N] === 1;
}

// Instantiate with 8 vertices
component main {public [poly_lat, poly_lng]} = Residency(8);
