import { AssessmentError } from "./assessment-signal.js";

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

function registryEntry(registry, id) {
  if (Array.isArray(registry)) return registry.find((item) => item?.id === id) || null;
  if (registry && typeof registry === "object") return registry[id] || null;
  return null;
}

function expectationFor(policy, expectationId) {
  const expectation = registryEntry(policy?.expectations || policy?.expectationRegistry, expectationId);
  if (!expectation) throw new AssessmentError("ASSESSMENT_UNKNOWN_EXPECTATION", `Unknown expectation: ${expectationId}.`);
  return expectation;
}

function criterionFor(policy, criterionId) {
  const criterion = registryEntry(policy?.criteria || policy?.criterionRegistry, criterionId);
  if (!criterion) throw new AssessmentError("ASSESSMENT_UNKNOWN_CRITERION", `Unknown comparison criterion: ${criterionId}.`);
  return criterion;
}

function criterionFocusFor(signal, criterion) {
  const focusDimensions = uniqueSorted(criterion.focusDimensions || []);
  const focusSet = new Set(focusDimensions);
  const groups = Object.entries(signal.groups || {}).flatMap(([groupId, group]) => {
    const matchedDimensions = uniqueSorted((group.questionDimensions || []).filter((item) => focusSet.has(item)));
    if (!matchedDimensions.length) return [];
    return [{ groupId, matchedDimensions, evidenceRefs: uniqueSorted(group.evidenceRefs || []) }];
  });
  const coveredDimensions = uniqueSorted(groups.flatMap((group) => group.matchedDimensions));
  const coveredSet = new Set(coveredDimensions);
  const missingDimensions = focusDimensions.filter((item) => !coveredSet.has(item));
  const coverage = !coveredDimensions.length ? "missing" : missingDimensions.length ? "partial" : "complete";
  return {
    id: criterion.id,
    label: criterion.label,
    focusDimensions,
    coveredDimensions,
    missingDimensions,
    coverage,
    groups,
    evidenceRefs: uniqueSorted(groups.flatMap((group) => group.evidenceRefs)),
  };
}

function alignmentFor(signal, expectation) {
  const tags = new Set(signal.groups.outcome.tags || []);
  const constructResults = (expectation.constructs || []).map((construct) => {
    const support = uniqueSorted((construct.supportTags || []).filter((tag) => tags.has(tag)));
    const counter = uniqueSorted((construct.counterTags || []).filter((tag) => tags.has(tag)));
    let state = "absent";
    if (support.length && counter.length) state = "mixed";
    else if (support.length) state = "support";
    else if (counter.length) state = "counter";
    return { id: construct.id, priority: construct.priority, state, support, counter };
  });
  const support = uniqueSorted(constructResults.flatMap((item) => item.support));
  const counter = uniqueSorted(constructResults.flatMap((item) => item.counter));
  const weightFor = (item) => item.priority === "core" ? 2 : 1;
  const supportWeight = constructResults
    .filter((item) => item.state === "support")
    .reduce((sum, item) => sum + weightFor(item), 0);
  const counterWeight = constructResults
    .filter((item) => item.state === "counter")
    .reduce((sum, item) => sum + weightFor(item), 0);
  const mixedWeight = constructResults
    .filter((item) => item.state === "mixed")
    .reduce((sum, item) => sum + weightFor(item), 0);
  const coreSupport = constructResults.some((item) => item.priority === "core" && item.state === "support");
  const coreCounter = constructResults.some((item) => item.priority === "core" && item.state === "counter");
  let outcomeAlignment = "neutral";
  if (coreSupport && supportWeight >= 2 && counterWeight === 0 && mixedWeight === 0) outcomeAlignment = "clear-alignment";
  else if (supportWeight > counterWeight + mixedWeight) outcomeAlignment = "partial-alignment";
  else if (coreCounter && counterWeight >= 2 && supportWeight === 0 && mixedWeight === 0) outcomeAlignment = "clear-divergence";
  else if (counterWeight > supportWeight + mixedWeight) outcomeAlignment = "divergence";
  return { outcomeAlignment, support, counter, constructResults };
}

const GRADE_ORDER = Object.freeze(["SSS", "SS", "S", "A", "B", "C", "D", "E"]);

function capGrade(grade, cap) {
  return GRADE_ORDER.indexOf(grade) < GRADE_ORDER.indexOf(cap) ? cap : grade;
}

function gradeFor(signal, outcomeAlignment) {
  const { foundation, process, stability, agency, burden, evidence } = signal.descriptors;
  if (evidence === "limited") return { grade: null, caps: [], reasonCode: "ASSESSMENT_EVIDENCE_LIMITED" };
  if (outcomeAlignment === "clear-alignment"
    && foundation === "supportive" && process === "smooth" && stability === "stable" && agency === "high"
    && burden === "low" && evidence === "sufficient" && signal.unresolvedConflictIds.length === 0) {
    return { grade: "SSS", caps: [], reasonCode: null };
  }
  const positives = [foundation === "supportive", process === "smooth", stability === "stable", agency === "high", burden === "low", evidence === "sufficient", signal.unresolvedConflictIds.length === 0]
    .filter(Boolean).length;
  let grade;
  if (outcomeAlignment === "clear-alignment") grade = positives >= 5 ? "SS" : "S";
  else if (outcomeAlignment === "partial-alignment") grade = process === "smooth" || process === "conditional" ? "A" : "B";
  else if (outcomeAlignment === "neutral") grade = "C";
  else if (outcomeAlignment === "divergence") grade = "D";
  else grade = "E";
  const caps = [];
  if (foundation === "weak") caps.push({ reason: "weak-foundation", maximumGrade: "A" });
  if (process === "blocked") caps.push({ reason: "blocked-process", maximumGrade: "B" });
  if (stability === "fragile") caps.push({ reason: "fragile-outcome", maximumGrade: "B" });
  if (agency === "limited") caps.push({ reason: "limited-agency", maximumGrade: "B" });
  if (burden === "high") caps.push({ reason: "high-burden", maximumGrade: "A" });
  if (evidence === "dispersed") caps.push({ reason: "dispersed-evidence", maximumGrade: "B" });
  if (signal.unresolvedConflictIds.length) caps.push({ reason: "unresolved-conflict", maximumGrade: "B" });
  for (const cap of caps) grade = capGrade(grade, cap.maximumGrade);
  return { grade, caps, reasonCode: null };
}

function trendFor(signal) {
  const stanceTotals = Object.values(signal.groups || {}).reduce((totals, group) => {
    for (const key of ["supportive", "cautionary", "conditional", "transformative"]) {
      totals[key] += Number(group?.stanceCounts?.[key] ?? group?.stances?.[key]) || 0;
    }
    return totals;
  }, { supportive: 0, cautionary: 0, conditional: 0, transformative: 0 });
  const { process, stability, burden } = signal.descriptors || {};
  if (process === "blocked" && stanceTotals.cautionary > stanceTotals.supportive) return "clearly-blocked";
  if (stanceTotals.cautionary >= stanceTotals.supportive + 2 || (stability === "fragile" && burden === "high")) return "leaning-difficult";
  if (process === "mixed" || stanceTotals.conditional + stanceTotals.transformative >= 2) return "changeful";
  if (stanceTotals.supportive >= stanceTotals.cautionary + 3 && stability === "stable") return "clearly-positive";
  if (stanceTotals.supportive > stanceTotals.cautionary) return "leaning-positive";
  return "relatively-steady";
}

export function evaluateAssessment({ signal, policy, expectationId = null, criterionId = null } = {}) {
  if (!signal || !signal.kind || !signal.provenance?.policyVersion) {
    throw new AssessmentError("ASSESSMENT_INVALID_SIGNAL", "A sealed AssessmentSignal is required.");
  }
  if (!policy?.schemaVersion || !policy?.policyVersion) {
    throw new AssessmentError("ASSESSMENT_INVALID_POLICY", "Assessment policy requires schemaVersion and policyVersion.");
  }
  if (signal.provenance.policySchemaVersion !== policy.schemaVersion
    || signal.provenance.policyVersion !== policy.policyVersion) {
    throw new AssessmentError("ASSESSMENT_POLICY_VERSION_MISMATCH", "AssessmentSignal and policy versions differ.");
  }
  if (signal.questionId !== policy.questionId || signal.kind !== policy.outputContract) {
    throw new AssessmentError("ASSESSMENT_POLICY_SIGNAL_MISMATCH", "AssessmentSignal and policy identity differ.");
  }
  const base = {
    schemaVersion: "1.0.0",
    signalId: signal.id,
    kind: signal.kind,
    questionId: signal.questionId,
    spreadId: signal.spreadId,
    evidenceRefs: uniqueSorted(signal.evidenceRefs),
    sourceRefs: uniqueSorted(signal.sourceRefs),
    semanticRefs: uniqueSorted(signal.semanticRefs),
    descriptors: { ...(signal.descriptors || {}) },
    trend: trendFor(signal),
    grade: null,
  };
  if (signal.kind !== "alignment-grade") {
    let criterion = null;
    if (policy.criterionMode === "required") {
      if (!criterionId) throw new AssessmentError("ASSESSMENT_CRITERION_REQUIRED", "Comparison assessment requires criterionId.");
    }
    if (criterionId) {
      criterion = criterionFor(policy, criterionId);
    }
    return deepFreeze({
      ...base,
      criterionId,
      ...(criterion ? { criterionFocus: criterionFocusFor(signal, criterion) } : {}),
    });
  }
  if (!expectationId) throw new AssessmentError("ASSESSMENT_EXPECTATION_REQUIRED", "Alignment assessment requires expectationId.");
  const expectation = expectationFor(policy, expectationId);
  if (expectation.resultMode === "situation-map") {
    return deepFreeze({ ...base, kind: "situation-map", expectationId, reasonCode: "ASSESSMENT_OBSERVE_ONLY" });
  }
  if (!signal.spreadEligible) {
    const reasonCode = signal.spreadId === "single" ? "ASSESSMENT_SINGLE_CARD_EXCLUDED" : "ASSESSMENT_SPREAD_INELIGIBLE";
    return deepFreeze({ ...base, kind: "situation-map", expectationId, reasonCode });
  }
  const { outcomeAlignment, support, counter, constructResults } = alignmentFor(signal, expectation);
  const gradeResult = gradeFor(signal, outcomeAlignment);
  return deepFreeze({
    ...base,
    expectationId,
    outcomeAlignment,
    grade: gradeResult.grade,
    reasonCode: gradeResult.reasonCode,
    caps: gradeResult.caps,
    constructResults,
    matchedSupportTags: support,
    matchedCounterTags: counter,
  });
}

export { AssessmentError };
