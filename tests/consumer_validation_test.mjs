import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGoldenCardProfile } from "../src/knowledge/cards/registry.js";
import { loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { getLegacyPositionOperator as getPositionOperator } from "../src/knowledge/spreads/operators/index.js";
import { createMinimalObservation } from "../src/engine/observations/minimal-consumer.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/consumer/cases.json"), "utf8"));
const observations = new Map();
for (const fixture of fixtures) {
  const input = {
    card: await loadGoldenCardProfile(fixture.cardId),
    question: await loadQuestionProfile(fixture.questionId),
    operator: getPositionOperator(fixture.spreadId, fixture.positionId),
    orientation: fixture.orientation,
    reversalMode: fixture.reversalMode,
  };
  const first = createMinimalObservation(input);
  const second = createMinimalObservation(input);
  assert.deepEqual(first, second, fixture.id);
  assert.ok(first.semanticUnitRef.startsWith(`${fixture.cardId}#`));
  assert.equal(Number.isFinite(first.localScore), true);
  assert.equal(first.positionId, fixture.positionId);
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
console.log("TQ-005B golden Card, Question, and Position contracts produce deterministic legal minimal observations.");
