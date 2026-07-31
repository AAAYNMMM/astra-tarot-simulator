import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GOLDEN_CARD_IDS, loadGoldenCardProfile } from "../src/knowledge/cards/registry.js";
import { validateCardSemanticProfile } from "../src/engine/validation/card-profile-validator.js";
import { validateCardVocabulary } from "../src/engine/validation/vocabulary-validator.js";
import { scoreCardProfile } from "../src/engine/validation/card-quality-gate.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "src/knowledge/schemas/card-semantic-profile.schema.json"), "utf8"));
assert.deepEqual(GOLDEN_CARD_IDS, ["major-0", "major-7", "major-9", "major-16", "cups-two", "pentacles-eight"]);
for (const cardId of GOLDEN_CARD_IDS) {
  const card = await loadGoldenCardProfile(cardId);
  assert.equal(card.id, cardId);
  assert.deepEqual(validateCardSemanticProfile(card, schema), [], cardId);
  assert.equal(validateCardVocabulary(card).valid, true, cardId);
  const result = scoreCardProfile(card, schema);
  assert.ok(result.score >= 90, `${cardId} score ${result.score}`);
  assert.equal(result.admitted, true);
}
console.log("TQ-003/TQ-004 six golden profiles and development quality gate passed.");
