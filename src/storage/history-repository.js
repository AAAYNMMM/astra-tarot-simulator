import { evaluateCapacity, isQuotaExceededError } from "./capacity-policy.js";
import { validateReadingRecord } from "./reading-record.js";

function sortRecords(records) {
  return records.sort((left, right) =>
    String(right.createdAt || "").localeCompare(String(left.createdAt || "")) || String(left.id).localeCompare(String(right.id)));
}

export function createHistoryRepository({
  store,
  estimateStorage = null,
  capacityPolicy,
} = {}) {
  if (!store) throw new TypeError("A history store is required.");
  const pending = new Map();
  const memoryMeta = new Map();
  let mode = "uninitialized";

  async function initialize() {
    try {
      await store.open();
      mode = "indexeddb";
    } catch {
      mode = "memory";
    }
    return Object.freeze({ mode });
  }

  async function capacity() {
    let count = pending.size;
    if (mode === "indexeddb") {
      try {
        count += await store.count();
      } catch {
        mode = "memory";
      }
    }
    let estimate = null;
    if (typeof estimateStorage === "function") {
      try {
        estimate = await estimateStorage();
      } catch {
        estimate = null;
      }
    }
    return evaluateCapacity({ count, estimate, policy: capacityPolicy });
  }

  async function save(record) {
    const errors = validateReadingRecord(record);
    if (errors.length) return Object.freeze({ status: "rejected", reason: errors.join("; ") });
    if (mode === "uninitialized") await initialize();
    if (mode === "indexeddb") {
      try {
        await store.put(record);
        pending.delete(record.id);
        const state = await capacity();
        return Object.freeze({
          status: state.level === "normal" ? "saved" : "saved-with-warning",
          capacity: state,
        });
      } catch (error) {
        pending.set(record.id, record);
        mode = "degraded";
        return Object.freeze({
          status: "degraded",
          reason: isQuotaExceededError(error) ? "quota-exceeded" : "indexeddb-write-failed",
          retainedInMemory: true,
          actions: Object.freeze(["export-history", "free-browser-storage"]),
        });
      }
    }
    pending.set(record.id, record);
    return Object.freeze({
      status: "degraded",
      reason: "indexeddb-unavailable",
      retainedInMemory: true,
      actions: Object.freeze(["export-history"]),
    });
  }

  async function list() {
    let stored = [];
    if (mode === "indexeddb") {
      try {
        stored = await store.listAll();
      } catch {
        mode = "degraded";
      }
    }
    const merged = new Map(stored.map((record) => [record.id, record]));
    for (const record of pending.values()) merged.set(record.id, record);
    return sortRecords([...merged.values()]);
  }

  async function get(id) {
    if (pending.has(id)) return pending.get(id);
    if (mode === "uninitialized") await initialize();
    if (mode === "indexeddb") {
      try {
        return await store.get(id);
      } catch {
        mode = "degraded";
      }
    }
    return null;
  }

  async function remove(id) {
    pending.delete(id);
    if (mode === "indexeddb") await store.delete(id);
  }

  async function getMeta(key) {
    if (memoryMeta.has(key)) return memoryMeta.get(key);
    if (mode === "uninitialized") await initialize();
    if (mode === "indexeddb") {
      try {
        return await store.getMeta(key);
      } catch {
        mode = "degraded";
      }
    }
    return null;
  }

  async function setMeta(key, value) {
    memoryMeta.set(key, value);
    if (mode === "uninitialized") await initialize();
    if (mode === "indexeddb") await store.setMeta(key, value);
  }

  async function drainPending() {
    if (mode !== "indexeddb") return Object.freeze({ status: "not-ready", persisted: 0 });
    let persisted = 0;
    for (const record of [...pending.values()]) {
      await store.put(record);
      pending.delete(record.id);
      persisted += 1;
    }
    return Object.freeze({ status: "completed", persisted });
  }

  return Object.freeze({
    initialize,
    save,
    list,
    get,
    remove,
    getMeta,
    setMeta,
    capacity,
    drainPending,
    get mode() { return mode; },
    get pendingCount() { return pending.size; },
  });
}
