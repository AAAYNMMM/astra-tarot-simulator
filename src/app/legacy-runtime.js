export const LEGACY_GLOBAL_NAME = "TarotData";
export const LEGACY_SCRIPT_PATHS = Object.freeze(["../../data.js", "../../app.js"]);

let runtimePromise = null;

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

async function loadLegacyRuntime({ documentRef, windowRef, baseUrl }) {
  if (!documentRef?.head || !windowRef) {
    throw new Error("Legacy runtime requires a browser document and window.");
  }

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
