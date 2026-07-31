export const CELTIC_POSITION_OPERATORS = [
  {
    "schemaVersion": "1.0.0",
    "spreadId": "celtic",
    "positionId": "present",
    "selectableFacets": [
      "state",
      "relationship",
      "obstacle",
      "resource"
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
    "spreadId": "celtic",
    "positionId": "challenge",
    "selectableFacets": [
      "obstacle",
      "boundary",
      "cause",
      "relationship"
    ],
    "tense": "present",
    "subjectScope": "mixed",
    "weight": 1.3,
    "conditionality": "corrective",
    "actionTransform": "optional",
    "evidencePriority": "core",
    "canSupportConclusion": true,
    "canSupplyCounterEvidence": true
  },
  {
    "schemaVersion": "1.0.0",
    "spreadId": "celtic",
    "positionId": "past",
    "selectableFacets": [
      "cause",
      "state",
      "motivation",
      "obstacle"
    ],
    "tense": "past",
    "subjectScope": "mixed",
    "weight": 0.9,
    "conditionality": "contextual",
    "actionTransform": "none",
    "evidencePriority": "secondary",
    "canSupportConclusion": true,
    "canSupplyCounterEvidence": true
  },
  {
    "schemaVersion": "1.0.0",
    "spreadId": "celtic",
    "positionId": "future",
    "selectableFacets": [
      "trend",
      "outcome",
      "opportunity",
      "action"
    ],
    "tense": "near-future",
    "subjectScope": "mixed",
    "weight": 1.0,
    "conditionality": "conditional",
    "actionTransform": "optional",
    "evidencePriority": "primary",
    "canSupportConclusion": true,
    "canSupplyCounterEvidence": true
  },
  {
    "schemaVersion": "1.0.0",
    "spreadId": "celtic",
    "positionId": "above",
    "selectableFacets": [
      "motivation",
      "opportunity",
      "outcome",
      "reflection"
    ],
    "tense": "open",
    "subjectScope": "self",
    "weight": 0.9,
    "conditionality": "contextual",
    "actionTransform": "optional",
    "evidencePriority": "secondary",
    "canSupportConclusion": true,
    "canSupplyCounterEvidence": false
  },
  {
    "schemaVersion": "1.0.0",
    "spreadId": "celtic",
    "positionId": "below",
    "selectableFacets": [
      "cause",
      "motivation",
      "reflection",
      "state"
    ],
    "tense": "open",
    "subjectScope": "self",
    "weight": 1.0,
    "conditionality": "contextual",
    "actionTransform": "none",
    "evidencePriority": "primary",
    "canSupportConclusion": true,
    "canSupplyCounterEvidence": true
  },
  {
    "schemaVersion": "1.0.0",
    "spreadId": "celtic",
    "positionId": "advice",
    "selectableFacets": [
      "action",
      "boundary",
      "resource",
      "reflection"
    ],
    "tense": "near-future",
    "subjectScope": "self",
    "weight": 1.3,
    "conditionality": "corrective",
    "actionTransform": "required",
    "evidencePriority": "core",
    "canSupportConclusion": true,
    "canSupplyCounterEvidence": false
  },
  {
    "schemaVersion": "1.0.0",
    "spreadId": "celtic",
    "positionId": "external",
    "selectableFacets": [
      "relationship",
      "resource",
      "obstacle",
      "opportunity"
    ],
    "tense": "present",
    "subjectScope": "environment",
    "weight": 0.9,
    "conditionality": "contextual",
    "actionTransform": "none",
    "evidencePriority": "secondary",
    "canSupportConclusion": true,
    "canSupplyCounterEvidence": true
  },
  {
    "schemaVersion": "1.0.0",
    "spreadId": "celtic",
    "positionId": "hopes",
    "selectableFacets": [
      "motivation",
      "reflection",
      "obstacle",
      "opportunity"
    ],
    "tense": "open",
    "subjectScope": "self",
    "weight": 0.8,
    "conditionality": "contextual",
    "actionTransform": "none",
    "evidencePriority": "contextual",
    "canSupportConclusion": false,
    "canSupplyCounterEvidence": true
  },
  {
    "schemaVersion": "1.0.0",
    "spreadId": "celtic",
    "positionId": "outcome",
    "selectableFacets": [
      "outcome",
      "trend",
      "opportunity",
      "boundary"
    ],
    "tense": "near-future",
    "subjectScope": "mixed",
    "weight": 1.2,
    "conditionality": "conditional",
    "actionTransform": "optional",
    "evidencePriority": "core",
    "canSupportConclusion": true,
    "canSupplyCounterEvidence": true
  }
];
