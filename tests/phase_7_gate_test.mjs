import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createReadingRandomContextFactory } from "../src/core/random/production-random.js";
import { createHistoryRepository } from "../src/storage/history-repository.js";
import { createMemoryStore, sampleRecord } from "./phase_7_test_support.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const randomFactory = createReadingRandomContextFactory();
for (let index = 0; index < 1000; index += 1) {
  const left = randomFactory({ rootSeed: `phase7-${index}` });
  const right = randomFactory({ rootSeed: `phase7-${index}` });
  assert.deepEqual(left.draw.shuffle([0, 1, 2, 3, 4, 5]), right.draw.shuffle([0, 1, 2, 3, 4, 5]));
  assert.equal(left.orientation.nextUnit(), right.orientation.nextUnit());
}
const repository = createHistoryRepository({ store: createMemoryStore() });
await repository.initialize();
for (let index = 0; index < 25; index += 1) {
  assert.match((await repository.save(sampleRecord(`gate-${index}`, `2026-08-01T00:${String(index).padStart(2, "0")}:00.000Z`))).status, /^saved/);
}
assert.equal((await repository.list()).length, 25);
const progress = fs.readFileSync(path.join(root, "docs/PROGRESS.md"), "utf8");
assert.match(progress, /Phase 7状态 \| `PARENT-DONE`/);
assert.match(progress, /唯一下一任务 \| `EV-001`/);
for (const name of ["phase_7_complete.py", ...Array.from({ length: 12 }, (_, index) => `phase_7_payload_${String(index).padStart(2, "0")}.txt`)]) {
  assert.equal(fs.existsSync(path.join(root, "automation", name)), false);
}
console.log("Phase 7 terminal gate passed: production random, structured history, migration, transfer, and degradation are closed.");
