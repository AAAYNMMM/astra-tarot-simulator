function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function stanceDirection(stance) {
  if (stance === "supportive") return 1;
  if (stance === "cautionary") return -1;
  return 0;
}

export function resolveClaimConflicts(scoredBatch) {
  if (!scoredBatch || !Array.isArray(scoredBatch.scoredCandidates)) {
    throw new TypeError("A scored ClaimCandidate batch is required.");
  }
  const activeCandidates = [];
  const suppressedCandidates = [];
  const propositionWinners = new Map();

  for (const candidate of scoredBatch.scoredCandidates) {
    const key = `${candidate.dimension}|${candidate.propositionKey}|${candidate.stance}`;
    const winner = propositionWinners.get(key);
    if (winner) {
      suppressedCandidates.push({
        candidate,
        reason: "duplicate-proposition",
        retainedCandidateId: winner.id,
      });
      continue;
    }
    propositionWinners.set(key, candidate);
    activeCandidates.push(candidate);
  }

  const byDimension = new Map();
  for (const candidate of activeCandidates) {
    if (!byDimension.has(candidate.dimension)) byDimension.set(candidate.dimension, []);
    byDimension.get(candidate.dimension).push(candidate);
  }
  const conflicts = [];
  for (const [dimension, candidates] of byDimension) {
    const supportive = candidates.filter((item) => stanceDirection(item.stance) > 0);
    const cautionary = candidates.filter((item) => stanceDirection(item.stance) < 0);
    if (!supportive.length || !cautionary.length) continue;
    const positive = supportive[0];
    const negative = cautionary[0];
    const gap = Number(Math.abs(positive.score - negative.score).toFixed(4));
    conflicts.push({
      id: `claim-conflict-${dimension}`,
      dimension,
      supportiveCandidateIds: supportive.map((item) => item.id),
      cautionaryCandidateIds: cautionary.map((item) => item.id),
      scoreGap: gap,
      resolution: gap >= 0.22 ? "dominant-with-counterevidence" : "retain-tension",
      dominantCandidateId: gap >= 0.22 ? (positive.score >= negative.score ? positive.id : negative.id) : null,
      explanationKey: gap >= 0.22 ? "conflict:dominant-with-counterevidence" : "conflict:retain-tension",
    });
  }

  return deepFreeze({
    schemaVersion: "1.0.0",
    questionId: scoredBatch.questionId,
    spreadId: scoredBatch.spreadId,
    activeCandidates,
    suppressedCandidates,
    conflicts,
    policy: "deduplicate-identical-retain-opposition",
  });
}
