export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "wealth-growth",
  "text": "怎样做更有利于建立长期稳定？",
  "label": "长期规划",
  "domain": "finance",
  "intent": "resource-planning",
  "timeframe": "long-term",
  "riskLevel": "medium",
  "answerDimensions": [
    "current-state",
    "resource-allocation",
    "risk",
    "stability",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "reallocate-resources",
    "act-with-conditions",
    "wait-and-prepare",
    "adjust-current-path",
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
          "resource-allocation"
        ],
        "present": [
          "resource-allocation",
          "risk"
        ],
        "future": [
          "risk",
          "stability"
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
          "resource-allocation"
        ],
        "root": [
          "resource-allocation",
          "risk"
        ],
        "trend": [
          "risk",
          "stability"
        ],
        "influence": [
          "stability",
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
          "resource-allocation"
        ],
        "challenge": [
          "resource-allocation",
          "risk"
        ],
        "past": [
          "risk",
          "stability"
        ],
        "future": [
          "stability",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "current-state"
        ],
        "below": [
          "current-state",
          "resource-allocation"
        ],
        "advice": [
          "resource-allocation",
          "recommended-action"
        ],
        "external": [
          "risk",
          "stability"
        ],
        "hopes": [
          "stability",
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
