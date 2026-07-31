import assert from "node:assert/strict";
import { createValidatedClaim } from "../src/engine/claims/claim-engine.js";
import { validateStructuredClaim } from "../src/engine/claims/claim-validator.js";
import { renderReadingText } from "../src/engine/text/template-renderer.js";
import { buildPhase6Fixture } from "./phase_6_test_support.mjs";

const fixture = await buildPhase6Fixture({ spreadId: "cross", orientation: "upright", offset: 13 });
const pipeline = createValidatedClaim(fixture);
assert.ok(fixture.question.allowedConclusionTypes.includes(pipeline.claim.conclusionType));
assert.equal(pipeline.claim.validation.status, "valid");
assert.deepEqual(validateStructuredClaim({
  claim: pipeline.claim,
  question: fixture.question,
  candidateBatch: pipeline.candidateBatch,
  resolution: pipeline.resolution,
}), []);
assert.ok(Object.isFrozen(pipeline.claim));

const invalidConclusion = { ...pipeline.claim, conclusionType: "guaranteed-outcome" };
assert.ok(validateStructuredClaim({
  claim: invalidConclusion,
  question: fixture.question,
  candidateBatch: pipeline.candidateBatch,
  resolution: pipeline.resolution,
}).some((item) => item.includes("not allowed")));

const prohibited = { ...pipeline.claim, forbiddenClaimTypes: ["guaranteed-outcome"] };
assert.ok(validateStructuredClaim({
  claim: prohibited,
  question: fixture.question,
  candidateBatch: pipeline.candidateBatch,
  resolution: pipeline.resolution,
}).some((item) => item.includes("Prohibited")));

assert.throws(() => renderReadingText({
  claim: { ...pipeline.claim, validation: { status: "invalid" } },
  candidateBatch: pipeline.candidateBatch,
  observations: fixture.observations,
}), /validated structured Claim/);
console.log("CL-004 finite classification and CL-005 structured Claim validation passed.");
