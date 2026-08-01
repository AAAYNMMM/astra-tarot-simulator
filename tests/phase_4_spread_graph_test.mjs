import assert from "node:assert/strict";
import { LEGACY_SPREADS_V1 as SPREADS } from "../src/knowledge/spreads/definitions.js";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import {
  LEGACY_SPREAD_GRAPHS_V1 as SPREAD_GRAPHS,
  getSpreadGraph,
  validateSpreadGraph,
} from "../src/engine/observations/spread-graphs.js";

const getLegacySpreadGraph = (spreadId) => getSpreadGraph(spreadId, "1.0.0");

const expectedEdges = { single: 0, timeline: 2, cross: 6, celtic: 13 };
for (const spread of SPREADS) {
  const graph = getLegacySpreadGraph(spread.id);
  assert.equal(graph, SPREAD_GRAPHS[spread.id]);
  assert.deepEqual(validateSpreadGraph(graph, "1.0.0"), [], spread.id);
  assert.deepEqual(graph.nodes.map((node) => node.id), spread.positions.map((position) => position.id));
  assert.equal(graph.edges.length, expectedEdges[spread.id]);
  assert.ok(graph.mainLines.length >= 1 && graph.mainLines.length <= 4);
}
for (const questionId of QUESTION_PROFILE_IDS) {
  const question = await loadQuestionProfile(questionId);
  for (const spread of SPREADS) {
    const graphPositions = getLegacySpreadGraph(spread.id).nodes.map((node) => node.id);
    assert.deepEqual(Object.keys(question.spreadProfiles[spread.id].positionResponsibilities), graphPositions, `${questionId}/${spread.id}`);
  }
}
assert.equal(Object.values(SPREAD_GRAPHS).flatMap((graph) => graph.nodes).length, 19);
assert.equal(Object.values(SPREAD_GRAPHS).flatMap((graph) => graph.edges).length, 21);
console.log("PO-002 fixed graphs passed: 4 spreads, 19 nodes, 21 structural edges, and 90 question mappings.");
