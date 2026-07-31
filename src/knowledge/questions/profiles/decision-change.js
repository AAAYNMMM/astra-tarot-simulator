export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "decision-change",
  "text": "如果选择改变，我需要准备什么？",
  "label": "变化准备",
  "domain": "decision",
  "intent": "change-decision",
  "timeframe": "near-term",
  "riskLevel": "medium",
  "answerDimensions": [
    "internal-motivation",
    "readiness",
    "main-obstacle",
    "external-condition",
    "development-trend",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "act-now",
    "act-with-conditions",
    "wait-and-prepare",
    "adjust-current-path",
    "currently-unfavorable",
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
          "internal-motivation",
          "recommended-action"
        ]
      },
      "requiredConclusionDimensions": [
        "internal-motivation",
        "recommended-action"
      ],
      "outputDepth": "brief"
    },
    "timeline": {
      "positionResponsibilities": {
        "past": [
          "internal-motivation",
          "readiness"
        ],
        "present": [
          "readiness",
          "main-obstacle"
        ],
        "future": [
          "main-obstacle",
          "external-condition"
        ]
      },
      "requiredConclusionDimensions": [
        "internal-motivation",
        "recommended-action"
      ],
      "outputDepth": "standard"
    },
    "cross": {
      "positionResponsibilities": {
        "core": [
          "internal-motivation",
          "readiness"
        ],
        "root": [
          "readiness",
          "main-obstacle"
        ],
        "trend": [
          "main-obstacle",
          "external-condition"
        ],
        "influence": [
          "external-condition",
          "development-trend"
        ],
        "action": [
          "development-trend",
          "recommended-action"
        ]
      },
      "requiredConclusionDimensions": [
        "internal-motivation",
        "recommended-action"
      ],
      "outputDepth": "standard"
    },
    "celtic": {
      "positionResponsibilities": {
        "present": [
          "internal-motivation",
          "readiness"
        ],
        "challenge": [
          "readiness",
          "main-obstacle"
        ],
        "past": [
          "main-obstacle",
          "external-condition"
        ],
        "future": [
          "external-condition",
          "development-trend"
        ],
        "above": [
          "development-trend",
          "recommended-action"
        ],
        "below": [
          "recommended-action",
          "internal-motivation"
        ],
        "advice": [
          "internal-motivation",
          "recommended-action"
        ],
        "external": [
          "readiness",
          "main-obstacle"
        ],
        "hopes": [
          "main-obstacle",
          "external-condition"
        ],
        "outcome": [
          "external-condition",
          "development-trend"
        ]
      },
      "requiredConclusionDimensions": [
        "internal-motivation",
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
