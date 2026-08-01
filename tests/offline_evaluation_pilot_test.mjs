import assert from "node:assert/strict";
import fs from "node:fs";

import {
  PILOT_QUESTION_EVALUATION_POLICIES,
  getPilotQuestionEvaluationPolicy,
} from "../src/knowledge/evaluation/pilot-policies.js";
import { validateQuestionEvaluationPolicy } from "../src/engine/validation/question-evaluation-policy-validator.js";
import { createAssessmentSignal, AssessmentError } from "../src/engine/assessment/assessment-signal.js";
import { evaluateAssessment } from "../src/engine/assessment/alignment-assessor.js";
import { executeReadingEngine } from "../src/engine/runtime/reading-engine.js";
import { loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { SPREADS } from "../src/knowledge/spreads/definitions.js";

const schema = JSON.parse(fs.readFileSync(
  new URL("../src/knowledge/schemas/question-evaluation-policy.schema.json", import.meta.url),
  "utf8",
));

const CARD_IDS = Object.freeze([
  "major-6", "major-10", "major-13", "major-16", "major-17", "major-19",
  "cups-two", "cups-five", "cups-eight", "pentacles-four", "pentacles-ten", "swords-eight",
]);
const QUESTION_IDS = Object.freeze([
  "love-future", "career-opportunity", "wealth-growth", "growth-lesson", "daily-action", "decision-option",
]);
const timeline = SPREADS.find((spread) => spread.id === "timeline");
const GRADE_ORDER = Object.freeze(["SSS", "SS", "S", "A", "B", "C", "D", "E"]);

function timelineDraws(offset) {
  return timeline.positions.map((position, index) => ({
    cardId: CARD_IDS[(offset + index) % CARD_IDS.length],
    positionId: position.id,
    orientation: (offset + index) % 2 === 0 ? "upright" : "reversed",
  }));
}

function errorCode(action) {
  try {
    action();
  } catch (error) {
    assert.ok(error instanceof AssessmentError);
    return error.code;
  }
  throw new Error("Expected AssessmentError.");
}

function syntheticSignal({
  descriptors,
  outcomeTags = ["reciprocity", "connection", "commitment", "communication", "honesty"],
  spreadId = "timeline",
  spreadEligible = true,
} = {}) {
  return Object.freeze({
    schemaVersion: "1.0.0",
    id: `synthetic-${spreadId}-${descriptors.process}`,
    kind: "alignment-grade",
    questionId: "love-future",
    spreadId,
    spreadEligible,
    groups: Object.freeze({ outcome: Object.freeze({ tags: Object.freeze(outcomeTags) }) }),
    descriptors: Object.freeze(descriptors),
    unresolvedConflictIds: Object.freeze([]),
    evidenceRefs: Object.freeze(["obs-outcome", "claim-synthetic"]),
    sourceRefs: Object.freeze(["major-6#state.primary"]),
    semanticRefs: Object.freeze(["major-6#state.primary"]),
    provenance: Object.freeze({ policySchemaVersion: "1.0.0", policyVersion: "1.0.0" }),
  });
}

assert.equal(PILOT_QUESTION_EVALUATION_POLICIES.length, 6);
assert.deepEqual(PILOT_QUESTION_EVALUATION_POLICIES.map((policy) => policy.questionId), QUESTION_IDS);
for (const policy of PILOT_QUESTION_EVALUATION_POLICIES) {
  const question = await loadQuestionProfile(policy.questionId);
  assert.deepEqual(validateQuestionEvaluationPolicy(policy, schema, { question }), [], policy.questionId);
  assert.equal(policy.schemaVersion, "1.0.0");
  assert.equal(policy.policyVersion, "1.0.0");
  assert.equal(getPilotQuestionEvaluationPolicy(policy.questionId), policy);
}

const engineCases = [];
const matrixGrades = [];
for (const [index, questionId] of QUESTION_IDS.entries()) {
  const policy = getPilotQuestionEvaluationPolicy(questionId);
  assert.ok(policy.allowedSpreads.includes("timeline"), `${questionId} must allow the timeline test case`);
  for (const [cardIndex] of CARD_IDS.entries()) {
    const input = { questionId, spreadId: "timeline", draws: timelineDraws(cardIndex + index) };
    const engineResult = await executeReadingEngine(input);
    const beforeAssessment = structuredClone(engineResult);
    const firstSignal = createAssessmentSignal({ engineResult, policy });
    const secondSignal = createAssessmentSignal({ engineResult, policy });
    assert.deepEqual(firstSignal, secondSignal, `${questionId}/${CARD_IDS[cardIndex]} signal must be deterministic`);
    assert.ok(firstSignal.evidenceRefs.length > 0, `${questionId}/${CARD_IDS[cardIndex]} must retain evidence`);
    assert.equal(firstSignal.provenance.policySchemaVersion, policy.schemaVersion);
    assert.equal(firstSignal.provenance.policyVersion, policy.policyVersion);
    assert.deepEqual(engineResult, beforeAssessment, `${questionId}/${CARD_IDS[cardIndex]} must not mutate evidence`);
    if (policy.outputContract === "alignment-grade") {
      for (const expectation of policy.expectations.filter((item) => item.resultMode === "alignment-grade")) {
        const assessment = evaluateAssessment({ signal: firstSignal, policy, expectationId: expectation.id });
        assert.ok(GRADE_ORDER.includes(assessment.grade), `${questionId}/${expectation.id} must return an ordinal grade`);
        matrixGrades.push(assessment.grade);
      }
    }
    if (cardIndex === 0) engineCases.push({ policy, input, engineResult, signal: firstSignal, beforeAssessment });
  }
}
const highGradeCount = matrixGrades.filter((grade) => ["SSS", "SS", "S"].includes(grade)).length;
assert.ok(highGradeCount > 0, "representative evidence must be able to reach a high grade");
assert.ok(highGradeCount / matrixGrades.length <= 0.15, "SSS/SS/S must remain uncommon in the pilot matrix");
assert.ok(new Set(matrixGrades).size >= 6, "pilot matrix must exercise a layered grade distribution");

const love = engineCases.find((item) => item.policy.questionId === "love-future");
const developExpectation = love.policy.expectations.find((item) => item.id === "develop-relationship");
const endExpectation = love.policy.expectations.find((item) => item.id === "end-relationship");
const loveDevelop = evaluateAssessment({ signal: love.signal, policy: love.policy, expectationId: developExpectation.id });
const loveEnd = evaluateAssessment({ signal: love.signal, policy: love.policy, expectationId: endExpectation.id });
assert.deepEqual(loveDevelop.evidenceRefs, loveEnd.evidenceRefs);
const observeOnly = evaluateAssessment({ signal: love.signal, policy: love.policy, expectationId: "observe-only" });
assert.equal(observeOnly.grade, null);
assert.equal(observeOnly.kind, "situation-map");
assert.equal(observeOnly.reasonCode, "ASSESSMENT_OBSERVE_ONLY");
assert.equal(errorCode(() => evaluateAssessment({ signal: love.signal, policy: love.policy, expectationId: "not-a-real-expectation" })), "ASSESSMENT_UNKNOWN_EXPECTATION");
assert.equal(errorCode(() => evaluateAssessment({
  signal: love.signal,
  policy: { ...love.policy, policyVersion: "9.9.9" },
  expectationId: developExpectation.id,
})), "ASSESSMENT_POLICY_VERSION_MISMATCH");

const decision = engineCases.find((item) => item.policy.questionId === "decision-option");
assert.equal(errorCode(() => evaluateAssessment({ signal: decision.signal, policy: decision.policy })), "ASSESSMENT_CRITERION_REQUIRED");
assert.equal(errorCode(() => evaluateAssessment({ signal: decision.signal, policy: decision.policy, criterionId: "not-a-real-criterion" })), "ASSESSMENT_UNKNOWN_CRITERION");

const singlePolicy = {
  ...love.policy,
  allowedSpreads: [...love.policy.allowedSpreads, "single"],
};
const singleSignal = syntheticSignal({
  spreadId: "single",
  spreadEligible: false,
  descriptors: { foundation: "not-applicable", process: "not-applicable", stability: "not-applicable", agency: "high", burden: "low", evidence: "sufficient" },
});
const singleAssessment = evaluateAssessment({ signal: singleSignal, policy: singlePolicy, expectationId: developExpectation.id });
assert.equal(singleAssessment.grade, null);
assert.equal(singleAssessment.reasonCode, "ASSESSMENT_SINGLE_CARD_EXCLUDED");

const blockedProcess = syntheticSignal({
  descriptors: { foundation: "supportive", process: "blocked", stability: "stable", agency: "high", burden: "low", evidence: "sufficient" },
});
const capped = evaluateAssessment({ signal: blockedProcess, policy: love.policy, expectationId: developExpectation.id });
assert.equal(capped.outcomeAlignment, "clear-alignment");
assert.ok(GRADE_ORDER.indexOf(capped.grade) >= GRADE_ORDER.indexOf("B"), `blocked process grade must be capped at B: ${capped.grade}`);
assert.ok(capped.caps.some((cap) => cap.reason === "blocked-process"));

const excellent = syntheticSignal({
  descriptors: { foundation: "supportive", process: "smooth", stability: "stable", agency: "high", burden: "low", evidence: "sufficient" },
});
assert.equal(evaluateAssessment({ signal: excellent, policy: love.policy, expectationId: developExpectation.id }).grade, "SSS");

for (const { policy, input, engineResult, beforeAssessment } of engineCases) {
  // Evaluation is a read-only consumer of the production evidence bundle.
  if (policy.outputContract === "alignment-grade") {
    evaluateAssessment({ signal: createAssessmentSignal({ engineResult, policy }), policy, expectationId: policy.expectations[0].id });
  } else if (policy.outputContract === "comparison-support") {
    evaluateAssessment({ signal: createAssessmentSignal({ engineResult, policy }), policy, criterionId: policy.criteria[0].id });
  } else {
    evaluateAssessment({ signal: createAssessmentSignal({ engineResult, policy }), policy });
  }
  assert.deepEqual(engineResult, beforeAssessment, `${policy.questionId} assessment must not mutate engine evidence`);
  const rerun = await executeReadingEngine(input);
  assert.deepEqual(rerun, beforeAssessment, `${policy.questionId} production engine output changed after assessment`);
}

console.log(`Offline evaluation pilot passed: ${QUESTION_IDS.length * CARD_IDS.length} question/card cases, immutable evidence, stable grades, and caps.`);
