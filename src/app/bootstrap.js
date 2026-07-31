import { startApplication } from "./application.js";

export async function bootstrapBrowser(globalScope = globalThis) {
  const documentRef = globalScope.document;
  const windowRef = globalScope.window;
  if (!documentRef || !windowRef) {
    return Object.freeze({ started: false, reason: "browser-globals-unavailable" });
  }
  return startApplication({ documentRef, windowRef });
}

function reportBootFailure(error) {
  console.error("星纱塔罗启动失败", error);
  document.documentElement.dataset.astraBoot = "failed";
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  void bootstrapBrowser().catch(reportBootFailure);
}
