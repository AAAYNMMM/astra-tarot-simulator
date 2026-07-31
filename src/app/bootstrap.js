import { startLegacyRuntime } from "./legacy-runtime.js";

export async function bootstrapBrowser(globalScope = globalThis) {
  const documentRef = globalScope.document;
  const windowRef = globalScope.window;
  if (!documentRef || !windowRef) {
    return Object.freeze({ started: false, reason: "browser-globals-unavailable" });
  }
  await startLegacyRuntime({ documentRef, windowRef });
  return Object.freeze({ started: true });
}

function reportBootFailure(error) {
  console.error("星纱塔罗启动失败", error);
  document.documentElement.dataset.astraBoot = "failed";
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  void bootstrapBrowser().catch(reportBootFailure);
}
