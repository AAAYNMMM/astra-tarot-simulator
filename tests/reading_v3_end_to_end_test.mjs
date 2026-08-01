import assert from "node:assert/strict";

import { createReadingFactory } from "../src/app/controllers/reading-controller.js";
import { createReadingRandomContextFactory } from "../src/core/random/production-random.js";
import { executeSpreadReadingRequest } from "../src/engine/decisive/spread-reading.js";
import { validateReadingPresentationV3 } from "../src/engine/interpretation/reading-presentation-validator.js";
import { CARD_PROFILE_IDS, loadCardProfile } from "../src/knowledge/cards/registry.js";
import { SPREADS } from "../src/knowledge/spreads/definitions.js";

const GRADES = new Set(["SSS", "SS", "S", "A", "B", "C", "D", "E"]);
const FORBIDDEN_KEYS = new Set([
  "question", "questionId", "questionText", "categoryId", "domain", "intent", "questionType",
  "expectation", "expectationId", "criterionId", "timeframe", "comparison",
]);

function findForbiddenKey(value, path = "$") {
  if (!value || typeof value !== "object") return null;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) return `${path}.${key}`;
    const nested = findForbiddenKey(child, `${path}.${key}`);
    if (nested) return nested;
  }
  return null;
}

function requestFor(spread) {
  return {
    protocolVersion: "3.0.0",
    readingId: `reading-v3-${spread.id}`,
    spreadId: spread.id,
    spreadDefinitionVersion: "2.0.0",
    draws: spread.positions.map((position, index) => ({
      cardId: CARD_PROFILE_IDS[index],
      positionId: position.id,
      orientation: index % 2 === 0 ? "upright" : "reversed",
    })),
    randomAudit: createReadingRandomContextFactory()({ rootSeed: `v3-e2e-${spread.id}` }).audit,
  };
}

for (const spread of SPREADS) {
  const request = requestFor(spread);
  const first = await executeSpreadReadingRequest(request);
  const replay = await executeSpreadReadingRequest(structuredClone(request));
  assert.equal(first.status, "completed", spread.id);
  assert.equal(first.presentation.status, "complete", spread.id);
  assert.ok(GRADES.has(first.presentation.grade.level), spread.id);
  assert.deepEqual(validateReadingPresentationV3(first.presentation), [], spread.id);
  assert.equal(first.presentation.factorBands.length, 8, spread.id);
  assert.ok(first.presentation.factorBands.every((factor) => ["high", "medium", "low", "not-applicable"].includes(factor.band)));
  assert.ok(first.presentation.favorableFactors.length >= 1 && first.presentation.favorableFactors.length <= 3);
  assert.ok(first.presentation.limitingFactors.length >= 1 && first.presentation.limitingFactors.length <= 3);
  assert.ok(first.presentation.conditions.success.length >= 1);
  assert.ok(first.presentation.conditions.stopSignals.length >= 1);
  assert.equal(findForbiddenKey(first.engineResult), null, spread.id);
  assert.equal(findForbiddenKey(first.presentation), null, spread.id);
  assert.equal("internalScore" in first.presentation, false);
  assert.deepEqual(first.engineResult, replay.engineResult, `${spread.id}: engine replay`);
  assert.deepEqual(first.presentation, replay.presentation, `${spread.id}: presentation replay`);
  assert.equal(first.engineResult.cardDetails.length, spread.positions.length);
  for (const [index, detail] of first.engineResult.cardDetails.entries()) {
    const card = await loadCardProfile(request.draws[index].cardId);
    const expectedMeaning = request.draws[index].orientation === "reversed"
      ? card.traditions.reversedSummary
      : card.traditions.uprightSummary;
    assert.equal(detail.baseMeaning, expectedMeaning, `${spread.id}/${detail.positionId}: base meaning`);
    assert.ok(detail.positionMeaning.length > 0);
    assert.ok(detail.spreadRole.length > 0);
    assert.ok(detail.relations.length <= 3);
    if (request.draws[index].orientation === "reversed") assert.ok(detail.reversalMode);
    assert.equal(JSON.stringify(first.presentation).includes(detail.cardName), false, `${spread.id}: summary leaked card name`);
  }
  if (spread.id === "single") {
    assert.equal(first.presentation.grade.level === "SSS" || first.presentation.grade.level === "SS", false);
    assert.deepEqual(first.engineResult.cardDetails[0].relations, []);
  } else {
    assert.ok(first.engineResult.cardDetails.some((detail) => detail.relations.length > 0));
  }
  if (spread.id === "celtic") {
    assert.ok(["supported", "conditional", "contradicted"].includes(first.presentation.resultSupport.status));
    assert.ok(first.presentation.basis.some((item) => /支持结果|限制结果|条件性支持/u.test(item.text)));
  }
}

const deterministicSpread = SPREADS.find((spread) => spread.id === "timeline");
const deck = Array.from({ length: 12 }, (_, index) => ({ id: `card-${index}`, name: `牌${index}`, arcana: "major" }));
const createRandomContext = () => createReadingRandomContextFactory()({ rootSeed: "question-independent-root" });
const createReading = createReadingFactory({
  deck,
  selectors: {
    currentSpread: () => deterministicSpread,
    currentDeckStyle: () => "rws",
  },
  createRandomContext,
  now: () => new Date("2026-08-01T00:00:00.000Z"),
});
const firstQuestion = createReading({ questionText: "问题甲" });
const secondQuestion = createReading({ questionText: "正文完全不同的问题乙" });
assert.deepEqual(firstQuestion.randomAudit, secondQuestion.randomAudit);
assert.deepEqual(
  firstQuestion.draws.map((draw) => [draw.card.id, draw.position.id, draw.reversed]),
  secondQuestion.draws.map((draw) => [draw.card.id, draw.position.id, draw.reversed]),
);

await assert.rejects(() => executeSpreadReadingRequest({
  ...requestFor(SPREADS[0]),
  spreadDefinitionVersion: "1.0.0",
}));

console.log("Reading v3 end-to-end passed for four spreads, traditional base meanings, replay, presentation contracts, and question-independent random draws.");
