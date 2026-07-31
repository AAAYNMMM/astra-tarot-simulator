import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createReadingState, resetReadingState } from "../src/app/state/reading-state.js";
import { createSelectionSelectors } from "../src/app/selectors/current-selection.js";
import { createReadingFactory } from "../src/app/controllers/reading-controller.js";
import { historyRecordView } from "../src/ui/renderers/history.js";
import { safeColor, safeIdentifier } from "../src/ui/safe-dom.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const categories = [{ id: "daily", questions: [{ id: "daily-focus", text: "今天？" }] }];
const spreads = [{ id: "single", positions: [{ id: "essence", name: "核心" }] }, { id: "timeline", positions: [{ id: "past" }] }];
const deckStyles = [{ id: "rws", name: "经典韦特" }];
const state = createReadingState({ categories, initialDeckStyle: "rws" });
const selectors = createSelectionSelectors({ categories, spreads, deckStyles, state });
assert.equal(selectors.currentCategory().id, "daily");
assert.equal(selectors.currentQuestion().id, "daily-focus");
assert.equal(selectors.currentSpread().id, "timeline");
state.phase = "complete";
state.revealed.add(0);
resetReadingState(state);
assert.equal(state.phase, "setup");
assert.equal(state.revealed.size, 0);

const deck = [{ id: "major-0" }, { id: "major-1" }];
const values = [0.75, 0.1, 0.8];
const createReading = createReadingFactory({
  deck,
  selectors,
  secureShuffle: (items) => [...items],
  randomUnit: () => values.shift() ?? 0.5,
  now: () => new Date("2026-07-31T00:00:00.000Z"),
});
const reading = createReading();
assert.equal(reading.draws.length, 1);
assert.equal(reading.draws[0].reversed, false);
assert.match(reading.id, /^reading-1785456000000-/);

const attack = '<img src=x onerror="globalThis.pwned=true">';
const view = historyRecordView({
  id: `x\" data-owned=\"1`,
  categoryAccent: "red; background:url(javascript:alert(1))",
  categoryIcon: attack,
  question: attack,
  categoryName: attack,
  spreadName: attack,
  headline: attack,
  cards: [{ position: attack, name: attack, orientation: attack }],
}, () => attack);
assert.equal(view.question, attack);
assert.equal(view.accent, "#d8bb7a");
assert.equal(view.cards[0].name, attack);
assert.equal(safeIdentifier("daily-focus"), "daily-focus");
assert.equal(safeIdentifier('x\" onclick=\"1'), "unknown");
assert.equal(safeColor("#AABBCC"), "#aabbcc");

for (const relative of [
  "src/ui/renderers/history.js",
  "src/ui/components/toast.js",
]) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  assert.equal(source.includes("innerHTML"), false, `${relative} must not write untrusted HTML`);
  assert.equal(source.includes("insertAdjacentHTML"), false, `${relative} must not append untrusted HTML`);
}

const appSource = fs.readFileSync(path.join(root, "src/app/application.js"), "utf8");
for (const removed of [
  "const state = {",
  "function currentCategory()",
  "function renderCategories()",
  "function runShuffleAnimation()",
  "function showToast(",
  "function renderHistory()",
  "function bindEvents()",
]) {
  assert.equal(appSource.includes(removed), false, `app.js still owns ${removed}`);
}
console.log("MOD-004A UI contract passed: state, selectors, controller, renderers, animation, events, and hostile history boundaries are active.");
