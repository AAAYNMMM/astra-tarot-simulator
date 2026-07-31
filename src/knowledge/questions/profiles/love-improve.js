export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "love-improve",
  "text": "我可以怎样改善我们之间的关系？",
  "label": "相处建议",
  "domain": "relationship",
  "intent": "improvement-guidance",
  "timeframe": "open",
  "riskLevel": "low",
  "answerDimensions": [
    "current-state",
    "main-obstacle",
    "available-resource",
    "recommended-action",
    "boundary"
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
          "current-state",
          "boundary"
        ]
      },
      "requiredConclusionDimensions": [
        "current-state",
        "boundary"
      ],
      "outputDepth": "brief"
    },
    "timeline": {
      "positionResponsibilities": {
        "past": [
          "current-state",
          "main-obstacle"
        ],
        "present": [
          "main-obstacle",
          "available-resource"
        ],
        "future": [
          "available-resource",
          "recommended-action"
        ]
      },
      "requiredConclusionDimensions": [
        "current-state",
        "boundary"
      ],
      "outputDepth": "standard"
    },
    "cross": {
      "positionResponsibilities": {
        "core": [
          "current-state",
          "main-obstacle"
        ],
        "root": [
          "main-obstacle",
          "available-resource"
        ],
        "trend": [
          "available-resource",
          "recommended-action"
        ],
        "influence": [
          "recommended-action",
          "boundary"
        ],
        "action": [
          "boundary"
        ]
      },
      "requiredConclusionDimensions": [
        "current-state",
        "boundary"
      ],
      "outputDepth": "standard"
    },
    "celtic": {
      "positionResponsibilities": {
        "present": [
          "current-state",
          "main-obstacle"
        ],
        "challenge": [
          "main-obstacle",
          "available-resource"
        ],
        "past": [
          "available-resource",
          "recommended-action"
        ],
        "future": [
          "recommended-action",
          "boundary"
        ],
        "above": [
          "boundary",
          "current-state"
        ],
        "below": [
          "current-state",
          "main-obstacle"
        ],
        "advice": [
          "main-obstacle",
          "boundary"
        ],
        "external": [
          "available-resource",
          "recommended-action"
        ],
        "hopes": [
          "recommended-action",
          "boundary"
        ],
        "outcome": [
          "boundary",
          "current-state"
        ]
      },
      "requiredConclusionDimensions": [
        "current-state",
        "boundary"
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
