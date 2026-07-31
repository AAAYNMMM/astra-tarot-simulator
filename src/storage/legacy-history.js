import { HISTORY_KEY, HISTORY_LIMIT } from "../config/legacy-storage.js";

export function createLegacyHistoryStore(storage, { limit = HISTORY_LIMIT } = {}) {
  function load() {
    try {
      const parsed = JSON.parse(storage?.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function write(records) {
    try {
      storage?.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, limit)));
      return Boolean(storage);
    } catch {
      return false;
    }
  }

  return Object.freeze({ load, write, limit });
}
