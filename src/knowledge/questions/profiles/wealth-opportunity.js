export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "wealth-opportunity",
  "text": "近期值得关注的机会来自哪里？",
  "label": "机会来源",
  "domain": "finance",
  "intent": "opportunity-discovery",
  "timeframe": "near-term",
  "riskLevel": "medium",
  "answerDimensions": [
    "current-state",
    "opportunity-quality",
    "external-condition",
    "preparation-gap",
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
          "opportunity-quality"
        ],
        "present": [
          "opportunity-quality",
          "external-condition"
        ],
        "future": [
          "external-condition",
          "preparation-gap"
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
          "opportunity-quality"
        ],
        "root": [
          "opportunity-quality",
          "external-condition"
        ],
        "trend": [
          "external-condition",
          "preparation-gap"
        ],
        "influence": [
          "preparation-gap",
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
          "opportunity-quality"
        ],
        "challenge": [
          "opportunity-quality",
          "external-condition"
        ],
        "past": [
          "external-condition",
          "preparation-gap"
        ],
        "future": [
          "preparation-gap",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "current-state"
        ],
        "below": [
          "current-state",
          "opportunity-quality"
        ],
        "advice": [
          "opportunity-quality",
          "recommended-action"
        ],
        "external": [
          "external-condition",
          "preparation-gap"
        ],
        "hopes": [
          "preparation-gap",
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
