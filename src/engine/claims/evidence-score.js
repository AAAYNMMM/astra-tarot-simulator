function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}

function round(value) {
  return Number(value.toFixed(4));
}

function priorityWeight(priority) {
  return ({ core: 1, primary: 0.86, secondary: 0.72, context: 0.58 })[priority] || 0.5;
}

export function scoreClaimCandidates(candidateBatch, question) {
  if (!candidateBatch || !Array.isArray(candidateBatch.candidates) || !question) {
    throw new TypeError("ClaimCandidate batch and QuestionProfile are required.");
  }
  if (candidateBatch.questionId !== question.id) throw new Error("QuestionProfile does not match ClaimCandidate batch.");
  const dimensionOrder = new Map((question.answerDimensions || []).map((item, index) => [item, index]));
  const scored = candidateBatch.candidates.map((candidate) => {
    const observation = Number(candidate.strengthHints?.observationLocalScore) || 0;
    const relation = candidate.kind === "relation"
      ? Number(candidate.strengthHints?.relationStrength) || 0
      : observation;
    const priority = priorityWeight(candidate.strengthHints?.evidencePriority);
    const provenance = Math.min(1, (candidate.evidenceRefs?.length || 0) / 3);
    const sourceQuality = Math.min(1, (candidate.sourceRefs?.length || 0) / 2);
    const conditionPenalty = Math.min(0.12, (candidate.conditions?.length || 0) * 0.035);
    const score = round(clamp(
      observation * 0.32
      + relation * 0.28
      + priority * 0.2
      + provenance * 0.1
      + sourceQuality * 0.1
      - conditionPenalty,
    ));
    return {
      ...candidate,
      score,
      scoreBreakdown: {
        observation: round(observation),
        relation: round(relation),
        evidencePriority: round(priority),
        provenance: round(provenance),
        sourceQuality: round(sourceQuality),
        conditionPenalty: round(conditionPenalty),
      },
    };
  });
  scored.sort((left, right) => (
    right.score - left.score
    || (dimensionOrder.get(left.dimension) ?? 999) - (dimensionOrder.get(right.dimension) ?? 999)
    || left.sourceOrder - right.sourceOrder
    || left.id.localeCompare(right.id)
  ));
  const ranked = scored.map((candidate, index) => ({ ...candidate, rank: index + 1 }));
  return deepFreeze({
    schemaVersion: "1.0.0",
    questionId: candidateBatch.questionId,
    spreadId: candidateBatch.spreadId,
    candidateCount: ranked.length,
    scoredCandidates: ranked,
    ordering: "score-desc-dimension-source-id",
  });
}
