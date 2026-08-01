import {
  OUTPUT_CONTRACTS,
  QUESTION_EVALUATION_POLICIES,
} from "./question-evaluation-policies.js";

const PILOT_QUESTION_IDS = Object.freeze([
  "love-future",
  "career-opportunity",
  "wealth-growth",
  "growth-lesson",
  "daily-action",
  "decision-option",
]);

const policiesById = new Map(QUESTION_EVALUATION_POLICIES.map((item) => [item.questionId, item]));

export const PILOT_QUESTION_EVALUATION_POLICIES = Object.freeze(
  PILOT_QUESTION_IDS.map((questionId) => {
    const policy = policiesById.get(questionId);
    if (!policy) throw new Error(`Missing pilot QuestionEvaluationPolicy: ${questionId}`);
    return policy;
  }),
);

export function getPilotQuestionEvaluationPolicy(questionId) {
  return PILOT_QUESTION_IDS.includes(questionId) ? policiesById.get(questionId) || null : null;
}

export { OUTPUT_CONTRACTS };
