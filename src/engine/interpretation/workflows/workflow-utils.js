import { getSpreadDefinition } from "../../../knowledge/spreads/definitions.js";

const DIMENSION_LABELS = Object.freeze({
  "current-state": "当前状态", "key-condition": "关键条件", "next-response": "下一步回应",
  foundation: "基础", "carry-over": "延续影响", process: "过程", controllability: "可控空间",
  outcome: "结果", stability: "稳定性", "turning-condition": "转折条件",
  "external-condition": "外部条件", resistance: "阻力", cost: "代价",
  "conscious-direction": "意识方向", "hidden-driver": "深层驱动", "near-future": "近期发展",
  "self-position": "自我位置", "expectation-bias": "希望与担忧",
});
const FACET_LABELS = Object.freeze({
  state: "状态", cause: "根源", motivation: "动机", obstacle: "阻碍", opportunity: "机会",
  resource: "资源", relationship: "关系", action: "行动", boundary: "边界", trend: "趋势",
  outcome: "结果", reflection: "反思",
});
const RELATION_LABELS = Object.freeze({
  supports: "支持", reinforces: "强化", weakens: "削弱", contradicts: "冲突", causes: "因果",
  continues: "延续", transforms: "转折", repairs: "修复", conditions: "条件约束",
});
const FACTOR_LABELS = Object.freeze({
  foundation: "基础", process: "过程", outcome: "结果", stability: "稳定性", resistance: "阻力",
  cost: "代价", controllability: "可控性", interCardConflict: "牌间冲突",
});

export const unique = (values) => [...new Set((values || []).filter(Boolean))].sort();
export const positionsOf = (candidate) => unique(candidate?.positionIds || candidate?.positions || [candidate?.positionId]);
export const refsOf = (items) => unique((items || []).filter(Boolean).flatMap((item) => [item.id, ...(item.evidenceRefs || [])]));
export const relationLabel = (type) => RELATION_LABELS[type] || "结构关联";
export const dimensionLabel = (dimension) => DIMENSION_LABELS[dimension] || "综合结构";
export const facetLabel = (facet) => FACET_LABELS[facet] || "综合侧面";

function positionLabels(candidate) {
  const spread = getSpreadDefinition(candidate?.spreadId, "2.0.0");
  const labels = new Map((spread?.positions || []).map((position) => [position.id, position.name]));
  return positionsOf(candidate).map((positionId) => labels.get(positionId) || positionId);
}

export function item(text, evidenceRefs, status = "supported") {
  const refs = unique(evidenceRefs);
  return {
    status: refs.length && status !== "insufficient" ? status : "insufficient",
    text: refs.length ? text : "证据不足，暂不形成此项判断。",
    evidenceRefs: refs,
  };
}

export function candidatesAt(candidates, positions) {
  return (candidates || []).filter((candidate) => positionsOf(candidate).some((position) => positions.includes(position)));
}

export function observationsAt(observations, positions) {
  return (observations || []).filter((observation) => positions.includes(observation.positionId));
}

export function relationFor(relations, source, target) {
  return (relations || []).find((relation) => (
    relation.structure?.sourcePositionId === source && relation.structure?.targetPositionId === target
  )) || null;
}

export function toneFor(candidates) {
  const totals = { supportive: 0, limiting: 0, conditional: 0 };
  for (const candidate of candidates || []) {
    const score = Number.isFinite(Number(candidate.score)) ? Number(candidate.score) : 0.5;
    if (candidate.stance === "supportive") totals.supportive += score;
    else if (candidate.stance === "cautionary") totals.limiting += score;
    else totals.conditional += score;
  }
  if (totals.supportive > totals.limiting + 0.12) return "supportive";
  if (totals.limiting > totals.supportive + 0.12) return "limiting";
  if (totals.conditional) return "conditional";
  return "mixed";
}

export function positionSummary(label, positionIds, candidates, observations, relations = []) {
  const selectedCandidates = candidatesAt(candidates, positionIds);
  const selectedObservations = observationsAt(observations, positionIds);
  const selectedRelations = (relations || []).filter((relation) => (
    positionIds.includes(relation.structure?.sourcePositionId)
    || positionIds.includes(relation.structure?.targetPositionId)
  ));
  const tone = toneFor(selectedCandidates);
  const toneText = {
    supportive: "支持信号占主导", limiting: "限制信号占主导",
    conditional: "条件性与转折信号较多", mixed: "支持与限制相抵",
  }[tone];
  const dimensions = unique(selectedCandidates.map((candidate) => dimensionLabel(candidate.dimension)));
  const facets = unique(selectedObservations.map((observation) => facetLabel(observation.selectedFacet)));
  const focus = unique([...dimensions, ...facets]).slice(0, 3).join("、") || "结构职责";
  return {
    tone,
    item: item(`${label}：${toneText}；主要落在${focus}。`, refsOf([...selectedCandidates, ...selectedObservations, ...selectedRelations])),
  };
}

export function candidateFactors(candidates, stance, prefix) {
  return (candidates || []).filter((candidate) => candidate.stance === stance).sort((left, right) => (
    (Number(right.score) || 0) - (Number(left.score) || 0)
    || String(left.id || "").localeCompare(String(right.id || ""))
  )).slice(0, 3).map((candidate) => item(
    `${prefix}：${positionLabels(candidate).join("、")}位置的${dimensionLabel(candidate.dimension)}信号。`,
    refsOf([candidate]),
  ));
}

export function factorEvidence(assessment, kind) {
  const summaries = assessment?.factorBands || {};
  const penalties = new Set(["resistance", "cost", "interCardConflict"]);
  const rank = { low: 1, medium: 2, high: 3 };
  const entries = Object.entries(summaries).filter(([, detail]) => (
    detail?.evidenceRefs?.length && !["not-applicable", "unavailable"].includes(detail.band)
  )).sort(([leftFactor, left], [rightFactor, right]) => {
    const merit = (factor, detail) => {
      const value = rank[detail.band] || 0;
      const favorable = penalties.has(factor) ? 4 - value : value;
      return kind === "favorable" ? favorable : 4 - favorable;
    };
    return merit(rightFactor, right) - merit(leftFactor, left) || leftFactor.localeCompare(rightFactor);
  });
  return entries.slice(0, 3).map(([factor, detail]) => {
    const label = FACTOR_LABELS[factor] || factor;
    const band = detail.band === "high" ? "高位" : detail.band === "medium" ? "中位" : "低位";
    const penalty = penalties.has(factor);
    const text = kind === "favorable"
      ? `有利：${label}${penalty ? "程度" : "支撑"}处于${band}。`
      : penalty
        ? `限制边界：${label}程度处于${band}，若继续升高会削弱整阵结构。`
        : `限制边界：${label}支撑处于${band}，若继续转弱会削弱整阵结构。`;
    return item(text, detail.evidenceRefs);
  });
}

export function mergeSupported(...groups) {
  const result = [];
  const seen = new Set();
  for (const entry of groups.flat()) {
    if (entry?.status !== "supported" || !entry.evidenceRefs?.length) continue;
    const key = entry.text;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
  }
  return result.slice(0, 3);
}

export function successSignal(candidates, assessment, positionPreference = []) {
  const ordered = [...(candidates || [])].sort((left, right) => (
    Math.min(...positionsOf(left).map((position) => {
      const index = positionPreference.indexOf(position);
      return index < 0 ? 999 : index;
    })) - Math.min(...positionsOf(right).map((position) => {
      const index = positionPreference.indexOf(position);
      return index < 0 ? 999 : index;
    }))
    || (Number(right.score) || 0) - (Number(left.score) || 0)
    || String(left.id || "").localeCompare(String(right.id || ""))
  ));
  const candidate = ordered.find((entry) => entry.stance === "supportive");
  if (candidate) return item(`成立条件：${positionLabels(candidate).join("、")}位置的${dimensionLabel(candidate.dimension)}支持信号持续出现。`, refsOf([candidate]));
  return factorEvidence(assessment, "favorable")[0] || item("", []);
}

export function stopSignal(candidates, assessment, positionPreference = []) {
  const ordered = [...(candidates || [])].sort((left, right) => {
    const leftPreferred = positionsOf(left).some((position) => positionPreference.includes(position));
    const rightPreferred = positionsOf(right).some((position) => positionPreference.includes(position));
    return Number(rightPreferred) - Number(leftPreferred)
      || (Number(right.score) || 0) - (Number(left.score) || 0)
      || String(left.id || "").localeCompare(String(right.id || ""));
  });
  const candidate = ordered.find((entry) => entry.stance === "cautionary");
  if (candidate) return item(`停止信号：${positionLabels(candidate).join("、")}位置的${dimensionLabel(candidate.dimension)}限制持续增强。`, refsOf([candidate]));
  const limiting = factorEvidence(assessment, "limiting")[0];
  return limiting ? item(`停止信号：${limiting.text.replace(/^限制：/, "")}`, limiting.evidenceRefs) : item("", []);
}

export function turningSignal(candidates, relations) {
  const relation = (relations || []).find((entry) => ["transforms", "repairs", "conditions"].includes(entry.type));
  const candidate = (candidates || []).find((entry) => ["transformative", "conditional"].includes(entry.stance));
  const evidence = [relation, candidate].filter(Boolean);
  return evidence.length
    ? item(`转折信号：${relation ? relationLabel(relation.type) : "条件性"}结构开始改变原有连接。`, refsOf(evidence))
    : item("", []);
}

export function allEvidence(input) {
  return unique([
    ...refsOf([...(input.observations || []), ...(input.relations || []), ...(input.activeCandidates || []), ...(input.conflicts || [])]),
    ...(input.assessment?.evidenceRefs || []),
  ]);
}

export function seal(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const itemValue of Object.values(value)) seal(itemValue);
  return Object.freeze(value);
}

export function validateWorkflowInput(input) {
  for (const key of [
    "question", "questionId", "questionText", "categoryId", "domain", "intent", "questionType",
    "expectation", "expectationId", "criterionId", "timeframe", "comparison",
  ]) {
    if (Object.prototype.hasOwnProperty.call(input || {}, key)) throw new TypeError(`Spread workflows do not accept ${key}.`);
  }
}
