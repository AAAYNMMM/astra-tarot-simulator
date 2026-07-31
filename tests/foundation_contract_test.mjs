import assert from "node:assert/strict";
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
