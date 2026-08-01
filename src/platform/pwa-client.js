import { createPwaUpdateCoordinator } from "./pwa-update-coordinator.js";

export async function registerServiceWorker({
  navigatorRef = globalThis.navigator,
  locationRef = globalThis.location,
  windowRef = globalThis.window,
  scriptUrl = "./sw.js",
  getClientState = () => "unknown",
  getCurrentReleaseId = () => null,
  onUpdateAvailable = () => {},
  onActivated = () => {},
} = {}) {
  if (!navigatorRef?.serviceWorker || !String(locationRef?.protocol || "").startsWith("http")) {
    return Object.freeze({ registered: false, reason: "unsupported", coordinator: null });
  }
  try {
    const registration = await navigatorRef.serviceWorker.register(scriptUrl, { updateViaCache: "none" });
    const coordinator = windowRef
      ? createPwaUpdateCoordinator({
          navigatorRef,
          windowRef,
          getClientState,
          getCurrentReleaseId,
          onUpdateAvailable,
          onActivated,
        })
      : null;
    coordinator?.observeRegistration(registration);
    coordinator?.reportState();
    return Object.freeze({ registered: true, registration, coordinator });
  } catch {
    return Object.freeze({ registered: false, reason: "registration-failed", coordinator: null });
  }
}
