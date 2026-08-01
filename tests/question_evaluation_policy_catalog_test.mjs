import assert from "node:assert/strict";
import fs from "node:fs";

import {
  QUESTION_EVALUATION_POLICIES,
  getQuestionEvaluationPolicy,
} from "../src/knowledge/evaluation/question-evaluation-policies.js";
import { validateQuestionEvaluationPolicy } from "../src/engine/validation/question-evaluation-policy-validator.js";
import { createAssessmentSignal, AssessmentError } from "../src/engine/assessment/assessment-signal.js";
import { evaluateAssessment } from "../src/engine/assessment/alignment-assessor.js";
import { executeReadingEngine } from "../src/engine/runtime/reading-engine.js";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { SPREADS } from "../src/knowledge/spreads/definitions.js";

const schema = JSON.parse(fs.readFileSync(
  new URL("../src/knowledge/schemas/question-evaluation-policy.schema.json", import.meta.url),
  "utf8",
));
const CARD_IDS = Object.freeze([
  "major-6", "major-10", "major-13", "major-16", "major-17", "major-19",
  "cups-two", "cups-five", "cups-eight", "pentacles-four", "pentacles-ten", "swords-eight",
]);
const FORBIDDEN_QUESTION_TEXT = /爱不爱|正缘|宇宙|一定|必然|命运注定/u;
const GRADES = new Set(["SSS", "SS", "S", "A", "B", "C", "D", "E"]);

function assertDeepFrozen(value, path = "policy") {
  if (!value || typeof value !== "object") return;
  assert.equal(Object.isFrozen(value), true, `${path} must be frozen`);
  for (const [key, child] of Object.entries(value)) assertDeepFrozen(child, `${path}.${key}`);
}

function timelineDraws(offset) {
  const spread = SPREADS.find((item) => item.id === "timeline");
  return spread.positions.map((position, index) => ({
    cardId: CARD_IDS[(offset + index) % CARD_IDS.length],
    positionId: position.id,
    orientation: (offset + index) % 2 ? "reversed" : "upright",
  }));
}

function assessmentErrorCode(action) {
  let caught = null;
  assert.throws(action, (error) => {
    caught = error;
    return error instanceof AssessmentError;
  });
  return caught.code;
}

assert.equal(QUESTION_EVALUATION_POLICIES.length, 90);
assert.deepEqual(QUESTION_EVALUATION_POLICIES.map((policy) => policy.questionId), QUESTION_PROFILE_IDS);
assertDeepFrozen(QUESTION_EVALUATION_POLICIES);
assert.deepEqual(
  Object.fromEntries(["alignment-grade", "situation-map", "action-prompt", "comparison-support"].map((contract) => [
    contract,
    QUESTION_EVALUATION_POLICIES.filter((policy) => policy.outputContract === contract).length,
  ])),
  { "alignment-grade": 6, "situation-map": 18, "action-prompt": 62, "comparison-support": 4 },
);

for (const policy of QUESTION_EVALUATION_POLICIES) {
  const question = await loadQuestionProfile(policy.questionId);
  assert.deepEqual(validateQuestionEvaluationPolicy(policy, schema, { question }), [], policy.questionId);
  assert.equal(getQuestionEvaluationPolicy(policy.questionId), policy);
  assert.ok(policy.displayQuestion.length > 0);
  assert.ok(policy.timeframeLabel.length > 0);
  assert.ok(policy.observableSignals.length > 0);
  assert.doesNotMatch(policy.displayQuestion, FORBIDDEN_QUESTION_TEXT, policy.questionId);
  assert.equal(policy.questionId.includes("risk-review"), false);
  for (const expected of policy.expectations) {
    for (const construct of expected.constructs) {
      for (const tag of construct.supportTags) assert.equal(construct.counterTags.includes(tag), false, `${policy.questionId}/${construct.id}`);
    }
  }
  if (policy.outputContract === "alignment-grade") {
    assert.deepEqual(policy.allowedSpreads, ["timeline", "cross", "celtic"]);
    assert.equal(policy.criterionMode, "none");
    const gradeExpectations = policy.expectations.filter((item) => item.resultMode === "alignment-grade");
    assert.ok(gradeExpectations.length >= 2, policy.questionId);
    assert.deepEqual(policy.expectations.filter((item) => item.id === "observe-only").map((item) => item.resultMode), ["situation-map"]);
    assert.equal(policy.allowedSpreads.includes("single"), false);
  } else if (policy.outputContract === "comparison-support") {
    assert.deepEqual(policy.allowedSpreads, ["timeline"]);
    assert.equal(policy.criterionMode, "required");
    assert.equal(policy.criteria.length, 5);
    assert.equal(policy.expectations.length, 0);
    assert.doesNotMatch(policy.displayQuestion, /哪一个|哪一条|自动.*赢家/u, policy.questionId);
  } else {
    assert.deepEqual(policy.allowedSpreads, ["single", "timeline", "cross", "celtic"]);
    assert.equal(policy.expectations.some((item) => item.resultMode === "alignment-grade"), false);
  }
}
assert.equal(getQuestionEvaluationPolicy("unknown-question"), null);

const alignmentPolicies = QUESTION_EVALUATION_POLICIES.filter((policy) => policy.outputContract === "alignment-grade");
for (const [index, policy] of alignmentPolicies.entries()) {
  const engineResult = await executeReadingEngine({
    questionId: policy.questionId,
    spreadId: "timeline",
    draws: timelineDraws(index * 2),
  });
  const signal = createAssessmentSignal({ engineResult, policy });
  const gradeAssessments = policy.expectations
    .filter((item) => item.resultMode === "alignment-grade")
    .map((item) => evaluateAssessment({ signal, policy, expectationId: item.id }));
  for (const assessment of gradeAssessments) {
    assert.equal(GRADES.has(assessment.grade), true, `${policy.questionId}/${assessment.expectationId}: ${assessment.grade}`);
    assert.deepEqual(assessment.evidenceRefs, signal.evidenceRefs);
  }
  const observed = evaluateAssessment({ signal, policy, expectationId: "observe-only" });
  assert.equal(observed.grade, null);
  assert.equal(observed.reasonCode, "ASSESSMENT_OBSERVE_ONLY");
}

const comparisonPolicies = QUESTION_EVALUATION_POLICIES.filter((policy) => policy.outputContract === "comparison-support");
for (const [index, policy] of comparisonPolicies.entries()) {
  const engineResult = await executeReadingEngine({
    questionId: policy.questionId,
    spreadId: "timeline",
    draws: timelineDraws((index + alignmentPolicies.length) * 2),
  });
  const signal = createAssessmentSignal({ engineResult, policy });
  assert.equal(
    assessmentErrorCode(() => evaluateAssessment({ signal, policy })),
    "ASSESSMENT_CRITERION_REQUIRED",
    policy.questionId,
  );
  for (const criterion of policy.criteria) {
    const assessment = evaluateAssessment({ signal, policy, criterionId: criterion.id });
    assert.equal(assessment.grade, null);
    assert.equal(assessment.criterionId, criterion.id);
  }
}

console.log("Question evaluation policy catalog passed: 90 validated policies, 6 alignment and 4 comparison engine assessments.");
