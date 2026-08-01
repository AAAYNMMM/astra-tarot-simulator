import { getSpreadGraph, validateSpreadGraph } from "./spread-graphs.js";
import { responsibilitiesFor } from "./dimension-facet-map.js";
import { selectSemanticUnit } from "./semantic-selector.js";
import { getPositionOperator } from "../../knowledge/spreads/operators/index.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function round(value) {
  return Number(value.toFixed(4));
}

function qualityCoefficient(card) {
  const score = Number(card?.metadata?.score);
  if (!Number.isFinite(score)) return 0.9;
  return Math.min(1, Math.max(0.8, score / 100));
}

function orientationFit(card, orientation, reversalMode) {
  if (orientation === "upright") return 1;
  const configured = Number(card.reversal?.defaultWeights?.[reversalMode]);
  return round(0.8 + (Number.isFinite(configured) ? configured : 0) * 0.2);
}

function adjustedDimensions(card, orientation, reversalMode) {
  const source = Object.fromEntries(
    Object.entries(card.dimensions || {}).filter(([, value]) => Number.isFinite(value)),
  );
  if (orientation === "upright") return source;
  const result = { ...source };
  if (reversalMode === "blocked") {
    for (const [key, value] of Object.entries(result)) result[key] = round(value > 0 ? value * 0.45 : value);
  } else if (reversalMode === "excessive") {
    for (const key of ["activation", "speed", "risk"]) if (key in result) result[key] = round(result[key] * 1.25);
    for (const key of ["stability", "clarity"]) if (key in result) result[key] = round(result[key] * 0.75);
  } else if (reversalMode === "misdirected") {
    for (const key of ["clarity", "agency", "stability"]) if (key in result) result[key] = round(-Math.abs(result[key] || 1));
  } else if (reversalMode === "loss-of-control") {
    for (const key of ["stability", "clarity", "agency"]) if (key in result) result[key] = round(-Math.abs(result[key] || 1));
    if ("risk" in result) result.risk = round(Math.abs(result.risk) + 1);
  } else {
    for (const [key, value] of Object.entries(result)) result[key] = round(value * 0.85);
  }
  return result;
}

function validateInput({ card, question, operator, orientation, reversalMode = null }) {
  if (!card || !question || !operator) throw new TypeError("card, question, and operator are required");
  if (!["upright", "reversed"].includes(orientation)) throw new RangeError(`Unsupported orientation: ${orientation}`);
  if (!question.spreadProfiles?.[operator.spreadId]) {
    throw new Error(`Question ${question.id} does not support spread ${operator.spreadId}.`);
  }
  if (!question.spreadProfiles[operator.spreadId].positionResponsibilities?.[operator.positionId]) {
    throw new Error(`Question ${question.id} has no responsibility for ${operator.spreadId}/${operator.positionId}.`);
  }
  if (orientation === "upright" && reversalMode !== null) {
    throw new Error("Upright observations cannot declare a reversal mode.");
  }
  if (orientation === "reversed" && !card.reversal?.supportedModes?.includes(reversalMode)) {
    throw new Error(`Unsupported reversal mode ${reversalMode} for ${card.id}.`);
  }
}

export function createObservation(input) {
  validateInput(input);
  const { card, question, operator, orientation, reversalMode = null } = input;
  const responsibilities = responsibilitiesFor(question, operator.spreadId, operator.positionId);
  const { selected, candidates } = selectSemanticUnit(input);
  const questionMatch = selected.dimensionMatchMode === "direct"
    ? round(Math.min(1, 0.65 + (selected.matchedDimensions.length / responsibilities.length) * 0.35))
    : 0.55;
  const scoreBreakdown = {
    positionWeight: operator.weight,
    questionMatch,
    semanticStrength: selected.semanticUnitStrength,
    orientationFit: orientationFit(card, orientation, reversalMode),
    dataQuality: qualityCoefficient(card),
  };
  const localScore = round(
    scoreBreakdown.positionWeight
    * scoreBreakdown.questionMatch
    * scoreBreakdown.semanticStrength
    * scoreBreakdown.orientationFit
    * scoreBreakdown.dataQuality,
  );
  const modeFacetRefs = orientation === "reversed"
    ? [...(card.reversal.modeFacetRefs?.[reversalMode] || [])]
    : [];
  const tags = [...new Set([
    ...(selected.unit.tags || []),
    `orientation:${orientation}`,
    `dimension-match:${selected.dimensionMatchMode}`,
    ...(orientation === "reversed" ? [`reversal:${reversalMode}`] : []),
  ])];
  return deepFreeze({
    schemaVersion: "1.0.0",
    id: `obs-${question.id}-${operator.spreadId}-${operator.positionId}-${card.id}-${orientation}`,
    cardId: card.id,
    questionId: question.id,
    spreadId: operator.spreadId,
    positionId: operator.positionId,
    orientation,
    semanticUnitRef: `${card.id}#${selected.reference}`,
    semanticText: selected.unit.text,
    sourceRefs: [...selected.unit.sourceRefs],
    selectedFacet: selected.facet,
    selectedReversalMode: orientation === "reversed" ? reversalMode : null,
    reversalMechanism: {
      applied: orientation === "reversed",
      mode: orientation === "reversed" ? reversalMode : null,
      modeFacetRefs,
    },
    semanticTags: tags,
    questionDimensions: [...responsibilities],
    matchedDimensions: [...selected.matchedDimensions],
    dimensionMatchMode: selected.dimensionMatchMode,
    positionRole: {
      tense: operator.tense,
      subjectScope: operator.subjectScope,
      conditionality: operator.conditionality,
      actionTransform: operator.actionTransform,
      evidencePriority: operator.evidencePriority,
    },
    dimensions: adjustedDimensions(card, orientation, reversalMode),
    scoreBreakdown,
    localScore,
    evidenceType: operator.evidencePriority,
    selectionTrace: candidates.slice(0, 3).map((candidate, index) => ({
      rank: index + 1,
      semanticUnitRef: `${card.id}#${candidate.reference}`,
      facet: candidate.facet,
      score: candidate.selectionScore,
    })),
  });
}

export function createSpreadObservations({ draw, question, spreadId, spreadDefinitionVersion = "2.0.0" }) {
  const graph = getSpreadGraph(spreadId, spreadDefinitionVersion);
  if (!graph) throw new Error(`Unknown spread graph: ${spreadId}`);
  const graphErrors = validateSpreadGraph(graph, spreadDefinitionVersion);
  if (graphErrors.length) throw new Error(graphErrors.join("; "));
  const expected = graph.nodes.map((node) => node.id);
  const actual = draw.map((item) => item.positionId);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Draw position order differs from graph ${spreadId}.`);
  }
  const observations = draw.map((item) => createObservation({
    card: item.card,
    question,
    operator: getPositionOperator(spreadId, item.positionId, spreadDefinitionVersion),
    orientation: item.orientation,
    reversalMode: item.reversalMode ?? null,
  }));
  return deepFreeze({
    schemaVersion: "1.0.0",
    spreadId,
    questionId: question.id,
    graphId: graph.id,
    observations,
  });
}
