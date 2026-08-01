import {
  allEvidence, candidateFactors, candidatesAt, factorEvidence, item, mergeSupported, positionSummary,
  refsOf, relationFor, relationLabel, seal, stopSignal, successSignal, toneFor, turningSignal,
  validateWorkflowInput,
} from "./workflow-utils.js";

const SUPPORT_RELATIONS = new Set(["supports", "reinforces", "continues", "repairs"]);
const TENSION_RELATIONS = new Set(["weakens", "contradicts"]);

function flowClassification(first, second, candidates) {
  if ([first, second].some((relation) => ["transforms", "repairs"].includes(relation?.type))) return "turning";
  const pastTone = toneFor(candidatesAt(candidates, ["past"]));
  const presentTone = toneFor(candidatesAt(candidates, ["present"]));
  const futureTone = toneFor(candidatesAt(candidates, ["future"]));
  if ((TENSION_RELATIONS.has(first?.type) && SUPPORT_RELATIONS.has(second?.type))
    || (pastTone === "limiting" && ["supportive", "conditional"].includes(presentTone) && futureTone !== "limiting")) return "improving";
  if ((SUPPORT_RELATIONS.has(first?.type) && TENSION_RELATIONS.has(second?.type))
    || (pastTone === "supportive" && presentTone !== "limiting" && futureTone === "limiting")) return "worsening";
  if (SUPPORT_RELATIONS.has(first?.type) && SUPPORT_RELATIONS.has(second?.type)) return "continuing";
  return "mixed";
}

const FLOW_TEXT = Object.freeze({
  turning: "时间之流出现明确转折：前一阶段的结构被修正或转换，未来不再只是原样延续。",
  improving: "时间之流呈改善：过去的限制正在当下获得支持或修复，并把较有利的结构传向未来。",
  worsening: "时间之流呈恶化：过去或当下原有的支持在通向未来时被削弱或直接冲突。",
  continuing: "时间之流呈延续：过去到当下、当下到未来的两段连接都保持支持或强化。",
  mixed: "时间之流呈混合：两段连接没有形成同一方向，未来趋势仍受当下条件牵制。",
});

function transitionItem(label, relation, sourceSummary, targetSummary) {
  const evidence = refsOf([relation, ...(sourceSummary || []), ...(targetSummary || [])]);
  if (!relation) return item("", evidence, "insufficient");
  return item(`${label}：两阶段通过“${relationLabel(relation.type)}”关系连接，说明前一阶段对后一阶段的作用方式。`, evidence);
}

export function createTimelineWorkflow(input = {}) {
  validateWorkflowInput(input);
  const observations = Array.isArray(input.observations) ? input.observations : [];
  const relations = Array.isArray(input.relations) ? input.relations : [];
  const candidates = Array.isArray(input.activeCandidates) ? input.activeCandidates : [];
  const first = relationFor(relations, "past", "present");
  const second = relationFor(relations, "present", "future");
  const classification = flowClassification(first, second, candidates);
  const past = positionSummary("过去", ["past"], candidates, observations, relations);
  const present = positionSummary("当下", ["present"], candidates, observations, relations);
  const future = positionSummary("未来", ["future"], candidates, observations, relations);
  const refs = allEvidence(input);
  const basis = [
    { id: "past-to-present", ...transitionItem("过去如何形成当下", first, candidatesAt(candidates, ["past"]), candidatesAt(candidates, ["present"])) },
    { id: "present-to-future", ...transitionItem("当下如何延续到未来", second, candidatesAt(candidates, ["present"]), candidatesAt(candidates, ["future"])) },
    { id: "flow-result", ...item(FLOW_TEXT[classification], refsOf([first, second, ...candidates])) },
    { id: "present-mechanism", ...present.item },
  ];
  return seal({
    schemaVersion: "2.0.0",
    spreadId: "timeline",
    status: observations.length === 3 && Boolean(first && second) && candidates.length ? "complete" : "insufficient",
    flowType: classification,
    spreadAnalysis: item(FLOW_TEXT[classification], refs),
    basis,
    favorableFactors: mergeSupported(candidateFactors(candidates, "supportive", "有利因素"), factorEvidence(input.assessment, "favorable")),
    limitingFactors: mergeSupported(candidateFactors(candidates, "cautionary", "限制因素"), factorEvidence(input.assessment, "limiting")),
    successSignal: successSignal(candidates, input.assessment, ["present", "future", "past"]),
    stopSignal: stopSignal(candidates, input.assessment, ["future", "present", "past"]),
    turningPoint: turningSignal(candidates, relations),
    realityReference: item("现实参考：先核对过去模式是否仍在当下重复，再观察当下机制是否按两段结构传递到未来位置。", refs),
    positionStates: { past: past.tone, present: present.tone, future: future.tone },
  });
}

export const buildTimelineWorkflow = createTimelineWorkflow;
export const runTimelineWorkflow = createTimelineWorkflow;
