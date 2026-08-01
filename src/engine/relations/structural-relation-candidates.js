import { getSpreadGraph, validateSpreadGraph } from "../observations/spread-graphs.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

const STRUCTURAL_ROLE_TYPE_HINTS = Object.freeze({
  "temporal-continuation": Object.freeze(["continues", "transforms"]),
  "conditional-projection": Object.freeze(["continues", "conditions", "transforms"]),
  "causal-input": Object.freeze(["causes", "conditions"]),
  "context-input": Object.freeze(["conditions", "supports", "weakens"]),
  "trend-projection": Object.freeze(["continues", "conditions", "transforms"]),
  "corrective-input": Object.freeze(["repairs", "conditions", "transforms"]),
  "response-to-context": Object.freeze(["repairs", "conditions"]),
  "context-conditions-action": Object.freeze(["conditions", "supports", "weakens"]),
  "underlying-input": Object.freeze(["causes", "conditions"]),
  "active-tension": Object.freeze(["contradicts", "weakens", "transforms"]),
  "intent-conditions-trend": Object.freeze(["conditions", "supports", "weakens"]),
  "contextual-pressure": Object.freeze(["conditions", "weakens", "reinforces"]),
  "expectation-conditions-guidance": Object.freeze(["conditions", "supports", "weakens"]),
  "trend-continuation": Object.freeze(["continues", "transforms"]),
  "guidance-conditions-outcome": Object.freeze(["conditions", "repairs", "transforms"]),
  "context-conditions-outcome": Object.freeze(["conditions", "supports", "weakens"]),
  "long-arc-projection": Object.freeze(["continues", "conditions", "transforms"]),
});

export const STRUCTURAL_RELATION_TYPE_HINTS = STRUCTURAL_ROLE_TYPE_HINTS;

function observationsByPosition({ observations, spreadId, graph }) {
  if (!Array.isArray(observations)) throw new TypeError("observations must be an array");
  const expectedPositions = new Set(graph.nodes.map((node) => node.id));
  const byPosition = new Map();
  const observationIds = new Set();

  for (const observation of observations) {
    if (!observation || typeof observation !== "object") {
      throw new TypeError("Each observation must be an object.");
    }
    if (observation.spreadId !== spreadId) {
      throw new Error(`Observation ${observation.id || "<unknown>"} belongs to ${observation.spreadId}, not ${spreadId}.`);
    }
    if (!expectedPositions.has(observation.positionId)) {
      throw new Error(`Observation ${observation.id || "<unknown>"} has unknown position ${observation.positionId}.`);
    }
    if (!observation.id || typeof observation.id !== "string") {
      throw new Error(`Observation at ${observation.positionId} has no stable id.`);
    }
    if (observationIds.has(observation.id)) {
      throw new Error(`Duplicate observation id: ${observation.id}.`);
    }
    if (byPosition.has(observation.positionId)) {
      throw new Error(`Duplicate observation position: ${observation.positionId}.`);
    }
    observationIds.add(observation.id);
    byPosition.set(observation.positionId, observation);
  }

  const missing = graph.nodes
    .map((node) => node.id)
    .filter((positionId) => !byPosition.has(positionId));
  if (missing.length) throw new Error(`Missing observations for ${spreadId}: ${missing.join(", ")}.`);
  if (byPosition.size !== graph.nodes.length) {
    throw new Error(`Observation count differs from graph ${spreadId}.`);
  }
  return byPosition;
}

export function createStructuralRelationCandidates({ spreadId, observations, spreadDefinitionVersion = "2.0.0" }) {
  const graph = getSpreadGraph(spreadId, spreadDefinitionVersion);
  if (!graph) throw new Error(`Unknown spread graph: ${spreadId}`);
  const graphErrors = validateSpreadGraph(graph, spreadDefinitionVersion);
  if (graphErrors.length) throw new Error(graphErrors.join("; "));

  const byPosition = observationsByPosition({ observations, spreadId, graph });
  const candidates = graph.edges.map((edge) => {
    const typeHints = STRUCTURAL_ROLE_TYPE_HINTS[edge.role];
    if (!typeHints) throw new Error(`No structural Relation hints for edge role ${edge.role}.`);
    const source = byPosition.get(edge.source);
    const target = byPosition.get(edge.target);
    return {
      schemaVersion: "1.0.0",
      id: `rel-candidate-${edge.id}`,
      sourceObservationId: source.id,
      targetObservationId: target.id,
      candidateTypes: [...typeHints],
      tags: [`spread:${spreadId}`, `structure-role:${edge.role}`],
      explanationKey: `spread-structure:${edge.role}`,
      origin: "spread-structure",
      structure: {
        graphId: graph.id,
        edgeId: edge.id,
        edgeRole: edge.role,
        sourcePositionId: edge.source,
        targetPositionId: edge.target,
      },
    };
  });

  return deepFreeze({
    schemaVersion: "1.0.0",
    spreadId,
    graphId: graph.id,
    sourceLayer: "spread-structure",
    candidates,
    ...(spreadDefinitionVersion === "2.0.0" ? {} : { spreadDefinitionVersion }),
  });
}

export function validateStructuralRelationCandidates(batch) {
  const errors = [];
  const graph = getSpreadGraph(batch?.spreadId, batch?.spreadDefinitionVersion || "2.0.0");
  if (!graph) return [`Unknown spread graph: ${batch?.spreadId}`];
  if (batch.graphId !== graph.id) errors.push(`${batch.spreadId}: graphId mismatch`);
  if (batch.sourceLayer !== "spread-structure") errors.push(`${batch.spreadId}: invalid sourceLayer`);

  const candidates = Array.isArray(batch.candidates) ? batch.candidates : [];
  if (candidates.length !== graph.edges.length) {
    errors.push(`${batch.spreadId}: candidate count differs from structural edge count`);
  }

  const candidateIds = new Set();
  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index];
    const edge = graph.edges[index];
    if (!edge) {
      errors.push(`${batch.spreadId}: unexpected candidate ${candidate?.id}`);
      continue;
    }
    if (candidateIds.has(candidate.id)) errors.push(`${batch.spreadId}: duplicate candidate ${candidate.id}`);
    candidateIds.add(candidate.id);
    if (candidate.id !== `rel-candidate-${edge.id}`) errors.push(`${batch.spreadId}: unstable candidate id at ${edge.id}`);
    if (candidate.origin !== "spread-structure") errors.push(`${batch.spreadId}: invalid origin at ${edge.id}`);
    if (candidate.sourceObservationId === candidate.targetObservationId) errors.push(`${batch.spreadId}: self relation at ${edge.id}`);
    if (candidate.structure?.edgeId !== edge.id) errors.push(`${batch.spreadId}: edge mapping mismatch at ${edge.id}`);
    if (candidate.structure?.sourcePositionId !== edge.source) errors.push(`${batch.spreadId}: source mapping mismatch at ${edge.id}`);
    if (candidate.structure?.targetPositionId !== edge.target) errors.push(`${batch.spreadId}: target mapping mismatch at ${edge.id}`);
    const expectedHints = STRUCTURAL_ROLE_TYPE_HINTS[edge.role] || [];
    if (JSON.stringify(candidate.candidateTypes) !== JSON.stringify(expectedHints)) {
      errors.push(`${batch.spreadId}: type hints differ at ${edge.id}`);
    }
    if ("type" in candidate || "strength" in candidate) {
      errors.push(`${batch.spreadId}: MR-001 cannot finalize semantic type or strength at ${edge.id}`);
    }
  }
  return errors;
}
