import { executeReadingEngine } from "../runtime/reading-engine.js";
import { loadCardProfile } from "../../knowledge/cards/registry.js";
import { loadQuestionProfile } from "../../knowledge/questions/registry.js";
import { createConciseInterpretation } from "../concise/interpretation.js";
import { AssessmentError, createAssessmentSignal } from "../assessment/assessment-signal.js";
import { evaluateAssessment } from "../assessment/alignment-assessor.js";
import { createAssessmentPresentation } from "../assessment/assessment-presentation.js";
import { getQuestionEvaluationPolicy } from "../../knowledge/evaluation/question-evaluation-policies.js";
import { executeSpreadReadingRequest } from "./spread-reading.js";

let warmPromise = null;
let warmRuns = 0;
const READING_REQUEST_PROTOCOL_VERSION = "2.0.0";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function validateEvaluationSelection({ protocolVersion, policy, spreadId, expectationId, criterionId, comparison }) {
  if (protocolVersion === null || protocolVersion === undefined) return;
  if (protocolVersion !== READING_REQUEST_PROTOCOL_VERSION) {
    throw new AssessmentError("ASSESSMENT_REQUEST_PROTOCOL_UNSUPPORTED", `Unsupported reading request protocol: ${protocolVersion}.`);
  }
  if (!policy.allowedSpreads.includes(spreadId)) {
    throw new AssessmentError("ASSESSMENT_SPREAD_INELIGIBLE", `Spread ${spreadId} is not allowed for ${policy.questionId}.`);
  }
  if (policy.outputContract === "alignment-grade" && !expectationId) {
    throw new AssessmentError("ASSESSMENT_EXPECTATION_REQUIRED", "An expectation must be selected before drawing cards.");
  }
  if (policy.outputContract !== "alignment-grade" && expectationId) {
    throw new AssessmentError("ASSESSMENT_EXPECTATION_NOT_ALLOWED", "This question does not use an expectation selection.");
  }
  if (policy.criterionMode === "required" && !criterionId) {
    throw new AssessmentError("ASSESSMENT_CRITERION_REQUIRED", "A comparison criterion must be selected before drawing cards.");
  }
  if (policy.criterionMode === "none" && criterionId) {
    throw new AssessmentError("ASSESSMENT_CRITERION_NOT_ALLOWED", "This question does not use a comparison criterion.");
  }
  if (policy.outputContract === "comparison-support") validateComparisonInput(comparison);
}

function validateComparisonInput(comparison) {
  const options = comparison?.options;
  if (comparison?.schemaVersion !== "1.0.0" || !Array.isArray(options) || options.length !== 2) {
    throw new AssessmentError("ASSESSMENT_COMPARISON_PATHS_REQUIRED", "Comparison requires exactly two versioned paths.");
  }
  const ids = new Set();
  const labels = new Set();
  for (const option of options) {
    const label = String(option?.label || "").trim();
    if (!option?.id || ids.has(option.id) || !label || labels.has(label) || !Array.isArray(option.draws) || option.draws.length !== 3) {
      throw new AssessmentError("ASSESSMENT_COMPARISON_PATHS_INVALID", "Comparison paths require unique IDs, labels, and three draws each.");
    }
    ids.add(option.id);
    labels.add(label);
    if (option.draws.map((draw) => draw.positionId).join("|") !== "past|present|future") {
      throw new AssessmentError("ASSESSMENT_COMPARISON_PATHS_INVALID", "Comparison path draws must follow timeline positions.");
    }
  }
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function prefixedRefs(branchId, refs) {
  return unique((refs || []).map((ref) => `${branchId}:${ref}`));
}

function remapEvidence(item, branch) {
  return {
    ...item,
    id: `${branch.id}-${item.id}`,
    role: branch.label,
    positionIds: (item.positionIds || []).map((id) => `${branch.id}-${id}`),
    text: `${branch.label}：${item.text}`,
    evidenceRefs: prefixedRefs(branch.id, item.evidenceRefs),
  };
}

function createComparisonSynthesis(branches, criterion) {
  const cardEvidence = branches.flatMap((branch) => branch.synthesis.cardEvidence.map((item) => ({
    ...item,
    id: `${branch.id}-${item.id}`,
    positionId: `${branch.id}-${item.positionId}`,
    positionName: `${branch.label} · ${item.positionName}`,
    evidenceRefs: prefixedRefs(branch.id, item.evidenceRefs),
  })));
  const keyEvidence = branches.map((branch) => remapEvidence(branch.synthesis.keyEvidence[0], branch));
  const evidenceRefs = unique(branches.flatMap((branch) => prefixedRefs(branch.id, branch.assessment.evaluation.evidenceRefs)));
  const summary = {
    verdictCode: "wait",
    verdictLabel: "分别核验",
    takeaway: `已按“${criterion.label}”分别整理两条路径；结果不合并为总分，也不会自动选出赢家。`,
    evidenceRefs,
  };
  const condition = {
    success: {
      text: "两条路径都使用同一判断标准，并出现可比较的现实反馈后，再更新判断。",
      evidenceRefs,
    },
    failure: {
      text: "如果路径名称、投入条件或观察周期不断变化，应暂停比较并先固定前提。",
      evidenceRefs,
    },
    turningPoint: {
      text: "当其中一条路径出现连续、可复核的现实进展时，差异才更值得参考。",
      evidenceRefs,
    },
  };
  const action = {
    text: "为两条路径各安排一次同成本、可撤回的小实验，再记录结果。",
    positionIds: [],
    evidenceRefs,
  };
  return {
    schemaVersion: "4.0.0",
    summary,
    keyEvidence,
    condition,
    action,
    cardEvidence,
    verdict: {
      code: "wait",
      label: "分别核验",
      directive: "先比较现实反馈",
      strength: "conditional",
      rule: "comparison-independent-timelines",
    },
    provenance: {
      interpretationVersion: "comparison-evidence-v1",
      evidenceCount: evidenceRefs.length,
      branchCount: branches.length,
      outcomeEvidenceRef: null,
      visibleCharacterCount: [summary.takeaway, ...keyEvidence.map((item) => item.text), action.text].join("").length,
    },
  };
}

function createComparisonPresentation(branches, policy, criterion) {
  const trends = branches.map((branch) => branch.assessment.presentation.trend);
  const trend = trends.every((item) => item.id === trends[0].id)
    ? trends[0]
    : { id: "changeful", label: "变化较多" };
  const favorableFactors = branches.flatMap((branch) => branch.assessment.presentation.favorableFactors.map((item) => ({
    code: `${branch.id}:${item.code}`,
    text: `${branch.label}：${item.text}`,
  })));
  const limitingFactors = branches.flatMap((branch) => branch.assessment.presentation.limitingFactors.map((item) => ({
    code: `${branch.id}:${item.code}`,
    text: `${branch.label}：${item.text}`,
  })));
  const evidenceRefs = unique(branches.flatMap((branch) => prefixedRefs(branch.id, branch.assessment.evaluation.evidenceRefs)));
  return {
    schemaVersion: "1.0.0",
    mode: "comparison-support",
    outputContract: "comparison-support",
    heading: "双路径比较参考",
    grade: null,
    gradeLabel: null,
    trend,
    summary: branches.map((branch) => `${branch.label}呈${branch.assessment.presentation.trend.label}`).join("；") + "。",
    reason: `两条路径分别使用独立三牌时间线，并按“${criterion.label}”整理；没有合并总分或自动赢家。`,
    favorableFactors,
    limitingFactors,
    guidance: "为两条路径各完成一次同成本、可撤回的小实验，再比较现实反馈。",
    observableSignals: policy.observableSignals.map((item) => ({ id: item.id, label: item.label })),
    evidenceRefs,
    policyVersion: policy.policyVersion,
  };
}

async function executeOne({ policy, questionId, questionText, categoryId, spreadId, draws, expectationId, criterionId }) {
  const engineStartedAt = performance.now();
  const engineResult = await executeReadingEngine({
    questionId,
    spreadId,
    draws: (draws || []).map((draw) => ({
      cardId: draw.cardId,
      positionId: draw.positionId,
      orientation: draw.orientation,
    })),
    renderingStream: null,
  });
  const engineMs = performance.now() - engineStartedAt;
  const narrativeStartedAt = performance.now();
  const synthesis = createConciseInterpretation({ engineResult, questionId, questionText, categoryId, spreadId, draws });
  const narrativeMs = performance.now() - narrativeStartedAt;
  const assessmentStartedAt = performance.now();
  const resolvedExpectationId = policy.outputContract === "alignment-grade" ? expectationId || "observe-only" : null;
  const signal = createAssessmentSignal({ engineResult, policy });
  const evaluation = evaluateAssessment({ signal, policy, expectationId: resolvedExpectationId, criterionId });
  const presentation = createAssessmentPresentation({ policy, signal, assessment: evaluation, concise: synthesis });
  const assessmentMs = performance.now() - assessmentStartedAt;
  return {
    synthesis,
    engineResult,
    assessment: {
      schemaVersion: "1.0.0",
      selection: { expectationId: resolvedExpectationId, criterionId },
      signal,
      evaluation,
      presentation,
    },
    timings: { engineMs, narrativeMs, assessmentMs },
  };
}

export function warmDecisiveReadingEngine() {
  if (warmPromise) return warmPromise;
  warmRuns += 1;
  warmPromise = (async () => {
    const startedAt = performance.now();
    await Promise.resolve();
    return deepFreeze({
      status: "ready",
      warmRuns,
      strategy: "core-only-on-demand-profiles",
      cardProfiles: 0,
      questionProfiles: 0,
      durationMs: Number((performance.now() - startedAt).toFixed(3)),
    });
  })();
  warmPromise.catch(() => {
    warmPromise = null;
  });
  return warmPromise;
}

export async function executeLegacyDecisiveReading({
  protocolVersion = null,
  questionId,
  questionText,
  categoryId,
  spreadId,
  draws,
  expectationId = null,
  criterionId = null,
  comparison = null,
} = {}) {
  const startedAt = performance.now();
  const policy = getQuestionEvaluationPolicy(questionId);
  if (!policy) throw new Error(`Missing QuestionEvaluationPolicy: ${questionId}`);
  validateEvaluationSelection({ protocolVersion, policy, spreadId, expectationId, criterionId, comparison });
  const loadStartedAt = performance.now();
  const allDraws = comparison?.options?.flatMap((option) => option.draws || []) || draws || [];
  const cardIds = [...new Set(allDraws.map((draw) => draw.cardId).filter(Boolean))];
  await Promise.all([
    loadQuestionProfile(questionId),
    ...cardIds.map((cardId) => loadCardProfile(cardId)),
  ]);
  const loadMs = performance.now() - loadStartedAt;
  let result;
  if (policy.outputContract === "comparison-support" && comparison) {
    const criterion = policy.criteria.find((item) => item.id === criterionId);
    if (!criterion) throw new AssessmentError("ASSESSMENT_UNKNOWN_CRITERION", `Unknown comparison criterion: ${criterionId}.`);
    const branches = [];
    for (const option of comparison.options) {
      const branch = await executeOne({ policy, questionId, questionText, categoryId, spreadId, draws: option.draws, expectationId: null, criterionId });
      branches.push({ id: option.id, label: String(option.label).trim(), ...branch });
    }
    const synthesis = createComparisonSynthesis(branches, criterion);
    const engineResult = {
      schemaVersion: "1.0.0",
      kind: "comparison",
      questionId,
      spreadId,
      branches: branches.map((branch) => ({ id: branch.id, label: branch.label, engineResult: branch.engineResult })),
      provenance: { branchCount: branches.length, relationScope: "branch-only" },
    };
    const assessment = {
      schemaVersion: "1.0.0",
      selection: {
        expectationId: null,
        criterionId,
        comparisonOptions: branches.map((branch) => ({ id: branch.id, label: branch.label })),
      },
      comparison: branches.map((branch) => ({
        id: branch.id,
        label: branch.label,
        signal: branch.assessment.signal,
        evaluation: branch.assessment.evaluation,
        presentation: branch.assessment.presentation,
      })),
      presentation: createComparisonPresentation(branches, policy, criterion),
    };
    result = {
      synthesis,
      engineResult,
      assessment,
      timings: {
        engineMs: branches.reduce((sum, branch) => sum + branch.timings.engineMs, 0),
        narrativeMs: branches.reduce((sum, branch) => sum + branch.timings.narrativeMs, 0),
        assessmentMs: branches.reduce((sum, branch) => sum + branch.timings.assessmentMs, 0),
      },
    };
  } else {
    const fallbackCriterionId = policy.outputContract === "comparison-support" ? criterionId || policy.criteria[0]?.id : criterionId;
    result = await executeOne({ policy, questionId, questionText, categoryId, spreadId, draws, expectationId, criterionId: fallbackCriterionId });
  }
  const totalMs = performance.now() - startedAt;
  return deepFreeze({
    protocolVersion: READING_REQUEST_PROTOCOL_VERSION,
    status: "completed",
    synthesis: result.synthesis,
    engineResult: result.engineResult,
    assessment: result.assessment,
    timings: {
      loadMs: Number(loadMs.toFixed(3)),
      engineMs: Number(result.timings.engineMs.toFixed(3)),
      narrativeMs: Number(result.timings.narrativeMs.toFixed(3)),
      assessmentMs: Number(result.timings.assessmentMs.toFixed(3)),
      totalMs: Number(totalMs.toFixed(3)),
    },
    performance: {
      workerExecutionMs: Number(totalMs.toFixed(3)),
      warmStarted: Boolean(warmPromise),
      warmRuns,
    },
  });
}

export function executeDecisiveReading(input = {}) {
  if (input?.protocolVersion === "3.0.0") return executeSpreadReadingRequest(input);
  if (input?.protocolVersion === null || input?.protocolVersion === undefined || input?.protocolVersion === "2.0.0") {
    return executeLegacyDecisiveReading(input);
  }
  return Promise.reject(new AssessmentError(
    "ASSESSMENT_REQUEST_PROTOCOL_UNSUPPORTED",
    `Unsupported reading request protocol: ${input.protocolVersion}.`,
  ));
}
