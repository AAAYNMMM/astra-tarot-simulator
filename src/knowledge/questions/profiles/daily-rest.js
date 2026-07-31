export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "daily-rest",
  "text": "今天我该如何安排休息与恢复？",
  "label": "身心节奏",
  "domain": "daily",
  "intent": "self-care",
  "timeframe": "today",
  "riskLevel": "low",
  "answerDimensions": [
    "current-state",
    "self-care-need",
    "recovery-need",
    "boundary",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "prioritize-recovery",
    "protect-boundary",
    "adjust-current-path",
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
          "self-care-need"
        ],
        "present": [
          "self-care-need",
          "recovery-need"
        ],
        "future": [
          "recovery-need",
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
          "self-care-need"
        ],
        "root": [
          "self-care-need",
          "recovery-need"
        ],
        "trend": [
          "recovery-need",
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
          "self-care-need"
        ],
        "challenge": [
          "self-care-need",
          "recovery-need"
        ],
        "past": [
          "recovery-need",
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
          "self-care-need"
        ],
        "advice": [
          "self-care-need",
          "recommended-action"
        ],
        "external": [
          "recovery-need",
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
