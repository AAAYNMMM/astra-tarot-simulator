import {
  allEvidence, candidateFactors, factorEvidence, item, mergeSupported, positionSummary, refsOf,
  seal, stopSignal, successSignal, turningSignal, validateWorkflowInput,
} from "./workflow-utils.js";

const RESULT_TEXT = Object.freeze({
  supported: "最终结果获得前九张中至少三个结构组支持，且没有尚未消解的严重冲突。",
  conditional: "最终结果只获得部分结构组支持；它必须依赖明确条件或转折才能成立。",
  contradicted: "最终结果受到前九张中的反向结构支持不足，不能脱离这些反证单独成立。",
  insufficient: "前九张支持证据不完整，暂不判断最终结果是否成立。",
});

const STAGES = Object.freeze([
  ["core", "核心与阻碍", ["present", "challenge"]],
  ["foundation", "深层基础", ["below"]],
  ["past", "过去影响", ["past"]],
  ["conscious", "意识目标", ["above"]],
  ["future", "近期发展", ["future"]],
  ["self", "当事人状态", ["self"]],
  ["environment", "外部环境", ["external"]],
  ["hopes", "希望与恐惧", ["hopes"]],
  ["outcome", "最终结果", ["outcome"]],
]);

export function createCelticWorkflow(input = {}) {
  validateWorkflowInput(input);
  const observations = Array.isArray(input.observations) ? input.observations : [];
  const relations = Array.isArray(input.relations) ? input.relations : [];
  const candidates = Array.isArray(input.activeCandidates) ? input.activeCandidates : [];
  const assessmentSupport = input.assessment?.resultSupport;
  const supportStatus = ["supported", "conditional", "contradicted"].includes(assessmentSupport?.status)
    ? assessmentSupport.status : "insufficient";
  const basis = STAGES.map(([id, label, positions]) => {
    const summary = positionSummary(label, positions, candidates, observations, relations);
    return { id, ...summary.item };
  });
  const supportGroups = (assessmentSupport?.groups || []).map((group) => ({
    id: group.id,
    resultStance: group.status,
    ...item(`${group.label}：${group.status === "supportive" ? "支持结果" : group.status === "opposing" ? "反向限制结果" : "仅提供条件性支持"}。`, group.evidenceRefs),
  }));
  const refs = allEvidence(input);
  const resultSupport = {
    status: supportStatus,
    text: RESULT_TEXT[supportStatus],
    evidenceRefs: [...(assessmentSupport?.evidenceRefs || [])],
  };
  return seal({
    schemaVersion: "2.0.0",
    spreadId: "celtic",
    status: observations.length === 10 && candidates.length && supportStatus !== "insufficient" ? "complete" : "insufficient",
    spreadAnalysis: item(RESULT_TEXT[supportStatus], supportStatus === "insufficient" ? [] : refsOf([assessmentSupport, ...relations, ...candidates])),
    basis: [...basis, ...supportGroups],
    supportGroups,
    resultSupport,
    favorableFactors: mergeSupported(candidateFactors(candidates, "supportive", "有利因素"), factorEvidence(input.assessment, "favorable")),
    limitingFactors: mergeSupported(candidateFactors(candidates, "cautionary", "限制因素"), factorEvidence(input.assessment, "limiting")),
    successSignal: successSignal(candidates, input.assessment, ["self", "future", "outcome", "present"]),
    stopSignal: stopSignal(candidates, input.assessment, ["outcome", "future", "challenge", "external"]),
    turningPoint: turningSignal(candidates, relations),
    realityReference: item("现实参考：依次核对核心与挑战、深层基础、过去、意识方向、近期发展、自我位置、环境及希望与恐惧，再检查这些证据是否继续支持结果。", refs),
  });
}

export const buildCelticWorkflow = createCelticWorkflow;
export const runCelticWorkflow = createCelticWorkflow;
