import { SETTINGS_KEY } from "../config/legacy-storage.js";

export function createSettingsStore(storage) {
  function load() {
    try {
      return JSON.parse(storage?.getItem(SETTINGS_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function save(patch) {
    try {
      const next = { ...load(), ...patch };
      storage?.setItem(SETTINGS_KEY, JSON.stringify(next));
      return Boolean(storage);
    } catch {
      return false;
    }
  }

  return Object.freeze({ load, save });
}
