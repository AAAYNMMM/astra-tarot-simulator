export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "decision-value",
  "text": "哪个决定更符合我长期的价值？",
  "label": "价值校准",
  "domain": "decision",
  "intent": "value-alignment",
  "timeframe": "long-term",
  "riskLevel": "medium",
  "answerDimensions": [
    "value-alignment",
    "tradeoff",
    "internal-motivation",
    "external-condition",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "act-now",
    "act-with-conditions",
    "adjust-current-path",
    "wait-and-prepare",
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
          "value-alignment",
          "recommended-action"
        ]
      },
      "requiredConclusionDimensions": [
        "value-alignment",
        "recommended-action"
      ],
      "outputDepth": "brief"
    },
    "timeline": {
      "positionResponsibilities": {
        "past": [
          "value-alignment",
          "tradeoff"
        ],
        "present": [
          "tradeoff",
          "internal-motivation"
        ],
        "future": [
          "internal-motivation",
          "external-condition"
        ]
      },
      "requiredConclusionDimensions": [
        "value-alignment",
        "recommended-action"
      ],
      "outputDepth": "standard"
    },
    "cross": {
      "positionResponsibilities": {
        "core": [
          "value-alignment",
          "tradeoff"
        ],
        "root": [
          "tradeoff",
          "internal-motivation"
        ],
        "trend": [
          "internal-motivation",
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
        "value-alignment",
        "recommended-action"
      ],
      "outputDepth": "standard"
    },
    "celtic": {
      "positionResponsibilities": {
        "present": [
          "value-alignment",
          "tradeoff"
        ],
        "challenge": [
          "tradeoff",
          "internal-motivation"
        ],
        "past": [
          "internal-motivation",
          "external-condition"
        ],
        "future": [
          "external-condition",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "value-alignment"
        ],
        "below": [
          "value-alignment",
          "tradeoff"
        ],
        "advice": [
          "tradeoff",
          "recommended-action"
        ],
        "external": [
          "internal-motivation",
          "external-condition"
        ],
        "hopes": [
          "external-condition",
          "recommended-action"
        ],
        "outcome": [
          "recommended-action",
          "value-alignment"
        ]
      },
      "requiredConclusionDimensions": [
        "value-alignment",
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
