import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const progress = fs.readFileSync(path.join(root, "docs/PROGRESS.md"), "utf8");
const phase = fs.readFileSync(path.join(root, "docs/PHASE_10_DECISIVE_READING.md"), "utf8");
const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const application = fs.readFileSync(path.join(root, "src/app/application.js"), "utf8");

assert.match(progress, /Phase 10状态 \| `PARENT-DONE`/);
assert.match(phase, /最终判断/);
assert.match(phase, /模块 Web Worker/);
assert.equal(index.includes("class=\"platform-status\""), false);
assert.equal(application.includes("executeReadingEngine"), false);

console.log("Phase 10 terminal gate passed: decisive Worker-backed reading is the recorded terminal state.");
