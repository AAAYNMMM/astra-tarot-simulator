export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "daily-energy",
  "text": "今天的核心能量是什么？",
  "label": "今日能量",
  "domain": "daily",
  "intent": "daily-guidance",
  "timeframe": "today",
  "riskLevel": "low",
  "answerDimensions": [
    "current-state",
    "daily-focus",
    "risk",
    "self-care-need",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "descriptive",
    "act-now",
    "protect-boundary",
    "prioritize-recovery",
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
          "daily-focus"
        ],
        "present": [
          "daily-focus",
          "risk"
        ],
        "future": [
          "risk",
          "self-care-need"
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
          "daily-focus"
        ],
        "root": [
          "daily-focus",
          "risk"
        ],
        "trend": [
          "risk",
          "self-care-need"
        ],
        "influence": [
          "self-care-need",
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
          "daily-focus"
        ],
        "challenge": [
          "daily-focus",
          "risk"
        ],
        "past": [
          "risk",
          "self-care-need"
        ],
        "future": [
          "self-care-need",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "current-state"
        ],
        "below": [
          "current-state",
          "daily-focus"
        ],
        "advice": [
          "daily-focus",
          "recommended-action"
        ],
        "external": [
          "risk",
          "self-care-need"
        ],
        "hopes": [
          "self-care-need",
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
