import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateJsonSchema } from "../src/engine/validation/schema-validator.js";
import { GOLDEN_CARD_IDS } from "../src/knowledge/cards/registry.js";
import { QUESTION_PROFILE_IDS } from "../src/knowledge/questions/registry.js";
import { getLegacyPositionOperator as getPositionOperator } from "../src/knowledge/spreads/operators/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const schema = readJson("src/knowledge/schemas/consumer-fixture.schema.json");
const fixtures = readJson("tests/fixtures/consumer/cases.json");
assert.equal(fixtures.length, 12);
for (const fixture of fixtures) {
  assert.deepEqual(validateJsonSchema(fixture, schema), [], fixture.id);
  assert.ok(GOLDEN_CARD_IDS.includes(fixture.cardId));
  assert.ok(QUESTION_PROFILE_IDS.includes(fixture.questionId));
  assert.ok(getPositionOperator(fixture.spreadId, fixture.positionId));
  if (fixture.orientation === "upright") assert.equal(fixture.reversalMode, null);
}
console.log("TQ-005A formal consumer fixtures passed.");
