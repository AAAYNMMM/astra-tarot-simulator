import assert from "node:assert/strict";
import { createClaimCandidates } from "../src/engine/claims/claim-candidate.js";
import { scoreClaimCandidates } from "../src/engine/claims/evidence-score.js";
import { resolveClaimConflicts } from "../src/engine/claims/conflict-resolver.js";
import { buildPhase6Fixture } from "./phase_6_test_support.mjs";

const fixture = await buildPhase6Fixture({ spreadId: "celtic", orientation: "reversed", offset: 9 });
const candidates = createClaimCandidates(fixture);
const scored = scoreClaimCandidates(candidates, fixture.question);
const repeated = scoreClaimCandidates(candidates, fixture.question);
assert.deepEqual(scored, repeated);
assert.equal(scored.scoredCandidates.length, candidates.candidates.length);
assert.ok(scored.scoredCandidates.every((item, index) => (
  item.rank === index + 1 && item.score >= 0 && item.score <= 1
)));
for (let index = 1; index < scored.scoredCandidates.length; index += 1) {
  assert.ok(scored.scoredCandidates[index - 1].score >= scored.scoredCandidates[index].score);
}

const base = scored.scoredCandidates[0];
const synthetic = {
  schemaVersion: "1.0.0",
  questionId: scored.questionId,
  spreadId: scored.spreadId,
  scoredCandidates: [
    { ...base, id: "synthetic-support", propositionKey: "same:support", stance: "supportive", score: 0.82, rank: 1 },
    { ...base, id: "synthetic-caution", propositionKey: "same:caution", stance: "cautionary", score: 0.78, rank: 2 },
    { ...base, id: "synthetic-duplicate", propositionKey: "same:support", stance: "supportive", score: 0.7, rank: 3 },
  ],
};
const resolution = resolveClaimConflicts(synthetic);
assert.equal(resolution.activeCandidates.length, 2);
assert.equal(resolution.suppressedCandidates.length, 1);
assert.equal(resolution.conflicts.length, 1);
assert.equal(resolution.conflicts[0].resolution, "retain-tension");
assert.ok(Object.isFrozen(resolution));
console.log("CL-002 evidence scoring and CL-003 conflict resolution passed.");
