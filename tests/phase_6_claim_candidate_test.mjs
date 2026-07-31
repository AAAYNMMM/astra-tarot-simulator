import assert from "node:assert/strict";
import { createClaimCandidates, validateClaimCandidateBatch } from "../src/engine/claims/claim-candidate.js";
import { buildPhase6Fixture } from "./phase_6_test_support.mjs";

for (const spreadId of ["single", "timeline", "cross", "celtic"]) {
  const fixture = await buildPhase6Fixture({ spreadId, offset: 4 });
  const batch = createClaimCandidates(fixture);
  const repeated = createClaimCandidates({
    ...fixture,
    observations: [...fixture.observations].reverse(),
  });
  assert.deepEqual(batch, repeated, `${spreadId}: ClaimCandidate order must ignore input order`);
  assert.equal(batch.candidateCount, fixture.observations.length + fixture.relationBatch.relations.length);
  assert.deepEqual(validateClaimCandidateBatch(batch, fixture), []);
  assert.ok(batch.candidates.every((item) => !("score" in item) && !("conclusionType" in item) && !("text" in item)));
  assert.ok(Object.isFrozen(batch));
}
const single = await buildPhase6Fixture({ spreadId: "single" });
const singleBatch = createClaimCandidates(single);
assert.equal(single.relationBatch.relations.length, 0);
assert.equal(singleBatch.candidateCount, 1);
console.log("CL-001 ClaimCandidate generation passed for all spreads.");
