import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const progress = read("docs/PROGRESS.md");
const contracts = read("docs/EXECUTION_CONTRACTS.md");
const phase = read("docs/PHASE_11_LONGFORM_PERFORMANCE.md");
const renderer = read("src/ui/renderers/insight.js");
const narrative = read("src/engine/longform/narrative.js");
const worker = read("src/app/reading-engine.worker.js");
const client = read("src/app/engine-worker-client.js");
const validate = read("automation/validate.py");

assert.match(progress, /当前阶段 \| Phase 11：长篇因果解读与渲染性能/);
assert.match(progress, /Phase 11状态 \| `PARENT-DONE`/);
assert.match(progress, /唯一下一任务 \| `无（2\.2长篇解读终态）`/);
assert.match(contracts, /### Phase 11终态要求/);
assert.match(phase, /长篇因果解读/);
assert.match(narrative, /局势总解|situationAnalysis/);
assert.match(narrative, /成立条件|conditions/);
assert.match(renderer, /关键牌位详解/);
assert.match(renderer, /时间与表现形式/);
assert.match(renderer, /replaceChildren/);
assert.match(worker, /ASTRA_WARM_READING_ENGINE/);
assert.match(client, /warmUp/);
assert.match(validate, /node-phase-11-longform-performance/);

for (const removed of ["走势依据", "走势从", "牌与牌之间如何对话", "你可以留意", "接下来的三步"]) {
  assert.equal(renderer.includes(removed), false, `renderer still contains ${removed}`);
}

for (const path of [
  "automation/phase_11_engine.py",
  "automation/phase_11_ui.py",
]) {
  assert.equal(fs.existsSync(new URL(`../${path}`, import.meta.url)), false, `${path} must be removed`);
}

console.log("Phase 11 terminal gate passed.");
