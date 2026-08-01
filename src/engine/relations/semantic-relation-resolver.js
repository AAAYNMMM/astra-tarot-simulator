function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function unique(values) {
  return [...new Set(values || [])];
}

function intersection(left, right) {
  const target = new Set(right || []);
  return unique(left).filter((item) => target.has(item));
}

function round(value) {
  return Number(value.toFixed(4));
}

function clamp(value, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function dimensionAlignment(source, target) {
  const keys = Object.keys(source || {}).filter((key) => Number.isFinite(source[key]) && Number.isFinite(target?.[key]));
  if (!keys.length) return { score: 0, compared: [] };
  let numerator = 0;
  let sourceMagnitude = 0;
  let targetMagnitude = 0;
  for (const key of keys) {
    numerator += source[key] * target[key];
    sourceMagnitude += source[key] ** 2;
    targetMagnitude += target[key] ** 2;
  }
  const denominator = Math.sqrt(sourceMagnitude) * Math.sqrt(targetMagnitude);
  return {
    score: round(denominator ? numerator / denominator : 0),
    compared: keys,
  };
}

function semanticTags(observation, card) {
  return unique([
    ...(observation.semanticTags || []),
    ...(card.themes || []),
    observation.selectedFacet,
  ].filter(Boolean));
}

function typePolarity(type) {
  if (["supports", "reinforces", "repairs"].includes(type)) return "supportive";
  if (["weakens", "contradicts"].includes(type)) return "tensional";
  if (type === "transforms") return "transformative";
  if (type === "causes") return "causal";
  if (type === "continues") return "continuative";
  return "conditional";
}

function scoreType(type, context) {
  const {
    sourceObservation,
    targetObservation,
    positionFit,
    alignment,
    themeOverlap,
    supportMatches,
    conflictMatches,
    transformMatches,
  } = context;
  let score = 0.25;
  const sourceFacet = sourceObservation.selectedFacet;
  const targetFacet = targetObservation.selectedFacet;
  const edgeRole = context.edgeRole;
  const mixedOrientation = sourceObservation.orientation !== targetObservation.orientation;
  const reversedCount = [sourceObservation, targetObservation].filter((item) => item.orientation === "reversed").length;

  if (type === "causes") {
    if (["cause", "motivation"].includes(sourceFacet)) score += 0.38;
    if (["state", "obstacle", "trend", "outcome"].includes(targetFacet)) score += 0.16;
    if (["causal-input", "underlying-input"].includes(edgeRole)) score += 0.24;
  } else if (type === "conditions") {
    score += positionFit.sharedResponsibilities.length * 0.07;
    score += positionFit.handoffDimensions.length * 0.09;
    if (targetObservation.positionRole?.conditionality !== "direct") score += 0.18;
    if (edgeRole.includes("condition") || edgeRole.includes("context")) score += 0.2;
  } else if (type === "supports") {
    score += supportMatches.length * 0.12;
    score += themeOverlap.length * 0.06;
    if (alignment.score > 0.2) score += alignment.score * 0.18;
    if (positionFit.coverage.combined >= 0.5) score += 0.12;
  } else if (type === "reinforces") {
    score += themeOverlap.length * 0.1;
    if (supportMatches.length >= 2) score += 0.22;
    if (alignment.score > 0.55) score += alignment.score * 0.22;
    if (!mixedOrientation) score += 0.08;
  } else if (type === "weakens") {
    score += conflictMatches.length * 0.14;
    if (alignment.score < -0.15) score += Math.abs(alignment.score) * 0.24;
    if (mixedOrientation) score += 0.12;
    if (reversedCount) score += reversedCount * 0.06;
  } else if (type === "contradicts") {
    score += conflictMatches.length * 0.18;
    if (alignment.score < -0.35) score += Math.abs(alignment.score) * 0.28;
    if (mixedOrientation) score += 0.08;
    if (edgeRole === "active-tension") score += 0.24;
  } else if (type === "transforms") {
    score += transformMatches.length * 0.16;
    if (mixedOrientation) score += 0.16;
    if (["action", "trend", "outcome", "boundary"].includes(targetFacet)) score += 0.14;
    if (["temporal-continuation", "trend-projection", "long-arc-projection"].includes(edgeRole)) score += 0.18;
  } else if (type === "repairs") {
    if (["obstacle", "cause", "state"].includes(sourceFacet)) score += 0.16;
    if (["action", "boundary", "resource", "opportunity"].includes(targetFacet)) score += 0.28;
    if (["required", "optional"].includes(targetObservation.positionRole?.actionTransform)) score += 0.16;
    if (["corrective-input", "response-to-context", "guidance-conditions-outcome"].includes(edgeRole)) score += 0.22;
  } else if (type === "continues") {
    if (sourceFacet === targetFacet) score += 0.16;
    if (alignment.score > 0) score += alignment.score * 0.18;
    if (!mixedOrientation) score += 0.1;
    if (["temporal-continuation", "trend-continuation", "long-arc-projection"].includes(edgeRole)) score += 0.28;
  }
  score += positionFit.evidenceWeight * 0.08;
  return round(score);
}

export const RELATION_TYPES = Object.freeze([
  "causes",
  "conditions",
  "supports",
  "weakens",
  "reinforces",
  "contradicts",
  "transforms",
  "repairs",
  "continues",
]);

export function resolveSemanticRelation({
  candidate,
  sourceObservation,
  targetObservation,
  sourceCard,
  targetCard,
  questionFit = null,
  responsibilityFit = null,
}) {
  const positionFit = responsibilityFit || questionFit;
  const spreadProfileMode = Boolean(responsibilityFit);
  if (!candidate || !sourceObservation || !targetObservation || !sourceCard || !targetCard || !positionFit) {
    throw new TypeError("Semantic Relation resolution requires candidate, observations, cards, and position fit.");
  }
  const allowedTypes = unique(candidate.candidateTypes);
  if (!allowedTypes.length || allowedTypes.some((type) => !RELATION_TYPES.includes(type))) {
    throw new Error(`Candidate ${candidate.id} contains unsupported Relation types.`);
  }

  const sourceTags = semanticTags(sourceObservation, sourceCard);
  const targetTags = semanticTags(targetObservation, targetCard);
  const sourceRelations = sourceCard.relations || {};
  const targetRelations = targetCard.relations || {};
  const themeOverlap = intersection(sourceTags, targetTags);
  const supportMatches = unique([
    ...intersection(sourceRelations.supportsTags, targetTags),
    ...intersection(targetRelations.supportsTags, sourceTags),
  ]);
  const conflictMatches = unique([
    ...intersection(sourceRelations.conflictsTags, targetTags),
    ...intersection(targetRelations.conflictsTags, sourceTags),
  ]);
  const transformMatches = unique([
    ...intersection(sourceRelations.transformsTags, targetTags),
    ...intersection(targetRelations.transformsTags, sourceTags),
  ]);
  const alignment = dimensionAlignment(sourceObservation.dimensions, targetObservation.dimensions);
  const context = {
    sourceObservation,
    targetObservation,
    positionFit,
    alignment,
    themeOverlap,
    supportMatches,
    conflictMatches,
    transformMatches,
    edgeRole: candidate.structure.edgeRole,
  };
  const scores = allowedTypes.map((type, index) => ({ type, index, score: scoreType(type, context) }));
  scores.sort((left, right) => right.score - left.score || left.index - right.index);
  const selected = scores[0];
  const runnerUp = scores[1]?.score ?? 0;
  const margin = selected.score - runnerUp;
  const strength = round(clamp(0.38 + selected.score * 0.42 + positionFit.coverage.combined * 0.12));
  const confidence = margin >= 0.22 && strength >= 0.7 ? "high" : margin >= 0.08 ? "medium" : "low";

  return deepFreeze({
    schemaVersion: "1.0.0",
    type: selected.type,
    polarity: typePolarity(selected.type),
    strength,
    confidence,
    candidateScores: scores.map(({ type, score }) => ({ type, score })),
    evidence: {
      themeOverlap,
      supportMatches,
      conflictMatches,
      transformMatches,
      dimensionAlignment: alignment,
      orientation: {
        source: sourceObservation.orientation,
        target: targetObservation.orientation,
        sourceMode: sourceObservation.selectedReversalMode || null,
        targetMode: targetObservation.selectedReversalMode || null,
      },
      ...(spreadProfileMode
        ? { responsibilityCoverage: positionFit.coverage }
        : { questionCoverage: positionFit.coverage }),
      handoffDimensions: [...positionFit.handoffDimensions],
    },
    explanationKeys: unique([
      candidate.explanationKey,
      `relation-type:${selected.type}`,
      `relation-polarity:${typePolarity(selected.type)}`,
      ...(positionFit.priorityDimension
        ? [`${spreadProfileMode ? "responsibility" : "question-dimension"}:${positionFit.priorityDimension}`]
        : []),
    ]),
  });
}
