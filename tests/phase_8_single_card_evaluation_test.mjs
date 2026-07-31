import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(fs.readFileSync(path.join(root, ".qa/evaluation/phase-8-evaluation-report.json"), "utf8"));
const suite = report.suites.singleCard;
assert.equal(suite.suiteId, "EV-001-single-card");
assert.equal(suite.caseCount, 78 * 2);
assert.ok(suite.averageScore >= 9);
assert.ok(suite.minimumScore >= 9);
assert.ok(suite.passRate >= 0.95);
assert.equal(suite.passed, true);
for (const rate of Object.values(suite.metricRates)) assert.equal(rate, 1);
console.log(`EV-001 single-card evaluation passed: ${suite.caseCount} cases, average ${suite.averageScore}.`);
