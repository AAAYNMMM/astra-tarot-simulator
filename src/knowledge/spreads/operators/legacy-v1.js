function legacyOperator(positionId, selectableFacets, {
  spreadId,
  tense,
  subjectScope,
  weight,
  conditionality,
  actionTransform,
  evidencePriority,
  canSupplyCounterEvidence = true,
}) {
  return Object.freeze({
    schemaVersion: "1.0.0",
    spreadId,
    positionId,
    selectableFacets: Object.freeze(selectableFacets),
    tense,
    subjectScope,
    weight,
    conditionality,
    actionTransform,
    evidencePriority,
    canSupportConclusion: true,
    canSupplyCounterEvidence,
  });
}

const single = (positionId, facets, options) => legacyOperator(positionId, facets, { spreadId: "single", ...options });
const timeline = (positionId, facets, options) => legacyOperator(positionId, facets, { spreadId: "timeline", ...options });
const cross = (positionId, facets, options) => legacyOperator(positionId, facets, { spreadId: "cross", ...options });
const celtic = (positionId, facets, options) => legacyOperator(positionId, facets, { spreadId: "celtic", ...options });

export const LEGACY_SINGLE_POSITION_OPERATORS = Object.freeze([
  single("essence", ["state", "opportunity", "action", "boundary", "reflection"], {
    tense: "open", subjectScope: "mixed", weight: 1.2, conditionality: "contextual",
    actionTransform: "optional", evidencePriority: "core",
  }),
]);

export const LEGACY_TIMELINE_POSITION_OPERATORS = Object.freeze([
  timeline("past", ["cause", "state", "motivation", "obstacle"], {
    tense: "past", subjectScope: "mixed", weight: 0.9, conditionality: "contextual",
    actionTransform: "none", evidencePriority: "secondary",
  }),
  timeline("present", ["state", "obstacle", "resource", "relationship"], {
    tense: "present", subjectScope: "mixed", weight: 1.2, conditionality: "direct",
    actionTransform: "optional", evidencePriority: "core",
  }),
  timeline("future", ["trend", "outcome", "opportunity", "action"], {
    tense: "near-future", subjectScope: "mixed", weight: 1, conditionality: "conditional",
    actionTransform: "optional", evidencePriority: "primary",
  }),
]);

export const LEGACY_CROSS_POSITION_OPERATORS = Object.freeze([
  cross("core", ["state", "obstacle", "relationship", "motivation"], {
    tense: "present", subjectScope: "mixed", weight: 1.4, conditionality: "direct",
    actionTransform: "none", evidencePriority: "core",
  }),
  cross("root", ["cause", "motivation", "state", "obstacle"], {
    tense: "past", subjectScope: "mixed", weight: 1, conditionality: "contextual",
    actionTransform: "none", evidencePriority: "primary",
  }),
  cross("trend", ["trend", "outcome", "opportunity", "action"], {
    tense: "near-future", subjectScope: "mixed", weight: 1.1, conditionality: "conditional",
    actionTransform: "optional", evidencePriority: "primary",
  }),
  cross("influence", ["resource", "opportunity", "obstacle", "relationship"], {
    tense: "present", subjectScope: "environment", weight: 1, conditionality: "contextual",
    actionTransform: "optional", evidencePriority: "primary",
  }),
  cross("action", ["action", "boundary", "resource", "opportunity"], {
    tense: "near-future", subjectScope: "self", weight: 1.3, conditionality: "corrective",
    actionTransform: "required", evidencePriority: "core", canSupplyCounterEvidence: false,
  }),
]);

export const LEGACY_CELTIC_POSITION_OPERATORS = Object.freeze([
  celtic("present", ["state", "relationship", "obstacle", "resource"], {
    tense: "present", subjectScope: "mixed", weight: 1.4, conditionality: "direct",
    actionTransform: "none", evidencePriority: "core",
  }),
  celtic("challenge", ["obstacle", "boundary", "cause", "relationship"], {
    tense: "present", subjectScope: "mixed", weight: 1.3, conditionality: "corrective",
    actionTransform: "optional", evidencePriority: "core",
  }),
  celtic("past", ["cause", "state", "motivation", "obstacle"], {
    tense: "past", subjectScope: "mixed", weight: 0.9, conditionality: "contextual",
    actionTransform: "none", evidencePriority: "secondary",
  }),
  celtic("future", ["trend", "outcome", "opportunity", "action"], {
    tense: "near-future", subjectScope: "mixed", weight: 1, conditionality: "conditional",
    actionTransform: "optional", evidencePriority: "primary",
  }),
  celtic("above", ["motivation", "opportunity", "outcome", "reflection"], {
    tense: "open", subjectScope: "self", weight: 0.9, conditionality: "contextual",
    actionTransform: "optional", evidencePriority: "secondary", canSupplyCounterEvidence: false,
  }),
  celtic("below", ["cause", "motivation", "reflection", "state"], {
    tense: "open", subjectScope: "self", weight: 1, conditionality: "contextual",
    actionTransform: "none", evidencePriority: "primary",
  }),
  celtic("advice", ["action", "boundary", "resource", "reflection"], {
    tense: "near-future", subjectScope: "self", weight: 1.3, conditionality: "corrective",
    actionTransform: "required", evidencePriority: "core", canSupplyCounterEvidence: false,
  }),
  celtic("external", ["relationship", "resource", "obstacle", "opportunity"], {
    tense: "present", subjectScope: "environment", weight: 0.9, conditionality: "contextual",
    actionTransform: "none", evidencePriority: "secondary",
  }),
  celtic("hopes", ["motivation", "reflection", "obstacle", "opportunity"], {
    tense: "open", subjectScope: "self", weight: 0.8, conditionality: "contextual",
    actionTransform: "none", evidencePriority: "contextual",
  }),
  celtic("outcome", ["outcome", "trend", "opportunity", "boundary"], {
    tense: "near-future", subjectScope: "mixed", weight: 1.2, conditionality: "conditional",
    actionTransform: "optional", evidencePriority: "core",
  }),
]);

export const LEGACY_POSITION_OPERATOR_GROUPS = Object.freeze({
  single: LEGACY_SINGLE_POSITION_OPERATORS,
  timeline: LEGACY_TIMELINE_POSITION_OPERATORS,
  cross: LEGACY_CROSS_POSITION_OPERATORS,
  celtic: LEGACY_CELTIC_POSITION_OPERATORS,
});
