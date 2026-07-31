import { createDeterministicStreams } from "../../core/random/deterministic-streams.js";
import { loadQuestionProfile } from "../../knowledge/questions/registry.js";
import { SPREADS } from "../../knowledge/spreads/definitions.js";
import { executeReadingEngine } from "../runtime/reading-engine.js";

const FORBIDDEN_TEXT = Object.freeze([
  "一定会",
  "必然会",
  "肯定会",
  "绝对会",
  "保证",
  "注定",
  "百分之百",
]);

function round(value) {
  return Number(value.toFixed(4));
}

function normalizeCase(testCase) {
  const spread = SPREADS.find((item) => item.id === testCase.spreadId);
  if (!spread) throw new Error(`Unknown evaluation spread ${testCase.spreadId}.`);
  const cardIds = Array.isArray(testCase.cardIds) ? testCase.cardIds : [testCase.cardId];
  if (!cardIds.length || cardIds.some((item) => typeof item !== "string")) {
    throw new Error(`Evaluation case ${testCase.id} requires cardIds.`);
  }
  const orientations = Array.isArray(testCase.orientations)
    ? testCase.orientations
    : [testCase.orientation || "upright"];
  return {
    ...testCase,
    cardIds: spread.positions.map((_, index) => cardIds[index % cardIds.length]),
    orientations: spread.positions.map((_, index) => orientations[index % orientations.length]),
    positions: spread.positions,
  };
}

async function executeCase(testCase, seedSuffix) {
  const normalized = normalizeCase(testCase);
  const streams = createDeterministicStreams(`${normalized.id}:${seedSuffix}`);
  return executeReadingEngine({
    questionId: normalized.questionId,
    spreadId: normalized.spreadId,
    draws: normalized.positions.map((position, index) => ({
      cardId: normalized.cardIds[index],
      positionId: position.id,
      orientation: normalized.orientations[index],
    })),
    renderingStream: streams.streams.rendering,
  });
}

function metricFlags(result, repeated, question, testCase) {
  const normalized = normalizeCase(testCase);
  const observations = result.observations || [];
  const claim = result.claim;
  const rendered = result.rendered;
  const text = rendered?.plainText || "";
  const required = new Set(claim?.requiredDimensions || []);
  const covered = new Set([...(claim?.dimensions || []), ...(claim?.coverageGaps || [])]);
  const expectedMulti = testCase.spreadId !== "single";
  return {
    pipeline: claim?.validation?.status === "valid" && Boolean(rendered?.plainText),
    semanticReferences: observations.every((item) => (
      typeof item.semanticUnitRef === "string"
      && item.semanticUnitRef.startsWith(`${item.cardId}#`)
      && Array.isArray(item.sourceRefs)
      && item.sourceRefs.length > 0
    )),
    questionFit: (
      result.questionId === question.id
      && observations.every((item) => item.questionId === question.id && item.questionDimensions.length > 0)
      && [...required].every((item) => covered.has(item))
    ),
    orientationFidelity: observations.every((item, index) => (
      item.orientation === normalized.orientations[index]
      && (item.orientation === "upright"
        ? item.selectedReversalMode === null
        : typeof item.selectedReversalMode === "string")
    )),
    conclusionPolicy: (
      question.allowedConclusionTypes.includes(claim?.conclusionType)
      && !(claim?.forbiddenClaimTypes || []).some((item) => question.forbiddenClaims.includes(item))
    ),
    textSafety: (
      FORBIDDEN_TEXT.every((item) => !text.includes(item))
      && rendered.provenance?.evidenceCount === claim.evidenceRefs.length
    ),
    deterministic: JSON.stringify(result) === JSON.stringify(repeated),
    relationStructure: expectedMulti
      ? result.relations.length > 0 && result.relations.every((item) => item.structure?.edgeId)
      : result.relations.length === 0,
  };
}

export async function evaluateCase(testCase) {
  const question = await loadQuestionProfile(testCase.questionId);
  const result = await executeCase(testCase, "stable");
  const repeated = await executeCase(testCase, "stable");
  const flags = metricFlags(result, repeated, question, testCase);
  const passed = Object.values(flags).filter(Boolean).length;
  const score = round((passed / Object.keys(flags).length) * 10);
  return Object.freeze({
    id: testCase.id,
    group: testCase.group || "unspecified",
    questionId: testCase.questionId,
    spreadId: testCase.spreadId,
    score,
    passed: passed === Object.keys(flags).length,
    metrics: Object.freeze(flags),
    output: Object.freeze({
      conclusionType: result.claim.conclusionType,
      confidence: result.claim.confidence,
      observationCount: result.observations.length,
      relationCount: result.relations.length,
      evidenceCount: result.claim.evidenceRefs.length,
      conflictCount: result.claim.conflicts.length,
      conditionCount: result.claim.conditions.length,
    }),
  });
}

export async function runEvaluationSuite(cases, { suiteId = "evaluation" } = {}) {
  if (!Array.isArray(cases) || cases.length === 0) throw new TypeError("Evaluation cases must be non-empty.");
  const results = [];
  for (const item of cases) results.push(await evaluateCase(item));
  const metricNames = Object.keys(results[0].metrics);
  const metricRates = Object.fromEntries(metricNames.map((name) => [
    name,
    round(results.filter((item) => item.metrics[name]).length / results.length),
  ]));
  const averageScore = round(results.reduce((sum, item) => sum + item.score, 0) / results.length);
  const minimumScore = Math.min(...results.map((item) => item.score));
  const passRate = round(results.filter((item) => item.passed).length / results.length);
  return Object.freeze({
    schemaVersion: "1.0.0",
    suiteId,
    caseCount: results.length,
    averageScore,
    minimumScore,
    passRate,
    metricRates,
    passed: averageScore >= 9 && minimumScore >= 9 && passRate >= 0.95,
    results,
  });
}
