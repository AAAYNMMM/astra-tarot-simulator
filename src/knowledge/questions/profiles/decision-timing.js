export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "decision-timing",
  "text": "现在是行动、等待，还是调整的时机？",
  "label": "时机判断",
  "domain": "decision",
  "intent": "timing-decision",
  "timeframe": "near-term",
  "riskLevel": "medium",
  "answerDimensions": [
    "current-state",
    "timing",
    "readiness",
    "external-condition",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "act-now",
    "act-with-conditions",
    "wait-and-prepare",
    "currently-unfavorable",
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
          "timing"
        ],
        "present": [
          "timing",
          "readiness"
        ],
        "future": [
          "readiness",
          "external-condition"
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
          "timing"
        ],
        "root": [
          "timing",
          "readiness"
        ],
        "trend": [
          "readiness",
          "external-condition"
        ],
        "influence": [
          "external-condition",
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
          "timing"
        ],
        "challenge": [
          "timing",
          "readiness"
        ],
        "past": [
          "readiness",
          "external-condition"
        ],
        "future": [
          "external-condition",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "current-state"
        ],
        "below": [
          "current-state",
          "timing"
        ],
        "advice": [
          "timing",
          "recommended-action"
        ],
        "external": [
          "readiness",
          "external-condition"
        ],
        "hopes": [
          "external-condition",
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
