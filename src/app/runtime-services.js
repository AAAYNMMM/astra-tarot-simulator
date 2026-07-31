import { createBusinessRandom } from "../core/random/business-random.js";
import { createReadingRandomContextFactory } from "../core/random/production-random.js";
import { createLifecycleClient } from "../platform/lifecycle-client.js";
import { createOfflineStatusClient } from "../platform/offline-status.js";
import { registerServiceWorker as registerPwaServiceWorker } from "../platform/pwa-client.js";
import { createArtifactFingerprintLoader } from "../storage/artifact-fingerprint.js";
import { createHistoryRepository } from "../storage/history-repository.js";
import { createHistoryExport, importHistoryExport } from "../storage/history-transfer.js";
import { createIndexedDbHistoryStore } from "../storage/indexeddb-history.js";
import { createLegacyHistoryStore } from "../storage/legacy-history.js";
import { migrateLegacyHistory } from "../storage/legacy-migration.js";
import { createLegacyReadingRecord } from "../storage/legacy-record.js";
import { createReadingRecord } from "../storage/reading-record.js";
import { createSettingsStore } from "../storage/settings.js";

function safeLocalStorage(windowRef) {
  try {
    return windowRef?.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createRuntimeServices(windowRef = globalThis.window) {
  if (!windowRef) throw new Error("Runtime services require a browser window.");
  const storageRef = safeLocalStorage(windowRef);
  const settings = createSettingsStore(storageRef);
  const history = createLegacyHistoryStore(storageRef);
  const businessRandom = createBusinessRandom({
    cryptoRef: windowRef.crypto,
    fallbackRandom: windowRef.Math?.random?.bind(windowRef.Math) ?? Math.random,
  });
  const createReadingRandomContext = createReadingRandomContextFactory({
    cryptoRef: windowRef.crypto,
    fallbackRandom: windowRef.Math?.random?.bind(windowRef.Math) ?? Math.random,
  });
  const structuredStore = createIndexedDbHistoryStore({ indexedDBRef: windowRef.indexedDB });
  const structuredHistory = createHistoryRepository({
    store: structuredStore,
    estimateStorage: windowRef.navigator?.storage?.estimate?.bind(windowRef.navigator.storage) || null,
  });
  const loadArtifactFingerprint = createArtifactFingerprintLoader({
    fetchRef: windowRef.fetch?.bind(windowRef),
  });
  const lifecycle = createLifecycleClient({ windowRef });
  const offlineStatus = createOfflineStatusClient({ windowRef });

  async function initializeStructuredHistory() {
    const initialized = await structuredHistory.initialize();
    if (initialized.mode !== "indexeddb") return initialized;
    try {
      const migration = await migrateLegacyHistory({
        legacyRecords: history.load(),
        repository: structuredHistory,
      });
      return Object.freeze({ ...initialized, migration });
    } catch (error) {
      return Object.freeze({ ...initialized, migration: { status: "failed", reason: error.message } });
    }
  }

  async function saveStructuredReading(reading, engineResult = null) {
    const artifactFingerprint = await loadArtifactFingerprint();
    const record = createReadingRecord({ reading, artifactFingerprint, engineResult });
    return structuredHistory.save(record);
  }

  async function exportStructuredHistory(options) {
    return createHistoryExport(await structuredHistory.list(), options);
  }

  async function importStructuredHistory(bundle, options = {}) {
    return importHistoryExport({ bundle, repository: structuredHistory, ...options });
  }

  return Object.freeze({
    randomUnit: businessRandom.randomUnit,
    secureShuffle: businessRandom.secureShuffle,
    createReadingRandomContext,
    registerServiceWorker: () =>
      registerPwaServiceWorker({
        navigatorRef: windowRef.navigator,
        locationRef: windowRef.location,
      }),
    registerLocalLifecycle: lifecycle.register,
    offlineStatus,
    loadSettings: settings.load,
    saveSettings: settings.save,
    loadHistory: history.load,
    writeHistory: history.write,
    readingRecord: createLegacyReadingRecord,
    initializeStructuredHistory,
    saveStructuredReading,
    exportStructuredHistory,
    importStructuredHistory,
    structuredHistory,
  });
}
