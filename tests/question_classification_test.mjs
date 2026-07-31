import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PHASE_1_QUESTION_CLASSIFICATIONS as QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";
import { CATEGORIES } from "../src/knowledge/legacy/questions.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const legacy = CATEGORIES.flatMap((category) => category.questions.slice(0, 7));
assert.equal(QUESTION_CLASSIFICATIONS.length, 42);
assert.equal(new Set(QUESTION_CLASSIFICATIONS.map((item) => item.id)).size, 42);
assert.deepEqual(QUESTION_CLASSIFICATIONS.map((item) => item.id), legacy.map((item) => item.id));
for (const item of QUESTION_CLASSIFICATIONS) {
  const source = legacy.find((question) => question.id === item.id);
  assert.equal(item.text, source.text);
  assert.ok(item.answerDimensions.length >= 4);
}
const report = JSON.parse(fs.readFileSync(path.join(root, ".qa/question-coverage.json"), "utf8"));
assert.deepEqual(report.domains, { relationship: 7, career: 7, finance: 7, growth: 7, decision: 7, daily: 7 });
assert.equal(Object.values(report.intents).reduce((sum, value) => sum + value, 0), 42);
console.log("QP-001 classification and 42-question coverage matrix passed.");
