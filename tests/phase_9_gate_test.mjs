import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const readJson = (relative) => JSON.parse(read(relative));
const progress = read("docs/PROGRESS.md");
const release = readJson(".qa/release/release-2.0.0.json");
const acceptance = readJson(".qa/release/release-acceptance.json");
const performance = readJson(".qa/release/performance-report.json");

assert.match(progress, /Phase 9状态 \| `PARENT-DONE`/);
assert.match(progress, /最近完成任务 \| Phase 9终态：`REL-004`/);
assert.match(progress, /唯一下一任务 \| `无（2\.0\.0终态）`/);
assert.equal(release.status, "RELEASED");
assert.equal(acceptance.status, "PASS");
assert.equal(performance.status, "PASS");
assert.match(read("sw.js"), /ASTRA_ROLLBACK_RELEASE/);
assert.match(read("manifest.webmanifest"), /icon-maskable-512\.png/);
for (const entry of fs.readdirSync(path.join(root, "automation"))) {
  assert.equal(/^phase_9_/.test(entry), false, entry);
}
console.log(`Phase 9 terminal gate passed: ${release.releaseId} is released with clean tracked evidence.`);
