import { APP_VERSION } from "../../config/version.js";

export function createRecoveryActions({
  windowRef,
  documentRef,
  diagnosticLog,
  retry,
  showToast,
} = {}) {
  async function handle(action) {
    if (action === "retry") {
      await retry();
      return;
    }
    if (action === "export-diagnostics") {
      try {
        const content = diagnosticLog.exportReport({ appVersion: APP_VERSION });
        const blob = new windowRef.Blob([content], { type: "application/json" });
        const url = windowRef.URL.createObjectURL(blob);
        const anchor = documentRef.createElement("a");
        anchor.href = url;
        anchor.download = "astra-diagnostics.json";
        anchor.click();
        windowRef.setTimeout(() => windowRef.URL.revokeObjectURL(url), 0);
        showToast("诊断文件已导出，未包含问题或解读正文", "◇");
      } catch {
        showToast("诊断文件暂时无法导出", "!");
      }
      return;
    }
    showToast("该恢复动作将在对应管理界面中提供", "◇");
  }
  return Object.freeze({ handle });
}
