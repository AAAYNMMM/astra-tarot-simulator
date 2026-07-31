#!/usr/bin/env python3
"""Apply the deterministic MOD-003B foundation-module migration."""

from __future__ import annotations

import json
import re
from pathlib import Path
from textwrap import dedent


ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content, encoding="utf-8", newline="\n")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one literal match, found {count}")
    return text.replace(old, new, 1)


def regex_once(text: str, pattern: str, replacement: str, label: str) -> str:
    updated, count = re.subn(pattern, replacement, text, count=1, flags=re.S)
    if count != 1:
        raise RuntimeError(f"{label}: expected one regex match, found {count}")
    return updated


MODULES = {
    "src/config/decks.js": r'''const freezeDeckStyle = (style) =>
  Object.freeze({
    ...style,
    ...(style.faceExtensions
      ? { faceExtensions: Object.freeze({ ...style.faceExtensions }) }
      : {}),
  });

export const DECK_STYLES = Object.freeze(
  [
    {
      id: "rws",
      name: "经典韦特",
      description: "1909 · 象征叙事",
      assetDirectory: "assets/rws",
      faceExtension: "jpg",
      cardBack: "assets/rws/card-back-rws.jpg",
      previewCard: "major-17",
    },
    {
      id: "arnoult",
      name: "阿尔诺古典",
      description: "1748 · 木刻原色",
      assetDirectory: "assets/decks/arnoult",
      faceExtension: "png",
      cardBack: "assets/decks/arnoult/card-back.jpg",
      previewCard: "major-2",
    },
    {
      id: "swiss",
      name: "瑞士 1JJ",
      description: "19 世纪 · 明快原色",
      assetDirectory: "assets/decks/swiss-1jj",
      faceExtension: "jpg",
      faceExtensions: { "major-5": "png" },
      cardBack: "assets/decks/swiss-1jj/card-back.png",
      previewCard: "major-18",
    },
    {
      id: "piedmont",
      name: "皮埃蒙特",
      description: "1865 · 意式双头",
      assetDirectory: "assets/decks/piedmont",
      faceExtension: "jpg",
      cardBack: "assets/decks/piedmont/card-back.jpg",
      previewCard: "major-19",
    },
  ].map(freezeDeckStyle),
);

export const LEGACY_DECK_IDS = Object.freeze({
  vintage: "arnoult",
  moonlit: "swiss",
  rose: "piedmont",
});

export function resolveDeckStyle(style) {
  const requestedId = typeof style === "string" ? style : style?.id;
  const deckId = LEGACY_DECK_IDS[requestedId] || requestedId;
  return DECK_STYLES.find((item) => item.id === deckId) || DECK_STYLES[0];
}
''',
    "src/config/legacy-storage.js": r'''export const HISTORY_KEY = "astra-tarot-history-v1";
export const SETTINGS_KEY = "astra-tarot-settings-v1";
export const HISTORY_LIMIT = 20;
''',
    "src/core/html.js": r'''export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
''',
    "src/core/random/business-random.js": r'''const UINT32_RANGE = 4294967296;

function secureUnit(cryptoRef) {
  if (typeof cryptoRef?.getRandomValues !== "function") return null;
  const buffer = new Uint32Array(1);
  cryptoRef.getRandomValues(buffer);
  return buffer[0] / UINT32_RANGE;
}

function validateUnit(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric >= 1) {
    throw new RangeError("Business random source must return a finite value in [0, 1).");
  }
  return numeric;
}

export function createBusinessRandom({
  cryptoRef = globalThis.crypto,
  fallbackRandom = Math.random,
} = {}) {
  if (typeof fallbackRandom !== "function") {
    throw new TypeError("fallbackRandom must be a function.");
  }

  function randomUnit() {
    const secure = secureUnit(cryptoRef);
    return secure === null ? validateUnit(fallbackRandom()) : secure;
  }

  function secureShuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(randomUnit() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  return Object.freeze({ randomUnit, secureShuffle });
}
''',
    "src/platform/assets.js": r'''import { resolveDeckStyle } from "../config/decks.js";

export function cardImagePath(cardId, style) {
  const deckStyle = resolveDeckStyle(style);
  const extension = deckStyle.faceExtensions?.[cardId] || deckStyle.faceExtension;
  return `${deckStyle.assetDirectory}/${cardId}.${extension}`;
}

export function cardBackPath(style) {
  return resolveDeckStyle(style).cardBack;
}
''',
    "src/platform/entropy.js": r'''function bytesToHex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function createPlatformClientId(cryptoRef = globalThis.crypto) {
  if (typeof cryptoRef?.randomUUID === "function") {
    return `astra-${cryptoRef.randomUUID()}`;
  }
  if (typeof cryptoRef?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    cryptoRef.getRandomValues(bytes);
    return `astra-${bytesToHex(bytes)}`;
  }
  return null;
}
''',
    "src/platform/lifecycle-client.js": r'''import { createPlatformClientId } from "./entropy.js";

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
''',
    "src/platform/pwa-client.js": r'''export function registerServiceWorker({
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
''',
    "src/storage/settings.js": r'''import { SETTINGS_KEY } from "../config/legacy-storage.js";

export function createSettingsStore(storage) {
  function load() {
    try {
      return JSON.parse(storage?.getItem(SETTINGS_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function save(patch) {
    try {
      const next = { ...load(), ...patch };
      storage?.setItem(SETTINGS_KEY, JSON.stringify(next));
      return Boolean(storage);
    } catch {
      return false;
    }
  }

  return Object.freeze({ load, save });
}
''',
    "src/storage/legacy-history.js": r'''import { HISTORY_KEY, HISTORY_LIMIT } from "../config/legacy-storage.js";

export function createLegacyHistoryStore(storage, { limit = HISTORY_LIMIT } = {}) {
  function load() {
    try {
      const parsed = JSON.parse(storage?.getItem(HISTORY_KEY) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function write(records) {
    try {
      storage?.setItem(HISTORY_KEY, JSON.stringify(records.slice(0, limit)));
      return Boolean(storage);
    } catch {
      return false;
    }
  }

  return Object.freeze({ load, write, limit });
}
''',
    "src/storage/legacy-record.js": r'''import { resolveDeckStyle } from "../config/decks.js";

export function createLegacyReadingRecord(reading) {
  return {
    id: reading.id,
    createdAt: reading.createdAt,
    categoryId: reading.category.id,
    categoryName: reading.category.name,
    categoryIcon: reading.category.icon,
    categoryAccent: reading.category.accent,
    question: reading.question.text,
    spreadName: reading.spread.name,
    deckName: resolveDeckStyle(reading.deckStyle).name,
    cards: reading.draws.map((draw) => ({
      name: draw.card.name,
      orientation: draw.reversed ? "逆位" : "正位",
      position: draw.position.name,
    })),
    headline: reading.synthesis?.headline || "",
  };
}
''',
}

LEGACY_RUNTIME = r'''import { DECK_STYLES, LEGACY_DECK_IDS, resolveDeckStyle } from "../config/decks.js";
import { escapeHtml } from "../core/html.js";
import { createBusinessRandom } from "../core/random/business-random.js";
import { cardBackPath, cardImagePath } from "../platform/assets.js";
import { createLifecycleClient } from "../platform/lifecycle-client.js";
import { registerServiceWorker as registerPwaServiceWorker } from "../platform/pwa-client.js";
import { createLegacyHistoryStore } from "../storage/legacy-history.js";
import { createLegacyReadingRecord } from "../storage/legacy-record.js";
import { createSettingsStore } from "../storage/settings.js";

export const LEGACY_GLOBAL_NAME = "TarotData";
export const LEGACY_RUNTIME_GLOBAL_NAME = "AstraRuntime";
export const LEGACY_SCRIPT_PATHS = Object.freeze(["../../data.js", "../../app.js"]);

let runtimePromise = null;

function safeLocalStorage(windowRef) {
  try {
    return windowRef?.localStorage ?? null;
  } catch {
    return null;
  }
}

function loadClassicScript(documentRef, relativePath, baseUrl) {
  return new Promise((resolve, reject) => {
    const script = documentRef.createElement("script");
    script.src = new URL(relativePath, baseUrl).href;
    script.async = false;
    script.dataset.astraLegacyScript = relativePath;
    script.addEventListener("load", () => resolve(script), { once: true });
    script.addEventListener(
      "error",
      () => {
        script.remove();
        reject(new Error(`Failed to load legacy runtime script: ${relativePath}`));
      },
      { once: true },
    );
    documentRef.head.append(script);
  });
}

export function createLegacyRuntimeBindings(windowRef = globalThis.window) {
  if (!windowRef) throw new Error("Legacy runtime bindings require a browser window.");
  const storageRef = safeLocalStorage(windowRef);
  const settings = createSettingsStore(storageRef);
  const history = createLegacyHistoryStore(storageRef);
  const businessRandom = createBusinessRandom({
    cryptoRef: windowRef.crypto,
    fallbackRandom: windowRef.Math?.random?.bind(windowRef.Math) ?? Math.random,
  });
  const lifecycle = createLifecycleClient({ windowRef });

  return Object.freeze({
    config: Object.freeze({ DECK_STYLES, LEGACY_DECK_IDS }),
    core: Object.freeze({
      escapeHtml,
      randomUnit: businessRandom.randomUnit,
      secureShuffle: businessRandom.secureShuffle,
    }),
    platform: Object.freeze({
      resolveDeckStyle,
      cardImagePath,
      cardBackPath,
      registerServiceWorker: () =>
        registerPwaServiceWorker({
          navigatorRef: windowRef.navigator,
          locationRef: windowRef.location,
        }),
      registerLocalLifecycle: lifecycle.register,
      lifecycleClientId: lifecycle.clientId,
    }),
    storage: Object.freeze({
      loadSettings: settings.load,
      saveSettings: settings.save,
      loadHistory: history.load,
      writeHistory: history.write,
      readingRecord: createLegacyReadingRecord,
    }),
  });
}

async function loadLegacyRuntime({ documentRef, windowRef, baseUrl }) {
  if (!documentRef?.head || !windowRef) {
    throw new Error("Legacy runtime requires a browser document and window.");
  }

  windowRef[LEGACY_RUNTIME_GLOBAL_NAME] = createLegacyRuntimeBindings(windowRef);
  await loadClassicScript(documentRef, LEGACY_SCRIPT_PATHS[0], baseUrl);
  if (!windowRef[LEGACY_GLOBAL_NAME]) {
    throw new Error("data.js did not initialize window.TarotData.");
  }
  await loadClassicScript(documentRef, LEGACY_SCRIPT_PATHS[1], baseUrl);
  return windowRef[LEGACY_GLOBAL_NAME];
}

export function startLegacyRuntime({
  documentRef = globalThis.document,
  windowRef = globalThis.window,
  baseUrl = import.meta.url,
} = {}) {
  if (!runtimePromise) {
    runtimePromise = loadLegacyRuntime({ documentRef, windowRef, baseUrl }).catch((error) => {
      runtimePromise = null;
      throw error;
    });
  }
  return runtimePromise;
}
'''

FOUNDATION_TEST = r'''import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { DECK_STYLES, resolveDeckStyle } from "../src/config/decks.js";
import { HISTORY_KEY, HISTORY_LIMIT, SETTINGS_KEY } from "../src/config/legacy-storage.js";
import { escapeHtml } from "../src/core/html.js";
import { createBusinessRandom } from "../src/core/random/business-random.js";
import { cardBackPath, cardImagePath } from "../src/platform/assets.js";
import { createPlatformClientId } from "../src/platform/entropy.js";
import { createLifecycleClient } from "../src/platform/lifecycle-client.js";
import { createLegacyHistoryStore } from "../src/storage/legacy-history.js";
import { createLegacyReadingRecord } from "../src/storage/legacy-record.js";
import { createSettingsStore } from "../src/storage/settings.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

class MemoryStorage {
  constructor(initial = {}) {
    this.values = new Map(Object.entries(initial));
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }
}

assert.equal(DECK_STYLES.length, 4);
assert.equal(resolveDeckStyle("vintage").id, "arnoult");
assert.equal(resolveDeckStyle("missing").id, "rws");
assert.equal(cardImagePath("major-5", "swiss"), "assets/decks/swiss-1jj/major-5.png");
assert.equal(cardBackPath("piedmont"), "assets/decks/piedmont/card-back.jpg");
assert.equal(escapeHtml(`<>&"'`), "&lt;&gt;&amp;&quot;&#039;");

const settingsStorage = new MemoryStorage();
const settings = createSettingsStore(settingsStorage);
assert.deepEqual(settings.load(), {});
assert.equal(settings.save({ deckStyle: "swiss" }), true);
assert.deepEqual(settings.load(), { deckStyle: "swiss" });
assert.equal(settingsStorage.getItem(SETTINGS_KEY), '{"deckStyle":"swiss"}');
const malformedSettings = createSettingsStore(new MemoryStorage({ [SETTINGS_KEY]: "{" }));
assert.deepEqual(malformedSettings.load(), {});

const historyStorage = new MemoryStorage();
const history = createLegacyHistoryStore(historyStorage);
const records = Array.from({ length: 25 }, (_, index) => ({ id: String(index) }));
assert.equal(history.write(records), true);
assert.equal(history.load().length, HISTORY_LIMIT);
assert.equal(historyStorage.getItem(HISTORY_KEY) !== null, true);

const fallbackValues = [0, 0];
const fallbackRandom = createBusinessRandom({
  cryptoRef: null,
  fallbackRandom: () => fallbackValues.shift(),
});
assert.deepEqual(fallbackRandom.secureShuffle([1, 2, 3]), [2, 3, 1]);
const secureRandom = createBusinessRandom({
  cryptoRef: { getRandomValues(buffer) { buffer[0] = 2147483648; return buffer; } },
  fallbackRandom: () => { throw new Error("fallback must not run"); },
});
assert.equal(secureRandom.randomUnit(), 0.5);
assert.throws(
  () => createBusinessRandom({ cryptoRef: null, fallbackRandom: () => 1 }).randomUnit(),
  RangeError,
);

assert.equal(
  createPlatformClientId({ randomUUID: () => "00000000-0000-4000-8000-000000000000" }),
  "astra-00000000-0000-4000-8000-000000000000",
);
assert.equal(createPlatformClientId(null), null);
const entropySource = fs.readFileSync(path.join(root, "src/platform/entropy.js"), "utf8");
const lifecycleSource = fs.readFileSync(path.join(root, "src/platform/lifecycle-client.js"), "utf8");
assert.equal(entropySource.includes("Math.random"), false);
assert.equal(lifecycleSource.includes("Math.random"), false);

const noEntropyLifecycle = createLifecycleClient({
  windowRef: { location: { protocol: "http:", hostname: "127.0.0.1" } },
  locationRef: { protocol: "http:", hostname: "127.0.0.1" },
  cryptoRef: null,
});
assert.equal(noEntropyLifecycle.clientId, null);
assert.equal(noEntropyLifecycle.register(), false);
const lifecycle = createLifecycleClient({
  windowRef: {
    location: { protocol: "http:", hostname: "127.0.0.1" },
    addEventListener() {},
    setInterval() {},
  },
  navigatorRef: {},
  locationRef: { protocol: "http:", hostname: "127.0.0.1" },
  cryptoRef: { randomUUID: () => "test-client" },
  fetchFn: () => Promise.resolve(),
});
assert.equal(lifecycle.endpoint("open"), "/__astra/open?client=astra-test-client");
assert.equal(lifecycle.register(), true);

const record = createLegacyReadingRecord({
  id: "reading-1",
  createdAt: "2026-07-31T00:00:00.000Z",
  category: { id: "daily", name: "每日指引", icon: "✦", accent: "#fff" },
  question: { text: "今天的核心能量是什么？" },
  spread: { name: "单张牌" },
  deckStyle: "rose",
  draws: [
    {
      card: { name: "愚者" },
      reversed: true,
      position: { name: "核心讯息" },
    },
  ],
  synthesis: { headline: "测试标题" },
});
assert.deepEqual(record, {
  id: "reading-1",
  createdAt: "2026-07-31T00:00:00.000Z",
  categoryId: "daily",
  categoryName: "每日指引",
  categoryIcon: "✦",
  categoryAccent: "#fff",
  question: "今天的核心能量是什么？",
  spreadName: "单张牌",
  deckName: "皮埃蒙特",
  cards: [{ name: "愚者", orientation: "逆位", position: "核心讯息" }],
  headline: "测试标题",
});

console.log(
  "MOD-003B foundation contract passed: config, assets, storage, records, business random, and platform entropy are isolated.",
);
'''


def main() -> None:
    for path, content in MODULES.items():
        write(path, dedent(content).lstrip())
    write("src/app/legacy-runtime.js", dedent(LEGACY_RUNTIME).lstrip())
    write("tests/foundation_contract_test.mjs", dedent(FOUNDATION_TEST).lstrip())

    app = read("app.js")
    app = regex_once(
        app,
        r'  const \{ deck, categories, spreads \} = window\.TarotData;.*?  const byId',
        dedent(r'''  const { deck, categories, spreads } = window.TarotData;
  const runtime = window.AstraRuntime;
  if (!runtime) throw new Error("AstraRuntime bindings were not installed.");
  const {
    config: { DECK_STYLES, LEGACY_DECK_IDS },
    core: { escapeHtml, randomUnit, secureShuffle },
    platform: {
      resolveDeckStyle,
      cardImagePath,
      cardBackPath,
      registerServiceWorker,
      registerLocalLifecycle,
    },
    storage: {
      loadSettings,
      saveSettings,
      loadHistory,
      writeHistory: writeHistoryToStorage,
      readingRecord,
    },
  } = runtime;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const storedSettings = loadSettings();
  const storedDeckStyle = LEGACY_DECK_IDS[storedSettings.deckStyle] || storedSettings.deckStyle;
  const initialDeckStyle = DECK_STYLES.some((style) => style.id === storedDeckStyle)
    ? storedDeckStyle
    : "rws";

  const byId'''),
        "app runtime header",
    )
    app = replace_once(app, "  let lifecycleStream = null;\n\n", "", "remove lifecycle stream")
    app = regex_once(
        app,
        r'  function loadSettings\(\) \{.*?  function delay',
        dedent(r'''  function writeHistory(records) {
    const saved = writeHistoryToStorage(records);
    if (!saved) showToast("浏览器阻止了本地存储，本次记录未保存", "!");
    return saved;
  }

  function delay'''),
        "storage and random extraction",
    )
    app = regex_once(
        app,
        r'  function resolveDeckStyle\(style\) \{.*?  function renderCategories',
        "  function renderCategories",
        "config asset and html extraction",
    )
    app = regex_once(
        app,
        r'  function readingRecord\(reading\) \{.*?\n  \}\n\n  function persistCurrentReading',
        "  function persistCurrentReading",
        "reading record extraction",
    )
    app = regex_once(
        app,
        r'  function registerServiceWorker\(\) \{.*?\n  function initialize',
        "  function initialize",
        "platform extraction",
    )
    if "Math.random" in app:
        raise RuntimeError("app.js still contains Math.random after MOD-003B extraction")
    if "function loadSettings" in app or "function randomUnit" in app:
        raise RuntimeError("app.js still contains extracted foundation implementations")
    write("app.js", app)
    app_lines = len(app.splitlines())

    package = json.loads(read("package.json"))
    package["scripts"]["test:foundation"] = "node tests/foundation_contract_test.mjs"
    write("package.json", json.dumps(package, ensure_ascii=False, indent=2) + "\n")

    sw = read("sw.js")
    sw = replace_once(sw, 'const CACHE_NAME = "astra-tarot-v7";', 'const CACHE_NAME = "astra-tarot-v8";', "SW cache version")
    module_paths = [
        "src/config/decks.js",
        "src/config/legacy-storage.js",
        "src/core/html.js",
        "src/core/random/business-random.js",
        "src/platform/assets.js",
        "src/platform/entropy.js",
        "src/platform/lifecycle-client.js",
        "src/platform/pwa-client.js",
        "src/storage/settings.js",
        "src/storage/legacy-history.js",
        "src/storage/legacy-record.js",
    ]
    marker = '  "./src/app/legacy-runtime.js",\n'
    insertion = marker + "".join(f'  "./{path}",\n' for path in module_paths)
    sw = replace_once(sw, marker, insertion, "SW module resources")
    write("sw.js", sw)

    validate = read("automation/validate.py")
    marker = dedent('''        (
            "node-module-contract",
            [node, "tests/module_contract_test.mjs"],
        ),
''')
    insertion = dedent('''        (
            "node-foundation-contract",
            [node, "tests/foundation_contract_test.mjs"],
        ),
        (
            "node-module-contract",
            [node, "tests/module_contract_test.mjs"],
        ),
''')
    validate = replace_once(validate, marker, insertion, "validation foundation step")
    write("automation/validate.py", validate)

    baseline = json.loads(read("automation/quality-baseline.json"))
    baseline["task"] = "MOD-003B"
    for item in baseline["knownDebt"]:
        if item["path"] == "app.js":
            item["baselineLines"] = app_lines
    write("automation/quality-baseline.json", json.dumps(baseline, ensure_ascii=False, indent=2) + "\n")

    module_test = read("tests/module_contract_test.mjs")
    module_test = replace_once(
        module_test,
        '  "src/app/legacy-runtime.js",\n',
        '  "src/app/legacy-runtime.js",\n'
        + '  "tests/foundation_contract_test.mjs",\n'
        + "".join(f'  "{path}",\n' for path in module_paths),
        "module required files",
    )
    module_test = replace_once(
        module_test,
        'assert.equal(packageMetadata.scripts["test:contracts"], "node tests/module_contract_test.mjs");\n',
        'assert.equal(packageMetadata.scripts["test:contracts"], "node tests/module_contract_test.mjs");\n'
        'assert.equal(packageMetadata.scripts["test:foundation"], "node tests/foundation_contract_test.mjs");\n',
        "package foundation script",
    )
    module_test = replace_once(
        module_test,
        'assert.equal(runtimeModule.LEGACY_GLOBAL_NAME, "TarotData");\n',
        'assert.equal(runtimeModule.LEGACY_GLOBAL_NAME, "TarotData");\n'
        'assert.equal(runtimeModule.LEGACY_RUNTIME_GLOBAL_NAME, "AstraRuntime");\n'
        'assert.equal(typeof runtimeModule.createLegacyRuntimeBindings, "function");\n',
        "runtime binding exports",
    )
    old_app_assertions = dedent(r'''const appSource = read("app.js");
assert.match(appSource, /astra-tarot-history-v1/, "Legacy history storage key changed");
assert.match(appSource, /astra-tarot-settings-v1/, "Legacy settings storage key changed");
assert.match(appSource, /const HISTORY_LIMIT = 20;/, "Legacy history limit baseline changed");
assert.match(appSource, /window\.TarotData/, "Legacy app must remain behind the MOD-003A bridge until MOD-006A");
assert.match(appSource, /Math\.random\(\)/, "Current random fallback must be recorded until MOD-003B");
''')
    new_app_assertions = dedent(r'''const appSource = read("app.js");
const storageConfigSource = read("src/config/legacy-storage.js");
assert.match(storageConfigSource, /astra-tarot-history-v1/, "Legacy history storage key changed");
assert.match(storageConfigSource, /astra-tarot-settings-v1/, "Legacy settings storage key changed");
assert.match(storageConfigSource, /HISTORY_LIMIT = 20/, "Legacy history limit baseline changed");
assert.match(appSource, /window\.TarotData/, "Legacy app must remain behind the bridge until MOD-006A");
assert.match(appSource, /window\.AstraRuntime/, "Legacy app must consume MOD-003B runtime bindings");
for (const extractedImplementation of [
  "function loadSettings",
  "function loadHistory",
  "function randomUnit",
  "function secureShuffle",
  "function resolveDeckStyle",
  "function cardImagePath",
  "function escapeHtml",
  "function lifecycleEndpoint",
]) {
  assert.equal(appSource.includes(extractedImplementation), false, `${extractedImplementation} still lives in app.js`);
}
assert.equal(appSource.includes("Math.random"), false, "app.js still mixes platform and business random");
''')
    module_test = replace_once(module_test, old_app_assertions, new_app_assertions, "module app assertions")
    module_test = replace_once(
        module_test,
        'assert.match(legacyRuntimeSource, /app\\.js/);\n',
        'assert.match(legacyRuntimeSource, /app\\.js/);\n'
        'assert.match(legacyRuntimeSource, /createLegacyRuntimeBindings/);\n'
        'assert.match(legacyRuntimeSource, /AstraRuntime/);\n',
        "legacy runtime assertions",
    )
    module_test = replace_once(
        module_test,
        'assert.match(serviceWorkerSource, /astra-tarot-v7/, "MOD-003A must bump the cache version");',
        'assert.match(serviceWorkerSource, /astra-tarot-v8/, "MOD-003B must bump the cache version");',
        "SW test version",
    )
    module_test = replace_once(
        module_test,
        '  "src/app/legacy-runtime.js",\n  "data.js",',
        '  "src/app/legacy-runtime.js",\n'
        + "".join(f'  "{path}",\n' for path in module_paths)
        + '  "data.js",',
        "SW test module resources",
    )
    module_test = replace_once(
        module_test,
        '["app.js", 1528, "MOD-006A"],',
        f'["app.js", {app_lines}, "MOD-006A"],',
        "quality baseline app lines",
    )
    module_test = replace_once(
        module_test,
        '"MOD-003A module contract passed: native ESM entry, controlled legacy bridge, Node format, CSS cascade, and PWA resources are preserved.",',
        '"MOD-003B module contract passed: foundation modules are wired through the controlled bridge while public IDs, CSS, and PWA resources remain stable.",',
        "module contract message",
    )
    write("tests/module_contract_test.mjs", module_test)

    python_test = read("tests/test_app_contract.py")
    python_test = replace_once(
        python_test,
        '        self.assertTrue((ROOT / "src/app/legacy-runtime.js").is_file())\n',
        '        self.assertTrue((ROOT / "src/app/legacy-runtime.js").is_file())\n'
        + "".join(f'        self.assertTrue((ROOT / "{path}").is_file())\n' for path in module_paths),
        "python required modules",
    )
    deck_method_pattern = r'    def test_deck_selection_switches_real_faces_and_backs_without_color_filters\(self\) -> None:\n.*?\n    def test_static_assets_do_not_require_remote_cdn'
    deck_method = dedent(r'''    def test_deck_selection_switches_real_faces_and_backs_without_color_filters(self) -> None:
        app_source = (ROOT / "app.js").read_text(encoding="utf-8")
        deck_source = (ROOT / "src/config/decks.js").read_text(encoding="utf-8")
        asset_source = (ROOT / "src/platform/assets.js").read_text(encoding="utf-8")
        styles = read_styles()
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        for deck_id, deck_name, asset_directory in (
            ("rws", "经典韦特", "assets/rws"),
            ("arnoult", "阿尔诺古典", "assets/decks/arnoult"),
            ("swiss", "瑞士 1JJ", "assets/decks/swiss-1jj"),
            ("piedmont", "皮埃蒙特", "assets/decks/piedmont"),
        ):
            self.assertIn(f'id: "{deck_id}"', deck_source)
            self.assertIn(f'name: "{deck_name}"', deck_source)
            self.assertIn(f'assetDirectory: "{asset_directory}"', deck_source)
        self.assertIn("cardImagePath(card.id, deckStyle)", app_source)
        self.assertIn("cardBackPath(deckStyle)", app_source)
        self.assertIn("resolveDeckStyle", asset_source)
        self.assertIn('class="tarot-face-art"', app_source)
        self.assertIn("选择牌面", html)
        self.assertIn("正面与牌背一一对应", html)
        self.assertIn("不使用滤镜换色", html)
        self.assertNotIn("card-back-v2.jpg", app_source)
        self.assertNotIn("card-back-v2.jpg", html)
        self.assertNotIn("card-back-v2.jpg", (ROOT / "sw.js").read_text(encoding="utf-8"))
        for color_filter in ("sepia(", "hue-rotate(", "grayscale(", "contrast("):
            self.assertNotIn(color_filter, styles)
        self.assertNotIn("mix-blend-mode", styles)

    def test_static_assets_do_not_require_remote_cdn''')
    python_test = regex_once(python_test, deck_method_pattern, deck_method, "python deck method")
    python_test = replace_once(
        python_test,
        '            "src/app/legacy-runtime.js",\n',
        '            "src/app/legacy-runtime.js",\n'
        + "".join(f'            "{path}",\n' for path in module_paths),
        "python CDN module list",
    )
    lifecycle_pattern = r'    def test_page_lifecycle_stream_is_wired_end_to_end\(self\) -> None:\n.*?\n\n\nif __name__ == "__main__":'
    lifecycle_method = dedent(r'''    def test_page_lifecycle_stream_is_wired_end_to_end(self) -> None:
        app_source = (ROOT / "app.js").read_text(encoding="utf-8")
        lifecycle_source = (ROOT / "src/platform/lifecycle-client.js").read_text(encoding="utf-8")
        entropy_source = (ROOT / "src/platform/entropy.js").read_text(encoding="utf-8")
        launcher_source = (ROOT / "run.py").read_text(encoding="utf-8")
        worker_source = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn("registerLocalLifecycle", app_source)
        self.assertIn("new EventSourceCtor", lifecycle_source)
        self.assertNotIn("Math.random", lifecycle_source)
        self.assertNotIn("Math.random", entropy_source)
        self.assertIn("/__astra/events", launcher_source)
        self.assertIn('startsWith("/__astra/")', worker_source)


if __name__ == "__main__":''')
    python_test = regex_once(python_test, lifecycle_pattern, lifecycle_method, "python lifecycle method")
    write("tests/test_app_contract.py", python_test)

    automation_readme = read("automation/README.md")
    automation_readme = replace_once(
        automation_readme,
        "Phase M 的 `MOD-001`、`MOD-002` 与 `MOD-003A` 当前实现：",
        "Phase M 的 `MOD-001`、`MOD-002`、`MOD-003A` 与 `MOD-003B` 当前实现：",
        "automation scope text",
    )
    automation_readme = replace_once(
        automation_readme,
        "3. `node tests/module_contract_test.mjs`\n4. `python scripts/check_module_size.py --mode baseline --format json`\n5. `python scripts/check_import_boundaries.py --format json`",
        "3. `node tests/foundation_contract_test.mjs`\n4. `node tests/module_contract_test.mjs`\n5. `python scripts/check_module_size.py --mode baseline --format json`\n6. `python scripts/check_import_boundaries.py --format json`",
        "automation step list",
    )
    automation_readme += dedent(f'''

## MOD-003B 基础边界

- `app.js` 当前基线下调为 {app_lines} 行，仍为 `MOD-006A` 前必须清除的 WARN。
- 业务随机位于 `src/core/random/business-random.js`，保留Web Crypto优先和显式普通随机回退，可注入测试源。
- 平台安全熵位于 `src/platform/entropy.js`，生命周期ID不得使用 `Math.random`；无安全熵时禁用生命周期信号。
- 配置、资源、设置、历史、旧ReadingRecord、PWA注册和生命周期均由真实兼容桥注入旧应用。
- `tests/foundation_contract_test.mjs` 直接验证这些模块，不需要浏览器或npm依赖。
''')
    write("automation/README.md", automation_readme)

    module_map = read("docs/MODULE_MAP.md")
    module_map += dedent(f'''

---

## 15. MOD-003B 已接线基础模块

当前真实页面在兼容桥加载 `app.js` 前安装冻结的 `window.AstraRuntime`：

```text
src/config/decks.js
src/config/legacy-storage.js
src/core/html.js
src/core/random/business-random.js
src/platform/assets.js
src/platform/entropy.js
src/platform/lifecycle-client.js
src/platform/pwa-client.js
src/storage/settings.js
src/storage/legacy-history.js
src/storage/legacy-record.js
```

- `app.js` 不再实现以上能力，当前基线为 {app_lines} 行。
- 业务随机与平台安全熵分开；仅业务随机允许显式普通随机回退。
- 平台安全熵不可用时，本地生命周期客户端禁用，不使用弱随机伪装安全ID。
- 旧 `window.TarotData` 和 `window.AstraRuntime` 只属于Phase M兼容层，删除任务为 `MOD-006A`。
''')
    write("docs/MODULE_MAP.md", module_map)

    src_readme = read("src/README.md")
    src_readme += dedent('''

## 当前活动JavaScript基础模块

`MOD-003B` 已让配置、核心工具、平台客户端和存储适配器通过 `src/app/legacy-runtime.js` 被真实页面使用。业务随机位于core层；安全熵、生命周期和PWA位于platform层；设置与旧历史位于storage层。旧 `app.js` 只通过受控 `window.AstraRuntime` 消费这些能力。
''')
    write("src/README.md", src_readme)

    print(
        f"mod_003b_applied app_lines={app_lines} modules={len(module_paths)} "
        "cache=astra-tarot-v8 foundation_test=enabled"
    )


if __name__ == "__main__":
    main()
