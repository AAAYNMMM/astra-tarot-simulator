export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "wealth-habit",
  "text": "哪一种金钱习惯正在影响我的稳定感？",
  "label": "金钱习惯",
  "domain": "finance",
  "intent": "pattern-reflection",
  "timeframe": "present",
  "riskLevel": "medium",
  "answerDimensions": [
    "current-state",
    "habit-pattern",
    "hidden-factor",
    "boundary",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "descriptive",
    "adjust-current-path",
    "protect-boundary",
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
          "habit-pattern"
        ],
        "present": [
          "habit-pattern",
          "hidden-factor"
        ],
        "future": [
          "hidden-factor",
          "boundary"
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
          "habit-pattern"
        ],
        "root": [
          "habit-pattern",
          "hidden-factor"
        ],
        "trend": [
          "hidden-factor",
          "boundary"
        ],
        "influence": [
          "boundary",
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
          "habit-pattern"
        ],
        "challenge": [
          "habit-pattern",
          "hidden-factor"
        ],
        "past": [
          "hidden-factor",
          "boundary"
        ],
        "future": [
          "boundary",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "current-state"
        ],
        "below": [
          "current-state",
          "habit-pattern"
        ],
        "advice": [
          "habit-pattern",
          "recommended-action"
        ],
        "external": [
          "hidden-factor",
          "boundary"
        ],
        "hopes": [
          "boundary",
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
