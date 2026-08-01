export const TIMELINE_POSITION_OPERATORS = Object.freeze([
  Object.freeze({
    schemaVersion: "1.0.0", spreadId: "timeline", positionId: "past",
    selectableFacets: Object.freeze(["cause", "state", "motivation", "obstacle"]),
    tense: "past", subjectScope: "mixed", weight: 0.9, conditionality: "contextual",
    actionTransform: "none", evidencePriority: "secondary",
    canSupportConclusion: true, canSupplyCounterEvidence: true,
  }),
  Object.freeze({
    schemaVersion: "1.0.0", spreadId: "timeline", positionId: "present",
    selectableFacets: Object.freeze(["state", "obstacle", "resource", "relationship", "action"]),
    tense: "present", subjectScope: "mixed", weight: 1.1, conditionality: "direct",
    actionTransform: "optional", evidencePriority: "core",
    canSupportConclusion: true, canSupplyCounterEvidence: true,
  }),
  Object.freeze({
    schemaVersion: "1.0.0", spreadId: "timeline", positionId: "future",
    selectableFacets: Object.freeze(["trend", "outcome", "opportunity", "boundary", "action"]),
    tense: "near-future", subjectScope: "mixed", weight: 1, conditionality: "conditional",
    actionTransform: "optional", evidencePriority: "primary",
    canSupportConclusion: true, canSupplyCounterEvidence: true,
  }),
]);
