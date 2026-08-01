import assert from "node:assert/strict";

import {
  STRUCTURAL_ASSESSMENT_WEIGHTS,
  assessStructuralReading,
} from "../src/engine/assessment/structural-assessor.js";
import { SPREADS } from "../src/knowledge/spreads/definitions.js";

const EXPECTED = Object.freeze({
  timeline: Object.freeze({
    foundation: 0.06,
    process: 0.11,
    outcome: 0.6,
    stability: 0.06,
    resistance: 0.06,
    cost: 0.03,
    controllability: 0.05,
    interCardConflict: 0.03,
  }),
  cross: Object.freeze({
    foundation: 0.06,
    process: 0.08,
    outcome: 0.6,
    stability: 0.05,
    resistance: 0.06,
    cost: 0.04,
    controllability: 0.06,
    interCardConflict: 0.05,
  }),
  celtic: Object.freeze({
    foundation: 0.06,
    process: 0.07,
    outcome: 0.6,
    stability: 0.05,
    resistance: 0.06,
    cost: 0.04,
    controllability: 0.05,
    interCardConflict: 0.07,
  }),
});

for (const [spreadId, expected] of Object.entries(EXPECTED)) {
  assert.deepEqual(STRUCTURAL_ASSESSMENT_WEIGHTS[spreadId], expected);
  assert.equal(Number(Object.values(expected).reduce((sum, value) => sum + value, 0).toFixed(10)), 1);
  assert.equal(expected.outcome, 0.6);
  assert.ok(Object.entries(expected).every(([key, value]) => key === "outcome" || value < expected.outcome));
}

const spread = (spreadId) => SPREADS.find((entry) => entry.id === spreadId);

function fixture(spreadId, outcomeStance) {
  const positions = spread(spreadId).positions.map((entry) => entry.id);
  const outcomePositions = new Set(
    spreadId === "timeline" ? ["future"] : spreadId === "cross" ? ["trend"] : ["outcome"],
  );
  const observations = positions.map((positionId) => ({
    id: `obs-${positionId}`,
    spreadId,
    positionId,
    dimensions: { stability: 0, agency: 0, risk: 0 },
  }));
  const activeCandidates = positions.map((positionId) => ({
    id: `candidate-${positionId}`,
    positionIds: [positionId],
    score: 1,
    stance: outcomePositions.has(positionId) ? outcomeStance : "descriptive",
    selectedFacet: "state",
    evidenceRefs: [`obs-${positionId}`],
  }));
  const relations = [{
    id: "relation-neutral",
    type: "conditions",
    strength: 1,
    sourceObservationId: observations[0].id,
    targetObservationId: observations.at(-1).id,
    structure: {
      sourcePositionId: positions[0],
      targetPositionId: positions.at(-1),
    },
  }];
  return { spreadId, observations, activeCandidates, relations, conflicts: [] };
}

for (const spreadId of ["timeline", "cross"]) {
  const supportive = assessStructuralReading(fixture(spreadId, "supportive"));
  const cautionary = assessStructuralReading(fixture(spreadId, "cautionary"));
  assert.equal(supportive.status, "valid");
  assert.equal(cautionary.status, "valid");
  assert.ok(
    supportive.internalScore - cautionary.internalScore >= 0.59,
    `${spreadId} outcome must dominate the score delta`,
  );
}

console.log("Outcome-dominant weighting tests passed.");
