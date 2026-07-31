export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "love-communication",
  "text": "我们之间真正需要被说清楚的是什么？",
  "label": "沟通重点",
  "domain": "relationship",
  "intent": "communication-guidance",
  "timeframe": "present",
  "riskLevel": "medium",
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
