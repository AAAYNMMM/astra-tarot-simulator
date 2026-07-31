function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function average(items) {
  return items.length ? items.reduce((sum, value) => sum + value, 0) / items.length : 0;
}

function category(type) {
  const value = String(type);
  if (/(indeterminate|unclear|insufficient|mixed|unknown)/.test(value)) return "indeterminate";
  if (/(unfavorable|avoid|pause|stop|release|decline|not-ready|no-)/.test(value)) return "negative";
  if (/(condition|prepare|adjust|clarify|explore|cautious|balance|boundary|wait|observe|repair|review|slow)/.test(value)) return "conditional";
  if (/(act-now|favorable|continue|proceed|open|growth|advance|accept|yes|strengthen)/.test(value)) return "positive";
  return "neutral";
}

function selectAllowedConclusion(allowed, preference) {
  const order = preference === "positive"
    ? ["positive", "conditional", "neutral", "indeterminate", "negative"]
    : preference === "negative"
      ? ["negative", "conditional", "indeterminate", "neutral", "positive"]
      : preference === "indeterminate"
        ? ["indeterminate", "conditional", "neutral", "negative", "positive"]
        : ["conditional", "neutral", "indeterminate", "positive", "negative"];
  for (const wanted of order) {
    const match = allowed.find((item) => category(item) === wanted);
    if (match) return match;
  }
  return allowed[0];
}

function confidenceFor(score, conflicts, gaps) {
  if (gaps.length || conflicts.some((item) => item.resolution === "retain-tension")) return "low";
  if (score >= 0.76 && conflicts.length === 0) return "high";
  return "medium";
}

export function classifyStructuredClaim({ resolution, question }) {
  if (!resolution || !Array.isArray(resolution.activeCandidates) || !question) {
    throw new TypeError("Conflict resolution and QuestionProfile are required.");
  }
  const allowed = unique(question.allowedConclusionTypes);
  if (!allowed.length) throw new Error(`Question ${question.id} has no allowed conclusion types.`);
  const supportive = resolution.activeCandidates.filter((item) => item.stance === "supportive");
  const cautionary = resolution.activeCandidates.filter((item) => item.stance === "cautionary");
  const conditional = resolution.activeCandidates.filter((item) => ["conditional", "transformative"].includes(item.stance));
  const supportScore = average(supportive.map((item) => item.score));
  const cautionScore = average(cautionary.map((item) => item.score));
  const conditionalScore = average(conditional.map((item) => item.score));
  let preference = "conditional";
  if (resolution.conflicts.some((item) => item.resolution === "retain-tension")) preference = "indeterminate";
  else if (cautionScore > supportScore + 0.15) preference = "negative";
  else if (supportScore > cautionScore + 0.12 && conditionalScore < supportScore) preference = "positive";

  const conclusionType = selectAllowedConclusion(allowed, preference);
  const dimensions = unique(resolution.activeCandidates.map((item) => item.dimension));
  const requiredDimensions = unique(question.spreadProfiles?.[resolution.spreadId]?.requiredConclusionDimensions);
  const coverageGaps = requiredDimensions.filter((item) => !dimensions.includes(item));
  const conditions = unique(resolution.activeCandidates.flatMap((item) => item.conditions));
  if (category(conclusionType) === "conditional" && conditions.length === 0) conditions.push("maintain-evidence-boundary");
  const score = Number(average(resolution.activeCandidates.map((item) => item.score)).toFixed(4));
  const candidateIds = resolution.activeCandidates.map((item) => item.id);
  const evidenceRefs = unique(resolution.activeCandidates.flatMap((item) => item.evidenceRefs));
  const sourceRefs = unique(resolution.activeCandidates.flatMap((item) => item.sourceRefs));

  return deepFreeze({
    schemaVersion: "1.0.0",
    id: `claim-${question.id}-${resolution.spreadId}`,
    claimType: "bounded-hypothesis",
    questionId: question.id,
    spreadId: resolution.spreadId,
    conclusionType,
    conclusionCategory: category(conclusionType),
    dimensions,
    requiredDimensions,
    coverageGaps,
    score,
    confidence: confidenceFor(score, resolution.conflicts, coverageGaps),
    conditions,
    conflicts: resolution.conflicts.map((item) => ({
      conflictId: item.id,
      dimension: item.dimension,
      resolution: item.resolution,
      dominantCandidateId: item.dominantCandidateId,
    })),
    candidateIds,
    evidenceRefs,
    sourceRefs,
    forbiddenClaimTypes: [],
    explanationKeys: unique([
      `conclusion:${conclusionType}`,
      `conclusion-category:${category(conclusionType)}`,
      ...dimensions.map((item) => `claim-dimension:${item}`),
      ...resolution.conflicts.map((item) => item.explanationKey),
    ]),
    provenance: {
      candidateCount: resolution.activeCandidates.length,
      suppressedCount: resolution.suppressedCandidates.length,
      conflictCount: resolution.conflicts.length,
      policy: resolution.policy,
    },
  });
}
