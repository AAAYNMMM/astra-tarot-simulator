export const OFFLINE_STATE_NAMES = Object.freeze([
  "APP-SHELL-READY",
  "DEFAULT-DECK-READY",
  "SELECTED-DECKS-READY",
]);

function unsupportedStatus() {
  return Object.freeze({
    supported: false,
    releaseId: null,
    activeReleaseId: null,
    previousReleaseId: null,
    states: Object.freeze({
      "APP-SHELL-READY": false,
      "DEFAULT-DECK-READY": false,
      "SELECTED-DECKS-READY": Object.freeze([]),
    }),
  });
}

export function createOfflineStatusClient({
  navigatorRef = globalThis.navigator,
  windowRef = globalThis.window,
  documentRef = windowRef?.document ?? globalThis.document,
  MessageChannelCtor = windowRef?.MessageChannel ?? globalThis.MessageChannel,
  timeoutMs = 3000,
} = {}) {
  let current = unsupportedStatus();

  function applyStatus(payload) {
    if (!payload?.states) return current;
    current = Object.freeze({ supported: true, ...payload });
    const root = documentRef?.documentElement;
    if (root) {
      root.dataset.appShellReady = String(Boolean(payload.states["APP-SHELL-READY"]));
      root.dataset.defaultDeckReady = String(Boolean(payload.states["DEFAULT-DECK-READY"]));
      root.dataset.selectedDecksReady = (payload.states["SELECTED-DECKS-READY"] || []).join(",");
      root.dataset.releaseId = String(payload.activeReleaseId || payload.releaseId || "");
    }
    windowRef?.dispatchEvent?.(new CustomEvent("astra:offline-status", { detail: current }));
    return current;
  }

  async function controller() {
    if (!navigatorRef?.serviceWorker) return null;
    if (navigatorRef.serviceWorker.controller) return navigatorRef.serviceWorker.controller;
    try {
      const registration = await navigatorRef.serviceWorker.ready;
      return registration?.active || null;
    } catch {
      return null;
    }
  }

  async function request(message, onProgress = () => {}) {
    const target = await controller();
    if (!target || typeof MessageChannelCtor !== "function") return null;
    return new Promise((resolve) => {
      const channel = new MessageChannelCtor();
      let settled = false;
      const timer = windowRef?.setTimeout?.(() => { settled = true; resolve(null); }, timeoutMs);
      channel.port1.onmessage = (event) => {
        const payload = event.data ?? null;
        if (payload?.type === "ASTRA_DECK_PROGRESS") { onProgress(payload); return; }
        if (settled) return;
        settled = true;
        if (timer) windowRef.clearTimeout(timer);
        resolve(payload);
      };
      target.postMessage(message, [channel.port2]);
    });
  }

  async function refresh() {
    const payload = await request({ type: "ASTRA_OFFLINE_STATUS" });
    return payload ? applyStatus(payload) : current;
  }

  async function cacheDeck(deckId, { onProgress = () => {} } = {}) {
    const result = await request({ type: "ASTRA_CACHE_DECK", deckId }, onProgress);
    if (result?.status) applyStatus(result.status);
    return Object.freeze({ ready: Boolean(result?.ready), reason: result?.reason || null });
  }

  async function deleteDeck(deckId) {
    const result = await request({ type: "ASTRA_DELETE_DECK", deckId });
    if (result?.status) applyStatus(result.status);
    return Boolean(result?.deleted);
  }

  async function estimateStorage() {
    try {
      const estimate = await navigatorRef?.storage?.estimate?.();
      return Object.freeze({ usage: Number(estimate?.usage || 0), quota: Number(estimate?.quota || 0) });
    } catch {
      return Object.freeze({ usage: 0, quota: 0 });
    }
  }

  function start({ selectedDeckId = null } = {}) {
    navigatorRef?.serviceWorker?.addEventListener?.("controllerchange", refresh);
    void refresh();
    if (selectedDeckId) void cacheDeck(selectedDeckId);
    return current;
  }

  return Object.freeze({
    start,
    refresh,
    cacheDeck,
    deleteDeck,
    estimateStorage,
    getStatus: () => current,
  });
}
