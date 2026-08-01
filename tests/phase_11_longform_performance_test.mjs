import assert from "node:assert/strict";
import fs from "node:fs";
import { performance } from "node:perf_hooks";
import { createLongformInterpretation, LENGTH_RULES, textSimilarity } from "../src/engine/longform/narrative.js";
import { serializeReadingForWorker } from "../src/app/controllers/engine-synthesis.js";
import { createReadingEngineWorkerClient, WARM_MESSAGE, WORKER_MESSAGE } from "../src/app/engine-worker-client.js";

const POSITIONS = Object.freeze({
  single: ["essence"],
  timeline: ["past", "present", "future"],
  cross: ["core", "root", "trend", "influence", "action"],
  celtic: ["present", "challenge", "past", "future", "above", "below", "advice", "external", "hopes", "outcome"],
});

function fixture(spreadId) {
  const draws = POSITIONS[spreadId].map((positionId, index) => ({
    cardId: `${["cups", "wands", "swords", "pentacles"][index % 4]}-${index + 1}`,
    cardName: `测试牌${index + 1}`,
    positionId,
    positionName: positionId,
    orientation: index % 3 === 0 ? "reversed" : "upright",
    meaning: `第${index + 1}项现实条件已经形成，并正在改变后续行动、关系节奏与资源分配`,
    advice: "把判断落实为可以连续执行的现实动作",
    keywords: ["稳定", "行动", "边界"],
    suit: ["cups", "wands", "swords", "pentacles"][index % 4],
    arcana: "minor",
  }));
  const observations = draws.map((draw, index) => ({
    positionId: draw.positionId,
    semanticText: draw.meaning,
    localScore: 0.62 + index * 0.01,
    dimensions: {
      speed: (index % 3) - 1,
      stability: index % 2 ? 1 : 2,
      agency: 1,
      clarity: 1,
      risk: index === 1 ? 2 : 0,
      transition: index > draws.length / 2 ? 2 : 0,
    },
  }));
  const candidates = draws.map((draw, index) => ({
    id: `candidate-${spreadId}-${index}`,
    positionIds: [draw.positionId],
    stance: index === 1 ? "cautionary" : index === 2 ? "conditional" : "supportive",
    score: 0.88 - index * 0.02,
    semanticSeeds: [draw.meaning],
    sourceOrder: index,
  }));
  return {
    questionId: "love-new",
    questionText: "新的缘分会以怎样的方式靠近我？",
    categoryId: "love",
    spreadId,
    draws,
    engineResult: {
      claim: {
        id: `claim-${spreadId}`,
        conclusionType: "conditional",
        conclusionCategory: "directive",
        conditions: ["现实回应稳定"],
      },
      resolution: { activeCandidates: candidates },
      observations,
    },
  };
}

for (const spreadId of Object.keys(POSITIONS)) {
  const input = fixture(spreadId);
  const result = createLongformInterpretation(input);
  assert.equal(result.schemaVersion, "3.0.0");
  assert.notEqual(result.verdict.code, "indeterminate");
  assert.equal(result.judgment.includes(input.questionText), false, `${spreadId} repeated the question`);
  assert.equal(result.positionAnalyses.length, POSITIONS[spreadId].length);
  assert.equal(result.provenance.visibleCharacterCount >= LENGTH_RULES[spreadId].min, true);
  assert.equal(result.provenance.visibleCharacterCount <= LENGTH_RULES[spreadId].max, true);
  assert.equal(Boolean(result.conditions.success && result.conditions.failure && result.conditions.turningPoint), true);
  assert.equal(spreadId === "single" ? result.manifestation === null : Boolean(result.manifestation), true);
  const visible = [
    result.judgment,
    ...result.situationAnalysis,
    ...result.positionAnalyses.map((item) => item.body),
    ...Object.values(result.conditions),
    ...(result.manifestation ? Object.values(result.manifestation) : []),
  ].join("\n");
  for (const banned of ["走势从", "牌阵故事", "牌与牌之间如何对话", "你可以留意", "接下来的三步", "作为状态线索时指出", "可能", "也许", "或许"]) {
    assert.equal(visible.includes(banned), false, `${spreadId} leaked ${banned}`);
  }
  for (const item of result.positionAnalyses) {
    assert.equal(item.body.includes(item.cardName), false, `${spreadId}/${item.positionId} repeated card name`);
  }
  const paragraphs = [result.judgment, ...result.situationAnalysis, ...result.positionAnalyses.map((item) => item.body)];
  for (let left = 0; left < paragraphs.length; left += 1) {
    for (let right = left + 1; right < paragraphs.length; right += 1) {
      assert.equal(textSimilarity(paragraphs[left], paragraphs[right]) < 0.72, true);
    }
  }
}

const reading = {
  question: { id: "love-new", text: "新的缘分会以怎样的方式靠近我？" },
  category: { id: "love" },
  spread: { id: "timeline" },
  draws: [
    {
      card: {
        id: "cups-nine",
        name: "圣杯九",
        upright: "满足感已经形成，生活具有稳定基础",
        reversed: "满足感被封闭，舒适区开始阻挡新的互动",
        advice: "保留稳定生活，同时给新的互动留下实际时间",
        keywords: ["满足", "舒适", "边界"],
        suit: "cups",
        arcana: "minor",
      },
      position: { id: "past", name: "过去" },
      reversed: false,
    },
  ],
};
const payload = serializeReadingForWorker(reading);
assert.equal("card" in payload.draws[0], false);
assert.equal(payload.draws[0].meaning, reading.draws[0].card.upright);
assert.deepEqual(payload.draws[0].keywords, ["满足", "舒适", "边界"]);

class MockWorker {
  static instances = [];
  constructor() {
    this.listeners = new Map();
    this.messages = [];
    MockWorker.instances.push(this);
  }
  addEventListener(type, callback) {
    this.listeners.set(type, callback);
  }
  postMessage(message) {
    this.messages.push(message);
    queueMicrotask(() => {
      const status = message.type === WARM_MESSAGE ? "ready" : "completed";
      this.listeners.get("message")?.({ data: { id: message.id, status, value: { ok: true } } });
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
});

const timings = [];
const benchmark = fixture("celtic");
for (let index = 0; index < 80; index += 1) {
  const started = performance.now();
  createLongformInterpretation(benchmark);
  timings.push(performance.now() - started);
}
timings.sort((left, right) => left - right);
const median = timings[Math.floor(timings.length * 0.5)];
const p95 = timings[Math.floor(timings.length * 0.95)];
assert.equal(median < 20, true, `longform median ${median.toFixed(3)}ms exceeded 20ms`);
assert.equal(p95 < 50, true, `longform p95 ${p95.toFixed(3)}ms exceeded 50ms`);

const rendererSource = fs.readFileSync(new URL("../src/ui/renderers/insight.js", import.meta.url), "utf8");
const appSource = fs.readFileSync(new URL("../src/app/application.js", import.meta.url), "utf8");
const cssSource = fs.readFileSync(new URL("../src/styles/phase-11.css", import.meta.url), "utf8");
assert.match(rendererSource, /replaceChildren/);
assert.match(rendererSource, /createDocumentFragment/);
assert.doesNotMatch(rendererSource, /insightContent\.innerHTML\s*=/);
assert.match(appSource, /engineWorkerClient\.warmUp/);
assert.match(appSource, /renderLoading\(\)/);
assert.match(cssSource, /content-visibility:\s*auto/);
assert.match(cssSource, /contain:\s*layout paint style/);

console.log(JSON.stringify({
  status: "PASS",
  spreads: Object.keys(POSITIONS),
  workerCreations: client.stats().workerCreations,
  medianMs: Number(median.toFixed(3)),
  p95Ms: Number(p95.toFixed(3)),
}));
