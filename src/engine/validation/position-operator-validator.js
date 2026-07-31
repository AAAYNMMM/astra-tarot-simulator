import { validateJsonSchema } from "./schema-validator.js";
import { SPREADS } from "../../knowledge/spreads/definitions.js";
import { TAXONOMY } from "../../knowledge/vocabularies/taxonomy.js";

const spreadPositions = new Map(SPREADS.map((spread) => [spread.id, new Set(spread.positions.map((item) => item.id))]));
const facets = new Set(TAXONOMY.facets);

function issue(code, path, value) {
  return Object.freeze({ code, path, keyword: "positionContract", value });
}

export function validatePositionOperator(operator, schema) {
  const errors = [...validateJsonSchema(operator, schema)];
  const positions = spreadPositions.get(operator?.spreadId);
  if (!positions) errors.push(issue("position.spread_unknown", "$.spreadId", operator?.spreadId));
  else if (!positions.has(operator.positionId)) errors.push(issue("position.id_not_in_spread", "$.positionId", operator.positionId));
  for (const [index, facet] of (operator?.selectableFacets || []).entries()) {
    if (!facets.has(facet)) errors.push(issue("position.facet_unknown", `$.selectableFacets[${index}]`, facet));
  }
  if (operator?.actionTransform === "required" && !(operator.selectableFacets || []).includes("action")) {
    errors.push(issue("position.required_action_without_action_facet", "$.actionTransform", operator.actionTransform));
  }
  if (operator?.evidencePriority === "core" && operator?.canSupportConclusion !== true) {
    errors.push(issue("position.core_must_support_conclusion", "$.canSupportConclusion", operator.canSupportConclusion));
  }
  return errors.sort((a, b) => a.path.localeCompare(b.path) || a.code.localeCompare(b.code));
}
