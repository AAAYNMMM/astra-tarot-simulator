import { startApplication } from "./application.js";

export async function bootstrapBrowser(globalScope = globalThis) {
  const documentRef = globalScope.document;
  const windowRef = globalScope.window;
  if (!documentRef || !windowRef) {
    return Object.freeze({ started: false, reason: "browser-globals-unavailable" });
  }
  const result = startApplication({ documentRef, windowRef });
  documentRef.documentElement.dataset.astraBoot = result.started ? "ready" : "skipped";
  return result;
}

function reportBootFailure(error) {
  console.error("星纱塔罗启动失败", error);
  document.documentElement.dataset.astraBoot = "failed";
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  void bootstrapBrowser().catch(reportBootFailure);
}
