import { createPlatformStatusController } from "../ui/components/platform-status.js";

export function createPlatformRuntime({
  windowRef,
  dom,
  offlineStatus,
  registerServiceWorker,
  state,
  currentDeckStyle,
  showToast,
}) {
  const controller = createPlatformStatusController({
    windowRef,
    dom,
    offlineStatus,
    getSelectedDeckId: currentDeckStyle,
    showToast,
  });

  function clientState() {
    if (state.completing) return "pending-save";
    if (state.phase === "setup" || state.phase === "complete") return "idle";
    return "reading";
  }

  async function start(selectedDeckId) {
    const result = await registerServiceWorker({
      getClientState: clientState,
      getCurrentReleaseId: () => offlineStatus.getStatus().activeReleaseId,
      onUpdateAvailable: controller.updateAvailable,
      onActivated: controller.activated,
    });
    offlineStatus.start({ selectedDeckId });
    controller.bind(result.coordinator);
    return result;
  }

  return Object.freeze({
    start,
    render: controller.render,
  });
}
