import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES } from "../src/knowledge/legacy/questions.js";
import { QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { validateQuestionProfile } from "../src/engine/validation/question-profile-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "src/knowledge/schemas/question-profile.schema.json"), "utf8"));
assert.equal(CATEGORIES.length, 6);
assert.ok(CATEGORIES.every((category) => category.questions.length === 15));
assert.equal(CATEGORIES.flatMap((category) => category.questions).length, 90);
assert.equal(QUESTION_CLASSIFICATIONS.length, 90);
assert.equal(QUESTION_PROFILE_IDS.length, 90);
assert.equal(new Set(QUESTION_PROFILE_IDS).size, 90);
assert.equal(new Set(QUESTION_CLASSIFICATIONS.map((item) => item.text)).size, 90);
for (const classification of QUESTION_CLASSIFICATIONS) {
  const profile = await loadQuestionProfile(classification.id);
  assert.equal(profile.id, classification.id);
  assert.equal(profile.text, classification.text);
  assert.equal(profile.domain, classification.domain);
  assert.deepEqual(validateQuestionProfile(profile, schema), [], classification.id);
  assert.deepEqual(Object.keys(profile.spreadProfiles).sort(), ["celtic","cross","single","timeline"]);
}
const report = JSON.parse(fs.readFileSync(path.join(root, ".qa/question-library-report.json"), "utf8"));
assert.equal(report.summary.totalQuestions, 90);
assert.deepEqual(report.summary.domains, { relationship:15, career:15, finance:15, growth:15, decision:15, daily:15 });
assert.equal(report.summary.schemaPassRate, 1);
assert.ok(report.summary.nearSynonymRatio <= 0.05);
assert.equal(report.frozenFailures.length, 0);
assert.equal(report.validationFailures.length, 0);
assert.equal(report.highRiskFailures.length, 0);
console.log("QP-003A-F question expansion passed: 90 profiles, 15 per domain, frozen base questions, and risk boundaries.");
