import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(fs.readFileSync(path.join(root, ".qa/evaluation/phase-8-evaluation-report.json"), "utf8"));
const suite = report.suites.questionFit;
assert.equal(suite.suiteId, "EV-002-question-fit");
assert.equal(suite.caseCount, 90 * 4);
assert.equal(new Set(suite.results.map((item) => item.questionId)).size, 90);
assert.deepEqual([...new Set(suite.results.map((item) => item.spreadId))].sort(), ["celtic", "cross", "single", "timeline"]);
assert.ok(suite.averageScore >= 9);
assert.ok(suite.minimumScore >= 9);
assert.ok(suite.passRate >= 0.95);
assert.equal(suite.passed, true);
console.log(`EV-002 question-fit evaluation passed: ${suite.caseCount} cases, average ${suite.averageScore}.`);
