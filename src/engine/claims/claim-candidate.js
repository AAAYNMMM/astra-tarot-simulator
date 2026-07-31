import { getSpreadGraph } from "../observations/spread-graphs.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function observationStance(observation) {
  if (observation.orientation === "reversed") return "cautionary";
  if (["obstacle", "cause", "risk"].includes(observation.selectedFacet)) return "cautionary";
  if (["action", "resource", "opportunity", "support"].includes(observation.selectedFacet)) return "supportive";
  const dimensions = Object.values(observation.dimensions || {}).filter(Number.isFinite);
  const average = dimensions.length ? dimensions.reduce((sum, value) => sum + value, 0) / dimensions.length : 0;
  if (average > 0.2) return "supportive";
  if (average < -0.2) return "cautionary";
  return "descriptive";
}

function relationStance(relation) {
  if (relation.polarity === "supportive") return "supportive";
  if (relation.polarity === "tensional") return "cautionary";
  if (relation.polarity === "transformative") return "transformative";
  return "conditional";
}

function observationConditions(observation) {
  const conditions = [];
  if (observation.positionRole?.conditionality && observation.positionRole.conditionality !== "direct") {
    conditions.push(`position-${observation.positionRole.conditionality}`);
  }
  if (observation.orientation === "reversed") {
    conditions.push(`reversal-${observation.selectedReversalMode || "modified"}`);
  }
  return unique(conditions);
}

function relationConditions(relation) {
  const conditions = [];
  if (["conditions", "transforms", "repairs"].includes(relation.type)) conditions.push(`relation-${relation.type}`);
  if (relation.confidence === "low") conditions.push("low-relation-confidence");
  return unique(conditions);
}

function dimensionForObservation(observation, question) {
  const responsibilities = observation.questionDimensions || [];
  return (observation.matchedDimensions || []).find((item) => responsibilities.includes(item))
    || responsibilities[0]
    || question.answerDimensions?.[0]
    || "general";
}

function validateInputs({ relationBatch, observations, question }) {
  if (!relationBatch || !Array.isArray(relationBatch.relations)) {
    throw new TypeError("A Relation batch is required.");
  }
  if (!Array.isArray(observations) || observations.length === 0) {
    throw new TypeError("At least one Observation is required.");
  }
  if (!question || relationBatch.questionId !== question.id) {
    throw new Error("QuestionProfile must match the Relation batch.");
  }
  if (observations.some((item) => item.questionId !== question.id || item.spreadId !== relationBatch.spreadId)) {
    throw new Error("Observation batch does not match the question and spread.");
  }
}

export function createClaimCandidates({ relationBatch, observations, question }) {
  validateInputs({ relationBatch, observations, question });
  const graph = getSpreadGraph(relationBatch.spreadId);
  if (!graph || graph.id !== relationBatch.graphId) throw new Error("Relation graph does not match the frozen spread graph.");
  const observationsByPosition = new Map(observations.map((item) => [item.positionId, item]));
  const observationsById = new Map(observations.map((item) => [item.id, item]));
  const orderedObservations = graph.nodes.map((node) => observationsByPosition.get(node.id));
  if (orderedObservations.some((item) => !item)) throw new Error("Observation batch is incomplete for the spread graph.");

  const candidates = [];
  orderedObservations.forEach((observation, index) => {
    const dimension = dimensionForObservation(observation, question);
    const stance = observationStance(observation);
    candidates.push({
      schemaVersion: "1.0.0",
      id: `claim-candidate-observation-${observation.id}`,
      kind: "observation",
      questionId: question.id,
      spreadId: relationBatch.spreadId,
      dimension,
      stance,
      propositionKey: `${dimension}:${observation.selectedFacet || "state"}:${stance}`,
      positionIds: [observation.positionId],
      observationIds: [observation.id],
      relationIds: [],
      evidenceRefs: [observation.id],
      sourceRefs: unique(observation.sourceRefs),
      conditions: observationConditions(observation),
      semanticSeeds: unique([observation.semanticText]),
      explanationKeys: unique([
        `claim-source:observation`,
        `claim-dimension:${dimension}`,
        `claim-stance:${stance}`,
      ]),
      strengthHints: {
        observationLocalScore: observation.localScore,
        relationStrength: null,
        evidencePriority: observation.positionRole?.evidencePriority || "context",
      },
      sourceOrder: index,
      tags: unique([...(observation.semanticTags || []), `candidate-kind:observation`, `dimension:${dimension}`]),
    });
  });

  relationBatch.relations.forEach((relation, index) => {
    const source = observationsById.get(relation.sourceObservationId);
    const target = observationsById.get(relation.targetObservationId);
    if (!source || !target) throw new Error(`Relation ${relation.id} has an unknown Observation endpoint.`);
    const dimension = relation.questionFit?.priorityDimension
      || target.questionDimensions?.[0]
      || source.questionDimensions?.[0]
      || question.answerDimensions?.[0]
      || "general";
    const stance = relationStance(relation);
    candidates.push({
      schemaVersion: "1.0.0",
      id: `claim-candidate-relation-${relation.id}`,
      kind: "relation",
      questionId: question.id,
      spreadId: relationBatch.spreadId,
      dimension,
      stance,
      propositionKey: `${dimension}:${relation.type}:${stance}`,
      positionIds: unique([source.positionId, target.positionId]),
      observationIds: [source.id, target.id],
      relationIds: [relation.id],
      evidenceRefs: [relation.id, source.id, target.id],
      sourceRefs: unique([...(source.sourceRefs || []), ...(target.sourceRefs || [])]),
      conditions: relationConditions(relation),
      semanticSeeds: unique([source.semanticText, target.semanticText]),
      explanationKeys: unique([
        ...(relation.explanationKeys || []),
        `claim-source:relation`,
        `claim-dimension:${dimension}`,
        `claim-stance:${stance}`,
      ]),
      strengthHints: {
        observationLocalScore: Number(((source.localScore + target.localScore) / 2).toFixed(4)),
        relationStrength: relation.strength,
        evidencePriority: relation.questionFit?.target?.evidencePriority || "context",
      },
      sourceOrder: orderedObservations.length + index,
      tags: unique([...(relation.tags || []), `candidate-kind:relation`, `dimension:${dimension}`]),
    });
  });

  return deepFreeze({
    schemaVersion: "1.0.0",
    questionId: question.id,
    spreadId: relationBatch.spreadId,
    graphId: relationBatch.graphId,
    candidateCount: candidates.length,
    candidates,
    provenance: {
      observationCount: orderedObservations.length,
      relationCount: relationBatch.relations.length,
      ordering: "spread-node-then-edge",
    },
  });
}

export function validateClaimCandidateBatch(batch, { relationBatch, observations, question }) {
  const errors = [];
  if (!batch || batch.questionId !== question?.id) return ["ClaimCandidate batch does not match the question."];
  if (batch.spreadId !== relationBatch?.spreadId || batch.graphId !== relationBatch?.graphId) {
    errors.push("ClaimCandidate batch does not match the Relation graph.");
  }
  const candidates = Array.isArray(batch.candidates) ? batch.candidates : [];
  if (batch.candidateCount !== candidates.length) errors.push("candidateCount mismatch");
  if (candidates.length !== observations.length + relationBatch.relations.length) {
    errors.push("ClaimCandidate count must equal Observation plus Relation evidence.");
  }
  const ids = new Set();
  let lastOrder = -1;
  for (const candidate of candidates) {
    if (ids.has(candidate.id)) errors.push(`Duplicate ClaimCandidate ${candidate.id}`);
    ids.add(candidate.id);
    if (!question.answerDimensions.includes(candidate.dimension)) errors.push(`Unknown answer dimension at ${candidate.id}`);
    if (!["observation", "relation"].includes(candidate.kind)) errors.push(`Unknown candidate kind at ${candidate.id}`);
    if (!["supportive", "cautionary", "descriptive", "conditional", "transformative"].includes(candidate.stance)) {
      errors.push(`Unknown candidate stance at ${candidate.id}`);
    }
    if (!candidate.evidenceRefs?.length || !candidate.sourceRefs?.length) errors.push(`Missing evidence provenance at ${candidate.id}`);
    if (candidate.sourceOrder < lastOrder) errors.push(`Unstable candidate order at ${candidate.id}`);
    lastOrder = candidate.sourceOrder;
    if ("score" in candidate || "conclusionType" in candidate || "text" in candidate) {
      errors.push(`CL-001 candidate finalized a later-stage field at ${candidate.id}`);
    }
  }
  return errors;
}
