export const QUESTION_PROFILE = Object.freeze({
  "schemaVersion": "1.0.0",
  "id": "career-team",
  "text": "我该如何改善与同事或伙伴的合作？",
  "label": "协作关系",
  "domain": "career",
  "intent": "collaboration-guidance",
  "timeframe": "open",
  "riskLevel": "medium",
  "answerDimensions": [
    "relationship-pattern",
    "communication-focus",
    "available-resource",
    "boundary",
    "recommended-action"
  ],
  "allowedConclusionTypes": [
    "open-dialogue",
    "act-with-conditions",
    "protect-boundary",
    "adjust-current-path",
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
          "available-resource"
        ],
        "future": [
          "available-resource",
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
          "available-resource"
        ],
        "trend": [
          "available-resource",
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
          "available-resource"
        ],
        "past": [
          "available-resource",
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
          "available-resource",
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
