import assert from "node:assert/strict";
import fool from "../src/knowledge/cards/major-0.js";
import tower from "../src/knowledge/cards/major-16.js";
import { resolveSemanticRelation, RELATION_TYPES } from "../src/engine/relations/semantic-relation-resolver.js";

const candidate = {
  id: "candidate-test",
  candidateTypes: ["contradicts", "weakens", "transforms"],
  explanationKey: "spread-structure:active-tension",
  structure: { edgeRole: "active-tension" },
};
const baseObservation = {
  selectedFacet: "state",
  orientation: "upright",
  selectedReversalMode: null,
  semanticTags: ["openness", "state"],
  dimensions: fool.dimensions,
  positionRole: { conditionality: "direct", actionTransform: "none" },
};
const targetObservation = {
  selectedFacet: "obstacle",
  orientation: "reversed",
  selectedReversalMode: tower.reversal.supportedModes[0],
  semanticTags: ["disruption", "obstacle"],
  dimensions: Object.fromEntries(Object.entries(tower.dimensions).map(([key, value]) => [key, -value])),
  positionRole: { conditionality: "contextual", actionTransform: "optional" },
};
const questionFit = {
  sharedResponsibilities: ["main-obstacle"],
  handoffDimensions: ["main-obstacle"],
  priorityDimension: "main-obstacle",
  evidenceWeight: 1,
  coverage: { source: 1, target: 1, combined: 1 },
};
const resolved = resolveSemanticRelation({
  candidate,
  sourceObservation: baseObservation,
  targetObservation,
  sourceCard: fool,
  targetCard: tower,
  questionFit,
});
assert.ok(candidate.candidateTypes.includes(resolved.type));
assert.ok(RELATION_TYPES.includes(resolved.type));
assert.ok(resolved.strength >= 0 && resolved.strength <= 1);
assert.equal(resolved.polarity, resolved.type === "transforms" ? "transformative" : "tensional");
assert.deepEqual(resolveSemanticRelation({
  candidate,
  sourceObservation: baseObservation,
  targetObservation,
  sourceCard: fool,
  targetCard: tower,
  questionFit,
}), resolved);
assert.ok(Object.isFrozen(resolved));
console.log("MR-003 semantic, state, action, and reversal Relation resolution passed.");
