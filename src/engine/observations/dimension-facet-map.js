const FACET_ORDER = Object.freeze([
  "state", "cause", "motivation", "obstacle", "opportunity", "resource",
  "relationship", "action", "boundary", "trend", "outcome", "reflection",
]);

const RULES = Object.freeze([
  { tokens: ["motivation", "belief", "identity", "emotion", "shame", "hope", "fear", "value"], facets: ["motivation", "reflection", "state"] },
  { tokens: ["obstacle", "risk", "cost", "loss", "debt", "pressure", "conflict", "safety", "uncertainty", "gap", "constraint"], facets: ["obstacle", "boundary", "cause"] },
  { tokens: ["boundary", "protection", "limit"], facets: ["boundary", "obstacle", "action"] },
  { tokens: ["resource", "support", "income", "saving", "budget", "evidence", "stakeholder", "capacity"], facets: ["resource", "opportunity", "state"] },
  { tokens: ["action", "recommended", "practice", "learning", "communication", "conversation", "repair", "help", "finish", "priority", "commitment", "threshold"], facets: ["action", "boundary", "resource"] },
  { tokens: ["trend", "development", "future", "outcome", "result", "reversible", "choice", "direction"], facets: ["trend", "outcome", "opportunity"] },
  { tokens: ["relationship", "reciprocity", "external", "third-party", "sharing", "leadership", "collaboration"], facets: ["relationship", "state", "boundary"] },
  { tokens: ["readiness", "preparation"], facets: ["state", "resource", "action"] },
  { tokens: ["current", "body", "condition", "status"], facets: ["state", "reflection", "resource"] },
  { tokens: ["cause", "root", "past"], facets: ["cause", "motivation", "state"] },
]);

function unique(values) {
  return [...new Set(values)];
}

export function facetsForDimension(dimension) {
  const normalized = String(dimension || "").toLowerCase();
  const matched = RULES.filter((rule) => rule.tokens.some((token) => normalized.includes(token)))
    .flatMap((rule) => rule.facets);
  return Object.freeze(unique(matched.length ? matched : ["state", "reflection", "action", "boundary"]));
}

export function responsibilitiesFor(question, spreadId, positionId) {
  const responsibilities = question?.spreadProfiles?.[spreadId]?.positionResponsibilities?.[positionId];
  return Object.freeze([...(responsibilities || [])]);
}

export function mediatedResponsibility(responsibilities, operator) {
  if (!responsibilities.length) return null;
  if (operator.actionTransform === "required") return responsibilities.at(-1);
  if (operator.tense === "near-future" || operator.conditionality === "conditional") {
    return responsibilities.at(-1);
  }
  if (operator.subjectScope === "environment") return responsibilities[0];
  if (operator.tense === "past") return responsibilities[0];
  if (operator.evidencePriority === "core") return responsibilities[0];
  return responsibilities.at(-1);
}

export function facetPriorityFor(question, operator) {
  const responsibilities = responsibilitiesFor(question, operator.spreadId, operator.positionId);
  const preferred = responsibilities.flatMap((dimension) => facetsForDimension(dimension));
  const legal = new Set(operator.selectableFacets);
  return Object.freeze(unique([...preferred, ...operator.selectableFacets, ...FACET_ORDER])
    .filter((facet) => legal.has(facet)));
}

export function dimensionMatchesFacet(dimension, facet) {
  return facetsForDimension(dimension).includes(facet);
}
