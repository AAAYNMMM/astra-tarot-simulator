export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "daily-relationship",
  "text": "今天与他人相处时，我最需要保持什么态度？",
  "label": "人际提醒",
  "domain": "daily",
  "intent": "communication-guidance",
  "timeframe": "today",
  "riskLevel": "low",
  "answerDimensions": [
    "relationship-pattern",
    "communication-focus",
    "hidden-factor",
    "boundary",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "open-dialogue",
    "protect-boundary",
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
          "relationship-pattern",
          "recommended-action"
        ]
      },
      "requiredConclusionDimensions": [
        "relationship-pattern",
        "recommended-action"
      ],
      "outputDepth": "brief"
    },
    "timeline": {
      "positionResponsibilities": {
        "past": [
          "relationship-pattern",
          "communication-focus"
        ],
        "present": [
          "communication-focus",
          "hidden-factor"
        ],
        "future": [
          "hidden-factor",
          "boundary"
        ]
      },
      "requiredConclusionDimensions": [
        "relationship-pattern",
        "recommended-action"
      ],
      "outputDepth": "standard"
    },
    "cross": {
      "positionResponsibilities": {
        "core": [
          "relationship-pattern",
          "communication-focus"
        ],
        "root": [
          "communication-focus",
          "hidden-factor"
        ],
        "trend": [
          "hidden-factor",
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
        "relationship-pattern",
        "recommended-action"
      ],
      "outputDepth": "standard"
    },
    "celtic": {
      "positionResponsibilities": {
        "present": [
          "relationship-pattern",
          "communication-focus"
        ],
        "challenge": [
          "communication-focus",
          "hidden-factor"
        ],
        "past": [
          "hidden-factor",
          "boundary"
        ],
        "future": [
          "boundary",
          "recommended-action"
        ],
        "above": [
          "recommended-action",
          "relationship-pattern"
        ],
        "below": [
          "relationship-pattern",
          "communication-focus"
        ],
        "advice": [
          "communication-focus",
          "recommended-action"
        ],
        "external": [
          "hidden-factor",
          "boundary"
        ],
        "hopes": [
          "boundary",
          "recommended-action"
        ],
        "outcome": [
          "recommended-action",
          "relationship-pattern"
        ]
      },
      "requiredConclusionDimensions": [
        "relationship-pattern",
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
