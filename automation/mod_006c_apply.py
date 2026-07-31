#!/usr/bin/env python3
"""Apply MOD-006C classic Service Worker policy and offline status contracts."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.replace("\r\n", "\n"), encoding="utf-8", newline="\n")


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return source.replace(old, new, 1)


SERVICE_WORKER = r'''importScripts("./src/generated/precache-manifest.js");

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
'''

OFFLINE_STATUS = r'''export const OFFLINE_STATE_NAMES = Object.freeze([
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
'''

IMAGE_FALLBACK = r'''const DEFAULT_PLACEHOLDER = "./icon.svg";

export function installImageFallbacks(documentRef = globalThis.document, {
  placeholderUrl = DEFAULT_PLACEHOLDER,
} = {}) {
  if (!documentRef?.addEventListener) return () => {};
  const onError = (event) => {
    const image = event.target;
    if (!image || String(image.tagName).toUpperCase() !== "IMG") return;
    if (image.dataset.imageStatus === "unavailable") return;
    image.dataset.imageStatus = "unavailable";
    image.alt = image.alt || "牌面图片暂时不可用";
    image.src = placeholderUrl;
  };
  documentRef.addEventListener("error", onError, true);
  return () => documentRef.removeEventListener("error", onError, true);
}
'''

PWA_TEST = r'''import assert from "node:assert/strict";
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
    this.port2 = {};
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
    queueMicrotask(() => ports[0].onmessage?.({ data: message.type === "ASTRA_CACHE_DECK" ? { ready: true, status: { releaseId: "test", states } } : { releaseId: "test", states } }));
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
'''


def update_runtime_services(source: str) -> str:
    source = replace_once(
        source,
        'import { createLifecycleClient } from "../platform/lifecycle-client.js";\n',
        'import { createLifecycleClient } from "../platform/lifecycle-client.js";\nimport { createOfflineStatusClient } from "../platform/offline-status.js";\n',
        "offline client import",
    )
    source = replace_once(
        source,
        "  const lifecycle = createLifecycleClient({ windowRef });\n",
        "  const lifecycle = createLifecycleClient({ windowRef });\n  const offlineStatus = createOfflineStatusClient({ windowRef });\n",
        "offline client creation",
    )
    return replace_once(
        source,
        "    registerLocalLifecycle: lifecycle.register,\n",
        "    registerLocalLifecycle: lifecycle.register,\n    offlineStatus,\n",
        "offline client export",
    )


def update_application(source: str) -> str:
    source = replace_once(
        source,
        'import { createToast } from "../ui/components/toast.js";\n',
        'import { createToast } from "../ui/components/toast.js";\nimport { installImageFallbacks } from "../ui/image-fallback.js";\n',
        "image fallback import",
    )
    source = replace_once(
        source,
        "    writeHistory: writeHistoryToStorage, readingRecord,\n",
        "    writeHistory: writeHistoryToStorage, readingRecord, offlineStatus,\n",
        "offline service destructure",
    )
    source = replace_once(
        source,
        "  const dom = bindDom(document);\n",
        "  installImageFallbacks(document);\n  const dom = bindDom(document);\n",
        "image fallback install",
    )
    source = replace_once(
        source,
        "      renderDeckStyles();\n      showToast(`已切换为${currentDeckStyle().name}牌面`, \"✦\");\n",
        "      renderDeckStyles();\n      void offlineStatus.cacheDeck(state.deckStyleId);\n      showToast(`已切换为${currentDeckStyle().name}牌面`, \"✦\");\n",
        "selected deck cache request",
    )
    return replace_once(
        source,
        "      registerServiceWorker();\n      registerLocalLifecycle();\n",
        "      void registerServiceWorker().then(() => offlineStatus.start({ selectedDeckId: initialDeckStyle }));\n      registerLocalLifecycle();\n",
        "offline status startup",
    )


def update_pwa_client(source: str) -> str:
    return replace_once(
        source,
        "  return navigatorRef.serviceWorker.register(scriptUrl).then(\n",
        '  return navigatorRef.serviceWorker.register(scriptUrl, { updateViaCache: "none" }).then(\n',
        "updateViaCache registration",
    )


def update_validate(source: str) -> str:
    anchor = '''        (
            "node-module-contract",
            [node, "tests/module_contract_test.mjs"],
        ),
'''
    addition = '''        (
            "node-pwa-contract",
            [node, "tests/pwa_contract_test.mjs"],
        ),
'''
    return replace_once(source, anchor, addition + anchor, "PWA validation step")


def update_package(source: str) -> str:
    metadata = json.loads(source)
    metadata.setdefault("scripts", {})["test:pwa"] = "node tests/pwa_contract_test.mjs"
    return json.dumps(metadata, ensure_ascii=False, indent=2) + "\n"


def update_module_contract(source: str) -> str:
    source = replace_once(
        source,
        '  "src/platform/assets.js", "src/platform/entropy.js", "src/platform/lifecycle-client.js",\n',
        '  "src/platform/assets.js", "src/platform/entropy.js", "src/platform/lifecycle-client.js",\n  "src/platform/offline-status.js", "src/ui/image-fallback.js", "tests/pwa_contract_test.mjs",\n',
        "PWA required files",
    )
    start = source.index('const sw = read("sw.js");')
    end = source.index('const baseline = JSON.parse', start)
    replacement = '''const sw = read("sw.js");
assert.match(sw, /^importScripts\\("\\.\\/src\\/generated\\/precache-manifest\\.js"\\);/);
assert.equal(sw.includes("skipWaiting"), false);
assert.equal(sw.includes("clients.claim"), false);
assert.equal(sw.includes("caches.keys"), false);
assert.match(sw, /APP-SHELL-READY/);
assert.match(sw, /DEFAULT-DECK-READY/);
assert.match(sw, /SELECTED-DECKS-READY/);
'''
    source = source[:start] + replacement + source[end:]
    return source.replace("MOD-006B module contract passed:", "MOD-006C module contract passed:")


def main() -> None:
    write("sw.js", SERVICE_WORKER.lstrip())
    write("src/platform/offline-status.js", OFFLINE_STATUS.lstrip())
    write("src/ui/image-fallback.js", IMAGE_FALLBACK.lstrip())
    write("tests/pwa_contract_test.mjs", PWA_TEST.lstrip())
    write("src/app/runtime-services.js", update_runtime_services(read("src/app/runtime-services.js")))
    write("src/app/application.js", update_application(read("src/app/application.js")))
    write("src/platform/pwa-client.js", update_pwa_client(read("src/platform/pwa-client.js")))
    write("automation/validate.py", update_validate(read("automation/validate.py")))
    write("package.json", update_package(read("package.json")))
    write("tests/module_contract_test.mjs", update_module_contract(read("tests/module_contract_test.mjs")))
    write("src/styles/cards.css", read("src/styles/cards.css") + "\nimg[data-image-status=\"unavailable\"] {\n  object-fit: contain;\n  padding: 18%;\n  background: rgba(12, 11, 24, 0.92);\n}\n")
    write("docs/MODULE_MAP.md", read("docs/MODULE_MAP.md") + "\n\n## MOD-006C离线边界\n\n经典 `sw.js` 通过 `importScripts` 读取生成清单；导航、版本化运行资源和牌组图片分别使用network-first、release cache-first和按需cache-first。离线状态由 `src/platform/offline-status.js` 暴露，图片失败由 `src/ui/image-fallback.js` 提供可访问占位，不触发重抽。\n")
    write("src/README.md", read("src/README.md") + "\n\n## 经典Service Worker\n\n`sw.js` 不使用ESM；通过生成的 `precache-manifest.js` 建立release缓存。安装失败只阻断必需壳资源，牌组失败不会破坏当前稳定壳缓存；更新激活与旧缓存清理由后续 `PLAT-001` 协调。\n")
    progress = read("docs/PROGRESS.md")
    progress = progress.replace("| 当前进行中任务 | `MOD-006C` 经典Service Worker策略与离线状态 |", "| 当前进行中任务 | `MOD-006D` Phase M终态验证 |")
    progress = progress.replace("| 最近完成任务 | `MOD-006B` 正式生成、规范哈希与manifest |", "| 最近完成任务 | `MOD-006C` 经典Service Worker策略与离线状态 |")
    progress = progress.replace("| `MOD-006C` | `IN_PROGRESS` | 下一步接线经典SW与离线状态 |", "| `MOD-006C` | `DONE` | 经典SW、三层离线状态和可访问图片占位 |")
    progress = progress.replace("| `MOD-006D` | `BACKLOG` | 等待 `MOD-006C` |", "| `MOD-006D` | `IN_PROGRESS` | full、浏览器、CSP、DOM、历史、PWA与模块边界终态验证 |")
    progress = progress.replace("## 当前任务：MOD-006C", "## 当前任务：MOD-006D")
    progress = progress.replace("按生成的 `src/generated/precache-manifest.js` 分类导航、版本化运行资源和牌组图片；建立 `APP-SHELL-READY`、`DEFAULT-DECK-READY`、`SELECTED-DECKS-READY` 状态，失败图片使用可访问占位且不重抽。", "执行Phase M full验证、浏览器harness、CSP与DOM注入、历史兼容、PWA缓存分类和模块边界检查；通过后将Phase M标记为PARENT-DONE并释放唯一NEXT `TQ-001`。")
    write("docs/PROGRESS.md", progress)
    print("mod_006c_applied sw=classic cache_policy=classified offline_states=3 image_fallback=accessible")


if __name__ == "__main__":
    main()
