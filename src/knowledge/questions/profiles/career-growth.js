export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "career-growth",
  "text": "未来三个月，我该如何提升竞争力？",
  "label": "成长策略",
  "domain": "career",
  "intent": "capability-development",
  "timeframe": "near-term",
  "riskLevel": "low",
  "answerDimensions": [
    "current-state",
    "learning-goal",
    "available-resource",
    "preparation-gap",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "act-now",
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
          "learning-goal"
        ],
        "present": [
          "learning-goal",
          "available-resource"
        ],
        "future": [
          "available-resource",
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
          "learning-goal"
        ],
        "root": [
          "learning-goal",
          "available-resource"
        ],
        "trend": [
          "available-resource",
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
          "learning-goal"
        ],
        "challenge": [
          "learning-goal",
          "available-resource"
        ],
        "past": [
          "available-resource",
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
          "learning-goal"
        ],
        "advice": [
          "learning-goal",
          "recommended-action"
        ],
        "external": [
          "available-resource",
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
