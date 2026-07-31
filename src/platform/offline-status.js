export const OFFLINE_STATE_NAMES = Object.freeze([
  "APP-SHELL-READY",
  "DEFAULT-DECK-READY",
  "SELECTED-DECKS-READY",
]);

function unsupportedStatus() {
  return Object.freeze({
    supported: false,
    releaseId: null,
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
  timeoutMs = 1500,
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

  async function request(message) {
    const target = await controller();
    if (!target || typeof MessageChannelCtor !== "function") return null;
    return new Promise((resolve) => {
      const channel = new MessageChannelCtor();
      const timer = windowRef?.setTimeout?.(() => resolve(null), timeoutMs);
      channel.port1.onmessage = (event) => {
        if (timer) windowRef.clearTimeout(timer);
        resolve(event.data ?? null);
      };
      target.postMessage(message, [channel.port2]);
    });
  }

  async function refresh() {
    const payload = await request({ type: "ASTRA_OFFLINE_STATUS" });
    return payload ? applyStatus(payload) : current;
  }

  async function cacheDeck(deckId) {
    const result = await request({ type: "ASTRA_CACHE_DECK", deckId });
    if (result?.status) applyStatus(result.status);
    return Boolean(result?.ready);
  }

  function start({ selectedDeckId = "rws" } = {}) {
    navigatorRef?.serviceWorker?.addEventListener?.("controllerchange", refresh);
    void refresh();
    if (selectedDeckId) void cacheDeck(selectedDeckId);
    return current;
  }

  return Object.freeze({ start, refresh, cacheDeck, getStatus: () => current });
}
