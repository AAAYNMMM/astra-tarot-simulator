import { getSpreadGraph } from "../observations/spread-graphs.js";
import { resolveClaimConflicts } from "./conflict-resolver.js";

const LIMITING_REVERSAL_MODES = new Set([
  "blocked", "distorted", "excessive", "misdirected", "avoided",
  "loss-of-control", "delayed", "deficient",
]);
const ALLOWED_CONCLUSIONS = Object.freeze([
  "favorable", "conditional", "currently-unfavorable", "indeterminate",
]);

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function clamp(value) {
  return Math.min(1, Math.max(0, value));
}

function round(value) {
  return Number(value.toFixed(4));
}

function average(items) {
  return items.length ? items.reduce((sum, value) => sum + value, 0) / items.length : 0;
}

function priorityWeight(priority) {
  return ({ core: 1, primary: 0.86, secondary: 0.72, context: 0.58 })[priority] || 0.5;
}

function observationStance(observation) {
  if (observation.orientation === "reversed") {
    if (observation.selectedReversalMode === "released") return "transformative";
    if (observation.selectedReversalMode === "internalized") return "conditional";
    if (LIMITING_REVERSAL_MODES.has(observation.selectedReversalMode)) return "cautionary";
  }
  if (["obstacle", "boundary"].includes(observation.selectedFacet)) return "cautionary";
  if (["action", "resource", "opportunity"].includes(observation.selectedFacet)) return "supportive";
  const dimensions = Object.values(observation.dimensions || {}).filter(Number.isFinite);
  const mean = average(dimensions);
  if (mean > 0.2) return "supportive";
  if (mean < -0.2) return "cautionary";
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
  if (observation.orientation === "reversed") conditions.push(`reversal-${observation.selectedReversalMode || "modified"}`);
  return unique(conditions);
}

function relationConditions(relation) {
  const conditions = [];
  if (["conditions", "transforms", "repairs"].includes(relation.type)) conditions.push(`relation-${relation.type}`);
  if (relation.confidence === "low") conditions.push("low-relation-confidence");
  return unique(conditions);
}

function validateInputs({ relationBatch, observations, readingProfile }) {
  if (!relationBatch || !Array.isArray(relationBatch.relations)) throw new TypeError("A Relation batch is required.");
  if (!Array.isArray(observations) || !observations.length) throw new TypeError("At least one Observation is required.");
  if (!readingProfile || relationBatch.spreadId !== readingProfile.spreadId) {
    throw new Error("SpreadReadingProfile must match the Relation batch.");
  }
  if (observations.some((item) => item.spreadId !== relationBatch.spreadId)) {
    throw new Error("Observation batch does not match the spread.");
  }
}

function createCandidates({ relationBatch, observations, readingProfile }) {
  validateInputs({ relationBatch, observations, readingProfile });
  const graph = getSpreadGraph(relationBatch.spreadId, relationBatch.spreadDefinitionVersion || "2.0.0");
  if (!graph || graph.id !== relationBatch.graphId) throw new Error("Relation graph does not match the frozen spread graph.");
  const observationsByPosition = new Map(observations.map((item) => [item.positionId, item]));
  const observationsById = new Map(observations.map((item) => [item.id, item]));
  const orderedObservations = graph.nodes.map((node) => observationsByPosition.get(node.id));
  if (orderedObservations.some((item) => !item)) throw new Error("Observation batch is incomplete for the spread graph.");

  const candidates = [];
  orderedObservations.forEach((observation, index) => {
    const responsibilities = observation.positionResponsibilities || [];
    const dimension = (observation.matchedResponsibilities || []).find((item) => responsibilities.includes(item))
      || responsibilities[0]
      || readingProfile.answerDimensions[0];
    const stance = observationStance(observation);
    candidates.push({
      schemaVersion: "2.0.0",
      id: `claim-candidate-observation-${observation.id}`,
      kind: "observation",
      spreadId: relationBatch.spreadId,
      dimension,
      stance,
      propositionKey: `${dimension}:${observation.selectedFacet || "state"}:${stance}`,
      selectedFacet: observation.selectedFacet || "state",
      positionIds: [observation.positionId],
      observationIds: [observation.id],
      relationIds: [],
      evidenceRefs: [observation.id],
      sourceRefs: unique(observation.sourceRefs),
      conditions: observationConditions(observation),
      semanticSeeds: unique([observation.semanticText]),
      explanationKeys: unique([
        "claim-source:observation", `claim-dimension:${dimension}`, `claim-stance:${stance}`,
      ]),
      strengthHints: {
        observationLocalScore: observation.localScore,
        relationStrength: null,
        evidencePriority: observation.positionRole?.evidencePriority || "context",
      },
      sourceOrder: index,
      tags: unique([...(observation.semanticTags || []), "candidate-kind:observation", `dimension:${dimension}`, `facet:${observation.selectedFacet || "state"}`]),
    });
  });

  relationBatch.relations.forEach((relation, index) => {
    const source = observationsById.get(relation.sourceObservationId);
    const target = observationsById.get(relation.targetObservationId);
    if (!source || !target) throw new Error(`Relation ${relation.id} has an unknown Observation endpoint.`);
    const dimension = relation.responsibilityFit?.priorityDimension
      || target.positionResponsibilities?.[0]
      || source.positionResponsibilities?.[0]
      || readingProfile.answerDimensions[0];
    const stance = relationStance(relation);
    candidates.push({
      schemaVersion: "2.0.0",
      id: `claim-candidate-relation-${relation.id}`,
      kind: "relation",
      spreadId: relationBatch.spreadId,
      dimension,
      stance,
      propositionKey: `${dimension}:${relation.type}:${stance}`,
      selectedFacet: target.selectedFacet || source.selectedFacet || "state",
      positionIds: unique([source.positionId, target.positionId]),
      observationIds: [source.id, target.id],
      relationIds: [relation.id],
      evidenceRefs: [relation.id, source.id, target.id],
      sourceRefs: unique([...(source.sourceRefs || []), ...(target.sourceRefs || [])]),
      conditions: relationConditions(relation),
      semanticSeeds: unique([source.semanticText, target.semanticText]),
      explanationKeys: unique([
        ...(relation.explanationKeys || []), "claim-source:relation", `claim-dimension:${dimension}`, `claim-stance:${stance}`,
      ]),
      strengthHints: {
        observationLocalScore: round((source.localScore + target.localScore) / 2),
        relationStrength: relation.strength,
        evidencePriority: relation.responsibilityFit?.target?.evidencePriority || "context",
      },
      sourceOrder: orderedObservations.length + index,
      tags: unique([...(relation.tags || []), "candidate-kind:relation", `dimension:${dimension}`, `facet:${target.selectedFacet || source.selectedFacet || "state"}`]),
    });
  });
  return deepFreeze({
    schemaVersion: "2.0.0",
    spreadId: relationBatch.spreadId,
    graphId: relationBatch.graphId,
    candidateCount: candidates.length,
    candidates,
    provenance: {
      observationCount: orderedObservations.length,
      relationCount: relationBatch.relations.length,
      ordering: "spread-node-then-edge",
      semanticScope: "spread-position-responsibility",
    },
  });
}

function validateCandidates(batch, { relationBatch, observations, readingProfile }) {
  const errors = [];
  if (!batch || batch.spreadId !== readingProfile?.spreadId) return ["ClaimCandidate batch does not match the SpreadReadingProfile."];
  if (batch.spreadId !== relationBatch?.spreadId || batch.graphId !== relationBatch?.graphId) errors.push("ClaimCandidate batch does not match the Relation graph.");
  const candidates = Array.isArray(batch.candidates) ? batch.candidates : [];
  if (batch.candidateCount !== candidates.length) errors.push("candidateCount mismatch");
  if (candidates.length !== observations.length + relationBatch.relations.length) errors.push("ClaimCandidate count must equal Observation plus Relation evidence.");
  const ids = new Set();
  let lastOrder = -1;
  for (const candidate of candidates) {
    if (ids.has(candidate.id)) errors.push(`Duplicate ClaimCandidate ${candidate.id}`);
    ids.add(candidate.id);
    if (!readingProfile.answerDimensions.includes(candidate.dimension)) errors.push(`Unknown answer dimension at ${candidate.id}`);
    if (!candidate.evidenceRefs?.length || !candidate.sourceRefs?.length) errors.push(`Missing evidence provenance at ${candidate.id}`);
    if (candidate.sourceOrder < lastOrder) errors.push(`Unstable candidate order at ${candidate.id}`);
    lastOrder = candidate.sourceOrder;
  }
  return errors;
}

function scoreCandidates(candidateBatch, readingProfile) {
  const dimensionOrder = new Map(readingProfile.answerDimensions.map((item, index) => [item, index]));
  const scored = candidateBatch.candidates.map((candidate) => {
    const observation = Number(candidate.strengthHints?.observationLocalScore) || 0;
    const relation = candidate.kind === "relation" ? Number(candidate.strengthHints?.relationStrength) || 0 : observation;
    const priority = priorityWeight(candidate.strengthHints?.evidencePriority);
    const provenance = Math.min(1, (candidate.evidenceRefs?.length || 0) / 3);
    const sourceQuality = Math.min(1, (candidate.sourceRefs?.length || 0) / 2);
    const conditionPenalty = Math.min(0.12, (candidate.conditions?.length || 0) * 0.035);
    const score = round(clamp(
      observation * 0.32 + relation * 0.28 + priority * 0.2
      + provenance * 0.1 + sourceQuality * 0.1 - conditionPenalty,
    ));
    return {
      ...candidate,
      score,
      scoreBreakdown: {
        observation: round(observation), relation: round(relation), evidencePriority: round(priority),
        provenance: round(provenance), sourceQuality: round(sourceQuality), conditionPenalty: round(conditionPenalty),
      },
    };
  });
  scored.sort((left, right) => (
    right.score - left.score
    || (dimensionOrder.get(left.dimension) ?? 999) - (dimensionOrder.get(right.dimension) ?? 999)
    || left.sourceOrder - right.sourceOrder
    || left.id.localeCompare(right.id)
  ));
  const ranked = scored.map((candidate, index) => ({ ...candidate, rank: index + 1 }));
  return deepFreeze({
    schemaVersion: "2.0.0",
    spreadId: candidateBatch.spreadId,
    candidateCount: ranked.length,
    scoredCandidates: ranked,
    ordering: "score-desc-dimension-source-id",
  });
}

function conclusionCategory(type) {
  if (type === "favorable") return "positive";
  if (type === "currently-unfavorable") return "negative";
  if (type === "indeterminate") return "indeterminate";
  return "conditional";
}

function classifyClaim({ resolution, readingProfile }) {
  const supportive = resolution.activeCandidates.filter((item) => item.stance === "supportive");
  const cautionary = resolution.activeCandidates.filter((item) => item.stance === "cautionary");
  const conditional = resolution.activeCandidates.filter((item) => ["conditional", "transformative"].includes(item.stance));
  const supportScore = average(supportive.map((item) => item.score));
  const cautionScore = average(cautionary.map((item) => item.score));
  const conditionalScore = average(conditional.map((item) => item.score));
  let conclusionType = "conditional";
  if (resolution.conflicts.some((item) => item.resolution === "retain-tension")) conclusionType = "indeterminate";
  else if (cautionScore > supportScore + 0.15) conclusionType = "currently-unfavorable";
  else if (supportScore > cautionScore + 0.12 && conditionalScore < supportScore) conclusionType = "favorable";
  const dimensions = unique(resolution.activeCandidates.map((item) => item.dimension));
  const requiredDimensions = unique(readingProfile.answerDimensions);
  const coverageGaps = requiredDimensions.filter((item) => !dimensions.includes(item));
  const conditions = unique(resolution.activeCandidates.flatMap((item) => item.conditions));
  if (conclusionType === "conditional" && !conditions.length) conditions.push("maintain-evidence-boundary");
  const score = round(average(resolution.activeCandidates.map((item) => item.score)));
  return {
    schemaVersion: "2.0.0",
    id: `claim-${readingProfile.spreadId}-structure`,
    claimType: "bounded-structural-hypothesis",
    spreadId: resolution.spreadId,
    conclusionType,
    conclusionCategory: conclusionCategory(conclusionType),
    dimensions,
    requiredDimensions,
    coverageGaps,
    score,
    confidence: coverageGaps.length || resolution.conflicts.some((item) => item.resolution === "retain-tension")
      ? "low" : score >= 0.76 && !resolution.conflicts.length ? "high" : "medium",
    conditions,
    conflicts: resolution.conflicts.map((item) => ({
      conflictId: item.id, dimension: item.dimension, resolution: item.resolution,
      dominantCandidateId: item.dominantCandidateId,
    })),
    candidateIds: resolution.activeCandidates.map((item) => item.id),
    evidenceRefs: unique(resolution.activeCandidates.flatMap((item) => item.evidenceRefs)),
    sourceRefs: unique(resolution.activeCandidates.flatMap((item) => item.sourceRefs)),
    forbiddenClaimTypes: [],
    explanationKeys: unique([
      `conclusion:${conclusionType}`, `conclusion-category:${conclusionCategory(conclusionType)}`,
      ...dimensions.map((item) => `claim-dimension:${item}`),
      ...resolution.conflicts.map((item) => item.explanationKey),
    ]),
    provenance: {
      candidateCount: resolution.activeCandidates.length,
      suppressedCount: resolution.suppressedCandidates.length,
      conflictCount: resolution.conflicts.length,
      policy: resolution.policy,
      semanticScope: "spread-position-responsibility",
    },
  };
}

function validateClaim({ claim, candidateBatch, resolution, readingProfile }) {
  const errors = [];
  if (!ALLOWED_CONCLUSIONS.includes(claim.conclusionType)) errors.push("Unsupported structural conclusion type.");
  if (claim.spreadId !== readingProfile.spreadId || claim.spreadId !== candidateBatch.spreadId) errors.push("Claim scope mismatch.");
  if (!Number.isFinite(claim.score) || claim.score < 0 || claim.score > 1) errors.push("Claim score must be in [0, 1].");
  const candidatesById = new Map(candidateBatch.candidates.map((item) => [item.id, item]));
  const activeIds = new Set(resolution.activeCandidates.map((item) => item.id));
  const knownEvidence = new Set(candidateBatch.candidates.flatMap((item) => item.evidenceRefs || []));
  for (const candidateId of claim.candidateIds) if (!candidatesById.has(candidateId) || !activeIds.has(candidateId)) errors.push(`Unknown or inactive ClaimCandidate: ${candidateId}`);
  for (const evidenceRef of claim.evidenceRefs) if (!knownEvidence.has(evidenceRef)) errors.push(`Unknown evidence reference: ${evidenceRef}`);
  for (const dimension of claim.dimensions) if (!readingProfile.answerDimensions.includes(dimension)) errors.push(`Unknown answer dimension: ${dimension}`);
  if (!claim.candidateIds.length || !claim.evidenceRefs.length || !claim.sourceRefs.length) errors.push("Claim must retain candidate, evidence, and source provenance.");
  return unique(errors);
}

export function createSpreadClaimPipeline({ relationBatch, observations, readingProfile }) {
  const candidateBatch = createCandidates({ relationBatch, observations, readingProfile });
  const candidateErrors = validateCandidates(candidateBatch, { relationBatch, observations, readingProfile });
  if (candidateErrors.length) throw new Error(candidateErrors.join("; "));
  const scoredBatch = scoreCandidates(candidateBatch, readingProfile);
  const resolution = resolveClaimConflicts(scoredBatch);
  const classified = classifyClaim({ resolution, readingProfile });
  const claimErrors = validateClaim({ claim: classified, candidateBatch, resolution, readingProfile });
  if (claimErrors.length) throw new Error(claimErrors.join("; "));
  const claim = deepFreeze({
    ...classified,
    validation: {
      status: "valid",
      validatorVersion: "2.0.0",
      checkedRules: ["evidence-provenance", "spread-dimensions", "conditions", "conflicts", "score-bounds"],
    },
  });
  return deepFreeze({
    schemaVersion: "2.0.0",
    spreadId: relationBatch.spreadId,
    candidateBatch,
    scoredBatch,
    resolution,
    claim,
  });
}
