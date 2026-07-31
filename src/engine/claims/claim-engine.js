import { createClaimCandidates, validateClaimCandidateBatch } from "./claim-candidate.js";
import { scoreClaimCandidates } from "./evidence-score.js";
import { resolveClaimConflicts } from "./conflict-resolver.js";
import { classifyStructuredClaim } from "./conclusion-classifier.js";
import { validateAndSealClaim } from "./claim-validator.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

export function createValidatedClaim({ relationBatch, observations, question }) {
  const candidateBatch = createClaimCandidates({ relationBatch, observations, question });
  const candidateErrors = validateClaimCandidateBatch(candidateBatch, { relationBatch, observations, question });
  if (candidateErrors.length) throw new Error(candidateErrors.join("; "));
  const scoredBatch = scoreClaimCandidates(candidateBatch, question);
  const resolution = resolveClaimConflicts(scoredBatch);
  const classified = classifyStructuredClaim({ resolution, question });
  const claim = validateAndSealClaim({
    claim: classified,
    question,
    candidateBatch,
    resolution,
  });
  return deepFreeze({
    schemaVersion: "1.0.0",
    questionId: question.id,
    spreadId: relationBatch.spreadId,
    candidateBatch,
    scoredBatch,
    resolution,
    claim,
  });
}
