import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

import { executeDecisiveReading } from "../src/engine/decisive/reading.js";
import { validateConciseInterpretation } from "../src/engine/concise/interpretation.js";
import { CARD_PROFILE_IDS } from "../src/knowledge/cards/registry.js";
import { QUESTION_PROFILE_IDS } from "../src/knowledge/questions/registry.js";
import { SPREADS } from "../src/knowledge/spreads/definitions.js";

function drawsFor(spread, targetIndex, targetOrientation, questionIndex) {
  const targetSlot = (targetIndex + questionIndex) % spread.positions.length;
  const selected = new Array(spread.positions.length);
  const used = new Set([CARD_PROFILE_IDS[targetIndex]]);
  selected[targetSlot] = CARD_PROFILE_IDS[targetIndex];
  let cursor = (targetIndex + questionIndex * 7 + 1) % CARD_PROFILE_IDS.length;
  for (let slot = 0; slot < selected.length; slot += 1) {
    if (slot === targetSlot) continue;
    while (used.has(CARD_PROFILE_IDS[cursor])) cursor = (cursor + 1) % CARD_PROFILE_IDS.length;
    selected[slot] = CARD_PROFILE_IDS[cursor];
    used.add(CARD_PROFILE_IDS[cursor]);
    cursor = (cursor + 11) % CARD_PROFILE_IDS.length;
  }
  return spread.positions.map((position, slot) => ({
    cardId: selected[slot],
    cardName: selected[slot],
    positionId: position.id,
    positionName: position.name,
    orientation: slot === targetSlot
      ? targetOrientation
      : ((questionIndex + targetIndex + slot) % 4 === 0 ? "reversed" : "upright"),
  }));
}

const expected = CARD_PROFILE_IDS.length * 2 * QUESTION_PROFILE_IDS.length * SPREADS.length;
const timings = Object.fromEntries(SPREADS.map((spread) => [spread.id, []]));
let completed = 0;
const startedAt = performance.now();

for (const [questionIndex, questionId] of QUESTION_PROFILE_IDS.entries()) {
  const categoryId = questionId.split("-")[0];
  for (const spread of SPREADS) {
    for (const [targetIndex] of CARD_PROFILE_IDS.entries()) {
      for (const orientation of ["upright", "reversed"]) {
        const started = performance.now();
        const caseId = `${questionId}/${spread.id}/${CARD_PROFILE_IDS[targetIndex]}/${orientation}`;
        let result;
        try {
          result = await executeDecisiveReading({
            questionId,
            questionText: questionId,
            categoryId,
            spreadId: spread.id,
            draws: drawsFor(spread, targetIndex, orientation, questionIndex),
          });
        } catch (error) {
          throw new Error(`${caseId}: ${error.message}`, { cause: error });
        }
        timings[spread.id].push(performance.now() - started);
        assert.equal(result.status, "completed");
        assert.equal(result.synthesis.schemaVersion, "4.0.0");
        assert.deepEqual(
          validateConciseInterpretation(result.synthesis, { drawCount: spread.positions.length }),
          [],
          caseId,
        );
        completed += 1;
      }
    }
  }
}

assert.equal(completed, expected);
const percentiles = Object.fromEntries(Object.entries(timings).map(([spreadId, values]) => {
  values.sort((left, right) => left - right);
  return [spreadId, {
    medianMs: Number(values[Math.floor(values.length * 0.5)].toFixed(3)),
    p95Ms: Number(values[Math.floor(values.length * 0.95)].toFixed(3)),
  }];
}));
assert.equal(percentiles.celtic.p95Ms < 50, true, `celtic P95 ${percentiles.celtic.p95Ms}ms exceeded 50ms`);

console.log(JSON.stringify({
  status: "PASS",
  cases: completed,
  expected,
  durationMs: Number((performance.now() - startedAt).toFixed(3)),
  percentiles,
}));
