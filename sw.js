importScripts("./src/generated/precache-manifest.js");

const MANIFEST = self.__ASTRA_PRECACHE_MANIFEST__;
if (!MANIFEST) throw new Error("Generated precache manifest was not loaded.");

const RELEASE_ID = MANIFEST.releaseId;
const PROTOCOL_VERSION = MANIFEST.protocolVersion || "1.0.0";
const HISTORY_LIMIT = Number(MANIFEST.historyLimit || 2);
const DEFAULT_DECK_ID = "rws";
const META_CACHE = "astra-release-meta-v1";
const META_URL = new URL("./__astra-release-meta__", self.registration.scope).href;
const STATUS_URL = new URL("./__astra-offline-status__", self.registration.scope).href;
const REQUIRED_GROUPS = Object.freeze(MANIFEST.required);
const REQUIRED_URLS = Object.freeze(
  [...new Set(Object.values(REQUIRED_GROUPS).flat())].map((item) => new URL(item, self.registration.scope).href),
);
const REQUIRED_SET = new Set(REQUIRED_URLS);
const TRANSPORT_HASHES = Object.freeze(
  Object.fromEntries(Object.entries(MANIFEST.transportHashes || {}).map(([item, hash]) => [
    new URL(item, self.registration.scope).href,
    hash,
  ])),
);
const DECK_URLS = Object.freeze(Object.fromEntries(
  Object.entries(MANIFEST.optionalDecks).map(([deckId, files]) => [
    deckId,
    Object.freeze(files.map((item) => new URL(item, self.registration.scope).href)),
  ]),
));
const DECK_BY_URL = new Map(
  Object.entries(DECK_URLS).flatMap(([deckId, files]) => files.map((item) => [item, deckId])),
);

function releaseCacheName(releaseId, kind, { staging = false } = {}) {
  if (staging) return `astra-stage-${releaseId}-${kind}`;
  return `astra-release-${releaseId}-${kind}`;
}

function deckCacheName(releaseId, deckId) {
  return `astra-deck-${releaseId}-${deckId}`;
}

function emptyMeta() {
  return {
    schemaVersion: "1.0.0",
    protocolVersion: PROTOCOL_VERSION,
    activeReleaseId: null,
    previousReleaseId: null,
    healthyReleases: [],
    rollbackReleaseId: null,
  };
}

async function readMeta() {
  const cache = await caches.open(META_CACHE);
  const response = await cache.match(META_URL);
  if (!response) return emptyMeta();
  try { return { ...emptyMeta(), ...(await response.json()) }; } catch { return emptyMeta(); }
}

async function writeMeta(update) {
  const current = await readMeta();
  const next = { ...current, ...update };
  const cache = await caches.open(META_CACHE);
  await cache.put(META_URL, new Response(JSON.stringify(next), {
    headers: { "content-type": "application/json; charset=utf-8" },
  }));
  return next;
}

function emptyStatus(meta = emptyMeta()) {
  return {
    releaseId: RELEASE_ID,
    activeReleaseId: meta.activeReleaseId,
    previousReleaseId: meta.previousReleaseId,
    artifactManifestHash: MANIFEST.artifactManifestHash,
    states: {
      "APP-SHELL-READY": false,
      "DEFAULT-DECK-READY": false,
      "SELECTED-DECKS-READY": [],
    },
  };
}

async function readStatus() {
  const meta = await readMeta();
  const cache = await caches.open(META_CACHE);
  const response = await cache.match(STATUS_URL);
  if (!response) return emptyStatus(meta);
  try { return { ...emptyStatus(meta), ...(await response.json()), activeReleaseId: meta.activeReleaseId, previousReleaseId: meta.previousReleaseId }; }
  catch { return emptyStatus(meta); }
}

async function writeStatus(update) {
  const current = await readStatus();
  const next = { ...current, ...update, states: { ...current.states, ...(update.states || {}) } };
  const cache = await caches.open(META_CACHE);
  await cache.put(STATUS_URL, new Response(JSON.stringify(next), {
    headers: { "content-type": "application/json; charset=utf-8" },
  }));
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

async function sha256(buffer) {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function fetchVerified(url, options = {}) {
  const response = await fetch(url, { cache: "reload", credentials: "same-origin" });
  if (!responseIsCacheable(response, url, options)) throw new Error(`Refused non-cacheable response: ${url}`);
  const expectedHash = TRANSPORT_HASHES[url];
  if (expectedHash) {
    const actualHash = await sha256(await response.clone().arrayBuffer());
    if (actualHash !== expectedHash) throw new Error(`Transport hash mismatch: ${url}`);
  }
  return response;
}

function requiredKind(url) {
  for (const [kind, paths] of Object.entries(REQUIRED_GROUPS)) {
    if (paths.some((item) => new URL(item, self.registration.scope).href === url)) return kind;
  }
  return "shell";
}

async function stageRequiredResources() {
  const stagedNames = [...new Set(REQUIRED_URLS.map((url) => releaseCacheName(RELEASE_ID, requiredKind(url), { staging: true })))];
  try {
    for (const url of REQUIRED_URLS) {
      const kind = requiredKind(url);
      const cache = await caches.open(releaseCacheName(RELEASE_ID, kind, { staging: true }));
      const response = await fetchVerified(url, { navigation: url.endsWith("/") || url.endsWith("/index.html") });
      await cache.put(url, response.clone());
    }
  } catch (error) {
    await Promise.all(stagedNames.map((name) => caches.delete(name)));
    throw error;
  }
  return stagedNames;
}

async function promoteStagedRelease() {
  for (const kind of Object.keys(REQUIRED_GROUPS)) {
    const staged = await caches.open(releaseCacheName(RELEASE_ID, kind, { staging: true }));
    const requests = await staged.keys();
    const stable = await caches.open(releaseCacheName(RELEASE_ID, kind));
    for (const request of requests) {
      const response = await staged.match(request);
      if (response) await stable.put(request, response);
    }
    await caches.delete(releaseCacheName(RELEASE_ID, kind, { staging: true }));
  }
  const meta = await readMeta();
  const previousReleaseId = meta.activeReleaseId && meta.activeReleaseId !== RELEASE_ID
    ? meta.activeReleaseId
    : meta.previousReleaseId;
  const healthy = [...new Set([RELEASE_ID, previousReleaseId, ...(meta.healthyReleases || [])].filter(Boolean))].slice(0, HISTORY_LIMIT);
  await writeMeta({
    activeReleaseId: RELEASE_ID,
    previousReleaseId,
    healthyReleases: healthy,
    rollbackReleaseId: null,
  });
  await writeStatus({
    releaseId: RELEASE_ID,
    states: { "APP-SHELL-READY": true },
  });
}

async function releaseCache(releaseId, kind) {
  return caches.open(releaseCacheName(releaseId, kind));
}

async function activeReleaseId() {
  const meta = await readMeta();
  return meta.rollbackReleaseId || meta.activeReleaseId || RELEASE_ID;
}

async function deckIsComplete(releaseId, deckId) {
  const files = DECK_URLS[deckId];
  if (!files) return false;
  const cache = await caches.open(deckCacheName(releaseId, deckId));
  const matches = await Promise.all(files.map((url) => cache.match(url)));
  return matches.every(Boolean);
}

async function updateDeckStatus(deckId, ready) {
  const current = await readStatus();
  const selected = new Set(current.states["SELECTED-DECKS-READY"] || []);
  if (ready) selected.add(deckId); else selected.delete(deckId);
  return writeStatus({
    states: {
      "DEFAULT-DECK-READY": deckId === DEFAULT_DECK_ID ? ready : current.states["DEFAULT-DECK-READY"],
      "SELECTED-DECKS-READY": [...selected].sort(),
    },
  });
}

async function cacheDeck(deckId, port = null) {
  const files = DECK_URLS[deckId];
  if (!files) return { ready: false, reason: "unknown-deck" };
  const releaseId = await activeReleaseId();
  const cacheName = deckCacheName(releaseId, deckId);
  const cache = await caches.open(cacheName);
  try {
    let completed = 0;
    for (const url of files) {
      if (!(await cache.match(url))) {
        const response = await fetchVerified(url);
        await cache.put(url, response.clone());
      }
      completed += 1;
      port?.postMessage?.({ type: "ASTRA_DECK_PROGRESS", deckId, completed, total: files.length });
    }
    const ready = await deckIsComplete(releaseId, deckId);
    await updateDeckStatus(deckId, ready);
    return { ready, reason: ready ? null : "incomplete" };
  } catch {
    await caches.delete(cacheName);
    await updateDeckStatus(deckId, false);
    return { ready: false, reason: "cache-failed" };
  }
}

async function deleteDeck(deckId) {
  const releaseId = await activeReleaseId();
  const deleted = await caches.delete(deckCacheName(releaseId, deckId));
  await updateDeckStatus(deckId, false);
  return deleted;
}

async function clientReports() {
  const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  return clients.map((client) => ({ id: client.id, url: client.url }));
}

async function cleanupOldReleases() {
  const meta = await readMeta();
  const reports = await clientReports();
  if (reports.length > 0) return;
  const keep = new Set([META_CACHE]);
  for (const releaseId of (meta.healthyReleases || []).slice(0, HISTORY_LIMIT)) {
    for (const kind of Object.keys(REQUIRED_GROUPS)) keep.add(releaseCacheName(releaseId, kind));
    for (const deckId of Object.keys(DECK_URLS)) keep.add(deckCacheName(releaseId, deckId));
  }
  const names = await caches.keys();
  await Promise.all(names.filter((name) => name.startsWith("astra-") && !keep.has(name)).map((name) => caches.delete(name)));
}

async function navigationResponse(event) {
  try {
    const response = await fetch(event.request);
    if (!responseIsCacheable(response, event.request.url, { navigation: true })) return response;
    return response;
  } catch {
    const releaseId = await activeReleaseId();
    const cache = await releaseCache(releaseId, "shell");
    return cache.match(new URL("./index.html", self.registration.scope).href);
  }
}

async function requiredResponse(event) {
  const releaseId = await activeReleaseId();
  const kind = requiredKind(event.request.url);
  const cache = await releaseCache(releaseId, kind);
  return (await cache.match(event.request)) || fetch(event.request);
}

async function fetchDeckNetwork(request) {
  try {
    return await fetch(request);
  } catch {
    return fetch(request.clone());
  }
}

async function deckResponse(event, deckId) {
  const releaseId = await activeReleaseId();
  const cache = await caches.open(deckCacheName(releaseId, deckId));
  const cached = await cache.match(event.request);
  if (cached) return cached;
  const response = await fetchDeckNetwork(event.request);
  if (responseIsCacheable(response, event.request.url)) {
    event.waitUntil(cache.put(event.request, response.clone()).then(async () => {
      await updateDeckStatus(deckId, await deckIsComplete(releaseId, deckId));
    }));
  }
  return response;
}

self.addEventListener("install", (event) => {
  event.waitUntil(stageRequiredResources());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(promoteStagedRelease().then(cleanupOldReleases));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith("/__astra/")) return;
  if (request.mode === "navigate") { event.respondWith(navigationResponse(event)); return; }
  const deckId = DECK_BY_URL.get(url.href);
  if (deckId) { event.respondWith(deckResponse(event, deckId)); return; }
  if (REQUIRED_SET.has(url.href)) event.respondWith(requiredResponse(event));
});

self.addEventListener("message", (event) => {
  const message = event.data || {};
  const port = event.ports?.[0];
  if (message.type === "ASTRA_OFFLINE_STATUS") {
    event.waitUntil(readStatus().then((status) => port?.postMessage(status)));
    return;
  }
  if (message.type === "ASTRA_CACHE_DECK") {
    event.waitUntil(cacheDeck(String(message.deckId || ""), port).then(async (result) => {
      port?.postMessage({ ...result, deckId: message.deckId, status: await readStatus() });
    }));
    return;
  }
  if (message.type === "ASTRA_DELETE_DECK") {
    event.waitUntil(deleteDeck(String(message.deckId || "")).then(async (deleted) => {
      port?.postMessage({ deleted, deckId: message.deckId, status: await readStatus() });
    }));
    return;
  }
  if (message.protocolVersion !== PROTOCOL_VERSION) return;
  if (message.type === "ASTRA_ACTIVATE_RELEASE" && message.releaseId) {
    event.waitUntil(self.skipWaiting());
    return;
  }
  if (message.type === "ASTRA_ROLLBACK_RELEASE") {
    event.waitUntil(readMeta().then(async (meta) => {
      if (!meta.previousReleaseId) return;
      await writeMeta({ rollbackReleaseId: meta.previousReleaseId });
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      clients.forEach((client) => client.postMessage({
        protocolVersion: PROTOCOL_VERSION,
        type: "ASTRA_RELEASE_ACTIVATED",
        releaseId: meta.previousReleaseId,
        rollback: true,
      }));
    }));
  }
});
