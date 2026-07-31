export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "daily-avoid",
  "text": "今天需要留意或避免什么？",
  "label": "注意事项",
  "domain": "daily",
  "intent": "risk-assessment",
  "timeframe": "today",
  "riskLevel": "low",
  "answerDimensions": [
    "current-state",
    "risk",
    "hidden-factor",
    "external-condition",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "act-with-conditions",
    "wait-and-prepare",
    "currently-unfavorable",
    "protect-boundary",
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
          "risk"
        ],
        "present": [
          "risk",
          "hidden-factor"
        ],
        "future": [
          "hidden-factor",
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
          "risk"
        ],
        "root": [
          "risk",
          "hidden-factor"
        ],
        "trend": [
          "hidden-factor",
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
          "risk"
        ],
        "challenge": [
          "risk",
          "hidden-factor"
        ],
        "past": [
          "hidden-factor",
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
          "risk"
        ],
        "advice": [
          "risk",
          "recommended-action"
        ],
        "external": [
          "hidden-factor",
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
