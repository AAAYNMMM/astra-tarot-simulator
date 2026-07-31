import { validateJsonSchema } from "./schema-validator.js";
import { dimensionMatchesFacet, responsibilitiesFor } from "../observations/dimension-facet-map.js";

function issue(code, path, value) {
  return Object.freeze({ code, path, keyword: "observationContract", value });
}

function semanticMap(card) {
  return new Map(Object.values(card.facets || {}).flat().map((unit) => [unit.id, unit]));
}

export function validateObservation(observation, { card, question, operator, schema }) {
  const errors = [...validateJsonSchema(observation, schema)];
  const prefix = `${card.id}#`;
  const reference = observation?.semanticUnitRef?.startsWith(prefix)
    ? observation.semanticUnitRef.slice(prefix.length)
    : null;
  const unit = semanticMap(card).get(reference);
  if (!unit) errors.push(issue("observation.semantic_reference_unknown", "$.semanticUnitRef", observation?.semanticUnitRef));
  if (observation?.cardId !== card.id) errors.push(issue("observation.card_mismatch", "$.cardId", observation?.cardId));
  if (observation?.questionId !== question.id) errors.push(issue("observation.question_mismatch", "$.questionId", observation?.questionId));
  if (observation?.spreadId !== operator.spreadId) errors.push(issue("observation.spread_mismatch", "$.spreadId", observation?.spreadId));
  if (observation?.positionId !== operator.positionId) errors.push(issue("observation.position_mismatch", "$.positionId", observation?.positionId));
  if (!operator.selectableFacets.includes(observation?.selectedFacet)) {
    errors.push(issue("observation.facet_not_allowed", "$.selectedFacet", observation?.selectedFacet));
  }
  if (unit && observation?.semanticText !== unit.text) {
    errors.push(issue("observation.semantic_text_mismatch", "$.semanticText", observation?.semanticText));
  }
  const responsibilities = responsibilitiesFor(question, operator.spreadId, operator.positionId);
  if (JSON.stringify(observation?.questionDimensions) !== JSON.stringify(responsibilities)) {
    errors.push(issue("observation.question_dimensions_mismatch", "$.questionDimensions", observation?.questionDimensions));
  }
  for (const dimension of observation?.matchedDimensions || []) {
    if (!responsibilities.includes(dimension) || !dimensionMatchesFacet(dimension, observation.selectedFacet)) {
      errors.push(issue("observation.dimension_facet_mismatch", "$.matchedDimensions", dimension));
    }
  }
  if (observation?.orientation === "upright" && observation?.selectedReversalMode !== null) {
    errors.push(issue("observation.upright_has_reversal", "$.selectedReversalMode", observation?.selectedReversalMode));
  }
  if (observation?.orientation === "reversed" && !card.reversal.supportedModes.includes(observation?.selectedReversalMode)) {
    errors.push(issue("observation.reversal_mode_invalid", "$.selectedReversalMode", observation?.selectedReversalMode));
  }
  const breakdown = observation?.scoreBreakdown || {};
  const expectedScore = Number((
    breakdown.positionWeight
    * breakdown.questionMatch
    * breakdown.semanticStrength
    * breakdown.orientationFit
    * breakdown.dataQuality
  ).toFixed(4));
  if (!Number.isFinite(observation?.localScore) || observation.localScore !== expectedScore) {
    errors.push(issue("observation.local_score_mismatch", "$.localScore", observation?.localScore));
  }
  for (const [key, value] of Object.entries(observation?.dimensions || {})) {
    if (!Number.isFinite(value)) errors.push(issue("observation.dimension_not_finite", `$.dimensions.${key}`, value));
  }
  return errors.sort((left, right) => (
    left.path < right.path ? -1 : left.path > right.path ? 1
      : left.code < right.code ? -1 : left.code > right.code ? 1 : 0
  ));
}
