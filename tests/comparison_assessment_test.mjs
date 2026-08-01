import assert from "node:assert/strict";

import { TarotData } from "../src/knowledge/legacy/index.js";
import { createReadingFactory } from "../src/app/controllers/reading-controller.js";
import { serializeReadingForWorker } from "../src/app/controllers/engine-synthesis.js";
import { createReadingRandomContextFactory, replayReadingRandomContext } from "../src/core/random/production-random.js";
import { executeDecisiveReading } from "../src/engine/decisive/reading.js";
import { AssessmentError } from "../src/engine/assessment/assessment-signal.js";
import { createReadingRecord, validateReadingRecord } from "../src/storage/reading-record.js";
import { createStructuredHistorySummary } from "../src/storage/history-summary.js";

const category = TarotData.categories.find((item) => item.id === "decision");
const question = category.questions.find((item) => item.id === "decision-option");
const timeline = TarotData.spreads.find((item) => item.id === "timeline");
const randomFactory = createReadingRandomContextFactory();
const ROOT_SEED = "comparison-contract-root-seed";

function comparisonSelection(optionA = "继续现有路径", optionB = "测试替代路径") {
  return {
    outputContract: "comparison-support",
    criterionId: "stability",
    comparisonOptions: [
      { id: "option-a", label: optionA },
      { id: "option-b", label: optionB },
    ],
  };
}

function createReading({ rootSeed = ROOT_SEED, selection = comparisonSelection() } = {}) {
  const factory = createReadingFactory({
    deck: TarotData.deck,
    selectors: {
      currentCategory: () => category,
      currentQuestion: () => question,
      currentSpread: () => timeline,
      currentDeckStyle: () => "rws",
    },
    createRandomContext: () => randomFactory({ rootSeed }),
    now: () => new Date("2026-08-01T00:00:00.000Z"),
  });
  return factory({ evaluationSelection: selection });
}

function workerInput(reading) {
  return serializeReadingForWorker(reading);
}

async function decisiveFrom(reading) {
  const payload = workerInput(reading);
  return executeDecisiveReading(payload);
}

async function assessmentErrorCode(payload) {
  try {
    await executeDecisiveReading(payload);
  } catch (error) {
    assert.equal(error instanceof AssessmentError, true, error?.message);
    return error.code;
  }
  throw new Error("Expected AssessmentError.");
}

const first = createReading();
const repeated = createReading();
assert.equal(first.draws.length, 6);
assert.deepEqual(first, repeated, "the same root seed must reproduce the complete comparison reading");
assert.deepEqual(first.draws.map((draw) => [draw.branchId, draw.position.id, draw.card.id, draw.reversed]), repeated.draws.map((draw) => [draw.branchId, draw.position.id, draw.card.id, draw.reversed]));
assert.deepEqual(first.comparison.options.map((item) => item.id), ["option-a", "option-b"]);
for (const option of first.comparison.options) {
  const branch = first.draws.filter((draw) => draw.branchId === option.id);
  assert.equal(branch.length, 3);
  assert.deepEqual(branch.map((draw) => draw.enginePosition.id), ["past", "present", "future"]);
}
const namedStreams = first.randomAudit.comparison.streams;
assert.deepEqual(Object.keys(namedStreams).sort(), [
  "comparison:option-a:draw",
  "comparison:option-a:orientation",
  "comparison:option-b:draw",
  "comparison:option-b:orientation",
]);
assert.equal(new Set(Object.values(namedStreams).map((item) => item.derivedSeed)).size, 4);
const replayedRandom = replayReadingRandomContext(first.randomAudit);
assert.equal(replayedRandom.audit.rootSeed, ROOT_SEED);
assert.deepEqual(
  createReading({ rootSeed: replayedRandom.audit.rootSeed }).draws.map((draw) => [draw.card.id, draw.reversed]),
  first.draws.map((draw) => [draw.card.id, draw.reversed]),
);

const relabeled = createReading({ selection: comparisonSelection("路径甲", "路径乙") });
assert.deepEqual(
  relabeled.draws.map((draw) => [draw.branchId, draw.card.id, draw.reversed]),
  first.draws.map((draw) => [draw.branchId, draw.card.id, draw.reversed]),
);
const standard = createReading({ selection: null });
const standardRepeated = createReading({ selection: null });
assert.equal(standard.comparison, null);
assert.equal(standard.randomAudit.comparison, undefined);
assert.equal(standard.draws.length, 3);
assert.deepEqual(standard.draws.map((draw) => draw.position.id), ["past", "present", "future"]);
assert.deepEqual(standard.draws.map((draw) => [draw.card.id, draw.reversed]), standardRepeated.draws.map((draw) => [draw.card.id, draw.reversed]));

const serialized = workerInput(first);
assert.equal(serialized.protocolVersion, "2.0.0");
assert.deepEqual(serialized.draws, []);
assert.equal(serialized.comparison.options.length, 2);
for (const option of serialized.comparison.options) {
  assert.equal(option.draws.length, 3);
  assert.deepEqual(option.draws.map((draw) => draw.positionId), ["past", "present", "future"]);
}

const result = await decisiveFrom(first);
assert.equal(result.engineResult.kind, "comparison");
assert.equal(result.engineResult.branches.length, 2);
assert.equal(result.assessment.presentation.grade, null);
assert.match(result.synthesis.summary.takeaway, /不.*自动选出赢家/);
assert.equal(result.synthesis.cardEvidence.length, 6);
assert.equal(new Set(result.synthesis.cardEvidence.map((item) => item.positionId)).size, 6);
assert.ok(result.synthesis.cardEvidence.every((item) => /^(option-a|option-b)-/.test(item.positionId)));
for (const branch of result.engineResult.branches) {
  const observations = new Set(branch.engineResult.observations.map((item) => item.id));
  assert.ok(branch.engineResult.relations.every((relation) => (
    observations.has(relation.sourceObservationId) && observations.has(relation.targetObservationId)
  )), `${branch.id} relation crossed branch evidence`);
}
assert.equal(result.assessment.comparison.length, 2);
for (const branch of result.assessment.comparison) {
  assert.ok(branch.evaluation.descriptors);
  assert.ok(branch.presentation.trend?.id);
  assert.ok(branch.evaluation.evidenceRefs.length > 0);
}

const missingPaths = { ...serialized, comparison: null };
assert.equal(await assessmentErrorCode(missingPaths), "ASSESSMENT_COMPARISON_PATHS_REQUIRED");
const duplicateLabel = structuredClone(serialized);
duplicateLabel.comparison.options[1].label = duplicateLabel.comparison.options[0].label;
assert.equal(await assessmentErrorCode(duplicateLabel), "ASSESSMENT_COMPARISON_PATHS_INVALID");
const invalidPosition = structuredClone(serialized);
invalidPosition.comparison.options[0].draws[2].positionId = "wrong";
assert.equal(await assessmentErrorCode(invalidPosition), "ASSESSMENT_COMPARISON_PATHS_INVALID");
const missingCriterion = { ...serialized, criterionId: null };
assert.equal(await assessmentErrorCode(missingCriterion), "ASSESSMENT_CRITERION_REQUIRED");

first.synthesis = result.synthesis;
first.assessment = result.assessment;
const fingerprint = {
  schemaVersion: "1.0.0",
  status: "available",
  appVersion: "2.1.0",
  generatorVersion: "1.1.0",
  sourceSetHash: "a",
  engineManifestHash: "b",
  knowledgeManifestHash: "c",
};
const record = createReadingRecord({
  reading: first,
  artifactFingerprint: fingerprint,
  engineResult: result.engineResult,
  savedAt: "2026-08-01T00:01:00.000Z",
});
assert.deepEqual(validateReadingRecord(record), []);
assert.equal(record.evidence.comparison.length, 2);
assert.equal(record.assessment.comparison.length, 2);
assert.ok(record.assessment.comparison.every((branch) => branch.evaluation.evidenceRefs.length > 0));
const history = createStructuredHistorySummary(result.engineResult, result.synthesis, result.assessment);
assert.equal(history.conclusionType, "comparison-support");
assert.equal(history.assessment.grade, null);

console.log("Comparison assessment passed: independent timelines, branch-only evidence, stable protocol and history snapshots.");
