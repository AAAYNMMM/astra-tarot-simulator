export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "daily-message",
  "text": "此刻我的内在最想告诉我什么？",
  "label": "内在讯息",
  "domain": "daily",
  "intent": "hidden-factor",
  "timeframe": "today",
  "riskLevel": "low",
  "answerDimensions": [
    "current-state",
    "hidden-factor",
    "internal-motivation",
    "risk",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "descriptive",
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
          "hidden-factor"
        ],
        "present": [
          "hidden-factor",
          "internal-motivation"
        ],
        "future": [
          "internal-motivation",
          "risk"
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
          "hidden-factor"
        ],
        "root": [
          "hidden-factor",
          "internal-motivation"
        ],
        "trend": [
          "internal-motivation",
          "risk"
        ],
        "influence": [
          "risk",
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
          "hidden-factor"
        ],
        "challenge": [
          "hidden-factor",
          "internal-motivation"
        ],
        "past": [
          "internal-motivation",
          "risk"
        ],
        "future": [
          "risk",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "current-state"
        ],
        "below": [
          "current-state",
          "hidden-factor"
        ],
        "advice": [
          "hidden-factor",
          "recommended-action"
        ],
        "external": [
          "internal-motivation",
          "risk"
        ],
        "hopes": [
          "risk",
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
