import assert from "node:assert/strict";
import fs from "node:fs";
import { SPREADS, LEGACY_SPREADS_V1, getSpreadDefinition, resolveStoredSpreadDefinition } from "../src/knowledge/spreads/definitions.js";
import { POSITION_OPERATOR_GROUPS, POSITION_EVIDENCE_WEIGHTS } from "../src/knowledge/spreads/operators/index.js";
import { getSpreadGraph } from "../src/engine/observations/spread-graphs.js";
import { SPREAD_READING_PROFILES, validateSpreadReadingProfile } from "../src/knowledge/readings/spread-reading-profiles.js";
import { resolveReversalMode, resolveReversalModeWithTrace } from "../src/engine/reversal/reversal-mode-resolver.js";
import { assessStructuralReading, gradeForStructuralScore } from "../src/engine/assessment/structural-assessor.js";
import { createStructuralPresentation } from "../src/engine/assessment/structural-presentation.js";
import { createSpreadWorkflow } from "../src/engine/interpretation/workflows/index.js";
import { validateReadingPresentationV3 } from "../src/engine/interpretation/reading-presentation-validator.js";
import { loadCardProfile } from "../src/knowledge/cards/registry.js";

const spread = (id) => SPREADS.find((entry) => entry.id === id);
assert.deepEqual(SPREADS.map((entry) => entry.id), ["single", "timeline", "cross", "celtic"]);
assert.equal(spread("single").name, "单张牌");
assert.deepEqual(spread("single").positions.map((entry) => entry.id), ["essence"]);
assert.deepEqual(spread("timeline").positions.map((entry) => entry.id), ["past", "present", "future"]);
assert.deepEqual(spread("cross").positions.map((entry) => entry.id), ["core", "root", "trend", "influence", "action"]);
assert.deepEqual(spread("celtic").positions.map((entry) => entry.id), ["present", "challenge", "above", "below", "past", "future", "self", "external", "hopes", "outcome"]);
assert.equal(spread("celtic").definitionVersion, "2.0.0");
assert.ok(getSpreadDefinition("celtic", "1.0.0").positions.some((entry) => entry.id === "advice"));
assert.ok(!getSpreadDefinition("celtic", "1.0.0").positions.some((entry) => entry.id === "self"));
assert.equal(getSpreadDefinition("single", "1.0.0").name, "心语单张");
assert.equal(resolveStoredSpreadDefinition({ spreadId: "celtic" }), LEGACY_SPREADS_V1.find((entry) => entry.id === "celtic"));

assert.deepEqual(POSITION_EVIDENCE_WEIGHTS, {
  single: { essence: 1 }, timeline: { past: 0.9, present: 1.1, future: 1 },
  cross: { core: 1.2, root: 1, trend: 1, influence: 0.95, action: 1.1 },
  celtic: { present: 1.2, challenge: 1.2, above: 0.95, below: 1.05, past: 0.9, future: 1, self: 1, external: 0.9, hopes: 0.8, outcome: 1.1 },
});
for (const entry of SPREADS) {
  assert.deepEqual(POSITION_OPERATOR_GROUPS[entry.id].map((operator) => operator.positionId), entry.positions.map((position) => position.id));
}
assert.deepEqual(getSpreadGraph("cross").edges.map((edge) => `${edge.source}->${edge.target}`), [
  "root->core", "influence->core", "core->trend", "core->action", "action->trend", "influence->action",
]);
assert.ok(!getSpreadGraph("cross").edges.some((edge) => edge.source === "action" && edge.target === "influence"));
assert.deepEqual(getSpreadGraph("cross").mainLines.map((line) => line.positions), [
  ["root", "core", "trend"], ["influence", "core", "action"], ["influence", "action"], ["action", "trend"],
]);

const profileSchema = JSON.parse(fs.readFileSync(new URL("../src/knowledge/schemas/spread-reading-profile.schema.json", import.meta.url), "utf8"));
assert.equal(profileSchema.properties.schemaVersion.const, "2.0.0");
for (const [spreadId, profile] of Object.entries(SPREAD_READING_PROFILES)) {
  assert.equal(profile.spreadId, spreadId);
  assert.deepEqual(validateSpreadReadingProfile(profile), []);
  assert.ok(!/(?:questionText|questionId|expectationId)/.test(JSON.stringify(profile)));
  assert.deepEqual(Object.keys(profile.positionResponsibilities), spread(spreadId).positions.map((position) => position.id));
}
for (const field of [
  "question", "questionId", "questionText", "categoryId", "domain", "intent", "questionType",
  "expectation", "expectationId", "criterionId", "timeframe", "comparison",
]) {
  assert.ok(validateSpreadReadingProfile({
    ...SPREAD_READING_PROFILES.single,
    [field]: `forbidden-${field}`,
  }).some((error) => error.includes(field)), field);
}
assert.deepEqual(SPREAD_READING_PROFILES.celtic.outputWorkflow.map((stage) => stage.id), [
  "core", "foundation", "past", "conscious", "future", "self", "environment", "hopes", "outcome",
]);

const reversalCard = {
  reversal: {
    supportedModes: ["first", "second", "third"],
    defaultWeights: { first: 0.2, second: 0.4, third: 0.4 },
    modeFacetRefs: { first: ["state.primary"], second: ["state.secondary"], third: ["state.primary"] },
  },
};
const reversalOperator = { selectableFacets: ["state", "action"] };
assert.equal(resolveReversalMode({ card: reversalCard, operator: reversalOperator }), "second");
assert.deepEqual(resolveReversalModeWithTrace({ card: reversalCard, operator: reversalOperator }).ranking.map((entry) => entry.mode), ["second", "third", "first"]);
const positionSensitiveCard = await loadCardProfile("major-0");
const resolvedPositionModes = new Set(Object.values(POSITION_OPERATOR_GROUPS).flat().map((operator) => (
  resolveReversalMode({ card: positionSensitiveCard, operator })
)));
assert.ok(resolvedPositionModes.size >= 2, "a real reversed card must resolve differently across position responsibilities");

assert.deepEqual([
  [0.9, "SSS"], [0.8999, "SS"], [0.82, "SS"], [0.8199, "S"], [0.74, "S"], [0.64, "A"],
  [0.54, "B"], [0.44, "C"], [0.3, "D"], [0.2999, "E"],
].map(([score, expected]) => [score, gradeForStructuralScore(score), expected]), [
  [0.9, "SSS", "SSS"], [0.8999, "SS", "SS"], [0.82, "SS", "SS"], [0.8199, "S", "S"], [0.74, "S", "S"], [0.64, "A", "A"],
  [0.54, "B", "B"], [0.44, "C", "C"], [0.3, "D", "D"], [0.2999, "E", "E"],
]);

function fixture(spreadId, overrides = {}) {
  const positions = spread(spreadId).positions.map((entry) => entry.id);
  const observations = positions.map((positionId) => ({
    id: `obs-${positionId}`, spreadId, positionId, cardName: "不应进入综合内容",
    dimensions: { stability: 3, agency: 3, risk: -3 },
  }));
  const candidates = positions.map((positionId) => ({
    id: `candidate-${positionId}`, positionIds: [positionId], score: 1, stance: "supportive",
    selectedFacet: "state", dimension: "structure", evidenceRefs: [`obs-${positionId}`],
  }));
  const relations = spreadId === "single" ? [] : [{
    id: "rel-support", type: "reinforces", strength: 1,
    sourceObservationId: observations[0].id, targetObservationId: observations.at(-1).id,
    structure: { sourcePositionId: positions[0], targetPositionId: positions.at(-1) },
  }];
  return {
    spreadId, observations, relations, activeCandidates: candidates, conflicts: [],
    ...overrides,
  };
}

const singleAssessment = assessStructuralReading(fixture("single"));
assert.equal(singleAssessment.status, "valid");
assert.equal(singleAssessment.grade, "S");
assert.equal(singleAssessment.factors.foundation, "not-applicable");
assert.equal(singleAssessment.factors.outcome, "not-applicable");
assert.equal(singleAssessment.factors.interCardConflict, "not-applicable");
assert.ok(singleAssessment.caps.some((cap) => cap.reason === "single-maximum"));

const celticHigh = assessStructuralReading(fixture("celtic"));
assert.equal(celticHigh.status, "valid");
assert.equal(celticHigh.grade, "SSS");
assert.equal(celticHigh.resultSupport.status, "supported");
assert.deepEqual(Object.keys(celticHigh.factors), ["foundation", "process", "outcome", "stability", "resistance", "cost", "controllability", "interCardConflict"]);

const conditionalInput = fixture("celtic");
conditionalInput.relations[0] = { ...conditionalInput.relations[0], type: "conditions" };
const celticConditional = assessStructuralReading(conditionalInput);
assert.equal(celticConditional.resultSupport.status, "conditional");
assert.ok(["A", "B", "C", "D", "E"].includes(celticConditional.grade));
assert.ok(celticConditional.caps.some((cap) => cap.reason === "conditional-result-support" && cap.maximumGrade === "A"));

const contradictedInput = fixture("celtic");
contradictedInput.relations[0] = {
  ...contradictedInput.relations[0],
  type: "contradicts",
  strength: 0.9,
  structure: { sourcePositionId: "future", targetPositionId: "outcome" },
};
const celticContradicted = assessStructuralReading(contradictedInput);
assert.equal(celticContradicted.resultSupport.status, "contradicted");
assert.ok(["C", "D", "E"].includes(celticContradicted.grade));
assert.ok(celticContradicted.caps.some((cap) => cap.reason === "contradicted-result-support" && cap.maximumGrade === "C"));

const weakFoundationInput = fixture("cross");
weakFoundationInput.activeCandidates.find((entry) => entry.positionIds[0] === "root").stance = "cautionary";
const weakFoundation = assessStructuralReading(weakFoundationInput);
assert.ok(weakFoundation.caps.some((cap) => cap.reason === "weak-foundation" && cap.maximumGrade === "A"));

const weakCoreInput = fixture("cross");
for (const positionId of ["core", "action"]) weakCoreInput.activeCandidates.find((entry) => entry.positionIds[0] === positionId).stance = "cautionary";
const weakCore = assessStructuralReading(weakCoreInput);
assert.ok(weakCore.caps.some((cap) => cap.reason === "weak-core-factor" && cap.maximumGrade === "B"));

const severeResistanceInput = fixture("cross");
for (const positionId of ["core", "influence"]) severeResistanceInput.activeCandidates.find((entry) => entry.positionIds[0] === positionId).selectedFacet = "obstacle";
severeResistanceInput.relations[0] = { ...severeResistanceInput.relations[0], type: "contradicts" };
const severeResistance = assessStructuralReading(severeResistanceInput);
assert.ok(severeResistance.caps.some((cap) => cap.reason === "severe-resistance-or-conflict" && cap.maximumGrade === "B"));

const highCostInput = fixture("timeline");
for (const observation of highCostInput.observations.filter((entry) => ["present", "future"].includes(entry.positionId))) observation.dimensions.risk = 3;
for (const positionId of ["present", "future"]) {
  const candidate = highCostInput.activeCandidates.find((entry) => entry.positionIds[0] === positionId);
  candidate.stance = "cautionary";
  candidate.selectedFacet = positionId === "present" ? "action" : "outcome";
}
const highCost = assessStructuralReading(highCostInput);
assert.ok(highCost.caps.some((cap) => cap.reason === "high-cost" && cap.maximumGrade === "A"));

const outcomeEligibilityInput = fixture("cross");
outcomeEligibilityInput.activeCandidates.find((entry) => entry.positionIds[0] === "trend").stance = "conditional";
const outcomeEligibility = assessStructuralReading(outcomeEligibilityInput);
assert.ok(outcomeEligibility.caps.some((cap) => cap.reason === "s-outcome-eligibility" && cap.maximumGrade === "A"));

const ssConflictInput = fixture("cross");
ssConflictInput.relations = [
  { ...ssConflictInput.relations[0], id: "rel-tension", type: "weakens", strength: 0.25 },
  { ...ssConflictInput.relations[0], id: "rel-support-2", type: "reinforces", strength: 1 },
];
ssConflictInput.conflicts = [{ id: "conflict-retained", resolution: "retain-tension", evidenceRefs: ["rel-tension"] }];
const ssConflict = assessStructuralReading(ssConflictInput);
assert.ok(ssConflict.factors.interCardConflict > 0.35 && ssConflict.factors.interCardConflict <= 0.65);
assert.ok(ssConflict.caps.some((cap) => cap.reason === "ss-conflict-eligibility" && cap.maximumGrade === "S"));

const incomplete = fixture("timeline");
incomplete.observations = incomplete.observations.slice(0, 2);
assert.equal(assessStructuralReading(incomplete).status, "incomplete");
assert.equal(assessStructuralReading(incomplete).grade, null);

const resultOnlyInput = fixture("cross");
for (const candidate of resultOnlyInput.activeCandidates) candidate.stance = candidate.positionIds[0] === "trend" ? "supportive" : "cautionary";
resultOnlyInput.relations[0] = { ...resultOnlyInput.relations[0], type: "contradicts" };
const resultOnly = assessStructuralReading(resultOnlyInput);
assert.ok(["B", "C", "D", "E"].includes(resultOnly.grade), "a favorable result position cannot erase an adverse foundation and process");

const presentation = createStructuralPresentation(celticHigh);
assert.equal(presentation.grade, "SSS");
assert.ok(!("internalScore" in presentation));
assert.ok(!("factors" in presentation));
assert.ok(presentation.factorSummaries.every((entry) => Array.isArray(entry.evidenceRefs)));

function timelineWorkflow(firstType, secondType) {
  const input = fixture("timeline");
  input.relations = [
    { id: `rel-past-present-${firstType}`, type: firstType, strength: 0.8, structure: { sourcePositionId: "past", targetPositionId: "present" } },
    { id: `rel-present-future-${secondType}`, type: secondType, strength: 0.8, structure: { sourcePositionId: "present", targetPositionId: "future" } },
  ];
  const assessment = assessStructuralReading(input);
  return createSpreadWorkflow("timeline", { ...input, assessment });
}
for (const [firstType, secondType, expected] of [
  ["transforms", "continues", "turning"],
  ["weakens", "supports", "improving"],
  ["supports", "contradicts", "worsening"],
  ["reinforces", "continues", "continuing"],
  ["conditions", "conditions", "mixed"],
]) {
  const output = timelineWorkflow(firstType, secondType);
  assert.equal(output.status, "complete");
  assert.equal(output.flowType, expected, `${firstType}/${secondType}`);
}

const crossInput = fixture("cross");
crossInput.relations = getSpreadGraph("cross").edges.map((edge) => ({
  id: `rel-${edge.id}`, type: "supports", strength: 0.8,
  structure: { sourcePositionId: edge.source, targetPositionId: edge.target },
}));
const crossWorkflow = createSpreadWorkflow("cross", { ...crossInput, assessment: assessStructuralReading(crossInput) });
assert.equal(crossWorkflow.status, "complete");
assert.equal(crossWorkflow.axisRelationship, "consistent");
assert.equal(crossWorkflow.actionSufficiency, "sufficient");
assert.deepEqual(crossWorkflow.basis.map((entry) => entry.id), ["horizontal-axis", "vertical-axis", "axis-relationship", "action-projection"]);

for (const spreadId of ["single", "timeline", "cross", "celtic"]) {
  const input = fixture(spreadId);
  const assessment = assessStructuralReading(input);
  const output = createSpreadWorkflow(spreadId, { ...input, assessment });
  assert.equal(output.spreadId, spreadId);
  assert.ok(!JSON.stringify(output).includes("不应进入综合内容"));
  for (const value of [output.spreadAnalysis, ...output.basis, ...output.favorableFactors, ...output.limitingFactors, output.successSignal, output.stopSignal, output.turningPoint, output.realityReference]) {
    assert.ok(Array.isArray(value.evidenceRefs));
    assert.ok(["supported", "insufficient"].includes(value.status));
  }
  if (spreadId === "celtic") assert.equal(output.resultSupport.status, "supported");
}
assert.throws(() => createSpreadWorkflow("single", { questionText: "禁止输入" }), /do not accept questionText/);
for (const field of [
  "question", "questionId", "questionText", "categoryId", "domain", "intent", "questionType",
  "expectation", "expectationId", "criterionId", "timeframe", "comparison",
]) {
  assert.throws(() => createSpreadWorkflow("single", { [field]: "禁止输入" }), new RegExp(`do not accept ${field}`));
}
assert.ok(validateReadingPresentationV3({ schemaVersion: "3.0.0", questionText: "禁止输入" }).some((error) => error.includes("questionText")));

console.log("Spread reading v3 definitions, deterministic reversal, structural assessment, presentation, and four workflows passed.");
