import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerServiceWorker } from "../src/platform/pwa-client.js";
import { createOfflineStatusClient, OFFLINE_STATE_NAMES } from "../src/platform/offline-status.js";
import { installImageFallbacks } from "../src/ui/image-fallback.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sw = fs.readFileSync(path.join(root, "sw.js"), "utf8");
assert.match(sw, /^importScripts\("\.\/src\/generated\/precache-manifest\.js"\);/);
assert.equal(sw.includes("clients.claim"), false);
assert.equal(/addEventListener\("install"[\s\S]{0,600}skipWaiting/.test(sw), false);
assert.match(sw, /ASTRA_ACTIVATE_RELEASE/);
assert.match(sw, /cleanupOldReleases/);
assert.match(sw, /caches\.keys/);
assert.match(sw, /request\.mode === "navigate"/);
assert.match(sw, /url\.origin !== self\.location\.origin/);
assert.match(sw, /url\.pathname\.startsWith\("\/__astra\/"\)/);
assert.match(sw, /response\.type === "opaque"/);
assert.match(sw, /response\.redirected/);
assert.match(sw, /event\.waitUntil\(cache\.put/);
assert.match(sw, /async function fetchDeckNetwork\(request\)/);
assert.match(sw, /return fetch\(request\.clone\(\)\);/);
assert.match(sw, /const response = await fetchDeckNetwork\(event\.request\);/);
assert.deepEqual([...OFFLINE_STATE_NAMES], ["APP-SHELL-READY", "DEFAULT-DECK-READY", "SELECTED-DECKS-READY"]);

let registrationOptions = null;
const registrationResult = await registerServiceWorker({
  navigatorRef: { serviceWorker: { register: async (_url, options) => { registrationOptions = options; return { active: true }; } } },
  locationRef: { protocol: "http:" },
});
assert.equal(registrationResult.registered, true);
assert.deepEqual(registrationOptions, { updateViaCache: "none" });

class FakeMessageChannel {
  constructor() {
    this.port1 = {};
    this.port2 = {
      postMessage: (data) => queueMicrotask(() => this.port1.onmessage?.({ data })),
    };
  }
}
const rootElement = { dataset: {} };
const fakeWindow = {
  document: { documentElement: rootElement },
  MessageChannel: FakeMessageChannel,
  setTimeout: () => 1,
  clearTimeout: () => {},
  dispatchEvent: () => {},
};
const worker = {
  postMessage(message, ports) {
    const states = { "APP-SHELL-READY": true, "DEFAULT-DECK-READY": true, "SELECTED-DECKS-READY": [message.deckId || "rws"] };
    ports[0].postMessage(message.type === "ASTRA_CACHE_DECK" ? { ready: true, status: { releaseId: "test", states } } : { releaseId: "test", states });
  },
};
const client = createOfflineStatusClient({
  navigatorRef: { serviceWorker: { controller: worker, addEventListener: () => {} } },
  windowRef: fakeWindow,
  documentRef: fakeWindow.document,
  MessageChannelCtor: FakeMessageChannel,
});
assert.equal((await client.refresh()).states["APP-SHELL-READY"], true);
assert.equal((await client.cacheDeck("rws")).ready, true);
assert.equal(rootElement.dataset.defaultDeckReady, "true");

const imageHandlers = new Map();
const documentRef = {
  addEventListener: (name, handler) => imageHandlers.set(name, handler),
  removeEventListener: (name) => imageHandlers.delete(name),
};
let retryCallback = null;
const uninstallFallbacks = installImageFallbacks(documentRef, {
  retryDelayMs: 0,
  scheduleRetry: (callback) => { retryCallback = callback; },
});
const image = {
  tagName: "IMG",
  dataset: {},
  alt: "",
  src: "missing.jpg",
  getAttribute: (name) => (name === "src" ? image.src : null),
};
imageHandlers.get("error")({ target: image });
assert.equal(image.dataset.imageStatus, "retrying");
assert.equal(image.dataset.imageRetryCount, "1");
assert.equal(image.src, "missing.jpg");
assert.equal(typeof retryCallback, "function");
retryCallback();
assert.equal(image.src, "missing.jpg");
imageHandlers.get("load")({ target: image });
assert.equal(image.dataset.imageStatus, undefined);
assert.equal(image.dataset.imageRetryCount, undefined);

retryCallback = null;
const unavailableImage = {
  tagName: "IMG",
  dataset: {},
  alt: "",
  src: "still-missing.jpg",
  getAttribute: (name) => (name === "src" ? unavailableImage.src : null),
};
imageHandlers.get("error")({ target: unavailableImage });
assert.equal(unavailableImage.dataset.imageStatus, "retrying");
retryCallback();
imageHandlers.get("error")({ target: unavailableImage });
assert.equal(unavailableImage.dataset.imageStatus, "unavailable");
assert.equal(unavailableImage.alt, "牌面图片暂时不可用");
assert.equal(unavailableImage.src, "./icon.svg");
uninstallFallbacks();
assert.equal(imageHandlers.size, 0);

console.log("MOD-006C PWA contract passed: deck fetches and image elements recover once from transient failures before accessible fallback.");
