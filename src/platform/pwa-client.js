export function registerServiceWorker({
  navigatorRef = globalThis.navigator,
  locationRef = globalThis.location,
  scriptUrl = "./sw.js",
} = {}) {
  if (!navigatorRef?.serviceWorker || !String(locationRef?.protocol || "").startsWith("http")) {
    return Promise.resolve(Object.freeze({ registered: false, reason: "unsupported" }));
  }
  return navigatorRef.serviceWorker.register(scriptUrl).then(
    (registration) => Object.freeze({ registered: true, registration }),
    () => Object.freeze({ registered: false, reason: "registration-failed" }),
  );
}
