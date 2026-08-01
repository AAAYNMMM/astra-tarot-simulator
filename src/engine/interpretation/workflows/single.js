import {
  allEvidence, candidateFactors, factorEvidence, item, mergeSupported, positionSummary,
  refsOf, seal, stopSignal, successSignal, toneFor, turningSignal, validateWorkflowInput,
} from "./workflow-utils.js";

const ANALYSIS = Object.freeze({
  supportive: "核心提示以支持结构为主，但单一来源只能作为核验起点，不能当作确定结果。",
  limiting: "核心提示以限制结构为主，应先识别阴影表现与边界，再决定是否行动。",
  conditional: "核心提示呈条件性或转折结构，现实表现取决于修正是否真正发生。",
  mixed: "核心提示中的支持与限制相抵，单张牌的信息广度不足以扩大判断。",
});

export function createSingleWorkflow(input = {}) {
  validateWorkflowInput(input);
  const observations = Array.isArray(input.observations) ? input.observations : [];
  const candidates = Array.isArray(input.activeCandidates) ? input.activeCandidates : [];
  const relations = Array.isArray(input.relations) ? input.relations : [];
  const core = positionSummary("核心提示", ["essence"], candidates, observations, relations);
  const refs = allEvidence(input);
  const favorableFactors = mergeSupported(
    candidateFactors(candidates, "supportive", "有利表现"),
    factorEvidence(input.assessment, "favorable"),
  );
  const limitingFactors = mergeSupported(
    candidateFactors(candidates, "cautionary", "阴影表现"),
    factorEvidence(input.assessment, "limiting"),
  );
  const realityCandidate = candidates[0];
  const realityReference = realityCandidate
    ? item("现实信号：观察核心位置对应的行为、边界或资源是否在下一次可验证行动中出现。", refsOf([realityCandidate, ...observations]))
    : item("", []);
  return seal({
    schemaVersion: "2.0.0",
    spreadId: "single",
    status: observations.length === 1 && candidates.length ? "complete" : "insufficient",
    informationBreadth: "single-source",
    spreadAnalysis: item(ANALYSIS[toneFor(candidates)], refs),
    basis: [{ id: "core-prompt", ...core.item }],
    favorableFactors,
    limitingFactors,
    successSignal: successSignal(candidates, input.assessment, ["essence"]),
    stopSignal: stopSignal(candidates, input.assessment, ["essence"]),
    turningPoint: turningSignal(candidates, relations),
    realityReference,
    relationStatus: item("单张牌阵不适用牌间关系判断。", refsOf(observations)),
  });
}

export const buildSingleWorkflow = createSingleWorkflow;
export const runSingleWorkflow = createSingleWorkflow;
