export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "love-current",
  "text": "这段关系当前最核心的能量是什么？",
  "label": "关系现状",
  "domain": "relationship",
  "intent": "status-assessment",
  "timeframe": "present",
  "riskLevel": "low",
  "answerDimensions": [
    "current-state",
    "core-dynamic",
    "hidden-factor",
    "risk",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "descriptive",
    "conditional",
    "indeterminate"
  ],
  "forbiddenClaims": [
    "certain-external-fact",
    "diagnosis",
    "exact-date",
    "financial-guarantee",
    "guaranteed-outcome",
    "mortality-prediction",
    "pregnancy-certainty",
    "third-party-certainty"
  ],
  "spreadProfiles": {
    "single": {
      "positionResponsibilities": {
        "essence": [
          "current-state",
          "recommended-action"
        ]
      },
      "requiredConclusionDimensions": [
        "current-state",
        "recommended-action"
      ],
      "outputDepth": "brief"
    },
    "timeline": {
      "positionResponsibilities": {
        "past": [
          "current-state",
          "core-dynamic"
        ],
        "present": [
          "core-dynamic",
          "hidden-factor"
        ],
        "future": [
          "hidden-factor",
          "risk"
        ]
      },
      "requiredConclusionDimensions": [
        "current-state",
        "recommended-action"
      ],
      "outputDepth": "standard"
    },
    "cross": {
      "positionResponsibilities": {
        "core": [
          "current-state",
          "core-dynamic"
        ],
        "root": [
          "core-dynamic",
          "hidden-factor"
        ],
        "trend": [
          "hidden-factor",
          "risk"
        ],
        "influence": [
          "risk",
          "recommended-action"
        ],
        "action": [
          "recommended-action"
        ]
      },
      "requiredConclusionDimensions": [
        "current-state",
        "recommended-action"
      ],
      "outputDepth": "standard"
    },
    "celtic": {
      "positionResponsibilities": {
        "present": [
          "current-state",
          "core-dynamic"
        ],
        "challenge": [
          "core-dynamic",
          "hidden-factor"
        ],
        "past": [
          "hidden-factor",
          "risk"
        ],
        "future": [
          "risk",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "current-state"
        ],
        "below": [
          "current-state",
          "core-dynamic"
        ],
        "advice": [
          "core-dynamic",
          "recommended-action"
        ],
        "external": [
          "hidden-factor",
          "risk"
        ],
        "hopes": [
          "risk",
          "recommended-action"
        ],
        "outcome": [
          "recommended-action",
          "current-state"
        ]
      },
      "requiredConclusionDimensions": [
        "current-state",
        "recommended-action"
      ],
      "outputDepth": "deep"
    }
  },
  "metadata": {
    "version": "1.0.0",
    "status": "APPROVED",
    "reviewDate": "2026-07-31"
  }
});
export default QUESTION_PROFILE;
