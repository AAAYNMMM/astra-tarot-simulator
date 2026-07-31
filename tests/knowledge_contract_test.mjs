import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { TarotData, LEGACY_KNOWLEDGE_METADATA } from "../src/knowledge/legacy/index.js";
import {
  categoryLens,
  cardStructureNote,
  orientationNote,
  reflectionPrompt,
} from "../src/engine/legacy/card-reading.js";
import { createSynthesis } from "../src/engine/legacy/synthesis.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotSource = fs.readFileSync(path.join(root, "data.js"), "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(snapshotSource, sandbox, { filename: "data.js" });
const snapshot = sandbox.window.TarotData;

assert.equal(JSON.stringify(TarotData), JSON.stringify(snapshot), "ESM knowledge must exactly match legacy data snapshot");
assert.equal(TarotData.deck.length, 78);
assert.equal(TarotData.categories.reduce((sum, category) => sum + category.questions.length, 0), 42);
assert.deepEqual(TarotData.spreads.map((spread) => spread.positions.length), [1, 3, 5, 10]);
assert.equal(LEGACY_KNOWLEDGE_METADATA.transitional, true);
assert.equal(LEGACY_KNOWLEDGE_METADATA.sourceKind, "human-authored");
assert.equal(LEGACY_KNOWLEDGE_METADATA.cardCount, 78);
assert.equal(LEGACY_KNOWLEDGE_METADATA.questionCount, 42);
assert.equal(LEGACY_KNOWLEDGE_METADATA.spreadCount, 4);

const reading = {
  category: TarotData.categories[0],
  question: TarotData.categories[0].questions[0],
  spread: TarotData.spreads[0],
  draws: [{ card: TarotData.deck[0], reversed: false, position: TarotData.spreads[0].positions[0] }],
};
assert.match(categoryLens(reading.draws[0], reading), /这张牌浓缩了问题最需要被看见的能量/);
assert.match(cardStructureNote(reading.draws[0].card), /大阿卡纳/);
assert.match(orientationNote(reading.draws[0]), /正位/);
assert.match(reflectionPrompt(reading.draws[0], reading), /真正需要/);
const synthesis = createSynthesis(reading);
assert.equal(typeof synthesis.headline, "string");
assert.equal(synthesis.actions.length, 3);

const runtimeSource = fs.readFileSync(path.join(root, "src/app/legacy-runtime.js"), "utf8");
assert.match(runtimeSource, /from "\.\.\/knowledge\/legacy\/index\.js"/);
assert.equal(runtimeSource.includes("../../data.js"), false, "runtime still loads root data.js");
assert.deepEqual([...((await import("../src/app/legacy-runtime.js")).LEGACY_SCRIPT_PATHS)], ["../../app.js"]);

const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
for (const name of [
  "categoryLens", "cardStructureNote", "orientationNote", "reflectionPrompt",
  "dominantElement", "createSpreadNarrative", "createConnections", "createActionSteps",
  "createSynthesis", "elementMeaning", "categoryFallbackAction",
]) {
  assert.equal(appSource.includes(`function ${name}(`), false, `${name} still lives in app.js`);
}
for (const relative of [
  "src/knowledge/legacy/cards/major.js",
  "src/knowledge/legacy/cards/minor.js",
  "src/knowledge/legacy/questions.js",
  "src/knowledge/spreads/definitions.js",
  "src/knowledge/legacy/build.js",
  "src/knowledge/legacy/index.js",
]) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  assert.equal(source.includes("window."), false, `${relative} must be importable without browser globals`);
  assert.ok(source.split(/\r?\n/).length <= 601, `${relative} exceeds manual JavaScript limit`);
}
console.log("MOD-005 knowledge contract passed: 78 cards, 42 questions, four spreads, and legacy interpretation remain byte-equivalent at the data level.");
