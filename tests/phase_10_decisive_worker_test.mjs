import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  createDecisiveInterpretation,
  validateDecisiveInterpretation,
} from "../src/engine/decisive/verdict.js";
import {
  createReadingEngineWorkerClient,
  WORKER_MESSAGE,
} from "../src/app/engine-worker-client.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const engineResult = {
  claim: {
    id: "claim-test",
    conclusionType: "indeterminate",
    conclusionCategory: "indeterminate",
    conditions: [],
  },
  resolution: {
    activeCandidates: [
      {
        id: "candidate-support",
        score: 0.84,
        sourceOrder: 0,
        stance: "supportive",
        positionIds: ["present"],
        semanticSeeds: ["行动条件已经成熟"],
      },
      {
        id: "candidate-risk",
        score: 0.63,
        sourceOrder: 1,
        stance: "cautionary",
        positionIds: ["obstacle"],
        semanticSeeds: ["旧方法正在消耗可用资源"],
      },
      {
        id: "candidate-repeat",
        score: 0.51,
        sourceOrder: 2,
        stance: "descriptive",
        positionIds: ["present"],
        semanticSeeds: ["行动条件已经成熟。"],
      },
    ],
  },
};
const draws = [
  {
    cardId: "major-1",
    cardName: "魔术师",
    positionId: "present",
    positionName: "当前",
    orientation: "upright",
  },
  {
    cardId: "major-16",
    cardName: "高塔",
    positionId: "obstacle",
    positionName: "阻碍",
    orientation: "reversed",
  },
];

const first = createDecisiveInterpretation({
  engineResult,
  questionText: "这件事现在应该推进吗？",
  draws,
});
const second = createDecisiveInterpretation({
  engineResult,
  questionText: "这件事现在应该推进吗？",
  draws,
});
assert.deepEqual(first, second);
assert.notEqual(first.verdict.code, "indeterminate");
assert.equal(first.verdict.code, "advance");
assert.equal(first.decisiveFactors.length, 2);
assert.deepEqual(validateDecisiveInterpretation(first), []);
assert.equal(/可能|也许|倾向|值得留意|继续观察|不宜作确定判断/.test(JSON.stringify(first)), false);

class FakeWorker {
  constructor(url, options) {
    this.url = url;
    this.options = options;
    this.listeners = new Map();
  }
  addEventListener(name, listener) {
    this.listeners.set(name, listener);
  }
  postMessage(message) {
    assert.equal(message.type, WORKER_MESSAGE);
    queueMicrotask(() => {
      this.listeners.get("message")?.({
        data: {
          id: message.id,
          status: "completed",
          value: { synthesis: first, engineResult },
        },
      });
    });
  }
  terminate() {}
}
const client = createReadingEngineWorkerClient({
  WorkerRef: FakeWorker,
  workerUrl: new URL("file:///reading-engine.worker.js"),
  timeoutMs: 1000,
});
const workerResult = await client.synthesize({ questionId: "q", spreadId: "single", draws: [] });
assert.equal(workerResult.synthesis.verdict.code, "advance");
client.dispose();

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const dom = fs.readFileSync(path.join(root, "src/ui/dom.js"), "utf8");
const application = fs.readFileSync(path.join(root, "src/app/application.js"), "utf8");
const adapter = fs.readFileSync(path.join(root, "src/app/controllers/engine-synthesis.js"), "utf8");
const workerClient = fs.readFileSync(path.join(root, "src/app/engine-worker-client.js"), "utf8");
const insight = fs.readFileSync(path.join(root, "src/ui/renderers/insight.js"), "utf8");

for (const removed of [
  "platformStatus",
  "offlineState",
  "releaseState",
  "storageState",
  "cacheDeckButton",
  "deleteDeckButton",
  "updateAppButton",
]) {
  assert.equal(index.includes(`id="${removed}"`), false, removed);
  assert.equal(dom.includes(`"${removed}"`), false, removed);
}
for (const heading of ["牌阵故事", "牌与牌之间如何对话", "你可以留意", "接下来的三步"]) {
  assert.equal(application.includes(heading), false, heading);
  assert.equal(insight.includes(heading), false, heading);
}
assert.equal(adapter.includes("engine/runtime/reading-engine.js"), false);
assert.match(application, /createReadingEngineWorkerClient/);
assert.match(workerClient, /type:\s*"module"/);
assert.match(workerClient, /new WorkerRef/);
assert.match(application, /createInsightRenderer/);

console.log("Phase 10 decisive reading contract passed: visible status UI is removed, verdicts are unique, text is non-repetitive, and engine work crosses a module Worker boundary.");
