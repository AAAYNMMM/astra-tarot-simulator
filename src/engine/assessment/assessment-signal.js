const STANCES = Object.freeze(["supportive", "cautionary", "descriptive", "conditional", "transformative"]);

export class AssessmentError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "AssessmentError";
    this.code = code;
  }
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function compare(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function uniqueSorted(values) {
  return [...new Set((values || []).filter(Boolean))].sort(compare);
}

function policyVersion(policy) {
  const version = policy?.policyVersion;
  if (typeof version !== "string" || !version) {
    throw new AssessmentError("ASSESSMENT_INVALID_POLICY", "Assessment policy requires policyVersion.");
  }
  return version;
}

function contractKind(policy) {
  const configured = policy?.outputContract;
  if (!["alignment-grade", "situation-map", "action-prompt", "comparison-support"].includes(configured)) {
    throw new AssessmentError("ASSESSMENT_INVALID_POLICY", `Unsupported assessment kind: ${configured}.`);
  }
  return configured;
}

function spreadIsEligible(policy, spreadId) {
  return Array.isArray(policy?.allowedSpreads) && policy.allowedSpreads.includes(spreadId);
}

function requireEngineResult(engineResult) {
  if (!engineResult || !Array.isArray(engineResult.observations) || !Array.isArray(engineResult.relations)
    || !Array.isArray(engineResult.resolution?.activeCandidates) || !engineResult.claim) {
    throw new AssessmentError("ASSESSMENT_INVALID_ENGINE_RESULT", "Assessment requires observations, relations, active candidates, and a claim.");
  }
  if (!engineResult.spreadId || !engineResult.claim.id) {
    throw new AssessmentError("ASSESSMENT_INVALID_ENGINE_RESULT", "Assessment engine result has no stable spread or claim identity.");
  }
}

const GROUP_POSITIONS = Object.freeze({
  single: Object.freeze({ foundation: [], process: [], outcome: [], action: ["essence"], context: [] }),
  timeline: Object.freeze({ foundation: ["past"], process: ["present"], outcome: ["future"], action: ["present"], context: [] }),
  cross: Object.freeze({ foundation: ["root"], process: ["core", "influence"], outcome: ["trend"], action: ["action"], context: [] }),
  celtic: Object.freeze({ foundation: ["past", "below"], process: ["present", "challenge", "future", "external"], outcome: ["outcome"], action: ["advice"], context: ["above", "hopes"] }),
});

function dimensionsAverage(observations) {
  const totals = new Map();
  const counts = new Map();
  for (const observation of observations) {
    for (const [dimension, value] of Object.entries(observation.dimensions || {})) {
      if (!Number.isFinite(value)) continue;
      totals.set(dimension, (totals.get(dimension) || 0) + value);
      counts.set(dimension, (counts.get(dimension) || 0) + 1);
    }
  }
  return Object.fromEntries([...totals.keys()].sort(compare).map((dimension) => [
    dimension,
    Number((totals.get(dimension) / counts.get(dimension)).toFixed(4)),
  ]));
}

function emptyStances() {
  return Object.fromEntries(STANCES.map((stance) => [stance, 0]));
}

function groupFor({ positionIds, observations, relations, candidates }) {
  const positionSet = new Set(positionIds);
  const selectedObservations = observations.filter((item) => positionSet.has(item.positionId));
  const observationIds = new Set(selectedObservations.map((item) => item.id));
  const selectedCandidates = candidates.filter((item) => item.positionIds?.some((id) => positionSet.has(id)));
  const selectedRelations = relations.filter((item) => (
    observationIds.has(item.sourceObservationId) || observationIds.has(item.targetObservationId)
  ));
  const stances = emptyStances();
  for (const candidate of selectedCandidates) if (STANCES.includes(candidate.stance)) stances[candidate.stance] += 1;
  return {
    positionIds: [...positionIds],
    evidenceRefs: uniqueSorted([
      ...selectedObservations.map((item) => item.id),
      ...selectedRelations.map((item) => item.id),
    ]),
    sourceRefs: uniqueSorted(selectedObservations.flatMap((item) => item.sourceRefs || [])),
    semanticRefs: uniqueSorted(selectedObservations.map((item) => item.semanticUnitRef)),
    questionDimensions: uniqueSorted(selectedObservations.flatMap((item) => [
      ...(item.questionDimensions || []),
      ...(item.matchedDimensions || []),
    ])),
    tags: uniqueSorted([
      ...selectedObservations.flatMap((item) => item.semanticTags || []),
      ...selectedRelations.flatMap((item) => item.tags || []),
    ]),
    dimensions: dimensionsAverage(selectedObservations),
    stances,
    stanceCounts: { ...stances },
  };
}

function groupDimension(group, dimension) {
  const value = group.dimensions?.[dimension];
  return Number.isFinite(value) ? Number(value) : null;
}

function describeFoundation(group) {
  if (!group.positionIds.length) return "not-applicable";
  const { supportive, cautionary } = group.stances;
  if (supportive && cautionary) return "mixed";
  if (cautionary > supportive) return "weak";
  if (supportive > cautionary) return "supportive";
  return "neutral";
}

function describeProcess(group) {
  if (!group.positionIds.length) return "not-applicable";
  const { supportive, cautionary, conditional, transformative } = group.stances;
  if (cautionary > supportive && cautionary >= conditional + transformative) return "blocked";
  if (supportive && cautionary) return "mixed";
  if (supportive && !cautionary && !transformative) return "smooth";
  if (conditional || transformative || cautionary) return "conditional";
  return "smooth";
}

function describeStability(groups) {
  const value = groupDimension(groups.outcome, "stability") ?? groupDimension(groups.process, "stability");
  if (!groups.outcome.positionIds.length) return "not-applicable";
  if (value === null || value === 0) return "conditional";
  if (value < 0) return "fragile";
  if (value >= 1) return "stable";
  return "conditional";
}

function describeAgency(groups) {
  const value = groupDimension(groups.action, "agency") ?? groupDimension(groups.process, "agency");
  if (!groups.action.positionIds.length) return "not-applicable";
  if (value === null || value === 0) return "shared";
  if (value < 0) return "limited";
  if (value >= 1) return "high";
  return "shared";
}

function describeBurden(groups) {
  const risk = Math.max(groupDimension(groups.process, "risk") ?? 0, groupDimension(groups.outcome, "risk") ?? 0);
  const cautionary = groups.process.stances.cautionary + groups.outcome.stances.cautionary;
  if (risk >= 2 || cautionary >= 3) return "high";
  if (risk > 0 || cautionary > 0) return "medium";
  return "low";
}

function describeEvidence(groups, missingEvidenceDimensions) {
  const refs = uniqueSorted(Object.values(groups).flatMap((group) => group.evidenceRefs));
  const sources = uniqueSorted(Object.values(groups).flatMap((group) => group.sourceRefs));
  if (refs.length < 2 || sources.length < 1) return "limited";
  if (missingEvidenceDimensions.length || (sources.length === 1 && refs.length > 3)) return "dispersed";
  return "sufficient";
}

export function createAssessmentSignal({ engineResult, policy } = {}) {
  requireEngineResult(engineResult);
  const version = policyVersion(policy);
  if (policy.questionId !== engineResult.questionId) {
    throw new AssessmentError("ASSESSMENT_POLICY_QUESTION_MISMATCH", "Assessment policy and engine result questionId differ.");
  }
  const positions = GROUP_POSITIONS[engineResult.spreadId];
  if (!positions) throw new AssessmentError("ASSESSMENT_UNSUPPORTED_SPREAD", `Unsupported spread: ${engineResult.spreadId}.`);
  const candidates = [...engineResult.resolution.activeCandidates];
  const groups = Object.fromEntries(Object.entries(positions).map(([name, positionIds]) => [
    name,
    groupFor({ positionIds, observations: engineResult.observations, relations: engineResult.relations, candidates }),
  ]));
  const unresolvedConflictIds = uniqueSorted((engineResult.resolution.conflicts || [])
    .filter((item) => item.resolution === "retain-tension")
    .map((item) => item.id));
  const allEvidenceRefs = uniqueSorted([
    ...Object.values(groups).flatMap((group) => group.evidenceRefs),
    ...(engineResult.claim.evidenceRefs || []),
  ]);
  const sourceRefs = uniqueSorted([
    ...Object.values(groups).flatMap((group) => group.sourceRefs),
    ...(engineResult.claim.sourceRefs || []),
  ]);
  const semanticRefs = uniqueSorted(Object.values(groups).flatMap((group) => group.semanticRefs));
  const tags = uniqueSorted(Object.values(groups).flatMap((group) => group.tags));
  const coveredEvidenceDimensions = uniqueSorted([
    ...engineResult.observations.flatMap((item) => item.questionDimensions || []),
    ...engineResult.observations.flatMap((item) => item.matchedDimensions || []),
    ...candidates.map((item) => item.dimension),
  ]);
  const coveredDimensionSet = new Set(coveredEvidenceDimensions);
  const missingEvidenceDimensions = uniqueSorted((policy.requiredEvidenceDimensions || [])
    .filter((dimension) => !coveredDimensionSet.has(dimension)));
  const signal = {
    schemaVersion: "1.0.0",
    id: `assessment-signal-${engineResult.claim.id}`,
    kind: contractKind(policy),
    questionId: engineResult.questionId,
    spreadId: engineResult.spreadId,
    spreadEligible: spreadIsEligible(policy, engineResult.spreadId) && groups.outcome.positionIds.length > 0,
    groups,
    descriptors: {
      foundation: describeFoundation(groups.foundation),
      process: describeProcess(groups.process),
      stability: describeStability(groups),
      agency: describeAgency(groups),
      burden: describeBurden(groups),
      evidence: describeEvidence(groups, missingEvidenceDimensions),
    },
    unresolvedConflictIds,
    allEvidenceRefs,
    evidenceRefs: allEvidenceRefs,
    sourceRefs,
    semanticRefs,
    tags,
    coveredEvidenceDimensions,
    missingEvidenceDimensions,
    provenance: {
      claimId: engineResult.claim.id,
      policySchemaVersion: policy.schemaVersion,
      policyVersion: version,
      observationCount: engineResult.observations.length,
      relationCount: engineResult.relations.length,
      activeCandidateCount: candidates.length,
    },
  };
  return deepFreeze(signal);
}
