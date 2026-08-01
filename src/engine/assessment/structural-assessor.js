import { SPREADS } from "../../knowledge/spreads/definitions.js";
import { getSpreadReadingProfile } from "../../knowledge/readings/spread-reading-profiles.js";

const FACTORS = Object.freeze([
  "foundation", "process", "outcome", "stability", "resistance", "cost", "controllability", "interCardConflict",
]);
const PENALTIES = new Set(["resistance", "cost", "interCardConflict"]);
const STANCE_VALUE = Object.freeze({ supportive: 1, transformative: 0.65, conditional: 0.5, descriptive: 0.5, cautionary: 0 });
const WEIGHTS = Object.freeze({
  single: Object.freeze({ process: 0.35, stability: 0.2, resistance: 0.15, cost: 0.1, controllability: 0.2 }),
  timeline: Object.freeze({ foundation: 0.1, process: 0.2, outcome: 0.28, stability: 0.1, resistance: 0.1, cost: 0.06, controllability: 0.1, interCardConflict: 0.06 }),
  cross: Object.freeze({ foundation: 0.12, process: 0.16, outcome: 0.22, stability: 0.1, resistance: 0.12, cost: 0.08, controllability: 0.12, interCardConflict: 0.08 }),
  celtic: Object.freeze({ foundation: 0.12, process: 0.14, outcome: 0.18, stability: 0.1, resistance: 0.12, cost: 0.08, controllability: 0.1, interCardConflict: 0.16 }),
});
const THRESHOLDS = Object.freeze([
  ["SSS", 0.9], ["SS", 0.82], ["S", 0.74], ["A", 0.64], ["B", 0.54], ["C", 0.44], ["D", 0.3], ["E", 0],
]);
const GRADE_ORDER = Object.freeze(["SSS", "SS", "S", "A", "B", "C", "D", "E"]);

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

const clamp = (value) => Math.min(1, Math.max(0, Number(value) || 0));
const round = (value) => Number(value.toFixed(4));
const unique = (values) => [...new Set((values || []).filter(Boolean))].sort();
const positionsOf = (candidate) => unique(candidate.positionIds || candidate.positions || [candidate.positionId]);
const scoreOf = (candidate) => clamp(Number.isFinite(Number(candidate.score)) ? Number(candidate.score) : Number(candidate.strength) || 0);
const stanceOf = (candidate) => STANCE_VALUE[candidate.stance] ?? 0.5;
const intersects = (candidate, positionIds) => positionsOf(candidate).some((positionId) => positionIds.includes(positionId));
const evidenceOf = (items) => unique(items.flatMap((item) => [item.id, ...(item.evidenceRefs || [])]));

function candidateFacet(candidate) {
  if (candidate.selectedFacet || candidate.facet) return candidate.selectedFacet || candidate.facet;
  const tagged = (candidate.tags || []).find((tag) => /^facet:/.test(tag));
  if (tagged) return tagged.slice(6);
  const parts = String(candidate.propositionKey || "").split(":");
  return parts.length >= 3 ? parts[1] : "";
}

function weightedShare(items, numeratorPredicate, value = () => 1) {
  const denominator = items.reduce((sum, item) => sum + scoreOf(item), 0);
  if (!denominator) return null;
  return clamp(items.reduce((sum, item) => (
    sum + (numeratorPredicate(item) ? scoreOf(item) * value(item) : 0)
  ), 0) / denominator);
}

function groupSupport(candidates, positions) {
  const selected = candidates.filter((candidate) => intersects(candidate, positions));
  const denominator = selected.reduce((sum, candidate) => sum + scoreOf(candidate), 0);
  return {
    value: denominator ? clamp(selected.reduce((sum, candidate) => sum + scoreOf(candidate) * stanceOf(candidate), 0) / denominator) : null,
    evidenceRefs: evidenceOf(selected),
  };
}

function observationDimension(observations, positions, dimension) {
  const selected = observations.filter((observation) => positions.includes(observation.positionId) && Number.isFinite(Number(observation.dimensions?.[dimension])));
  if (!selected.length) return { value: null, evidenceRefs: [] };
  const average = selected.reduce((sum, observation) => sum + Number(observation.dimensions[dimension]), 0) / selected.length;
  return { value: clamp((average + 3) / 6), evidenceRefs: evidenceOf(selected) };
}

function relationShare(relations, types, fallback) {
  const total = relations.reduce((sum, relation) => sum + clamp(relation.strength), 0);
  const selected = relations.filter((relation) => types.includes(relation.type));
  return {
    value: total ? clamp(selected.reduce((sum, relation) => sum + clamp(relation.strength), 0) / total) : fallback,
    evidenceRefs: evidenceOf(selected),
  };
}

function positionsFor(profile, group) {
  return [...(profile.scoringGroups?.[group] || [])];
}

const CELTIC_RESULT_GROUPS = Object.freeze([
  Object.freeze({ id: "core", label: "核心组", positions: Object.freeze(["present", "challenge"]) }),
  Object.freeze({ id: "foundation-past", label: "基础与过去组", positions: Object.freeze(["below", "past"]) }),
  Object.freeze({ id: "conscious-future", label: "意识与近期组", positions: Object.freeze(["above", "future"]) }),
  Object.freeze({ id: "self-environment-hopes", label: "当事人、环境与希望组", positions: Object.freeze(["self", "external", "hopes"]) }),
]);

function directionScore(candidates) {
  const selected = candidates.filter((candidate) => scoreOf(candidate) > 0);
  const denominator = selected.reduce((sum, candidate) => sum + scoreOf(candidate), 0);
  if (!denominator) return null;
  const direction = { supportive: 1, cautionary: -1, transformative: 0.25, conditional: 0, descriptive: 0 };
  return selected.reduce((sum, candidate) => sum + scoreOf(candidate) * (direction[candidate.stance] ?? 0), 0) / denominator;
}

function resultSupportForCeltic({ observations, relations, candidates, conflicts }) {
  const outcomeObservation = observations.find((item) => item.positionId === "outcome");
  const outcomeCandidates = candidates.filter((item) => positionsOf(item).includes("outcome"));
  const incoming = relations.filter((relation) => (
    relation.targetObservationId === outcomeObservation?.id || relation.structure?.targetPositionId === "outcome"
  ));
  if (!outcomeObservation || !outcomeCandidates.length) return { status: "insufficient", groups: [], evidenceRefs: [] };
  const outcomeDirection = directionScore(outcomeCandidates);
  if (outcomeDirection === null) return { status: "insufficient", groups: [], evidenceRefs: [] };
  const groups = CELTIC_RESULT_GROUPS.map((definition) => {
    const groupCandidates = candidates.filter((candidate) => positionsOf(candidate).some((position) => definition.positions.includes(position)));
    const groupRelations = incoming.filter((relation) => definition.positions.includes(relation.structure?.sourcePositionId));
    const directTension = groupRelations.some((relation) => ["weakens", "contradicts"].includes(relation.type));
    const directSupport = groupRelations.some((relation) => ["supports", "reinforces", "continues", "repairs"].includes(relation.type));
    const score = directionScore(groupCandidates);
    let status = "conditional";
    if (directTension) status = "opposing";
    else if (directSupport) status = "supportive";
    else if (score !== null) {
      if (outcomeDirection > 0.15) status = score > 0.1 ? "supportive" : score < -0.1 ? "opposing" : "conditional";
      else if (outcomeDirection < -0.15) status = score < -0.1 ? "supportive" : score > 0.1 ? "opposing" : "conditional";
    }
    return {
      id: definition.id,
      label: definition.label,
      status,
      evidenceRefs: evidenceOf([...groupCandidates, ...groupRelations]),
    };
  });
  if (groups.some((group) => !group.evidenceRefs.length)) return { status: "insufficient", groups, evidenceRefs: [] };
  const supportiveCount = groups.filter((group) => group.status === "supportive").length;
  const opposingCount = groups.filter((group) => group.status === "opposing").length;
  const unresolved = conflicts.some((conflict) => conflict.resolution === "retain-tension");
  const futureConflict = incoming.some((relation) => (
    relation.structure?.sourcePositionId === "future"
    && ["weakens", "contradicts"].includes(relation.type)
    && Number(relation.strength || 0) >= 0.55
  ));
  const conditionalOutcome = outcomeCandidates.some((candidate) => ["conditional", "transformative"].includes(candidate.stance))
    || incoming.some((relation) => ["conditions", "transforms"].includes(relation.type));
  let status = "conditional";
  if (opposingCount >= 2 || futureConflict) status = "contradicted";
  else if (supportiveCount >= 3 && !unresolved && !conditionalOutcome) status = "supported";
  return {
    status,
    groups,
    evidenceRefs: evidenceOf([outcomeObservation, ...outcomeCandidates, ...incoming, ...conflicts]),
  };
}

function capGrade(grade, maximumGrade) {
  return GRADE_ORDER.indexOf(grade) < GRADE_ORDER.indexOf(maximumGrade) ? maximumGrade : grade;
}

export function gradeForStructuralScore(score) {
  const numeric = Number(score);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1) throw new RangeError("Structural score must be between 0 and 1.");
  return THRESHOLDS.find(([, threshold]) => numeric >= threshold)[0];
}

function factorBand(key, value) {
  if (value === "not-applicable") return "not-applicable";
  if (value >= 0.67) return "high";
  if (value >= 0.34) return "medium";
  return "low";
}

function incompleteResult(spreadId, status, issues, factorEvidence = {}) {
  const factors = Object.fromEntries(FACTORS.map((factor) => [factor,
    spreadId === "single" && ["foundation", "outcome", "interCardConflict"].includes(factor) ? "not-applicable" : null,
  ]));
  return deepFreeze({
    schemaVersion: "2.0.0", spreadId, status, issues: unique(issues), factors,
    internalScore: null, grade: null, caps: [], factorBands: Object.fromEntries(FACTORS.map((factor) => [factor, {
      band: factors[factor] === "not-applicable" ? "not-applicable" : "unavailable",
      evidenceRefs: unique(factorEvidence[factor] || []),
    }])), evidenceRefs: unique(Object.values(factorEvidence).flat()),
  });
}

export function assessStructuralReading({ spreadId, observations, relations, activeCandidates, conflicts } = {}) {
  const spread = SPREADS.find((item) => item.id === spreadId);
  const profile = getSpreadReadingProfile(spreadId);
  if (!spread || !profile) return incompleteResult(spreadId || "unknown", "invalid", ["unsupported-spread"]);
  if (![observations, relations, activeCandidates, conflicts].every(Array.isArray)) {
    return incompleteResult(spreadId, "invalid", ["observations-relations-activeCandidates-conflicts-must-be-arrays"]);
  }
  const expected = spread.positions.map((position) => position.id);
  const actual = unique(observations.map((observation) => observation.positionId));
  if (observations.some((observation) => observation.spreadId && observation.spreadId !== spreadId)) {
    return incompleteResult(spreadId, "invalid", ["observation-spread-mismatch"]);
  }
  if (actual.length !== observations.length) {
    return incompleteResult(spreadId, "invalid", ["duplicate-observation-position"]);
  }
  const missingPositions = expected.filter((positionId) => !actual.includes(positionId));
  const issues = missingPositions.map((positionId) => `missing-position:${positionId}`);
  if (!activeCandidates.length) issues.push("missing-active-candidates");
  if (spreadId !== "single" && !relations.length) issues.push("missing-relations");
  if (issues.length) return incompleteResult(spreadId, "incomplete", issues);

  const foundation = spreadId === "single" ? { value: "not-applicable", evidenceRefs: [] } : groupSupport(activeCandidates, positionsFor(profile, "foundation"));
  const process = groupSupport(activeCandidates, positionsFor(profile, "process"));
  const outcome = spreadId === "single" ? { value: "not-applicable", evidenceRefs: [] } : groupSupport(activeCandidates, positionsFor(profile, "outcome"));

  const stabilityDimension = observationDimension(observations, positionsFor(profile, "stability"), "stability");
  const continuity = relationShare(relations, ["reinforces", "continues"], 0.5);
  const stability = {
    value: stabilityDimension.value === null ? null : clamp(0.65 * stabilityDimension.value + 0.35 * continuity.value),
    evidenceRefs: unique([...stabilityDimension.evidenceRefs, ...continuity.evidenceRefs]),
  };

  const resistancePositions = positionsFor(profile, "resistance");
  const resistanceCandidates = activeCandidates.filter((candidate) => intersects(candidate, resistancePositions));
  const obstacleShare = weightedShare(resistanceCandidates, (candidate) => (
    ["obstacle", "challenge", "limit", "boundary"].includes(candidateFacet(candidate))
    || (candidate.tags || []).some((tag) => /(?:obstacle|challenge|limit)/.test(tag))
  ));
  const weakening = relationShare(relations, ["weakens", "contradicts"], 0);
  const resistance = {
    value: obstacleShare === null ? null : clamp(0.6 * obstacleShare + 0.4 * weakening.value),
    evidenceRefs: unique([...evidenceOf(resistanceCandidates), ...weakening.evidenceRefs]),
  };

  const risk = observationDimension(observations, positionsFor(profile, "cost"), "risk");
  const costCandidates = activeCandidates.filter((candidate) => intersects(candidate, positionsFor(profile, "cost")));
  const limitingShare = weightedShare(costCandidates, (candidate) => (
    candidate.stance === "cautionary" && ["boundary", "obstacle", "action", "outcome"].includes(candidateFacet(candidate))
  ));
  const cost = {
    value: risk.value === null || limitingShare === null ? null : clamp(0.6 * risk.value + 0.4 * limitingShare),
    evidenceRefs: unique([...risk.evidenceRefs, ...evidenceOf(costCandidates)]),
  };

  const agencyPositions = positionsFor(profile, "controllability");
  const agency = observationDimension(observations, agencyPositions, "agency");
  const externalPositions = spreadId === "cross" ? ["influence"] : spreadId === "celtic" ? ["external"] : [];
  const externalCandidates = activeCandidates.filter((candidate) => intersects(candidate, externalPositions));
  const externalDominance = externalPositions.length
    ? (weightedShare(activeCandidates, (candidate) => intersects(candidate, externalPositions)) ?? 0)
    : 0;
  const controllability = {
    value: agency.value === null ? null : clamp(agency.value - externalDominance),
    evidenceRefs: unique([...agency.evidenceRefs, ...evidenceOf(externalCandidates)]),
  };

  const tension = relationShare(relations, ["weakens", "contradicts"], 0);
  const retained = conflicts.filter((conflict) => conflict.resolution === "retain-tension");
  const conflictShare = conflicts.length ? retained.length / conflicts.length : 0;
  const interCardConflict = spreadId === "single" ? { value: "not-applicable", evidenceRefs: [] } : {
    value: clamp(0.7 * tension.value + 0.3 * conflictShare),
    evidenceRefs: unique([...evidenceOf(relations), ...tension.evidenceRefs, ...evidenceOf(retained)]),
  };

  const parts = { foundation, process, outcome, stability, resistance, cost, controllability, interCardConflict };
  const missingFactors = Object.entries(parts).filter(([, part]) => part.value === null).map(([key]) => `missing-factor:${key}`);
  if (missingFactors.length) return incompleteResult(spreadId, "incomplete", missingFactors, Object.fromEntries(Object.entries(parts).map(([key, part]) => [key, part.evidenceRefs])));
  const factors = Object.fromEntries(Object.entries(parts).map(([key, part]) => [key, typeof part.value === "number" ? round(part.value) : part.value]));
  const weights = WEIGHTS[spreadId];
  const internalScore = round(Object.entries(weights).reduce((sum, [key, weight]) => (
    sum + weight * (PENALTIES.has(key) ? 1 - factors[key] : factors[key])
  ), 0));
  let grade = gradeForStructuralScore(internalScore);
  const caps = [];
  const addCap = (reason, maximumGrade) => caps.push({ reason, maximumGrade });
  if (spreadId === "single") addCap("single-maximum", "S");
  if (factors.foundation !== "not-applicable" && factors.foundation < 0.35) addCap("weak-foundation", "A");
  if (["process", "stability", "controllability"].some((key) => factors[key] < 0.35)) addCap("weak-core-factor", "B");
  if (factors.resistance > 0.7 || (factors.interCardConflict !== "not-applicable" && factors.interCardConflict > 0.65)) addCap("severe-resistance-or-conflict", "B");
  if (factors.cost > 0.75) addCap("high-cost", "A");
  const positiveKeys = ["foundation", "process", "outcome", "stability", "controllability"].filter((key) => factors[key] !== "not-applicable");
  const penaltyKeys = ["resistance", "cost", "interCardConflict"].filter((key) => factors[key] !== "not-applicable");
  const unresolved = retained.length > 0;
  if (!(positiveKeys.every((key) => factors[key] >= 0.7) && penaltyKeys.every((key) => factors[key] <= 0.25) && !unresolved)) addCap("sss-eligibility", "SS");
  if (factors.interCardConflict !== "not-applicable" && factors.interCardConflict > 0.35) addCap("ss-conflict-eligibility", "S");
  if (spreadId !== "single" && factors.outcome < 0.65) addCap("s-outcome-eligibility", "A");
  const resultSupport = spreadId === "celtic" ? resultSupportForCeltic({ observations, relations, candidates: activeCandidates, conflicts }) : null;
  if (resultSupport?.status === "insufficient") return incompleteResult(spreadId, "incomplete", ["missing-celtic-result-support"]);
  if (resultSupport?.status === "conditional") addCap("conditional-result-support", "A");
  if (resultSupport?.status === "contradicted") addCap("contradicted-result-support", "C");
  for (const cap of caps) grade = capGrade(grade, cap.maximumGrade);
  const factorBands = Object.fromEntries(FACTORS.map((key) => [key, {
    band: factorBand(key, factors[key]), evidenceRefs: unique(parts[key].evidenceRefs),
  }]));
  return deepFreeze({
    schemaVersion: "2.0.0", spreadId, status: "valid", factors, internalScore, grade,
    caps, factorBands, evidenceRefs: unique(Object.values(parts).flatMap((part) => part.evidenceRefs)),
    eligibility: {
      sss: !caps.some((cap) => cap.reason === "sss-eligibility"),
      ss: !caps.some((cap) => cap.reason === "ss-conflict-eligibility"),
      s: spreadId === "single" || !caps.some((cap) => cap.reason === "s-outcome-eligibility"),
    },
    ...(resultSupport ? { resultSupport } : {}),
  });
}

export const STRUCTURAL_ASSESSMENT_WEIGHTS = WEIGHTS;
export const STRUCTURAL_ASSESSMENT_THRESHOLDS = THRESHOLDS;
export const createStructuralAssessment = assessStructuralReading;
export const evaluateStructuralAssessment = assessStructuralReading;
