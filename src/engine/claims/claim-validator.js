import { INTERPRETATION_POLICY } from "../../knowledge/vocabularies/interpretation-policy.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

export function validateStructuredClaim({ claim, question, candidateBatch, resolution }) {
  const errors = [];
  if (!claim || !question || !candidateBatch || !resolution) return ["Claim validation inputs are incomplete."];
  if (claim.claimType !== "bounded-hypothesis") errors.push("Claim must remain a bounded hypothesis.");
  if (claim.questionId !== question.id || claim.spreadId !== candidateBatch.spreadId) errors.push("Claim scope mismatch.");
  if (!question.allowedConclusionTypes?.includes(claim.conclusionType)) errors.push("Conclusion type is not allowed by QuestionProfile.");
  const prohibited = new Set([...(INTERPRETATION_POLICY.prohibited || []), ...(question.forbiddenClaims || [])]);
  for (const forbidden of claim.forbiddenClaimTypes || []) {
    if (prohibited.has(forbidden)) errors.push(`Prohibited claim type: ${forbidden}`);
  }
  if (!Number.isFinite(claim.score) || claim.score < 0 || claim.score > 1) errors.push("Claim score must be in [0, 1].");
  if (!["low", "medium", "high"].includes(claim.confidence)) errors.push("Claim confidence is invalid.");

  const candidatesById = new Map(candidateBatch.candidates.map((item) => [item.id, item]));
  const activeIds = new Set(resolution.activeCandidates.map((item) => item.id));
  const knownEvidence = new Set(candidateBatch.candidates.flatMap((item) => item.evidenceRefs || []));
  for (const candidateId of claim.candidateIds || []) {
    if (!candidatesById.has(candidateId) || !activeIds.has(candidateId)) errors.push(`Unknown or inactive ClaimCandidate: ${candidateId}`);
  }
  for (const evidenceRef of claim.evidenceRefs || []) {
    if (!knownEvidence.has(evidenceRef)) errors.push(`Unknown evidence reference: ${evidenceRef}`);
  }
  if (!claim.candidateIds?.length || !claim.evidenceRefs?.length || !claim.sourceRefs?.length) {
    errors.push("Claim must retain candidate, evidence, and source provenance.");
  }

  const allowedDimensions = new Set(question.answerDimensions || []);
  for (const dimension of claim.dimensions || []) {
    if (!allowedDimensions.has(dimension)) errors.push(`Unknown answer dimension: ${dimension}`);
  }
  const coveredOrGap = new Set([...(claim.dimensions || []), ...(claim.coverageGaps || [])]);
  for (const required of claim.requiredDimensions || []) {
    if (!coveredOrGap.has(required)) errors.push(`Required conclusion dimension was neither covered nor declared as a gap: ${required}`);
  }
  if (claim.conflicts?.length && claim.provenance?.conflictCount !== claim.conflicts.length) {
    errors.push("Conflict provenance mismatch.");
  }
  if (claim.conclusionCategory === "conditional" && !claim.conditions?.length) {
    errors.push("Conditional conclusion has no explicit condition.");
  }
  if ("text" in claim || "paragraphs" in claim) errors.push("Structured Claim cannot contain rendered text.");
  return unique(errors);
}

export function validateAndSealClaim(inputs) {
  const errors = validateStructuredClaim(inputs);
  if (errors.length) throw new Error(errors.join("; "));
  return deepFreeze({
    ...inputs.claim,
    validation: {
      status: "valid",
      validatorVersion: "1.0.0",
      checkedRules: [
        "evidence-provenance",
        "question-dimensions",
        "forbidden-claims",
        "conditions",
        "conflicts",
        "score-bounds",
      ],
    },
  });
}
