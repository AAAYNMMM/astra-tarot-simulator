import { createPlatformClientId } from "./entropy.js";

const LOCAL_HOSTS = Object.freeze(new Set(["127.0.0.1", "localhost", "::1"]));

export function createLifecycleClient({
  windowRef = globalThis.window,
  navigatorRef = windowRef?.navigator ?? globalThis.navigator,
  locationRef = windowRef?.location ?? globalThis.location,
  cryptoRef = windowRef?.crypto ?? globalThis.crypto,
  fetchFn = windowRef?.fetch?.bind(windowRef) ?? globalThis.fetch?.bind(globalThis),
  EventSourceCtor = windowRef?.EventSource ?? globalThis.EventSource,
} = {}) {
  const clientId = createPlatformClientId(cryptoRef);
  let lifecycleStream = null;
  let registered = false;

  function endpoint(action) {
    if (!clientId) return null;
    if (locationRef?.protocol !== "http:" || !LOCAL_HOSTS.has(locationRef?.hostname)) return null;
    return `/__astra/${action}?client=${encodeURIComponent(clientId)}`;
  }

  function notify(action) {
    const target = endpoint(action);
    if (!target) return false;
    if (action === "close" && typeof navigatorRef?.sendBeacon === "function") {
      const queued = navigatorRef.sendBeacon(target);
      if (queued) return true;
    }
    if (typeof fetchFn !== "function") return false;
    void fetchFn(target, {
      method: "POST",
      cache: "no-store",
      keepalive: true,
    }).catch(() => {
      // Lifecycle signaling only exists when launched through run.py.
    });
    return true;
  }

  function register() {
    if (registered) return true;
    if (!endpoint("open")) return false;
    registered = true;
    notify("open");
    if (typeof EventSourceCtor === "function") {
      lifecycleStream = new EventSourceCtor(
        `/__astra/events?client=${encodeURIComponent(clientId)}`,
      );
    }
    windowRef?.addEventListener?.("pageshow", () => notify("open"));
    windowRef?.addEventListener?.("focus", () => notify("open"));
    windowRef?.setInterval?.(() => notify("open"), 10000);
    const notifyClose = () => {
      lifecycleStream?.close?.();
      notify("close");
    };
    windowRef?.addEventListener?.("beforeunload", notifyClose);
    windowRef?.addEventListener?.("pagehide", notifyClose);
    return true;
  }

  return Object.freeze({ clientId, endpoint, notify, register });
}
