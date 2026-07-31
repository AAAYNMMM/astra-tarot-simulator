export const HISTORY_DB_NAME = "astra-tarot-history-v2";
export const HISTORY_DB_VERSION = 1;
export const READING_STORE = "readings";
export const META_STORE = "meta";

function requestResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("IndexedDB request failed."));
  });
}

function transactionDone(transaction) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed."));
    transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted."));
  });
}

function upgradeDatabase(database) {
  if (!database.objectStoreNames.contains(READING_STORE)) {
    const readings = database.createObjectStore(READING_STORE, { keyPath: "id" });
    readings.createIndex("createdAt", "createdAt", { unique: false });
    readings.createIndex("questionId", "question.id", { unique: false });
  }
  if (!database.objectStoreNames.contains(META_STORE)) {
    database.createObjectStore(META_STORE, { keyPath: "key" });
  }
}

export function createIndexedDbHistoryStore({
  indexedDBRef = globalThis.indexedDB,
  dbName = HISTORY_DB_NAME,
  version = HISTORY_DB_VERSION,
} = {}) {
  let databasePromise = null;

  async function open() {
    if (databasePromise) return databasePromise;
    if (!indexedDBRef || typeof indexedDBRef.open !== "function") throw new Error("IndexedDB is unavailable.");
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDBRef.open(dbName, version);
      request.onupgradeneeded = () => upgradeDatabase(request.result);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Unable to open IndexedDB."));
      request.onblocked = () => reject(new Error("IndexedDB upgrade is blocked."));
    });
    try {
      return await databasePromise;
    } catch (error) {
      databasePromise = null;
      throw error;
    }
  }

  async function withStore(storeName, mode, operation) {
    const database = await open();
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    const resultPromise = operation(store);
    const result = await resultPromise;
    await transactionDone(transaction);
    return result;
  }

  return Object.freeze({
    open,
    async put(record) {
      return withStore(READING_STORE, "readwrite", (store) => requestResult(store.put(record)));
    },
    async get(id) {
      return withStore(READING_STORE, "readonly", (store) => requestResult(store.get(id)));
    },
    async delete(id) {
      return withStore(READING_STORE, "readwrite", (store) => requestResult(store.delete(id)));
    },
    async count() {
      return withStore(READING_STORE, "readonly", (store) => requestResult(store.count()));
    },
    async listAll() {
      const records = await withStore(READING_STORE, "readonly", (store) => requestResult(store.getAll()));
      return records.sort((left, right) =>
        String(right.createdAt || "").localeCompare(String(left.createdAt || "")) || String(left.id).localeCompare(String(right.id)));
    },
    async getMeta(key) {
      const entry = await withStore(META_STORE, "readonly", (store) => requestResult(store.get(key)));
      return entry?.value ?? null;
    },
    async setMeta(key, value) {
      return withStore(META_STORE, "readwrite", (store) => requestResult(store.put({ key, value })));
    },
    async close() {
      const database = await open();
      database.close();
      databasePromise = null;
    },
  });
}
