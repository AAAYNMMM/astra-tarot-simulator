import assert from "node:assert/strict";
import { createReadingRecord, validateReadingRecord } from "../src/storage/reading-record.js";
import { createIndexedDbHistoryStore } from "../src/storage/indexeddb-history.js";
import { createHistoryRepository } from "../src/storage/history-repository.js";
import { createFakeIndexedDB, createMemoryRepository } from "./phase_7_test_support.mjs";

const reading = {
  id: "reading-structured",
  createdAt: "2026-08-01T00:00:00.000Z",
  question: { id: "career-change", text: "现在适合转换方向吗？", domain: "career", intent: "change-decision" },
  category: { id: "career" },
  spread: { id: "cross", name: "五牌十字" },
  deckStyle: "rws",
  randomAudit: {
    schemaVersion: "1.0.0",
    algorithm: "fnv1a-mulberry32",
    version: "astra-prng-v1",
    rootSeed: "seed-structured",
    entropySource: "replay",
    streams: {},
  },
  draws: [{
    index: 0,
    card: { id: "major-0", name: "愚者" },
    position: { id: "core", name: "核心" },
    reversed: false,
  }],
  synthesis: { headline: "旧版摘要" },
};
const fingerprint = {
  schemaVersion: "1.0.0",
  status: "available",
  appVersion: "2.0.0-dev",
  generatorVersion: "1.0.0",
  sourceSetHash: "a",
  engineManifestHash: "b",
  knowledgeManifestHash: "c",
};
const engineResult = {
  observations: [{ id: "obs-1" }],
  relations: [{ id: "rel-1" }],
  claims: [{ id: "claim-1" }],
  rendered: { text: "结构化文本" },
};
const record = createReadingRecord({ reading, artifactFingerprint: fingerprint, engineResult });
assert.deepEqual(validateReadingRecord(record), []);
assert.equal(record.evidence.status, "available");
assert.equal(record.evidence.claims[0].id, "claim-1");
assert.equal("commit" in record.artifactFingerprint, false);
const { repository } = await createMemoryRepository();
assert.equal((await repository.save(record)).status, "saved");
assert.equal((await repository.get(record.id)).random.rootSeed, "seed-structured");
assert.equal((await repository.list()).length, 1);
const indexedStore = createIndexedDbHistoryStore({ indexedDBRef: createFakeIndexedDB(), dbName: "phase7-test" });
const indexedRepository = createHistoryRepository({ store: indexedStore });
assert.equal((await indexedRepository.initialize()).mode, "indexeddb");
assert.equal((await indexedRepository.save({ ...record, id: "reading-indexed" })).status, "saved");
assert.equal((await indexedRepository.get("reading-indexed")).question.id, "career-change");
assert.equal((await indexedRepository.list()).length, 1);
await indexedStore.setMeta("test-marker", { ok: true });
assert.deepEqual(await indexedStore.getMeta("test-marker"), { ok: true });
console.log("AU-002 ReadingRecord and IndexedDB repository contract passed.");
