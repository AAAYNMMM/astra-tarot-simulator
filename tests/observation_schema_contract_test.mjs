import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCardProfile } from "../src/knowledge/cards/registry.js";
import { loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { getPositionOperator } from "../src/knowledge/spreads/operators/index.js";
import { createObservation } from "../src/engine/observations/observation-engine.js";
import { validateObservation } from "../src/engine/validation/observation-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "src/knowledge/schemas/observation.schema.json"), "utf8"));
const card = await loadCardProfile("major-7");
const question = await loadQuestionProfile("career-change");
const uprightInput = { card, question, operator: getPositionOperator("cross", "core"), orientation: "upright", reversalMode: null };
const reversedInput = { card, question, operator: getPositionOperator("cross", "action"), orientation: "reversed", reversalMode: "misdirected" };
for (const input of [uprightInput, reversedInput]) {
  const observation = createObservation(input);
  assert.deepEqual(validateObservation(observation, { ...input, schema }), []);
  assert.ok(observation.semanticUnitRef.startsWith(`${card.id}#`));
  assert.ok(observation.sourceRefs.length > 0);
  assert.equal(Number.isFinite(observation.localScore), true);
}
const valid = createObservation(uprightInput);
const unknown = { ...valid, semanticUnitRef: `${card.id}#state.unknown` };
assert.ok(validateObservation(unknown, { ...uprightInput, schema }).some((item) => item.code === "observation.semantic_reference_unknown"));
const wrongScore = { ...valid, localScore: valid.localScore + 0.1 };
assert.ok(validateObservation(wrongScore, { ...uprightInput, schema }).some((item) => item.code === "observation.local_score_mismatch"));
assert.throws(() => createObservation({ ...uprightInput, orientation: "reversed", reversalMode: "not-a-mode" }));
console.log("PO-003 Observation schema and semantic-reference contract passed.");
