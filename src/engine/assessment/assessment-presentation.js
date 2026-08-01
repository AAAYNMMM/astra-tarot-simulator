import { AssessmentError } from "./assessment-signal.js";

const CONTRACT_HEADINGS = Object.freeze({
  "alignment-grade": "期待契合",
  "situation-map": "现况地图",
  "action-prompt": "行动提示",
  "comparison-support": "比较参考",
});

const GRADE_LABELS = Object.freeze({
  SSS: "极强契合",
  SS: "很强契合",
  S: "明显契合",
  A: "较为契合",
  B: "有条件契合",
  C: "正负相抵",
  D: "偏离期待",
  E: "明显偏离",
});

const TRENDS = Object.freeze({
  "clearly-positive": Object.freeze({ id: "clearly-positive", label: "明显积极" }),
  "leaning-positive": Object.freeze({ id: "leaning-positive", label: "偏向积极" }),
  "relatively-steady": Object.freeze({ id: "relatively-steady", label: "相对平稳" }),
  changeful: Object.freeze({ id: "changeful", label: "变化较多" }),
  "leaning-difficult": Object.freeze({ id: "leaning-difficult", label: "偏向困难" }),
  "clearly-blocked": Object.freeze({ id: "clearly-blocked", label: "明显受阻" }),
});

const CAP_LABELS = Object.freeze({
  "weak-foundation": "基础条件偏弱",
  "blocked-process": "过程明显受阻",
  "fragile-outcome": "结果稳定性不足",
  "limited-agency": "当前可控空间有限",
  "high-burden": "过程负担较高",
  "dispersed-evidence": "证据仍较分散",
  "unresolved-conflict": "牌阵内部仍有未消解冲突",
});

const NO_GRADE_REASONS = Object.freeze({
  ASSESSMENT_OBSERVE_ONLY: "未选择期待，因此保留为观察模式。",
  ASSESSMENT_SINGLE_CARD_EXCLUDED: "单张牌只提供观察线索，不生成好运等级。",
  ASSESSMENT_SPREAD_INELIGIBLE: "当前牌阵不适用于期待契合评级。",
  ASSESSMENT_EVIDENCE_LIMITED: "现有证据不足以形成稳定等级。",
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function compare(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function uniqueByCode(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.code || seen.has(item.code)) return false;
    seen.add(item.code);
    return true;
  });
}

function uniqueSorted(values) {
  return [...new Set((values || []).filter(Boolean))].sort(compare);
}

function mismatch(policy, signal, assessment) {
  return !policy || !signal || !assessment
    || policy.questionId !== signal.questionId
    || policy.questionId !== assessment.questionId
    || signal.kind !== policy.outputContract
    || assessment.signalId !== signal.id
    || ![policy.outputContract, "situation-map"].includes(assessment.kind);
}

function factor(code, text) {
  return { code, text };
}

function descriptorFactors(descriptors) {
  const favorable = [];
  const limiting = [];
  if (descriptors.foundation === "supportive") favorable.push(factor("supportive-foundation", "基础条件提供了可继续观察的支持。"));
  if (["weak", "mixed"].includes(descriptors.foundation)) limiting.push(factor("uncertain-foundation", "基础条件仍有不稳定或相互拉扯的部分。"));
  if (descriptors.process === "smooth") favorable.push(factor("smooth-process", "过程信号相对顺畅。"));
  if (descriptors.process === "conditional") limiting.push(factor("conditional-process", "过程仍取决于后续条件是否落实。"));
  if (descriptors.process === "mixed") limiting.push(factor("mixed-process", "过程同时出现支持与限制，需分开观察。"));
  if (descriptors.process === "blocked") limiting.push(factor("blocked-process", "过程出现明显阻滞，宜先处理阻碍。"));
  if (descriptors.stability === "stable") favorable.push(factor("stable-outcome", "结果位呈现较稳定的支撑。"));
  if (descriptors.stability === "fragile") limiting.push(factor("fragile-outcome", "结果位的稳定性较脆弱，需要保留调整空间。"));
  if (descriptors.stability === "conditional") limiting.push(factor("conditional-stability", "稳定性仍需由现实条件来验证。"));
  if (descriptors.agency === "high") favorable.push(factor("high-agency", "你仍保有较明确的行动空间。"));
  if (descriptors.agency === "shared") limiting.push(factor("shared-agency", "行动空间需要与环境或他人共同协调。"));
  if (descriptors.agency === "limited") limiting.push(factor("limited-agency", "当前可直接掌控的行动空间有限。"));
  if (descriptors.burden === "low") favorable.push(factor("low-burden", "当前负担相对可控。"));
  if (descriptors.burden === "medium") limiting.push(factor("medium-burden", "推进时需要预留负担与节奏。"));
  if (descriptors.burden === "high") limiting.push(factor("high-burden", "当前负担较高，不宜忽略成本与恢复。"));
  if (descriptors.evidence === "sufficient") favorable.push(factor("sufficient-evidence", "现有证据覆盖足以支持一个暂定判断。"));
  if (descriptors.evidence === "dispersed") limiting.push(factor("dispersed-evidence", "证据分散，结论应保持条件化。"));
  if (descriptors.evidence === "limited") limiting.push(factor("limited-evidence", "证据有限，暂不宜形成等级判断。"));
  return { favorable, limiting };
}

function alignmentFactor(outcomeAlignment) {
  if (outcomeAlignment === "clear-alignment") return factor("clear-alignment", "结果信号与所选期待较为一致。");
  if (outcomeAlignment === "partial-alignment") return factor("partial-alignment", "结果信号部分接近所选期待。");
  if (outcomeAlignment === "divergence") return factor("divergence", "结果信号更偏离所选期待。");
  if (outcomeAlignment === "clear-divergence") return factor("clear-divergence", "结果信号明显远离所选期待。");
  return factor("neutral-alignment", "结果信号尚未明显靠近或远离所选期待。");
}

function criterionCoverageFactor(criterionFocus) {
  if (!criterionFocus) return null;
  if (criterionFocus.coverage === "complete") {
    return factor("criterion-covered", `所选“${criterionFocus.label}”标准已有直接证据覆盖。`);
  }
  const missing = criterionFocus.missingDimensions.join("、") || "相关维度";
  return factor("criterion-missing", `所选“${criterionFocus.label}”标准仍缺少${missing}的直接证据。`);
}

function capFactors(caps) {
  return [...(caps || [])].sort((left, right) => compare(
    String(left?.reason || ""),
    String(right?.reason || ""),
  )).map((cap) => factor(
    `cap:${cap.reason || "unknown"}`,
    `主要限制来自${CAP_LABELS[cap.reason] || "当前条件"}，因此等级最高不超过 ${cap.maximumGrade || "当前可支持范围"}。`,
  ));
}

function summaryFor({ mode, assessment, descriptors, criterion }) {
  if (assessment.reasonCode === "ASSESSMENT_OBSERVE_ONLY") {
    return "未选择期待，因此不显示好运等级；以下内容只整理当前可观察的情况。";
  }
  if (mode === "alignment-grade") {
    const lead = {
      "clear-alignment": "现有结果较接近所选期待。",
      "partial-alignment": "现有结果部分接近所选期待。",
      neutral: "现有结果暂未显示明显的期待方向。",
      divergence: "现有结果更偏离所选期待。",
      "clear-divergence": "现有结果明显远离所选期待。",
    }[assessment.outcomeAlignment] || "现有结果需要继续结合现实进展观察。";
    return `${lead} 过程为${processText(descriptors.process)}，稳定性${stabilityText(descriptors.stability)}，行动空间${agencyText(descriptors.agency)}。`;
  }
  if (mode === "action-prompt") return `当前更适合把注意力放在一个可执行的小步骤上；过程为${processText(descriptors.process)}。`;
  if (mode === "comparison-support") {
    const coverage = assessment.criterionFocus?.coverage === "complete" ? "相关证据已覆盖" : "仍有相关证据缺口";
    return `此路径按“${criterion?.label || "所选维度"}”整理，${coverage}；过程为${processText(descriptors.process)}，稳定性${stabilityText(descriptors.stability)}。`;
  }
  return `当前情况以${processText(descriptors.process)}为主，稳定性${stabilityText(descriptors.stability)}。`;
}

function processText(value) {
  return ({ smooth: "相对顺畅", conditional: "仍有条件", mixed: "支持与限制并存", blocked: "存在阻滞", "not-applicable": "暂无适用过程" })[value] || "仍需观察";
}

function stabilityText(value) {
  return ({ stable: "较稳定", conditional: "仍待验证", fragile: "较脆弱", "not-applicable": "不适用" })[value] || "仍待观察";
}

function agencyText(value) {
  return ({ high: "较明确", shared: "需要协调", limited: "有限", "not-applicable": "不适用" })[value] || "仍待确认";
}

function guidanceFor(concise, observableSignal, mode) {
  const actionText = concise?.action?.text;
  const signalText = observableSignal?.label || "记录一个可观察的现实变化";
  if (typeof actionText === "string" && actionText.trim()) {
    return `先做：${actionText.trim()} 同时留意：${signalText}。`;
  }
  if (mode === "comparison-support") return `先围绕“${signalText}”做一个低成本、可逆的现实比较。`;
  return `下一步先留意：${signalText}。`;
}

function reasonFor(assessment, descriptors, concise) {
  if (assessment.reasonCode) return NO_GRADE_REASONS[assessment.reasonCode] || "当前证据不适合生成好运等级。";
  if (assessment.kind === "comparison-support") {
    return assessment.criterionFocus?.coverage === "complete"
      ? `所选“${assessment.criterionFocus.label}”标准已有可追溯依据，但仍不等于自动推荐。`
      : `所选“${assessment.criterionFocus?.label || "判断"}”标准证据尚不完整，比较应保持条件化。`;
  }
  const cap = assessment.caps?.[0];
  if (cap) return `这个等级的主要限制来自${CAP_LABELS[cap.reason] || "当前条件"}。`;
  const failure = concise?.condition?.failure?.text;
  if (typeof failure === "string" && failure.trim()) return `需要留意：${failure.trim()}`;
  if (descriptors.evidence === "limited") return "现有证据不足以形成稳定等级。";
  return "该判断只用于整理当前证据，仍需结合现实行动更新。";
}

function criterionFor(policy, criterionId) {
  return (policy.criteria || []).find((item) => item.id === criterionId) || null;
}

export function createAssessmentPresentation({ policy, signal, assessment, concise = null } = {}) {
  if (mismatch(policy, signal, assessment)) {
    throw new AssessmentError("ASSESSMENT_PRESENTATION_INPUT_MISMATCH", "Assessment presentation inputs do not share policy, signal, and contract identity.");
  }
  const mode = assessment.kind;
  const descriptors = assessment.descriptors || signal.descriptors || {};
  const criterion = criterionFor(policy, assessment.criterionId);
  const baseFactors = descriptorFactors(descriptors);
  const alignment = mode === "alignment-grade" ? alignmentFactor(assessment.outcomeAlignment) : null;
  const criterionCoverage = mode === "comparison-support" ? criterionCoverageFactor(assessment.criterionFocus) : null;
  const favorableFactors = uniqueByCode([
    ...(alignment && ["clear-alignment", "partial-alignment"].includes(assessment.outcomeAlignment) ? [alignment] : []),
    ...(criterionCoverage?.code === "criterion-covered" ? [criterionCoverage] : []),
    ...baseFactors.favorable,
  ]);
  const limitingFactors = uniqueByCode([
    ...(alignment && ["divergence", "clear-divergence", "neutral"].includes(assessment.outcomeAlignment) ? [alignment] : []),
    ...(criterionCoverage?.code === "criterion-missing" ? [criterionCoverage] : []),
    ...baseFactors.limiting,
    ...capFactors(assessment.caps),
  ]);
  const trend = TRENDS[assessment.trend] || TRENDS["relatively-steady"];
  const observableSignals = (policy.observableSignals || []).map((item) => ({ id: item.id, label: item.label }));
  const presentation = {
    schemaVersion: "1.0.0",
    mode,
    outputContract: policy.outputContract,
    heading: CONTRACT_HEADINGS[mode] || CONTRACT_HEADINGS[policy.outputContract],
    grade: mode === "alignment-grade" ? assessment.grade ?? null : null,
    gradeLabel: mode === "alignment-grade" && assessment.grade ? GRADE_LABELS[assessment.grade] || null : null,
    trend: { ...trend },
    summary: summaryFor({ mode, assessment, descriptors, criterion }),
    reason: reasonFor(assessment, descriptors, concise),
    favorableFactors,
    limitingFactors,
    guidance: guidanceFor(concise, observableSignals[0], mode),
    observableSignals,
    ...(assessment.criterionFocus ? { criterionFocus: assessment.criterionFocus } : {}),
    evidenceRefs: uniqueSorted(assessment.evidenceRefs || signal.evidenceRefs),
    policyVersion: policy.policyVersion,
  };
  return deepFreeze(presentation);
}
