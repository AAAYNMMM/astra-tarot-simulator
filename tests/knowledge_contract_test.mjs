import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TarotData, LEGACY_KNOWLEDGE_METADATA } from "../src/knowledge/legacy/index.js";
import { categoryLens, cardStructureNote, orientationNote, reflectionPrompt } from "../src/engine/legacy/card-reading.js";
import { createSynthesis } from "../src/engine/legacy/synthesis.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fingerprint = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/legacy-knowledge-fingerprint.json"), "utf8"));
const serialized = JSON.stringify(TarotData);
assert.equal(crypto.createHash("sha256").update(serialized).digest("hex"), fingerprint.sha256);
assert.equal(Buffer.byteLength(serialized), fingerprint.bytes);
assert.equal(TarotData.deck.length, 78);
assert.equal(TarotData.categories.reduce((sum, category) => sum + category.questions.length, 0), fingerprint.questions);
assert.deepEqual(TarotData.spreads.map((spread) => spread.positions.length), [1, 3, 5, 10]);
assert.equal(LEGACY_KNOWLEDGE_METADATA.transitional, true);

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
assert.equal(createSynthesis(reading).actions.length, 3);
for (const removed of ["app.js", "data.js", "src/app/legacy-runtime.js"]) {
  assert.equal(fs.existsSync(path.join(root, removed)), false);
}
console.log("MOD-006A knowledge contract passed: the frozen legacy fingerprint survives removal of root snapshots.");
