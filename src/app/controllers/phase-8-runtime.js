import { createRecoveryActions } from "../recovery/recovery-actions.js";
import { createRecoveryCoordinator } from "../recovery/recovery-coordinator.js";
import { createDiagnosticLog } from "../../platform/diagnostics.js";
import { createStructuredHistorySummary } from "../../storage/history-summary.js";
import { installAccessibility } from "../../ui/accessibility/controller.js";
import { renderRecoveryPanel } from "../../ui/components/recovery-panel.js";

export function createPhase8Runtime({
  windowRef,
  documentRef,
  dom,
  showToast,
  retry,
  saveStructuredReading,
  synthesizeReading,
} = {}) {
  if (!windowRef || !documentRef || !dom) throw new TypeError("Phase 8 runtime requires browser bindings.");
  if (typeof synthesizeReading !== "function") throw new TypeError("Worker-backed reading synthesis is required.");
  const diagnostics = createDiagnosticLog();
  let actions;
  const recovery = createRecoveryCoordinator({
    diagnosticLog: diagnostics,
    onError(error) {
      renderRecoveryPanel({
        documentRef,
        container: dom.insightContent,
        error,
        onAction: (action) => void actions.handle(action),
      });
    },
  });
  actions = createRecoveryActions({
    windowRef,
    documentRef,
    diagnosticLog: diagnostics,
    retry,
    showToast,
  });
  installAccessibility({ dom });

  async function synthesize(reading) {
    const result = await recovery.execute(
      "engine",
      () => synthesizeReading(reading),
      { spreadId: reading?.spread?.id, stage: "complete-reading" },
    );
    if (result.status !== "completed") return null;
    Object.defineProperty(reading, "engineResult", {
      value: result.value.engineResult,
      enumerable: false,
      configurable: true,
    });
    return result.value.synthesis;
  }

  function enrichLegacyRecord(record, reading) {
    const structured = createStructuredHistorySummary(reading?.engineResult);
    if (structured) record.structured = structured;
    return record;
  }

  async function saveStructured(reading) {
    const result = await saveStructuredReading(reading, reading?.engineResult || null);
    if (result.status === "degraded") showToast("结构化历史暂存于内存，请及时导出", "!");
    return result;
  }

  return Object.freeze({ synthesize, enrichLegacyRecord, saveStructured, diagnostics });
}
