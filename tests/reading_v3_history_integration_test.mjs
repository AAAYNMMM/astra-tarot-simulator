import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import { createRuntimeServices } from "../src/app/runtime-services.js";
import { getSpreadDefinition } from "../src/knowledge/spreads/definitions.js";
import { createFakeIndexedDB } from "./phase_7_test_support.mjs";
import { RANDOM_AUDIT_V1 } from "./v3_test_support.mjs";

function createMemoryLocalStorage(seed) {
  const values = new Map(Object.entries(seed));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  };
}

function legacyRecord(id, question, createdAt) {
  return {
    id,
    createdAt,
    categoryName: "兼容主题",
    categoryIcon: "✦",
    categoryAccent: "#a58ad4",
    question,
    spreadId: "celtic",
    spreadDefinitionVersion: "1.0.0",
    spreadName: "凯尔特十字",
    deckName: "经典韦特",
    cards: [{
      cardId: "major-0",
      name: "愚者",
      positionId: "advice",
      position: "行动建议",
      orientation: "正位",
    }],
    headline: "旧历史快照",
  };
}

const localStorage = createMemoryLocalStorage({
  "astra-tarot-history-v1": JSON.stringify([
    legacyRecord("shared-reading", "旧投影问题", "2026-07-30T00:00:00.000Z"),
    legacyRecord("migrated-v2", "迁移为 V2 的问题", "2026-07-29T00:00:00.000Z"),
  ]),
});

const windowRef = {
  localStorage,
  indexedDB: createFakeIndexedDB(),
  crypto: webcrypto,
  Math,
  navigator: { storage: { estimate: async () => ({ usage: 0, quota: 1024 * 1024 }) } },
  location: { protocol: "https:", hostname: "example.test" },
  addEventListener() {},
  setTimeout,
  clearTimeout,
  fetch: async () => ({
    ok: true,
    json: async () => ({
      appVersion: "3.0.0-test",
      generatorVersion: "1.0.0",
      sourceSetHash: "source-test-hash",
      engineManifestHash: "engine-test-hash",
      knowledgeManifestHash: "knowledge-test-hash",
    }),
  }),
};

const services = createRuntimeServices(windowRef);
const initialized = await services.initializeStructuredHistory();
assert.equal(initialized.mode, "indexeddb");
assert.equal(initialized.migration.status, "completed");
assert.equal(initialized.migration.migrated, 2);

const presentation = {
  schemaVersion: "3.0.0",
  status: "complete",
  grade: { level: "A", label: "较为顺畅" },
  structuralTendency: { text: "V3 结构走势快照。" },
  basis: [{ text: "结构依据。" }],
  conditions: { success: [{ text: "成立条件。" }], stopSignals: [{ text: "停止信号。" }], turningPoints: [] },
};
const spread = getSpreadDefinition("single", "2.0.0");
const v3Reading = {
  schemaVersion: "3.0.0",
  id: "shared-reading",
  createdAt: "2026-08-01T00:00:00.000Z",
  question: { text: "V3 自由问题", purpose: "history-only" },
  spread,
  deckStyle: "rws",
  randomAudit: structuredClone(RANDOM_AUDIT_V1),
  draws: [{
    index: 0,
    card: { id: "major-0", name: "愚者" },
    position: spread.positions[0],
    enginePosition: spread.positions[0],
    reversed: false,
  }],
  presentation,
  assessment: { presentation },
};
assert.notEqual((await services.saveStructuredReading(v3Reading)).status, "rejected");

const localOnly = legacyRecord("local-v1", "仍为 V1 的本地记录", "2026-07-31T00:00:00.000Z");
services.writeHistory([
  ...JSON.parse(localStorage.getItem("astra-tarot-history-v1")),
  localOnly,
]);

const combined = services.loadHistory();
assert.equal(combined.length, 3);
assert.equal(combined.find((record) => record.id === "shared-reading").question, "V3 自由问题");
assert.equal(combined.find((record) => record.id === "shared-reading").structured.schemaVersion, "3.0.0");
assert.equal(combined.find((record) => record.id === "migrated-v2").structured.schemaVersion, "2.0.0");
assert.equal(combined.find((record) => record.id === "local-v1").structured, undefined);

const celticV1 = getSpreadDefinition("celtic", "1.0.0");
const celticV2 = getSpreadDefinition("celtic", "2.0.0");
assert.equal(celticV1.positions[6].id, "advice");
assert.equal(celticV2.positions[6].id, "self");

services.writeHistory(services.loadHistory().filter((record) => record.id !== "shared-reading"));
await services.deleteStructuredReading("shared-reading");
assert.equal(JSON.parse(localStorage.getItem("astra-tarot-history-v1")).some((record) => record.id === "shared-reading"), false);
assert.equal(await services.structuredHistory.get("shared-reading"), undefined);
assert.equal(services.loadHistory().some((record) => record.id === "shared-reading"), false);

console.log("Reading v1/v2/v3 history merge, v1 Celtic snapshot, structured priority, and dual deletion passed.");
