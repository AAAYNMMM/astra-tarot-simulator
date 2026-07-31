import { createEventBinder } from "./events.js";
import { createReadingFactory } from "./controllers/reading-controller.js";
import { createSelectionSelectors } from "./selectors/current-selection.js";
import { createReadingState, resetReadingState } from "./state/reading-state.js";
import { createReadingAnimation } from "../ui/animations/reading.js";
import { createToast } from "../ui/components/toast.js";
import { bindDom } from "../ui/dom.js";
import { createHistoryRenderer } from "../ui/renderers/history.js";
import { createSetupRenderer } from "../ui/renderers/setup.js";
import { DECK_STYLES, LEGACY_DECK_IDS, resolveDeckStyle } from "../config/decks.js";
import { escapeHtml } from "../core/html.js";
import { createBusinessRandom } from "../core/random/business-random.js";
import { cardBackPath, cardImagePath } from "../platform/assets.js";
import { createLifecycleClient } from "../platform/lifecycle-client.js";
import { registerServiceWorker as registerPwaServiceWorker } from "../platform/pwa-client.js";
import { createLegacyHistoryStore } from "../storage/legacy-history.js";
import { createLegacyReadingRecord } from "../storage/legacy-record.js";
import { createSettingsStore } from "../storage/settings.js";

export const LEGACY_GLOBAL_NAME = "TarotData";
export const LEGACY_RUNTIME_GLOBAL_NAME = "AstraRuntime";
export const LEGACY_SCRIPT_PATHS = Object.freeze(["../../data.js", "../../app.js"]);

let runtimePromise = null;

function safeLocalStorage(windowRef) {
  try {
    return windowRef?.localStorage ?? null;
  } catch {
    return null;
  }
}

function loadClassicScript(documentRef, relativePath, baseUrl) {
  return new Promise((resolve, reject) => {
    const script = documentRef.createElement("script");
    script.src = new URL(relativePath, baseUrl).href;
    script.async = false;
    script.dataset.astraLegacyScript = relativePath;
    script.addEventListener("load", () => resolve(script), { once: true });
    script.addEventListener(
      "error",
      () => {
        script.remove();
        reject(new Error(`Failed to load legacy runtime script: ${relativePath}`));
      },
      { once: true },
    );
    documentRef.head.append(script);
  });
}

export function createLegacyRuntimeBindings(windowRef = globalThis.window) {
  if (!windowRef) throw new Error("Legacy runtime bindings require a browser window.");
  const storageRef = safeLocalStorage(windowRef);
  const settings = createSettingsStore(storageRef);
  const history = createLegacyHistoryStore(storageRef);
  const businessRandom = createBusinessRandom({
    cryptoRef: windowRef.crypto,
    fallbackRandom: windowRef.Math?.random?.bind(windowRef.Math) ?? Math.random,
  });
  const lifecycle = createLifecycleClient({ windowRef });

  return Object.freeze({
    app: Object.freeze({
      createReadingState,
      resetReadingState,
      createSelectionSelectors,
      createReadingFactory,
      createEventBinder,
    }),
    ui: Object.freeze({
      bindDom,
      createSetupRenderer,
      createReadingAnimation,
      createToast,
      createHistoryRenderer,
    }),
    config: Object.freeze({ DECK_STYLES, LEGACY_DECK_IDS }),
    core: Object.freeze({
      escapeHtml,
      randomUnit: businessRandom.randomUnit,
      secureShuffle: businessRandom.secureShuffle,
    }),
    platform: Object.freeze({
      resolveDeckStyle,
      cardImagePath,
      cardBackPath,
      registerServiceWorker: () =>
        registerPwaServiceWorker({
          navigatorRef: windowRef.navigator,
          locationRef: windowRef.location,
        }),
      registerLocalLifecycle: lifecycle.register,
      lifecycleClientId: lifecycle.clientId,
    }),
    storage: Object.freeze({
      loadSettings: settings.load,
      saveSettings: settings.save,
      loadHistory: history.load,
      writeHistory: history.write,
      readingRecord: createLegacyReadingRecord,
    }),
  });
}

async function loadLegacyRuntime({ documentRef, windowRef, baseUrl }) {
  if (!documentRef?.head || !windowRef) {
    throw new Error("Legacy runtime requires a browser document and window.");
  }

  windowRef[LEGACY_RUNTIME_GLOBAL_NAME] = createLegacyRuntimeBindings(windowRef);
  await loadClassicScript(documentRef, LEGACY_SCRIPT_PATHS[0], baseUrl);
  if (!windowRef[LEGACY_GLOBAL_NAME]) {
    throw new Error("data.js did not initialize window.TarotData.");
  }
  await loadClassicScript(documentRef, LEGACY_SCRIPT_PATHS[1], baseUrl);
  return windowRef[LEGACY_GLOBAL_NAME];
}

export function startLegacyRuntime({
  documentRef = globalThis.document,
  windowRef = globalThis.window,
  baseUrl = import.meta.url,
} = {}) {
  if (!runtimePromise) {
    runtimePromise = loadLegacyRuntime({ documentRef, windowRef, baseUrl }).catch((error) => {
      runtimePromise = null;
      throw error;
    });
  }
  return runtimePromise;
}
