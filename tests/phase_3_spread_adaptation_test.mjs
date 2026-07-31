import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { POSITION_OPERATOR_GROUPS } from "../src/knowledge/spreads/operators/index.js";
import { loadCardProfile } from "../src/knowledge/cards/registry.js";
import { createMinimalObservation } from "../src/engine/observations/minimal-consumer.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(fs.readFileSync(path.join(root, ".qa/question-library-report.json"), "utf8"));
const operators = Object.values(POSITION_OPERATOR_GROUPS).flat();
assert.equal(operators.length, 19);
assert.equal(report.summary.spreadScenarioTotal, 90 * 19);
assert.equal(report.summary.spreadScenarioPassed, report.summary.spreadScenarioTotal);
assert.equal(report.summary.spreadScenarioPassRate, 1);
const card = await loadCardProfile("major-7");
for (const questionId of QUESTION_PROFILE_IDS) {
  const question = await loadQuestionProfile(questionId);
  for (const operator of operators) {
    const responsibilities = question.spreadProfiles[operator.spreadId].positionResponsibilities[operator.positionId];
    assert.ok(responsibilities.length >= 1, `${questionId}/${operator.spreadId}/${operator.positionId}`);
    const observation = createMinimalObservation({ card, question, operator, orientation: "upright" });
    assert.equal(observation.questionId, questionId);
    assert.equal(observation.positionId, operator.positionId);
  }
}
console.log("QP-004A-F spread adaptation passed: all 90 questions answer through all 19 fixed positions.");
