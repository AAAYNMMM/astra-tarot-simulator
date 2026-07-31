export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "decision-option",
  "text": "还有哪一个替代方案值得我认真考虑？",
  "label": "替代方案",
  "domain": "decision",
  "intent": "alternative-option",
  "timeframe": "open",
  "riskLevel": "low",
  "answerDimensions": [
    "current-state",
    "alternative-option",
    "tradeoff",
    "opportunity-quality",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
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
          "alternative-option"
        ],
        "present": [
          "alternative-option",
          "tradeoff"
        ],
        "future": [
          "tradeoff",
          "opportunity-quality"
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
          "alternative-option"
        ],
        "root": [
          "alternative-option",
          "tradeoff"
        ],
        "trend": [
          "tradeoff",
          "opportunity-quality"
        ],
        "influence": [
          "opportunity-quality",
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
          "alternative-option"
        ],
        "challenge": [
          "alternative-option",
          "tradeoff"
        ],
        "past": [
          "tradeoff",
          "opportunity-quality"
        ],
        "future": [
          "opportunity-quality",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "current-state"
        ],
        "below": [
          "current-state",
          "alternative-option"
        ],
        "advice": [
          "alternative-option",
          "recommended-action"
        ],
        "external": [
          "tradeoff",
          "opportunity-quality"
        ],
        "hopes": [
          "opportunity-quality",
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
