import assert from "node:assert/strict";
import fs from "node:fs";

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
const progress = read("docs/PROGRESS.md");
const contracts = read("docs/EXECUTION_CONTRACTS.md");
const phase = read("docs/PHASE_12_CONCISE_STABILITY.md");
const renderer = read("src/ui/renderers/insight.js");
const interpretation = read("src/engine/concise/interpretation.js");
const worker = read("src/app/reading-engine.worker.js");
const client = read("src/app/engine-worker-client.js");
const validate = read("automation/validate.py");

assert.match(progress, /当前阶段 \| Phase 12：稳定性、精简解读与2\.1\.0/);
assert.match(progress, /Phase 12状态 \| `PARENT-IN-PROGRESS`|Phase 12状态 \| `PARENT-DONE`/);
assert.match(contracts, /### Phase 12：稳定性、精简解读与2\.1\.0/);
assert.match(phase, /解读Schema为`4\.0\.0`/);
assert.match(interpretation, /schemaVersion:\s*"4\.0\.0"/);
assert.match(interpretation, /keyEvidence/);
assert.match(interpretation, /outcomeEvidenceRef/);
assert.match(renderer, /关键依据/);
assert.match(renderer, /查看逐牌依据/);
assert.match(renderer, /replaceChildren/);
assert.match(worker, /ASTRA_WARM_READING_ENGINE/);
assert.match(client, /"warming"\s*:\s*"running"/);
assert.match(validate, /node-phase-11-concise-performance/);
assert.match(validate, /phase-11-real-data-matrix/);

for (const removed of ["局势总解", "关键牌位详解", "时间与表现形式", "situationAnalysis", "positionAnalyses"]) {
  assert.equal(renderer.includes(removed), false, `renderer still contains ${removed}`);
}
assert.equal(fs.existsSync(new URL("../src/engine/longform/narrative.js", import.meta.url)), false);
assert.equal(fs.existsSync(new URL("../src/engine/longform/argument.js", import.meta.url)), false);

console.log("Phase 12 concise stability gate passed.");
