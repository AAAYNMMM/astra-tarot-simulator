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
assert.equal(sw.includes("skipWaiting"), false);
assert.equal(sw.includes("clients.claim"), false);
assert.equal(sw.includes("caches.keys"), false);
assert.match(sw, /request\.mode === "navigate"/);
assert.match(sw, /url\.origin !== self\.location\.origin/);
assert.match(sw, /url\.pathname\.startsWith\("\/__astra\/"\)/);
assert.match(sw, /response\.type === "opaque"/);
assert.match(sw, /response\.redirected/);
assert.match(sw, /event\.waitUntil\(cache\.put/);
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
assert.equal(await client.cacheDeck("rws"), true);
assert.equal(rootElement.dataset.defaultDeckReady, "true");

let errorHandler = null;
const documentRef = { addEventListener: (_name, handler) => { errorHandler = handler; }, removeEventListener: () => {} };
installImageFallbacks(documentRef);
const image = { tagName: "IMG", dataset: {}, alt: "", src: "missing.jpg" };
errorHandler({ target: image });
assert.equal(image.dataset.imageStatus, "unavailable");
assert.equal(image.alt, "牌面图片暂时不可用");
assert.equal(image.src, "./icon.svg");
console.log("MOD-006C PWA contract passed: generated classic manifest, cache classes, offline states, and accessible image fallback are wired.");
