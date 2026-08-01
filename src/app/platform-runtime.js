export function createPlatformRuntime({
  windowRef,
  offlineStatus,
  registerServiceWorker,
  state,
} = {}) {
  let coordinator = null;
  let updatePending = false;

  function clientState() {
    if (state.completing) return "pending-save";
    if (state.phase === "setup" || state.phase === "complete") return "idle";
    return "reading";
  }

  async function activateWhenIdle() {
    coordinator?.reportState?.();
    if (!updatePending || !coordinator || clientState() !== "idle") return false;
    const decision = await coordinator.requestActivation({ force: false });
    if (decision?.activated) updatePending = false;
    return Boolean(decision?.activated);
  }

  async function start(selectedDeckId) {
    const result = await registerServiceWorker({
      getClientState: clientState,
      getCurrentReleaseId: () => offlineStatus.getStatus().activeReleaseId,
      onUpdateAvailable() {
        updatePending = true;
        void activateWhenIdle();
      },
      onActivated() {
        windowRef?.location?.reload?.();
      },
    });
    coordinator = result.coordinator;
    offlineStatus.start({ selectedDeckId });
    void activateWhenIdle();
    return result;
  }

  function render() {
    void activateWhenIdle();
  }

  return Object.freeze({ start, render });
}
