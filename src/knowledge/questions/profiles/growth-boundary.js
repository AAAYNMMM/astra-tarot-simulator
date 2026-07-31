export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "growth-boundary",
  "text": "我需要为自己建立怎样的边界？",
  "label": "个人边界",
  "domain": "growth",
  "intent": "boundary-guidance",
  "timeframe": "present",
  "riskLevel": "medium",
  "answerDimensions": [
    "current-state",
    "boundary",
    "risk",
    "relationship-pattern",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "protect-boundary",
    "open-dialogue",
    "act-with-conditions",
    "wait-and-prepare",
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
          "boundary"
        ],
        "present": [
          "boundary",
          "risk"
        ],
        "future": [
          "risk",
          "relationship-pattern"
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
          "boundary"
        ],
        "root": [
          "boundary",
          "risk"
        ],
        "trend": [
          "risk",
          "relationship-pattern"
        ],
        "influence": [
          "relationship-pattern",
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
          "boundary"
        ],
        "challenge": [
          "boundary",
          "risk"
        ],
        "past": [
          "risk",
          "relationship-pattern"
        ],
        "future": [
          "relationship-pattern",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "current-state"
        ],
        "below": [
          "current-state",
          "boundary"
        ],
        "advice": [
          "boundary",
          "recommended-action"
        ],
        "external": [
          "risk",
          "relationship-pattern"
        ],
        "hopes": [
          "relationship-pattern",
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
