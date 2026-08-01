import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { serializeReadingForWorker } from "../src/app/controllers/engine-synthesis.js";
import { executeSpreadReadingRequest } from "../src/engine/decisive/spread-reading.js";
import {
  createV3Reading,
  createV3WorkerRequest,
  V3_PROTOCOL_VERSION,
} from "./v3_test_support.mjs";

const ALLOWED_REQUEST_KEYS = [
  "draws",
  "protocolVersion",
  "randomAudit",
  "readingId",
  "spreadDefinitionVersion",
  "spreadId",
];
const FORBIDDEN_REQUEST_KEYS = [
  "questionId",
  "questionText",
  "categoryId",
  "domain",
  "intent",
  "questionType",
  "expectation",
  "expectationId",
  "criterionId",
  "timeframe",
  "comparison",
];

const PROJECT_ROOT = fileURLToPath(new URL("..", import.meta.url));

function collectStaticModuleGraph(entryPath) {
  const pending = [entryPath];
  const visited = new Set();
  const importPattern = /\bfrom\s+["']([^"']+)["']|\bimport\s+["']([^"']+)["']/g;
  while (pending.length) {
    const current = pending.pop();
    if (visited.has(current)) continue;
    visited.add(current);
    const source = fs.readFileSync(current, "utf8");
    for (const match of source.matchAll(importPattern)) {
      const specifier = match[1] || match[2];
      if (!specifier.startsWith(".")) continue;
      let resolved = path.resolve(path.dirname(current), specifier);
      if (!path.extname(resolved)) resolved += ".js";
      pending.push(resolved);
    }
  }
  return [...visited].map((file) => path.relative(PROJECT_ROOT, file).replaceAll("\\", "/")).sort();
}

test("v3 serializer exposes only the frozen question-free request shape", () => {
  const payload = serializeReadingForWorker(createV3Reading());
  assert.equal(payload.protocolVersion, V3_PROTOCOL_VERSION);
  assert.deepEqual(Object.keys(payload).sort(), ALLOWED_REQUEST_KEYS);
  for (const key of FORBIDDEN_REQUEST_KEYS) assert.equal(key in payload, false, key);
});

test("100 distinct question bodies serialize identically", () => {
  const payloads = Array.from({ length: 100 }, (_, index) => serializeReadingForWorker(
    createV3Reading({ questionText: `互不相同的问题正文 ${index}: ${"字".repeat(index + 1)}` }),
  ));
  for (const payload of payloads.slice(1)) assert.deepEqual(payload, payloads[0]);
});

async function assertFieldRejected(field) {
  const input = { ...createV3WorkerRequest(), [field]: `forbidden-${field}` };
  await assert.rejects(() => executeSpreadReadingRequest(input), undefined,
    `${field} must be rejected at the worker execution boundary`);
}

test("worker execution strictly rejects every former question field", async () => {
  await assert.doesNotReject(() => executeSpreadReadingRequest(createV3WorkerRequest()),
    "the field-free v3 request must be valid before strict rejection is tested");
  for (const field of FORBIDDEN_REQUEST_KEYS) await assertFieldRejected(field);
});

test("worker execution strictly rejects unknown fields", async () => {
  await assert.doesNotReject(() => executeSpreadReadingRequest(createV3WorkerRequest()),
    "the field-free v3 request must be valid before strict rejection is tested");
  await assertFieldRejected("unexpectedField");
  await assert.rejects(() => executeSpreadReadingRequest({
    ...createV3WorkerRequest(),
    draws: [{ ...createV3WorkerRequest().draws[0], questionText: "nested-forbidden" }],
  }));
});

test("question body changes cannot affect the engine result", async () => {
  const firstPayload = serializeReadingForWorker(createV3Reading({ questionText: "正文甲" }));
  const secondPayload = serializeReadingForWorker(createV3Reading({ questionText: "正文乙，完全不同。" }));
  assert.deepEqual(firstPayload, secondPayload);
  const [first, second] = await Promise.all([
    executeSpreadReadingRequest(firstPayload),
    executeSpreadReadingRequest(secondPayload),
  ]);
  assert.deepEqual(first.engineResult, second.engineResult);
});

test("v3 request and result contain no comparison flow", async () => {
  const payload = serializeReadingForWorker(createV3Reading());
  assert.equal("comparison" in payload, false);
  const result = await executeSpreadReadingRequest(payload);
  assert.equal("comparison" in result, false);
  assert.equal("comparison" in (result.engineResult || {}), false);
});

test("the worker static graph cannot reach fixed questions, evaluation policies, or legacy engines", () => {
  const graph = collectStaticModuleGraph(path.join(PROJECT_ROOT, "src/app/reading-engine.worker.js"));
  const forbiddenPaths = [
    "src/knowledge/questions/",
    "src/knowledge/evaluation/",
    "src/engine/decisive/reading.js",
    "src/engine/runtime/legacy-reading-engine.js",
    "src/engine/observations/observation-engine.js",
    "src/engine/relations/relation-engine.js",
    "src/engine/relations/question-position-relation.js",
    "src/engine/claims/claim-engine.js",
    "src/engine/claims/claim-candidate.js",
    "src/engine/claims/conclusion-classifier.js",
    "src/engine/claims/evidence-score.js",
    "src/engine/claims/claim-validator.js",
    "src/engine/assessment/assessment-signal.js",
    "src/engine/assessment/alignment-assessor.js",
    "src/engine/assessment/assessment-presentation.js",
  ];
  for (const forbidden of forbiddenPaths) {
    assert.equal(graph.some((modulePath) => modulePath.startsWith(forbidden)), false, forbidden);
  }
  assert.ok(graph.includes("src/engine/observations/spread-observation-engine.js"));
  assert.ok(graph.includes("src/engine/relations/spread-relation-engine.js"));
  assert.ok(graph.includes("src/engine/claims/spread-claim-engine.js"));
});
