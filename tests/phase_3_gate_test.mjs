import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const progress = fs.readFileSync(path.join(root, "docs/PROGRESS.md"), "utf8");
assert.match(progress, /Phase 3状态 \| `PARENT-DONE`/);
const report = readJson(".qa/question-library-report.json");
assert.equal(report.summary.totalQuestions, 90);
assert.equal(report.summary.baseQuestionsFrozen, 42);
assert.equal(report.summary.addedQuestions, 48);
assert.equal(report.summary.schemaPassRate, 1);
assert.ok(report.summary.nearSynonymRatio <= 0.05);
assert.equal(report.summary.spreadScenarioPassRate, 1);
assert.equal(report.frozenFailures.length, 0);
assert.equal(report.validationFailures.length, 0);
assert.equal(report.highRiskFailures.length, 0);
assert.equal(report.scenarioFailures.length, 0);
for (const removed of ["automation/phase_3_apply.py"]) {
  assert.equal(fs.existsSync(path.join(root, removed)), false, `${removed} must not remain`);
}
console.log("Phase 3 terminal gate passed: 90 questions, synonym control, high-risk boundaries, and four-spread adaptation.");
