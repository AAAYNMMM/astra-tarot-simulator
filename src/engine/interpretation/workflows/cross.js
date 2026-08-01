import {
  allEvidence, candidateFactors, candidatesAt, factorEvidence, item, mergeSupported, refsOf,
  relationFor, relationLabel, seal, stopSignal, successSignal, toneFor, turningSignal,
  validateWorkflowInput,
} from "./workflow-utils.js";

const SUPPORT = new Set(["supports", "reinforces", "continues", "repairs"]);
const TENSION = new Set(["weakens", "contradicts"]);

function axisState(relations, candidates) {
  if (relations.some((relation) => ["transforms", "repairs"].includes(relation?.type))) return "turning";
  if (relations.some((relation) => TENSION.has(relation?.type))) return "limiting";
  if (relations.every((relation) => relation && SUPPORT.has(relation.type)) && toneFor(candidates) !== "limiting") return "supportive";
  return toneFor(candidates);
}

function relationText(relations) {
  return relations.filter(Boolean).map((relation) => relationLabel(relation.type)).join("、") || "证据不足";
}

export function createCrossWorkflow(input = {}) {
  validateWorkflowInput(input);
  const observations = Array.isArray(input.observations) ? input.observations : [];
  const relations = Array.isArray(input.relations) ? input.relations : [];
  const candidates = Array.isArray(input.activeCandidates) ? input.activeCandidates : [];
  const rootCore = relationFor(relations, "root", "core");
  const coreTrend = relationFor(relations, "core", "trend");
  const influenceCore = relationFor(relations, "influence", "core");
  const coreAction = relationFor(relations, "core", "action");
  const influenceAction = relationFor(relations, "influence", "action");
  const actionTrend = relationFor(relations, "action", "trend");
  const horizontalCandidates = candidatesAt(candidates, ["root", "core", "trend"]);
  const verticalCandidates = candidatesAt(candidates, ["influence", "core", "action"]);
  const horizontal = axisState([rootCore, coreTrend], horizontalCandidates);
  const vertical = axisState([influenceCore, coreAction, influenceAction], verticalCandidates);
  let axisRelationship = horizontal === vertical ? "consistent" : "mixed";
  if ([rootCore, coreTrend, influenceCore, coreAction, influenceAction, actionTrend].some((relation) => ["transforms", "repairs"].includes(relation?.type))) axisRelationship = "turning";
  else if ((horizontal === "supportive" && vertical === "limiting") || (horizontal === "limiting" && vertical === "supportive")) axisRelationship = "conflicted";
  else if (vertical === "limiting" && SUPPORT.has(actionTrend?.type)) axisRelationship = "compensating";
  const actionTone = toneFor(candidatesAt(candidates, ["action"]));
  const actionSufficiency = ["supportive", "conditional"].includes(actionTone)
    && SUPPORT.has(actionTrend?.type)
    && !TENSION.has(influenceAction?.type) ? "sufficient" : "insufficient";
  const relationshipText = {
    consistent: "两条轴线方向一致，时间结构与内外结构互相确认。",
    compensating: "两条轴线形成补偿：外部或核心限制存在，但行动投射正在修正趋势。",
    conflicted: "两条轴线直接冲突：时间走势与内外行动给出相反方向。",
    turning: "两条轴线出现转折：修复或转换关系正在改变原有十字结构。",
    mixed: "两条轴线部分一致、部分分散，趋势仍取决于行动与外部影响的交接。",
  }[axisRelationship];
  const refs = allEvidence(input);
  const basis = [
    { id: "horizontal-axis", ...item(`水平时间轴：根源经核心通向趋势，两段关系分别为${relationText([rootCore, coreTrend])}。`, refsOf([rootCore, coreTrend, ...horizontalCandidates])) },
    { id: "vertical-axis", ...item(`上下内外轴：外部影响经核心落到行动，相关连接为${relationText([influenceCore, coreAction, influenceAction])}。`, refsOf([influenceCore, coreAction, influenceAction, ...verticalCandidates])) },
    { id: "axis-relationship", ...item(relationshipText, refsOf([rootCore, coreTrend, influenceCore, coreAction, influenceAction])) },
    { id: "action-projection", ...item(`行动投射：行动到趋势形成“${relationLabel(actionTrend?.type)}”关系；当前修正力${actionSufficiency === "sufficient" ? "足以改变趋势" : "尚不足以稳定改变趋势"}。`, refsOf([actionTrend, ...candidatesAt(candidates, ["action", "trend"])])) },
  ];
  return seal({
    schemaVersion: "2.0.0",
    spreadId: "cross",
    status: observations.length === 5 && [rootCore, coreTrend, influenceCore, coreAction, influenceAction, actionTrend].every(Boolean) && candidates.length ? "complete" : "insufficient",
    axisRelationship,
    actionSufficiency,
    spreadAnalysis: item(relationshipText, refs),
    basis,
    favorableFactors: mergeSupported(candidateFactors(candidates, "supportive", "有利因素"), factorEvidence(input.assessment, "favorable")),
    limitingFactors: mergeSupported(candidateFactors(candidates, "cautionary", "限制因素"), factorEvidence(input.assessment, "limiting")),
    successSignal: successSignal(candidates, input.assessment, ["action", "trend", "core"]),
    stopSignal: stopSignal(candidates, input.assessment, ["trend", "influence", "core"]),
    turningPoint: turningSignal(candidates, relations),
    realityReference: item("现实参考：检查可控行动是否真的改变核心状态，并观察外部影响是否随之减弱、转为资源或继续压制趋势。", refs),
  });
}

export const buildCrossWorkflow = createCrossWorkflow;
export const runCrossWorkflow = createCrossWorkflow;
