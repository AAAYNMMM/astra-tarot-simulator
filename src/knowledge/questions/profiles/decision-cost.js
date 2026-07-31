export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "decision-cost",
  "text": "这个选择最需要我承担的代价是什么？",
  "label": "代价评估",
  "domain": "decision",
  "intent": "cost-review",
  "timeframe": "open",
  "riskLevel": "medium",
  "answerDimensions": [
    "tradeoff",
    "cost",
    "risk",
    "value-alignment",
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
          "tradeoff",
          "recommended-action"
        ]
      },
      "requiredConclusionDimensions": [
        "tradeoff",
        "recommended-action"
      ],
      "outputDepth": "brief"
    },
    "timeline": {
      "positionResponsibilities": {
        "past": [
          "tradeoff",
          "cost"
        ],
        "present": [
          "cost",
          "risk"
        ],
        "future": [
          "risk",
          "value-alignment"
        ]
      },
      "requiredConclusionDimensions": [
        "tradeoff",
        "recommended-action"
      ],
      "outputDepth": "standard"
    },
    "cross": {
      "positionResponsibilities": {
        "core": [
          "tradeoff",
          "cost"
        ],
        "root": [
          "cost",
          "risk"
        ],
        "trend": [
          "risk",
          "value-alignment"
        ],
        "influence": [
          "value-alignment",
          "recommended-action"
        ],
        "action": [
          "recommended-action"
        ]
      },
      "requiredConclusionDimensions": [
        "tradeoff",
        "recommended-action"
      ],
      "outputDepth": "standard"
    },
    "celtic": {
      "positionResponsibilities": {
        "present": [
          "tradeoff",
          "cost"
        ],
        "challenge": [
          "cost",
          "risk"
        ],
        "past": [
          "risk",
          "value-alignment"
        ],
        "future": [
          "value-alignment",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "tradeoff"
        ],
        "below": [
          "tradeoff",
          "cost"
        ],
        "advice": [
          "cost",
          "recommended-action"
        ],
        "external": [
          "risk",
          "value-alignment"
        ],
        "hopes": [
          "value-alignment",
          "recommended-action"
        ],
        "outcome": [
          "recommended-action",
          "tradeoff"
        ]
      },
      "requiredConclusionDimensions": [
        "tradeoff",
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
