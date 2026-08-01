import assert from "node:assert/strict";
import fs from "node:fs";
import { performance } from "node:perf_hooks";

import {
  createConciseInterpretation,
  validateConciseInterpretation,
} from "../src/engine/concise/interpretation.js";
import { executeDecisiveReading, warmDecisiveReadingEngine } from "../src/engine/decisive/reading.js";
import { serializeReadingForWorker } from "../src/app/controllers/engine-synthesis.js";
import { createReadingEngineWorkerClient, WARM_MESSAGE, WORKER_MESSAGE } from "../src/app/engine-worker-client.js";
import { CARD_PROFILE_IDS } from "../src/knowledge/cards/registry.js";
import { LEGACY_SPREADS_V1 as SPREADS } from "../src/knowledge/spreads/definitions.js";

function payload(spreadId, cardIds = CARD_PROFILE_IDS) {
  const spread = SPREADS.find((item) => item.id === spreadId);
  return {
    questionId: "love-current",
    questionText: "这段关系当前最核心的能量是什么？",
    categoryId: "love",
    spreadId,
    draws: spread.positions.map((position, index) => ({
      cardId: cardIds[index],
      cardName: cardIds[index],
      positionId: position.id,
      positionName: position.name,
      orientation: index % 3 === 0 ? "reversed" : "upright",
    })),
  };
}

for (const spreadId of ["single", "timeline", "cross", "celtic"]) {
  const input = payload(spreadId);
  const first = await executeDecisiveReading(input);
  const second = await executeDecisiveReading(input);
  assert.deepEqual(first.synthesis, second.synthesis, `${spreadId} must be deterministic`);
  assert.equal(first.status, "completed");
  assert.equal(first.synthesis.schemaVersion, "4.0.0");
  assert.equal(first.synthesis.keyEvidence.length >= 2 && first.synthesis.keyEvidence.length <= 4, true);
  assert.equal(first.synthesis.cardEvidence.length, input.draws.length);
  assert.deepEqual(validateConciseInterpretation(first.synthesis, { drawCount: input.draws.length }), []);
  assert.equal(/[。！？][；，。]|[；，、]{2,}/.test(JSON.stringify(first.synthesis)), false);
  assert.equal(first.timings.totalMs >= first.timings.engineMs, true);
}

const failureRegression = payload("celtic", [
  "wands-two", "major-6", "cups-ace", "cups-nine", "swords-queen",
  "wands-ace", "cups-seven", "major-12", "cups-five", "major-3",
]);
failureRegression.draws.forEach((draw, index) => {
  draw.orientation = ["reversed", "upright", "reversed", "reversed", "upright", "reversed", "upright", "upright", "upright", "upright"][index];
});
const regression = await executeDecisiveReading(failureRegression);
assert.equal(regression.synthesis.schemaVersion, "4.0.0");
assert.match(regression.synthesis.summary.takeaway, /结果位/);
assert.equal(regression.synthesis.summary.evidenceRefs.includes(regression.synthesis.provenance.outcomeEvidenceRef), true);

for (const cardId of ["major-8", "cups-seven"]) {
  const input = payload("single", [cardId]);
  const result = await executeDecisiveReading(input);
  assert.equal(result.synthesis.cardEvidence[0].cardId, cardId);
  assert.deepEqual(validateConciseInterpretation(result.synthesis, { drawCount: 1 }), []);
}

const reading = {
  question: { id: "love-new", text: "新的缘分会以怎样的方式靠近我？" },
  category: { id: "love" },
  spread: { id: "single" },
  draws: [{
    card: {
      id: "cups-nine",
      name: "圣杯九",
      upright: "旧版展示文案不应进入推理负载",
      reversed: "旧版逆位展示文案不应进入推理负载",
      advice: "旧版行动文案不应进入推理负载",
      keywords: ["旧版", "展示"],
      suit: "cups",
      arcana: "minor",
    },
    position: { id: "essence", name: "核心讯息" },
    reversed: false,
  }],
};
const serialized = serializeReadingForWorker(reading);
for (const legacyField of ["meaning", "advice", "keywords", "card"]) {
  assert.equal(legacyField in serialized.draws[0], false, legacyField);
}

const warm = await warmDecisiveReadingEngine();
assert.equal(warm.status, "ready");
assert.equal(warm.strategy, "core-only-on-demand-profiles");
assert.equal(warm.cardProfiles, 0);
assert.equal(warm.questionProfiles, 0);

class MockWorker {
  static instances = [];
  constructor() {
    this.listeners = new Map();
    this.messages = [];
    MockWorker.instances.push(this);
  }
  addEventListener(type, callback) { this.listeners.set(type, callback); }
  postMessage(message) {
    this.messages.push(message);
    queueMicrotask(() => {
      const status = message.type === WARM_MESSAGE ? "ready" : "completed";
      this.listeners.get("message")?.({ data: { id: message.id, status, value: { status } } });
    });
  }
  terminate() {}
}
const client = createReadingEngineWorkerClient({ WorkerRef: MockWorker, timeoutMs: 1000 });
await Promise.all([client.warmUp(), client.warmUp()]);
await client.synthesize({ test: true });
assert.equal(MockWorker.instances.length, 1);
assert.equal(MockWorker.instances[0].messages.filter((item) => item.type === WARM_MESSAGE).length, 1);
assert.equal(MockWorker.instances[0].messages.filter((item) => item.type === WORKER_MESSAGE).length, 1);
assert.deepEqual(client.stats(), {
  workerCreations: 1,
  synthesisRequests: 1,
  pendingRequests: 0,
  warmStarted: true,
  status: "completed",
});

const timings = [];
const benchmark = payload("celtic");
await executeDecisiveReading(benchmark);
for (let index = 0; index < 80; index += 1) {
  const started = performance.now();
  await executeDecisiveReading(benchmark);
  timings.push(performance.now() - started);
}
timings.sort((left, right) => left - right);
const median = timings[Math.floor(timings.length * 0.5)];
const p95 = timings[Math.floor(timings.length * 0.95)];
assert.equal(median < 20, true, `concise median ${median.toFixed(3)}ms exceeded 20ms`);
assert.equal(p95 < 50, true, `concise p95 ${p95.toFixed(3)}ms exceeded 50ms`);

const rendererSource = fs.readFileSync(new URL("../src/ui/renderers/insight.js", import.meta.url), "utf8");
const appSource = fs.readFileSync(new URL("../src/app/application.js", import.meta.url), "utf8");
const cssSource = fs.readFileSync(new URL("../src/styles/phase-11.css", import.meta.url), "utf8");
assert.match(rendererSource, /card-evidence-details/);
assert.match(rendererSource, /精简解读/);
assert.doesNotMatch(rendererSource, /situationAnalysis|positionAnalyses|manifestation/);
assert.match(appSource, /duration:\s*480/);
assert.doesNotMatch(appSource, /await delay\(240\)/);
assert.match(cssSource, /content-visibility:\s*auto/);
assert.match(cssSource, /font-size:\s*1rem/);

const synthetic = createConciseInterpretation;
assert.equal(typeof synthetic, "function");
console.log(JSON.stringify({
  status: "PASS",
  schemaVersion: "4.0.0",
  medianMs: Number(median.toFixed(3)),
  p95Ms: Number(p95.toFixed(3)),
}));
