export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "career-balance",
  "text": "我该如何平衡投入、压力与长期发展？",
  "label": "节奏平衡",
  "domain": "career",
  "intent": "balance-regulation",
  "timeframe": "open",
  "riskLevel": "medium",
  "answerDimensions": [
    "current-state",
    "risk",
    "recovery-need",
    "boundary",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "prioritize-recovery",
    "protect-boundary",
    "adjust-current-path",
    "act-with-conditions",
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
          "risk"
        ],
        "present": [
          "risk",
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
          "risk"
        ],
        "root": [
          "risk",
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
          "risk"
        ],
        "challenge": [
          "risk",
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
          "risk"
        ],
        "advice": [
          "risk",
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
