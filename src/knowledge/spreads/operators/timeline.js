export const TIMELINE_POSITION_OPERATORS = [
  {
    "schemaVersion": "1.0.0",
    "spreadId": "timeline",
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
    "spreadId": "timeline",
    "positionId": "present",
    "selectableFacets": [
      "state",
      "obstacle",
      "resource",
      "relationship"
    ],
    "tense": "present",
    "subjectScope": "mixed",
    "weight": 1.2,
    "conditionality": "direct",
    "actionTransform": "optional",
    "evidencePriority": "core",
    "canSupportConclusion": true,
    "canSupplyCounterEvidence": true
  },
  {
    "schemaVersion": "1.0.0",
    "spreadId": "timeline",
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
  }
];
