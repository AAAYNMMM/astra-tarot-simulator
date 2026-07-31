import assert from "node:assert/strict";
import { SPREADS } from "../src/knowledge/spreads/definitions.js";
import { getSpreadGraph } from "../src/engine/observations/spread-graphs.js";
import {
  STRUCTURAL_RELATION_TYPE_HINTS,
  createStructuralRelationCandidates,
  validateStructuralRelationCandidates,
} from "../src/engine/relations/structural-relation-candidates.js";

function observationsFor(spreadId) {
  return getSpreadGraph(spreadId).nodes.map((node, index) => Object.freeze({
    schemaVersion: "1.0.0",
    id: `obs-${spreadId}-${node.id}-${index}`,
    spreadId,
    positionId: node.id,
    localScore: 1,
  }));
}

let totalCandidates = 0;
for (const spread of SPREADS) {
  const graph = getSpreadGraph(spread.id);
  const observations = observationsFor(spread.id);
  const batch = createStructuralRelationCandidates({ spreadId: spread.id, observations });
  const repeated = createStructuralRelationCandidates({
    spreadId: spread.id,
    observations: [...observations].reverse(),
  });

  assert.deepEqual(batch, repeated, `${spread.id}: input order must not alter candidates`);
  assert.deepEqual(validateStructuralRelationCandidates(batch), [], spread.id);
  assert.equal(batch.candidates.length, graph.edges.length, spread.id);
  assert.deepEqual(
    batch.candidates.map((candidate) => candidate.structure.edgeId),
    graph.edges.map((edge) => edge.id),
    `${spread.id}: graph edge order is authoritative`,
  );
  assert.ok(Object.isFrozen(batch));
  assert.ok(Object.isFrozen(batch.candidates));
  for (const candidate of batch.candidates) {
    const edge = graph.edges.find((item) => item.id === candidate.structure.edgeId);
    const source = observations.find((item) => item.positionId === edge.source);
    const target = observations.find((item) => item.positionId === edge.target);
    assert.equal(candidate.sourceObservationId, source.id);
    assert.equal(candidate.targetObservationId, target.id);
    assert.deepEqual(candidate.candidateTypes, STRUCTURAL_RELATION_TYPE_HINTS[edge.role]);
    assert.equal(candidate.origin, "spread-structure");
    assert.ok(!("type" in candidate), "MR-001 must not finalize semantic Relation type");
    assert.ok(!("strength" in candidate), "MR-001 must not score semantic Relation strength");
    assert.ok(Object.isFrozen(candidate));
    assert.ok(Object.isFrozen(candidate.structure));
    assert.ok(Object.isFrozen(candidate.candidateTypes));
  }
  totalCandidates += batch.candidates.length;
}

assert.equal(totalCandidates, 21);
assert.equal(
  createStructuralRelationCandidates({ spreadId: "single", observations: observationsFor("single") }).candidates.length,
  0,
);

assert.throws(
  () => createStructuralRelationCandidates({ spreadId: "unknown", observations: [] }),
  /Unknown spread graph/,
);
assert.throws(
  () => createStructuralRelationCandidates({
    spreadId: "timeline",
    observations: observationsFor("timeline").slice(0, 2),
  }),
  /Missing observations/,
);
assert.throws(
  () => createStructuralRelationCandidates({
    spreadId: "timeline",
    observations: [
      ...observationsFor("timeline").slice(0, 2),
      { ...observationsFor("timeline")[2], positionId: "present" },
    ],
  }),
  /Duplicate observation position/,
);
assert.throws(
  () => createStructuralRelationCandidates({
    spreadId: "timeline",
    observations: observationsFor("timeline").map((item, index) => (
      index === 0 ? { ...item, spreadId: "cross" } : item
    )),
  }),
  /belongs to cross/,
);

console.log("MR-001 structural Relation candidates passed: 21 frozen graph edges, deterministic mapping, and no premature semantic relations.");
