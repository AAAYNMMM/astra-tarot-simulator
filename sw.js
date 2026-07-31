importScripts("./src/generated/precache-manifest.js");

const MANIFEST = self.__ASTRA_PRECACHE_MANIFEST__;
if (!MANIFEST) throw new Error("Generated precache manifest was not loaded.");

const RELEASE_ID = MANIFEST.releaseId;
const SHELL_CACHE = `astra-shell-${RELEASE_ID}`;
const STATUS_CACHE = `astra-status-${RELEASE_ID}`;
const STATUS_URL = new URL("./__astra-offline-status__", self.registration.scope).href;
const DEFAULT_DECK_ID = "rws";
const REQUIRED_URLS = Object.freeze(
  [...new Set(Object.values(MANIFEST.required).flat())].map((item) => new URL(item, self.registration.scope).href),
);
const REQUIRED_SET = new Set(REQUIRED_URLS);
const DECK_URLS = Object.freeze(
  Object.fromEntries(
    Object.entries(MANIFEST.optionalDecks).map(([deckId, files]) => [
      deckId,
      Object.freeze(files.map((item) => new URL(item, self.registration.scope).href)),
    ]),
  ),
);
const DECK_BY_URL = new Map(
  Object.entries(DECK_URLS).flatMap(([deckId, files]) => files.map((item) => [item, deckId])),
);

function deckCacheName(deckId) {
  return `astra-deck-${RELEASE_ID}-${deckId}`;
}

function emptyStatus() {
  return {
    releaseId: RELEASE_ID,
    artifactManifestHash: MANIFEST.artifactManifestHash,
    states: {
      "APP-SHELL-READY": false,
      "DEFAULT-DECK-READY": false,
      "SELECTED-DECKS-READY": [],
    },
  };
}

async function readStatus() {
  const cache = await caches.open(STATUS_CACHE);
  const response = await cache.match(STATUS_URL);
  if (!response) return emptyStatus();
  try {
    const parsed = await response.json();
    return parsed?.releaseId === RELEASE_ID ? parsed : emptyStatus();
  } catch {
    return emptyStatus();
  }
}

async function writeStatus(update) {
  const current = await readStatus();
  const next = {
    ...current,
    ...update,
    states: { ...current.states, ...(update.states || {}) },
  };
  const cache = await caches.open(STATUS_CACHE);
  await cache.put(
    STATUS_URL,
    new Response(JSON.stringify(next), {
      headers: { "content-type": "application/json; charset=utf-8" },
    }),
  );
  return next;
}

function expectedType(url) {
  const pathname = new URL(url).pathname.toLowerCase();
  if (pathname.endsWith(".js")) return "javascript";
  if (pathname.endsWith(".css")) return "text/css";
  if (pathname.endsWith(".json") || pathname.endsWith(".webmanifest")) return "json";
  if (/\.(?:jpg|jpeg|png|webp|svg)$/.test(pathname)) return "image/";
  if (pathname.endsWith("/") || pathname.endsWith(".html")) return "text/html";
  return null;
}

function responseIsCacheable(response, url, { navigation = false } = {}) {
  if (!response || !response.ok || response.redirected || response.type === "opaque") return false;
  const contentType = String(response.headers.get("content-type") || "").toLowerCase();
  const expected = navigation ? "text/html" : expectedType(url);
  if (!expected) return false;
  if (expected === "javascript") return contentType.includes("javascript");
  if (expected === "json") return contentType.includes("json");
  return contentType.includes(expected);
}

async function fetchCacheable(url, options = {}) {
  const response = await fetch(url, { cache: "reload", credentials: "same-origin" });
  if (!responseIsCacheable(response, url, options)) {
    throw new Error(`Refused non-cacheable response: ${url}`);
  }
  return response;
}

async function cacheRequiredResources() {
  const cache = await caches.open(SHELL_CACHE);
  try {
    for (const url of REQUIRED_URLS) {
      const response = await fetchCacheable(url, { navigation: url.endsWith("/index.html") || url.endsWith("/") });
      await cache.put(url, response.clone());
    }
    await writeStatus({ states: { "APP-SHELL-READY": true } });
  } catch (error) {
    await caches.delete(SHELL_CACHE);
    await writeStatus({ states: { "APP-SHELL-READY": false } });
    throw error;
  }
}

async function deckIsComplete(deckId) {
  const files = DECK_URLS[deckId];
  if (!files) return false;
  const cache = await caches.open(deckCacheName(deckId));
  const matches = await Promise.all(files.map((url) => cache.match(url)));
  return matches.every(Boolean);
}

async function updateDeckStatus(deckId, ready) {
  const current = await readStatus();
  const selected = new Set(current.states["SELECTED-DECKS-READY"] || []);
  if (ready) selected.add(deckId);
  else selected.delete(deckId);
  return writeStatus({
    states: {
      "DEFAULT-DECK-READY": deckId === DEFAULT_DECK_ID
        ? ready
        : current.states["DEFAULT-DECK-READY"],
      "SELECTED-DECKS-READY": [...selected].sort(),
    },
  });
}

async function cacheDeck(deckId) {
  const files = DECK_URLS[deckId];
  if (!files) return false;
  const cacheName = deckCacheName(deckId);
  const cache = await caches.open(cacheName);
  try {
    for (const url of files) {
      if (await cache.match(url)) continue;
      const response = await fetchCacheable(url);
      await cache.put(url, response.clone());
    }
    const ready = await deckIsComplete(deckId);
    await updateDeckStatus(deckId, ready);
    return ready;
  } catch {
    await caches.delete(cacheName);
    await updateDeckStatus(deckId, false);
    return false;
  }
}

async function navigationResponse(event) {
  try {
    const response = await fetch(event.request);
    if (!responseIsCacheable(response, event.request.url, { navigation: true })) return response;
    const cache = await caches.open(SHELL_CACHE);
    event.waitUntil(cache.put(new URL("./index.html", self.registration.scope).href, response.clone()));
    return response;
  } catch {
    const cache = await caches.open(SHELL_CACHE);
    return cache.match(new URL("./index.html", self.registration.scope).href);
  }
}

async function shellResponse(event) {
  const cache = await caches.open(SHELL_CACHE);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  const response = await fetch(event.request);
  if (responseIsCacheable(response, event.request.url)) {
    event.waitUntil(cache.put(event.request, response.clone()));
  }
  return response;
}

async function deckResponse(event, deckId) {
  const cache = await caches.open(deckCacheName(deckId));
  const cached = await cache.match(event.request);
  if (cached) return cached;
  const response = await fetch(event.request);
  if (responseIsCacheable(response, event.request.url)) {
    event.waitUntil(
      cache.put(event.request, response.clone()).then(async () => {
        const ready = await deckIsComplete(deckId);
        await updateDeckStatus(deckId, ready);
      }),
    );
  }
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    cacheRequiredResources().then(() => cacheDeck(DEFAULT_DECK_ID).catch(() => false)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(readStatus());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/__astra/")) return;
  if (request.mode === "navigate") {
    event.respondWith(navigationResponse(event));
    return;
  }
  const deckId = DECK_BY_URL.get(url.href);
  if (deckId) {
    event.respondWith(deckResponse(event, deckId));
    return;
  }
  if (REQUIRED_SET.has(url.href)) event.respondWith(shellResponse(event));
});

self.addEventListener("message", (event) => {
  const port = event.ports?.[0];
  if (!port) return;
  if (event.data?.type === "ASTRA_OFFLINE_STATUS") {
    event.waitUntil(readStatus().then((status) => port.postMessage(status)));
    return;
  }
  if (event.data?.type === "ASTRA_CACHE_DECK") {
    const deckId = String(event.data.deckId || "");
    event.waitUntil(
      cacheDeck(deckId).then(async (ready) => {
        port.postMessage({ ready, deckId, status: await readStatus() });
      }),
    );
  }
});
