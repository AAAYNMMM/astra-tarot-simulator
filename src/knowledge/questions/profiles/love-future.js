export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "love-future",
  "text": "未来三个月，这段关系可能如何发展？",
  "label": "近期趋势",
  "domain": "relationship",
  "intent": "trend-forecast",
  "timeframe": "near-term",
  "riskLevel": "medium",
  "answerDimensions": [
    "current-state",
    "development-trend",
    "external-condition",
    "turning-point",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "growing",
    "stabilizing",
    "slowing",
    "conflicted",
    "restructuring",
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
          "development-trend"
        ],
        "present": [
          "development-trend",
          "external-condition"
        ],
        "future": [
          "external-condition",
          "turning-point"
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
          "development-trend"
        ],
        "root": [
          "development-trend",
          "external-condition"
        ],
        "trend": [
          "external-condition",
          "turning-point"
        ],
        "influence": [
          "turning-point",
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
          "development-trend"
        ],
        "challenge": [
          "development-trend",
          "external-condition"
        ],
        "past": [
          "external-condition",
          "turning-point"
        ],
        "future": [
          "turning-point",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "current-state"
        ],
        "below": [
          "current-state",
          "development-trend"
        ],
        "advice": [
          "development-trend",
          "recommended-action"
        ],
        "external": [
          "external-condition",
          "turning-point"
        ],
        "hopes": [
          "turning-point",
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
