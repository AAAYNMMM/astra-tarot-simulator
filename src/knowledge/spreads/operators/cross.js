export const CROSS_POSITION_OPERATORS = [
  {
    "schemaVersion": "1.0.0",
    "spreadId": "cross",
    "positionId": "core",
    "selectableFacets": [
      "state",
      "obstacle",
      "relationship",
      "motivation"
    ],
    "tense": "present",
    "subjectScope": "mixed",
    "weight": 1.4,
    "conditionality": "direct",
    "actionTransform": "none",
    "evidencePriority": "core",
    "canSupportConclusion": true,
    "canSupplyCounterEvidence": true
  },
  {
    "schemaVersion": "1.0.0",
    "spreadId": "cross",
    "positionId": "root",
    "selectableFacets": [
      "cause",
      "motivation",
      "state",
      "obstacle"
    ],
    "tense": "past",
    "subjectScope": "mixed",
    "weight": 1.0,
    "conditionality": "contextual",
    "actionTransform": "none",
    "evidencePriority": "primary",
    "canSupportConclusion": true,
    "canSupplyCounterEvidence": true
  },
  {
    "schemaVersion": "1.0.0",
    "spreadId": "cross",
    "positionId": "trend",
    "selectableFacets": [
      "trend",
      "outcome",
      "opportunity",
      "action"
    ],
    "tense": "near-future",
    "subjectScope": "mixed",
    "weight": 1.1,
    "conditionality": "conditional",
    "actionTransform": "optional",
    "evidencePriority": "primary",
    "canSupportConclusion": true,
    "canSupplyCounterEvidence": true
  },
  {
    "schemaVersion": "1.0.0",
    "spreadId": "cross",
    "positionId": "influence",
    "selectableFacets": [
      "resource",
      "opportunity",
      "obstacle",
      "relationship"
    ],
    "tense": "present",
    "subjectScope": "environment",
    "weight": 1.0,
    "conditionality": "contextual",
    "actionTransform": "optional",
    "evidencePriority": "primary",
    "canSupportConclusion": true,
    "canSupplyCounterEvidence": true
  },
  {
    "schemaVersion": "1.0.0",
    "spreadId": "cross",
    "positionId": "action",
    "selectableFacets": [
      "action",
      "boundary",
      "resource",
      "opportunity"
    ],
    "tense": "near-future",
    "subjectScope": "self",
    "weight": 1.3,
    "conditionality": "corrective",
    "actionTransform": "required",
    "evidencePriority": "core",
    "canSupportConclusion": true,
    "canSupplyCounterEvidence": false
  }
];
