import assert from "node:assert/strict";
import { createReadingRandomContextFactory, replayReadingRandomContext } from "../src/core/random/production-random.js";
import { createReadingFactory } from "../src/app/controllers/reading-controller.js";

const deterministicCrypto = {
  getRandomValues(buffer) {
    for (let index = 0; index < buffer.length; index += 1) buffer[index] = index + 1;
    return buffer;
  },
};
const factory = createReadingRandomContextFactory({ cryptoRef: deterministicCrypto });
const first = factory();
const second = replayReadingRandomContext(first.audit);
assert.equal(first.audit.entropySource, "web-crypto");
assert.equal(first.audit.rootSeed, second.audit.rootSeed);
assert.deepEqual(first.draw.shuffle([1, 2, 3, 4, 5]), second.draw.shuffle([1, 2, 3, 4, 5]));
assert.deepEqual(
  Array.from({ length: 8 }, () => first.orientation.nextUnit()),
  Array.from({ length: 8 }, () => second.orientation.nextUnit()),
);

const isolatedA = factory({ rootSeed: "fixed-seed" });
const isolatedB = factory({ rootSeed: "fixed-seed" });
for (let index = 0; index < 20; index += 1) isolatedA.rendering.nextUnit();
assert.deepEqual(isolatedA.draw.shuffle([1, 2, 3, 4]), isolatedB.draw.shuffle([1, 2, 3, 4]));

const deck = Array.from({ length: 12 }, (_, index) => ({ id: `card-${index}`, name: `Card ${index}` }));
const spread = { id: "timeline", name: "时间之流", positions: [
  { id: "past", name: "过去" }, { id: "present", name: "现在" }, { id: "future", name: "未来" },
]};
const selectors = {
  currentCategory: () => ({ id: "daily", name: "每日" }),
  currentQuestion: () => ({ id: "daily-focus", text: "今天关注什么？" }),
  currentSpread: () => spread,
  currentDeckStyle: () => "rws",
};
const makeReading = createReadingFactory({
  deck,
  selectors,
  createRandomContext: () => factory({ rootSeed: "replay-seed" }),
  now: () => new Date("2026-08-01T00:00:00.000Z"),
});
const readingA = makeReading();
const readingB = makeReading();
assert.deepEqual(
  readingA.draws.map((draw) => [draw.card.id, draw.reversed]),
  readingB.draws.map((draw) => [draw.card.id, draw.reversed]),
);
assert.equal(readingA.randomAudit.rootSeed, "replay-seed");
assert.equal(Object.keys(readingA).includes("renderingRandom"), false);
console.log("AU-001B production random integration passed.");
