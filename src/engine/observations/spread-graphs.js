import { SPREADS } from "../../knowledge/spreads/definitions.js";
import { POSITION_OPERATOR_GROUPS } from "../../knowledge/spreads/operators/index.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

const GRAPH_DEFINITIONS = {
  single: {
    nodes: [{ id: "essence", role: "core-observation", lane: "core" }],
    edges: [],
    mainLines: [{ id: "single-core", positions: ["essence"] }],
  },
  timeline: {
    nodes: [
      { id: "past", role: "origin-context", lane: "temporal" },
      { id: "present", role: "current-state", lane: "temporal" },
      { id: "future", role: "conditional-trend", lane: "temporal" },
    ],
    edges: [
      { id: "timeline-past-present", source: "past", target: "present", role: "temporal-continuation" },
      { id: "timeline-present-future", source: "present", target: "future", role: "conditional-projection" },
    ],
    mainLines: [{ id: "timeline-flow", positions: ["past", "present", "future"] }],
  },
  cross: {
    nodes: [
      { id: "core", role: "central-state", lane: "core" },
      { id: "root", role: "causal-root", lane: "cause" },
      { id: "trend", role: "conditional-trend", lane: "future" },
      { id: "influence", role: "external-influence", lane: "context" },
      { id: "action", role: "corrective-action", lane: "guidance" },
    ],
    edges: [
      { id: "cross-root-core", source: "root", target: "core", role: "causal-input" },
      { id: "cross-influence-core", source: "influence", target: "core", role: "context-input" },
      { id: "cross-core-trend", source: "core", target: "trend", role: "trend-projection" },
      { id: "cross-action-trend", source: "action", target: "trend", role: "corrective-input" },
      { id: "cross-action-influence", source: "action", target: "influence", role: "response-to-context" },
      { id: "cross-influence-action", source: "influence", target: "action", role: "context-conditions-action" },
    ],
    mainLines: [
      { id: "cross-causal", positions: ["root", "core", "trend"] },
      { id: "cross-context", positions: ["influence", "core", "trend"] },
      { id: "cross-guidance", positions: ["action", "trend"] },
    ],
  },
  celtic: {
    nodes: [
      { id: "present", role: "central-state", lane: "core" },
      { id: "challenge", role: "central-challenge", lane: "core" },
      { id: "past", role: "recent-origin", lane: "temporal" },
      { id: "future", role: "near-future", lane: "temporal" },
      { id: "above", role: "conscious-direction", lane: "inner" },
      { id: "below", role: "underlying-driver", lane: "inner" },
      { id: "advice", role: "corrective-guidance", lane: "guidance" },
      { id: "external", role: "external-context", lane: "context" },
      { id: "hopes", role: "expectation-and-fear", lane: "inner" },
      { id: "outcome", role: "conditional-outcome", lane: "future" },
    ],
    edges: [
      { id: "celtic-below-present", source: "below", target: "present", role: "underlying-input" },
      { id: "celtic-challenge-present", source: "challenge", target: "present", role: "active-tension" },
      { id: "celtic-past-present", source: "past", target: "present", role: "temporal-continuation" },
      { id: "celtic-present-future", source: "present", target: "future", role: "conditional-projection" },
      { id: "celtic-above-future", source: "above", target: "future", role: "intent-conditions-trend" },
      { id: "celtic-advice-future", source: "advice", target: "future", role: "corrective-input" },
      { id: "celtic-external-present", source: "external", target: "present", role: "context-input" },
      { id: "celtic-external-challenge", source: "external", target: "challenge", role: "contextual-pressure" },
      { id: "celtic-hopes-advice", source: "hopes", target: "advice", role: "expectation-conditions-guidance" },
      { id: "celtic-future-outcome", source: "future", target: "outcome", role: "trend-continuation" },
      { id: "celtic-advice-outcome", source: "advice", target: "outcome", role: "guidance-conditions-outcome" },
      { id: "celtic-external-outcome", source: "external", target: "outcome", role: "context-conditions-outcome" },
      { id: "celtic-present-outcome", source: "present", target: "outcome", role: "long-arc-projection" },
    ],
    mainLines: [
      { id: "celtic-core", positions: ["below", "present", "future", "outcome"] },
      { id: "celtic-pressure", positions: ["challenge", "present", "future"] },
      { id: "celtic-guidance", positions: ["above", "advice", "outcome"] },
      { id: "celtic-context", positions: ["external", "present", "outcome"] },
    ],
  },
};

export const SPREAD_GRAPHS = deepFreeze(Object.fromEntries(
  SPREADS.map((spread) => [spread.id, {
    schemaVersion: "1.0.0",
    id: `spread-graph-${spread.id}`,
    spreadId: spread.id,
    nodes: GRAPH_DEFINITIONS[spread.id].nodes,
    edges: GRAPH_DEFINITIONS[spread.id].edges,
    mainLines: GRAPH_DEFINITIONS[spread.id].mainLines,
  }]),
));

export function getSpreadGraph(spreadId) {
  return SPREAD_GRAPHS[spreadId] || null;
}

export function validateSpreadGraph(graph) {
  const errors = [];
  const spread = SPREADS.find((item) => item.id === graph?.spreadId);
  if (!spread) return [`Unknown spread graph: ${graph?.spreadId}`];
  const expected = spread.positions.map((item) => item.id);
  const nodeIds = (graph.nodes || []).map((item) => item.id);
  if (JSON.stringify(nodeIds) !== JSON.stringify(expected)) errors.push(`${spread.id}: node order differs from spread`);
  if ((POSITION_OPERATOR_GROUPS[spread.id] || []).length !== nodeIds.length) errors.push(`${spread.id}: operator count mismatch`);
  const nodeSet = new Set(nodeIds);
  const edgeIds = new Set();
  for (const edge of graph.edges || []) {
    if (edgeIds.has(edge.id)) errors.push(`${spread.id}: duplicate edge ${edge.id}`);
    edgeIds.add(edge.id);
    if (!nodeSet.has(edge.source) || !nodeSet.has(edge.target)) errors.push(`${spread.id}: edge ${edge.id} has unknown endpoint`);
    if (edge.source === edge.target) errors.push(`${spread.id}: edge ${edge.id} is self-referential`);
  }
  for (const line of graph.mainLines || []) {
    if (!line.positions?.length) errors.push(`${spread.id}: empty main line ${line.id}`);
    for (const positionId of line.positions || []) {
      if (!nodeSet.has(positionId)) errors.push(`${spread.id}: main line ${line.id} has unknown ${positionId}`);
    }
  }
  if (nodeIds.length > 1) {
    const visited = new Set([nodeIds[0]]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const edge of graph.edges || []) {
        if (visited.has(edge.source) && !visited.has(edge.target)) { visited.add(edge.target); changed = true; }
        if (visited.has(edge.target) && !visited.has(edge.source)) { visited.add(edge.source); changed = true; }
      }
    }
    if (visited.size !== nodeIds.length) errors.push(`${spread.id}: graph is disconnected`);
  } else if ((graph.edges || []).length !== 0) {
    errors.push(`${spread.id}: single-card graph cannot contain edges`);
  }
  return errors;
}
