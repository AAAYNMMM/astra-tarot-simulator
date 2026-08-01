import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const readJson = (relative) => JSON.parse(read(relative));
const progress = read("docs/PROGRESS.md");
const report = readJson(".qa/evaluation/phase-8-evaluation-report.json");
const blind = readJson(".qa/evaluation/blind-result.json");
assert.match(progress, /Phase 8状态 \| `PARENT-DONE`/);
assert.match(progress, /唯一下一任务 \| `无（2\.0\.0终态）`/);
assert.equal(report.summary.status, "PASS");
assert.equal(blind.status, "PASS");
assert.equal(report.summary.totalCases, 156 + 360 + 36);
for (const relative of [
  "src/engine/runtime/reading-engine.js",
  "src/engine/evaluation/evaluation-runner.js",
  "src/core/errors/app-error.js",
  "src/platform/diagnostics.js",
  "src/app/recovery/recovery-coordinator.js",
  "src/ui/components/recovery-panel.js",
  "src/ui/accessibility/controller.js",
  "scripts/doctor.py",
  "docs/PHASE_8_QUALITY_UI.md",
  "docs/HUMAN_REVIEW_PROTOCOL.md",
]) assert.equal(fs.existsSync(path.join(root, relative)), true, relative);
for (const entry of fs.readdirSync(path.join(root, "automation"))) {
  assert.equal(/^phase_8_(?:complete|payload)/.test(entry), false, entry);
}
console.log(`Phase 8 terminal gate passed: ${report.summary.totalCases} committed evaluation cases plus controlled blind validation.`);
