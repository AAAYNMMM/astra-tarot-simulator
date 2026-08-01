import { createHistoryRepository } from "../src/storage/history-repository.js";
import { unavailableArtifactFingerprint } from "../src/storage/artifact-fingerprint.js";
import { LEGACY_READING_RECORD_SCHEMA_VERSION } from "../src/storage/reading-record.js";

export function sampleRecord(id = "reading-1", createdAt = "2026-08-01T00:00:00.000Z") {
  return {
    schemaVersion: LEGACY_READING_RECORD_SCHEMA_VERSION,
    id,
    createdAt,
    savedAt: createdAt,
    question: { id: "daily-focus", text: "今天应关注什么？", domain: "daily", intent: "focus" },
    spread: { id: "single", name: "心语单张" },
    deck: { id: "rws" },
    random: {
      schemaVersion: "1.0.0",
      algorithm: "fnv1a-mulberry32",
      version: "astra-prng-v1",
      rootSeed: `seed-${id}`,
      entropySource: "replay",
      streams: {},
    },
    draw: [{
      index: 0,
      cardId: "major-0",
      cardName: "愚者",
      positionId: "essence",
      positionName: "核心讯息",
      orientation: "upright",
      reversalMode: null,
    }],
    evidence: { status: "available", observations: [], relations: [], claims: [], rendered: null },
    legacySynthesis: null,
    artifactFingerprint: unavailableArtifactFingerprint("test"),
    source: "test",
    migration: null,
  };
}

export function createMemoryStore({ failPut = null, failOpen = false } = {}) {
  const records = new Map();
  const meta = new Map();
  return {
    records,
    meta,
    async open() {
      if (failOpen) throw new Error("open failed");
      return true;
    },
    async put(record) {
      if (failPut) throw failPut;
      records.set(record.id, structuredClone(record));
      return record.id;
    },
    async get(id) { return records.get(id) || null; },
    async delete(id) { records.delete(id); },
    async count() { return records.size; },
    async listAll() { return [...records.values()]; },
    async getMeta(key) { return meta.get(key) || null; },
    async setMeta(key, value) { meta.set(key, structuredClone(value)); },
  };
}

export async function createMemoryRepository(options = {}) {
  const store = createMemoryStore(options);
  const repository = createHistoryRepository({ store, estimateStorage: options.estimateStorage });
  await repository.initialize();
  return { store, repository };
}


function fakeRequest(executor, transaction = null) {
  const request = { result: undefined, error: null, onsuccess: null, onerror: null };
  queueMicrotask(() => {
    try {
      request.result = executor();
      request.onsuccess?.();
      if (transaction) setTimeout(() => transaction.oncomplete?.(), 0);
    } catch (error) {
      request.error = error;
      request.onerror?.();
      if (transaction) setTimeout(() => transaction.onerror?.(), 0);
    }
  });
  return request;
}

export function createFakeIndexedDB() {
  const databases = new Map();
  return {
    open(name, version) {
      const request = { result: null, error: null, onupgradeneeded: null, onsuccess: null, onerror: null, onblocked: null };
      queueMicrotask(() => {
        let database = databases.get(name);
        const upgrade = !database;
        if (!database) {
          const stores = new Map();
          database = {
            version,
            objectStoreNames: { contains: (storeName) => stores.has(storeName) },
            createObjectStore(storeName) {
              const values = new Map();
              const store = {
                values,
                createIndex() {},
                put(value) { values.set(value.id ?? value.key, structuredClone(value)); return value.id ?? value.key; },
                get(key) { return structuredClone(values.get(key)); },
                delete(key) { values.delete(key); },
                count() { return values.size; },
                getAll() { return [...values.values()].map((value) => structuredClone(value)); },
              };
              stores.set(storeName, store);
              return store;
            },
            transaction(storeName) {
              const transaction = { oncomplete: null, onerror: null, onabort: null, error: null };
              transaction.objectStore = () => {
                const raw = stores.get(storeName);
                return {
                  put: (value) => fakeRequest(() => raw.put(value), transaction),
                  get: (key) => fakeRequest(() => raw.get(key), transaction),
                  delete: (key) => fakeRequest(() => raw.delete(key), transaction),
                  count: () => fakeRequest(() => raw.count(), transaction),
                  getAll: () => fakeRequest(() => raw.getAll(), transaction),
                };
              };
              return transaction;
            },
            close() {},
          };
          databases.set(name, database);
        }
        request.result = database;
        if (upgrade) request.onupgradeneeded?.();
        request.onsuccess?.();
      });
      return request;
    },
  };
}
