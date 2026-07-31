import { getPhase3QuestionDefinition } from "./phase-3-questions.js";

const FORBIDDEN_CLAIMS = Object.freeze([
  "certain-external-fact",
  "diagnosis",
  "exact-date",
  "financial-guarantee",
  "guaranteed-outcome",
  "mortality-prediction",
  "pregnancy-certainty",
  "third-party-certainty",
]);

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function pair(dimensions, start) {
  return Object.freeze([
    dimensions[start % dimensions.length],
    dimensions[(start + 1) % dimensions.length],
  ].filter((value, index, values) => values.indexOf(value) === index));
}

function spreadProfiles(dimensions) {
  const last = dimensions.length - 1;
  return {
    single: {
      positionResponsibilities: { essence: pair(dimensions, 0) },
      requiredConclusionDimensions: Object.freeze([dimensions[0], dimensions[last]]),
      outputDepth: "brief",
    },
    timeline: {
      positionResponsibilities: {
        past: pair(dimensions, 0),
        present: pair(dimensions, 1),
        future: pair(dimensions, Math.max(2, last - 1)),
      },
      requiredConclusionDimensions: Object.freeze([dimensions[0], dimensions[last]]),
      outputDepth: "standard",
    },
    cross: {
      positionResponsibilities: {
        core: pair(dimensions, 0),
        root: pair(dimensions, 1),
        trend: pair(dimensions, 2),
        influence: pair(dimensions, 3),
        action: Object.freeze([dimensions[last]]),
      },
      requiredConclusionDimensions: Object.freeze([dimensions[0], dimensions[last]]),
      outputDepth: "standard",
    },
    celtic: {
      positionResponsibilities: {
        present: pair(dimensions, 0),
        challenge: pair(dimensions, 1),
        past: pair(dimensions, 2),
        future: pair(dimensions, 3),
        above: pair(dimensions, 4),
        below: pair(dimensions, 0),
        advice: pair(dimensions, Math.max(0, last - 1)),
        external: pair(dimensions, 2),
        hopes: pair(dimensions, 3),
        outcome: Object.freeze([dimensions[last], dimensions[0]]),
      },
      requiredConclusionDimensions: Object.freeze([dimensions[0], dimensions[last]]),
      outputDepth: "deep",
    },
  };
}

export function createPhase3QuestionProfile(questionId) {
  const definition = getPhase3QuestionDefinition(questionId);
  const {
    categoryId: _categoryId,
    answerDimensions,
    allowedConclusionTypes,
    ...identity
  } = definition;
  return deepFreeze({
    schemaVersion: "1.0.0",
    ...identity,
    answerDimensions: [...answerDimensions],
    allowedConclusionTypes: [...allowedConclusionTypes],
    forbiddenClaims: [...FORBIDDEN_CLAIMS],
    spreadProfiles: spreadProfiles(answerDimensions),
    metadata: {
      version: "1.0.0",
      status: "APPROVED",
      reviewDate: "2026-07-31",
    },
  });
}
