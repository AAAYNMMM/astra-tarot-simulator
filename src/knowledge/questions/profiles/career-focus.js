export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "career-focus",
  "text": "我当前最值得投入的事业方向是什么？",
  "label": "方向选择",
  "domain": "career",
  "intent": "direction-selection",
  "timeframe": "open",
  "riskLevel": "medium",
  "answerDimensions": [
    "current-state",
    "value-alignment",
    "readiness",
    "external-condition",
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
          "value-alignment"
        ],
        "present": [
          "value-alignment",
          "readiness"
        ],
        "future": [
          "readiness",
          "external-condition"
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
          "value-alignment"
        ],
        "root": [
          "value-alignment",
          "readiness"
        ],
        "trend": [
          "readiness",
          "external-condition"
        ],
        "influence": [
          "external-condition",
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
          "value-alignment"
        ],
        "challenge": [
          "value-alignment",
          "readiness"
        ],
        "past": [
          "readiness",
          "external-condition"
        ],
        "future": [
          "external-condition",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "current-state"
        ],
        "below": [
          "current-state",
          "value-alignment"
        ],
        "advice": [
          "value-alignment",
          "recommended-action"
        ],
        "external": [
          "readiness",
          "external-condition"
        ],
        "hopes": [
          "external-condition",
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
