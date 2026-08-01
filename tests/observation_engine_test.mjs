import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCardProfile } from "../src/knowledge/cards/registry.js";
import { loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { LEGACY_SPREADS_V1 as SPREADS } from "../src/knowledge/spreads/definitions.js";
import { getLegacyPositionOperator as getPositionOperator } from "../src/knowledge/spreads/operators/index.js";
import { createMinimalObservation } from "../src/engine/observations/minimal-consumer.js";
import { createObservation, createSpreadObservations } from "../src/engine/observations/observation-engine.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/consumer/cases.json"), "utf8"));
const observations = new Map();
for (const fixture of fixtures) {
  const input = {
    card: await loadCardProfile(fixture.cardId),
    question: await loadQuestionProfile(fixture.questionId),
    operator: getPositionOperator(fixture.spreadId, fixture.positionId),
    orientation: fixture.orientation,
    reversalMode: fixture.reversalMode,
  };
  const first = createObservation(input);
  const second = createObservation(input);
  assert.deepEqual(first, second, fixture.id);
  assert.deepEqual(createMinimalObservation(input), first, `${fixture.id}: compatibility consumer`);
  assert.ok(first.matchedDimensions.length > 0);
  assert.equal(first.selectionTrace[0].semanticUnitRef, first.semanticUnitRef);
  observations.set(fixture.id, first);
}
for (const [left, right] of [
  ["consumer-chariot-core", "consumer-chariot-action"],
  ["consumer-hermit-below", "consumer-hermit-advice"],
  ["consumer-tower-root", "consumer-tower-trend"],
  ["consumer-cups-core", "consumer-cups-action"],
  ["consumer-pentacles-present", "consumer-pentacles-future"],
]) {
  assert.notEqual(observations.get(left).semanticUnitRef, observations.get(right).semanticUnitRef, `${left}/${right}`);
  assert.notEqual(observations.get(left).selectedFacet, observations.get(right).selectedFacet, `${left}/${right}`);
}
const question = await loadQuestionProfile("career-change");
const cardIds = ["major-7", "major-9", "major-16", "cups-two", "pentacles-eight", "swords-ace", "wands-ace", "major-0", "cups-ace", "pentacles-ace"];
for (const spread of SPREADS) {
  const draw = [];
  for (const [index, position] of spread.positions.entries()) {
    const card = await loadCardProfile(cardIds[index]);
    const reversed = index % 2 === 1;
    draw.push({
      card,
      positionId: position.id,
      orientation: reversed ? "reversed" : "upright",
      reversalMode: reversed ? card.reversal.supportedModes[0] : null,
    });
  }
  const result = createSpreadObservations({ draw, question, spreadId: spread.id, spreadDefinitionVersion: "1.0.0" });
  assert.equal(result.observations.length, spread.positions.length);
  assert.deepEqual(result.observations.map((item) => item.positionId), spread.positions.map((item) => item.id));
}
const chariot = await loadCardProfile("major-7");
const upright = createObservation({ card: chariot, question, operator: getPositionOperator("cross", "action"), orientation: "upright", reversalMode: null });
const reversed = createObservation({ card: chariot, question, operator: getPositionOperator("cross", "action"), orientation: "reversed", reversalMode: "misdirected" });
assert.notDeepEqual(upright.dimensions, reversed.dimensions);
assert.equal(reversed.reversalMechanism.applied, true);
console.log("PO-003 deterministic Observation Engine passed targeted and full-spread consumption tests.");
