export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "growth-next",
  "text": "下一阶段，我会成长为什么样的人？",
  "label": "阶段蜕变",
  "domain": "growth",
  "intent": "identity-growth",
  "timeframe": "near-term",
  "riskLevel": "low",
  "answerDimensions": [
    "current-state",
    "identity-direction",
    "learning-goal",
    "meaning",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "growing",
    "restructuring",
    "act-with-conditions",
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
          "identity-direction"
        ],
        "present": [
          "identity-direction",
          "learning-goal"
        ],
        "future": [
          "learning-goal",
          "meaning"
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
          "identity-direction"
        ],
        "root": [
          "identity-direction",
          "learning-goal"
        ],
        "trend": [
          "learning-goal",
          "meaning"
        ],
        "influence": [
          "meaning",
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
          "identity-direction"
        ],
        "challenge": [
          "identity-direction",
          "learning-goal"
        ],
        "past": [
          "learning-goal",
          "meaning"
        ],
        "future": [
          "meaning",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "current-state"
        ],
        "below": [
          "current-state",
          "identity-direction"
        ],
        "advice": [
          "identity-direction",
          "recommended-action"
        ],
        "external": [
          "learning-goal",
          "meaning"
        ],
        "hopes": [
          "meaning",
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
