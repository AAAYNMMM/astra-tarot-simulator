export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "career-block",
  "text": "阻碍我进步的关键因素是什么？",
  "label": "突破阻碍",
  "domain": "career",
  "intent": "obstacle-diagnosis",
  "timeframe": "present",
  "riskLevel": "low",
  "answerDimensions": [
    "current-state",
    "main-obstacle",
    "hidden-factor",
    "available-resource",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "descriptive",
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
          "main-obstacle"
        ],
        "present": [
          "main-obstacle",
          "hidden-factor"
        ],
        "future": [
          "hidden-factor",
          "available-resource"
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
          "main-obstacle"
        ],
        "root": [
          "main-obstacle",
          "hidden-factor"
        ],
        "trend": [
          "hidden-factor",
          "available-resource"
        ],
        "influence": [
          "available-resource",
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
          "main-obstacle"
        ],
        "challenge": [
          "main-obstacle",
          "hidden-factor"
        ],
        "past": [
          "hidden-factor",
          "available-resource"
        ],
        "future": [
          "available-resource",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "current-state"
        ],
        "below": [
          "current-state",
          "main-obstacle"
        ],
        "advice": [
          "main-obstacle",
          "recommended-action"
        ],
        "external": [
          "hidden-factor",
          "available-resource"
        ],
        "hopes": [
          "available-resource",
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
