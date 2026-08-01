import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(fs.readFileSync(path.join(root, ".qa/release/performance-report.json"), "utf8"));
assert.equal(report.schemaVersion, "1.0.0");
assert.equal(report.status, "PASS");
assert.equal(Object.values(report.checks).every(Boolean), true);
assert.ok(report.measurements.shellBytes > 0);
assert.ok(report.measurements.knowledgeBytes > 0);
assert.ok(report.measurements.deckBytes.rws > 0);
assert.ok(report.measurements.engineP95Ms <= report.budgets.engineP95Ms);
assert.ok(report.measurements.readingRecordBytes <= report.budgets.readingRecordBytes);
assert.ok(report.measurements.targetHistoryRecords >= 1000);
console.log(`Phase 9 performance budget passed: shell ${report.measurements.shellBytes} bytes, engine p95 ${report.measurements.engineP95Ms} ms.`);
