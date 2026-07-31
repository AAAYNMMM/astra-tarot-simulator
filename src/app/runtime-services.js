import { createBusinessRandom } from "../core/random/business-random.js";
import { createLifecycleClient } from "../platform/lifecycle-client.js";
import { createOfflineStatusClient } from "../platform/offline-status.js";
import { registerServiceWorker as registerPwaServiceWorker } from "../platform/pwa-client.js";
import { createLegacyHistoryStore } from "../storage/legacy-history.js";
import { createLegacyReadingRecord } from "../storage/legacy-record.js";
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
  const lifecycle = createLifecycleClient({ windowRef });
  const offlineStatus = createOfflineStatusClient({ windowRef });

  return Object.freeze({
    randomUnit: businessRandom.randomUnit,
    secureShuffle: businessRandom.secureShuffle,
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
  });
}
