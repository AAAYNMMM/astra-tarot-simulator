import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const report = JSON.parse(read(".qa/observation-engine-report.json"));
const progress = read("docs/PROGRESS.md");
assert.equal(report.summary.totalCards, 78);
assert.equal(report.summary.totalQuestions, 90);
assert.equal(report.summary.totalPositions, 19);
assert.equal(report.summary.graphCount, 4);
assert.equal(report.summary.graphNodes, 19);
assert.equal(report.summary.graphEdges, 21);
assert.equal(report.summary.questionPositionScenarios, 3420);
assert.equal(report.summary.cardPositionScenarios, 2964);
assert.equal(report.summary.totalScenarios, 6384);
assert.equal(report.summary.directMatchScenarios + report.summary.positionMediatedScenarios, 6384);
assert.ok(report.summary.directMatchScenarios > 0);
assert.ok(report.summary.positionMediatedScenarios > 0);
assert.equal(report.summary.schemaPassRate, 1);
assert.equal(report.summary.deterministicPassRate, 1);
assert.equal(report.summary.semanticReferencePassRate, 1);
assert.equal(report.summary.positionDifferentiationPassRate, 1);
assert.deepEqual(report.graphFailures, []);
assert.deepEqual(report.validationFailures, []);
assert.deepEqual(report.differentiationFailures, []);
assert.match(progress, /Phase 4状态 \| `PARENT-DONE`/);
for (let version = 1; version <= 8; version += 1) {
  const suffix = version === 1 ? "" : `_v${version}`;
  assert.equal(fs.existsSync(path.join(root, `automation/phase_4_apply${suffix}.py`)), false);
}
console.log("Phase 4 terminal gate passed: fixed graphs and full Observation Engine are closed.");
