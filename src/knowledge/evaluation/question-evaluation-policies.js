import { QUESTION_CLASSIFICATIONS } from "../questions/classification.js";
import { QUESTION_PROFILE_IDS } from "../questions/registry.js";

export const OUTPUT_CONTRACTS = Object.freeze(["alignment-grade", "situation-map", "action-prompt", "comparison-support"]);

const ALL_SPREADS = ["single", "timeline", "cross", "celtic"];
const GRADED_SPREADS = ["timeline", "cross", "celtic"];
const TIMELINE_ONLY = ["timeline"];
const definition = (id, outputContract, displayQuestion, timeframeLabel, requiredEvidenceDimensions, criteriaDimensions = null) =>
  ({ id, outputContract, displayQuestion, timeframeLabel, requiredEvidenceDimensions, criteriaDimensions });

const DEFINITIONS = [
  definition("love-current", "situation-map", "此刻这段关系最需要被看见的互动模式是什么？", "当下", ["current-state", "core-dynamic", "hidden-factor"]),
  definition("love-future", "alignment-grade", "未来三个月，这段关系是否会出现持续且明确的推进？", "未来三个月", ["current-state", "development-trend", "external-condition", "turning-point"]),
  definition("love-improve", "action-prompt", "这周我能做的一个关系修复动作是什么？", "未来七天", ["main-obstacle", "available-resource", "recommended-action"]),
  definition("love-new", "action-prompt", "本月我能尝试的一个认识新人的行动是什么？", "未来三十天", ["opportunity-quality", "preparation-gap", "recommended-action"]),
  definition("love-truth", "situation-map", "此刻我在这段关系中忽略的一个事实是什么？", "当下", ["current-state", "hidden-factor", "internal-motivation"]),
  definition("love-self", "action-prompt", "今天我能照顾的一个关系需要是什么？", "今天", ["self-care-need", "boundary", "recommended-action"]),
  definition("love-communication", "action-prompt", "下一次谈话中我需要说清的一件事是什么？", "未来七天", ["communication-focus", "boundary", "recommended-action"]),
  definition("career-focus", "alignment-grade", "未来三个月，当前职业方向是否会产生一项可验证的进展？", "未来三个月", ["current-state", "value-alignment", "readiness", "external-condition"]),
  definition("career-block", "situation-map", "当前最限制我推进的一项障碍是什么？", "当下", ["current-state", "main-obstacle", "hidden-factor"]),
  definition("career-change", "alignment-grade", "未来三个月，我是否具备开始执行一次职业方向调整的现实条件？", "未来三个月", ["internal-motivation", "readiness", "main-obstacle", "external-condition"]),
  definition("career-growth", "action-prompt", "本月最值得练习的一项职业能力是什么？", "未来三十天", ["learning-goal", "available-resource", "recommended-action"]),
  definition("career-team", "action-prompt", "本周我能改善协作的一次具体沟通是什么？", "未来七天", ["communication-focus", "boundary", "recommended-action"]),
  definition("career-balance", "action-prompt", "本周我需要调整的一项工作投入边界是什么？", "未来七天", ["recovery-need", "boundary", "recommended-action"]),
  definition("career-opportunity", "alignment-grade", "未来三个月，是否会出现一项可以实际申请或参与的事业或学习机会？", "未来三个月", ["current-state", "opportunity-quality", "external-condition", "preparation-gap"]),
  definition("wealth-state", "situation-map", "此刻我财务安排中最需要看清的一项模式是什么？", "当下", ["current-state", "core-dynamic", "hidden-factor"]),
  definition("wealth-opportunity", "action-prompt", "本月值得先核验的一类增收机会是什么？", "未来三十天", ["opportunity-quality", "external-condition", "recommended-action"]),
  definition("wealth-risk", "action-prompt", "本周我要核验的一项金钱风险信号是什么？", "未来七天", ["risk", "external-condition", "recommended-action"]),
  definition("wealth-growth", "action-prompt", "下个收入周期，我可以先调整哪一项资源配置来提高稳定性？", "下个收入周期", ["resource-allocation", "stability", "recommended-action"]),
  definition("wealth-project", "action-prompt", "继续投入前要确认的一项项目条件是什么？", "未来三十天", ["readiness", "main-obstacle", "recommended-action"]),
  definition("wealth-habit", "situation-map", "当前最影响稳定感的一项金钱习惯是什么？", "当下", ["habit-pattern", "hidden-factor", "boundary"]),
  definition("wealth-resource", "action-prompt", "本月最值得优先使用的一项现有资源是什么？", "未来三十天", ["resource-allocation", "stability", "recommended-action"]),
  definition("growth-lesson", "situation-map", "当前最需要觉察的一种重复模式是什么？", "当下", ["current-state", "hidden-factor", "internal-motivation"]),
  definition("growth-release", "action-prompt", "本周我要暂停的一种旧反应是什么？", "未来七天", ["habit-pattern", "boundary", "recommended-action"]),
  definition("growth-strength", "situation-map", "我尚未使用的一项能力资源是什么？", "当下", ["current-state", "core-dynamic", "hidden-factor"]),
  definition("growth-heal", "action-prompt", "今天我需要安排的一项恢复行动是什么？", "今天", ["self-care-need", "recovery-need", "recommended-action"]),
  definition("growth-next", "action-prompt", "下一阶段我要练习的一项身份行为是什么？", "未来三十天", ["identity-direction", "learning-goal", "recommended-action"]),
  definition("growth-boundary", "action-prompt", "本周我要表达的一条个人边界是什么？", "未来七天", ["boundary", "recommended-action"]),
  definition("growth-purpose", "action-prompt", "本月我要尝试的一项有意义活动是什么？", "未来三十天", ["identity-direction", "meaning", "recommended-action"]),
  definition("decision-see", "situation-map", "当前选择中我还未核验的一项假设是什么？", "当下", ["current-state", "hidden-factor"]),
  definition("decision-a", "action-prompt", "继续当前方向前要验证的一项条件是什么？", "未来十四天", ["development-trend", "external-condition", "recommended-action"]),
  definition("decision-change", "action-prompt", "改变方向前要完成的一项准备是什么？", "未来三十天", ["readiness", "main-obstacle", "recommended-action"]),
  definition("decision-value", "comparison-support", "未来三十天，两条路径在长期价值契合上分别呈现什么条件与代价？", "未来三十天", ["value-alignment", "tradeoff", "external-condition"], [["stability", ["tradeoff"]], ["growth", ["value-alignment"]], ["freedom", ["recommended-action"]], ["pressure", ["external-condition"]], ["long-term", ["value-alignment", "tradeoff"]]]),
  definition("decision-timing", "action-prompt", "行动前要满足的一项时机条件是什么？", "未来十四天", ["timing", "readiness", "recommended-action"]),
  definition("decision-cost", "action-prompt", "做出选择前要写清的一项代价是什么？", "未来十四天", ["tradeoff", "cost", "recommended-action"]),
  definition("decision-option", "comparison-support", "未来十四天，两条候选路径分别适合怎样的可撤回小实验？", "未来十四天", ["alternative-option", "tradeoff", "opportunity-quality", "recommended-action"], [["stability", ["current-state", "tradeoff"]], ["growth", ["opportunity-quality", "alternative-option"]], ["freedom", ["alternative-option", "recommended-action"]], ["pressure", ["current-state", "tradeoff"]], ["long-term", ["opportunity-quality", "tradeoff"]]]),
  definition("daily-energy", "situation-map", "今天最影响我节奏的一项状态是什么？", "今天", ["current-state", "daily-focus"]),
  definition("daily-focus", "action-prompt", "今天最值得专注的一件事是什么？", "今天", ["daily-focus", "recommended-action"]),
  definition("daily-avoid", "action-prompt", "今天我要暂停的一项分心行为是什么？", "今天", ["risk", "recommended-action"]),
  definition("daily-message", "situation-map", "此刻我最需要承认的一项需要是什么？", "今天", ["internal-motivation", "hidden-factor"]),
  definition("daily-action", "action-prompt", "今天我要完成的一个最小行动是什么？", "今天", ["main-obstacle", "available-resource", "recommended-action", "boundary"]),
  definition("daily-relationship", "action-prompt", "今天相处时我要保持的一项沟通态度是什么？", "今天", ["communication-focus", "recommended-action"]),
  definition("daily-rest", "action-prompt", "今天我要安排的一段恢复时间是什么？", "今天", ["self-care-need", "recovery-need", "recommended-action"]),
  definition("love-boundaries", "action-prompt", "这周我需要表达的一条关系边界是什么？", "未来七天", ["boundary", "communication-focus", "recommended-action"]),
  definition("love-reciprocity", "situation-map", "此刻这段关系中最明显的一处回应失衡是什么？", "当下", ["relationship-pattern", "resource-allocation", "hidden-factor"]),
  definition("love-trust", "action-prompt", "重建信任前我需要确认的一项可见承诺是什么？", "未来十四天", ["communication-focus", "boundary", "recommended-action"]),
  definition("love-distance", "situation-map", "当前距离正在回避的一个议题是什么？", "当下", ["relationship-pattern", "hidden-factor", "boundary"]),
  definition("love-choice", "action-prompt", "面对这段关系，我现在要澄清的一个取舍是什么？", "未来十四天", ["value-alignment", "tradeoff", "recommended-action"]),
  definition("love-repair", "action-prompt", "关系修复前需要落实的一个现实条件是什么？", "未来十四天", ["available-resource", "preparation-gap", "recommended-action"]),
  definition("love-ending", "action-prompt", "若关系结束，我本周要先建立的一项支持是什么？", "未来七天", ["readiness", "recovery-need", "recommended-action"]),
  definition("love-third-party", "situation-map", "对外部影响，我现在能核验的一项事实是什么？", "当下", ["external-condition", "communication-focus", "hidden-factor"]),
  definition("career-role-fit", "alignment-grade", "未来三个月，当前角色是否会提供一项可观察的成长机会？", "未来三个月", ["current-state", "value-alignment", "available-resource", "preparation-gap"]),
  definition("career-feedback", "situation-map", "最近反馈中最值得核验的一项信息是什么？", "未来十四天", ["external-condition", "hidden-factor", "learning-goal"]),
  definition("career-leadership", "action-prompt", "承担更多领导责任前要补足的一项能力是什么？", "未来三十天", ["learning-goal", "preparation-gap", "recommended-action"]),
  definition("career-conflict", "action-prompt", "当前冲突中我能改变的一项沟通方式是什么？", "未来七天", ["communication-focus", "boundary", "recommended-action"]),
  definition("career-burnout", "action-prompt", "本周我要调整的一项工作负荷是什么？", "未来七天", ["recovery-need", "boundary", "recommended-action"]),
  definition("career-negotiation", "action-prompt", "下一次协商前我要准备的一条事实依据是什么？", "未来十四天", ["communication-focus", "preparation-gap", "recommended-action"]),
  definition("career-transition-cost", "action-prompt", "转型前我必须算清的一项成本是什么？", "未来三十天", ["cost", "preparation-gap", "recommended-action"]),
  definition("career-portfolio", "action-prompt", "本月要整理成能力证据的一项经历是什么？", "未来三十天", ["available-resource", "learning-goal", "recommended-action"]),
  definition("wealth-budget", "action-prompt", "下个预算周期要调整的一项支出类别是什么？", "下个预算周期", ["resource-allocation", "stability", "recommended-action"]),
  definition("wealth-debt", "action-prompt", "面对负担时我要先核验的一项还款条件是什么？", "未来十四天", ["cost", "external-condition", "recommended-action"]),
  definition("wealth-savings", "action-prompt", "下个收入周期要建立的一项储备习惯是什么？", "下个收入周期", ["habit-pattern", "resource-allocation", "recommended-action"]),
  definition("wealth-investment", "action-prompt", "评估投资前必须补齐的一项事实是什么？", "未来十四天", ["hidden-factor", "external-condition", "recommended-action"]),
  definition("wealth-income", "action-prompt", "本月要优先投入的一项增收资源是什么？", "未来三十天", ["available-resource", "opportunity-quality", "recommended-action"]),
  definition("wealth-sharing", "action-prompt", "共用资金前要写清的一条使用边界是什么？", "未来十四天", ["boundary", "communication-focus", "recommended-action"]),
  definition("wealth-loss", "action-prompt", "面对已发生损失时先要停止的一项扩大行为是什么？", "未来七天", ["risk", "stability", "recommended-action"]),
  definition("wealth-purchase", "alignment-grade", "这项支出是否与未来三个月的财务稳定目标相符？", "未来三个月", ["value-alignment", "tradeoff", "cost", "stability"]),
  definition("growth-belief", "situation-map", "当前限制选择的一条自我信念是什么？", "当下", ["habit-pattern", "hidden-factor", "value-alignment"]),
  definition("growth-emotion", "situation-map", "下一次情绪出现时我要观察的一项触发是什么？", "未来七天", ["self-care-need", "hidden-factor", "recovery-need"]),
  definition("growth-support", "action-prompt", "本周我要提出的一项具体支持请求是什么？", "未来七天", ["available-resource", "boundary", "recommended-action"]),
  definition("growth-shame", "action-prompt", "面对自我否定时我要使用的一项安全支持是什么？", "未来七天", ["self-care-need", "recovery-need", "recommended-action"]),
  definition("growth-identity", "situation-map", "下一阶段最不再适合我的一条旧身份叙事是什么？", "未来三十天", ["identity-direction", "meaning", "turning-point"]),
  definition("growth-practice", "action-prompt", "本周要开始的一项可持续练习是什么？", "未来七天", ["learning-goal", "readiness", "recommended-action"]),
  definition("growth-forgiveness", "action-prompt", "考虑原谅前我要先保护的一条边界是什么？", "未来十四天", ["boundary", "recommended-action"]),
  definition("growth-help", "action-prompt", "出现哪一个可观察信号时我要寻求专业帮助？", "未来三十天", ["risk", "available-resource", "recommended-action"]),
  definition("decision-evidence", "action-prompt", "当前决定最缺少的一项证据是什么？", "未来七天", ["hidden-factor", "external-condition", "recommended-action"]),
  definition("decision-reversible", "comparison-support", "未来十四天，两条路径各自能否拆成可撤回的小实验？", "未来十四天", ["alternative-option", "readiness", "cost", "recommended-action"], [["stability", ["cost"]], ["growth", ["readiness"]], ["freedom", ["alternative-option"]], ["pressure", ["risk"]], ["long-term", ["cost", "recommended-action"]]]),
  definition("decision-stakeholders", "action-prompt", "决定前我要确认的一项责任边界是什么？", "未来十四天", ["relationship-pattern", "boundary", "recommended-action"]),
  definition("decision-pressure", "situation-map", "当前最影响判断的一项外部压力是什么？", "当下", ["external-condition", "internal-motivation", "risk"]),
  definition("decision-no-choice", "comparison-support", "未来十四天，当前路径与替代路径分别呈现哪些可观察差异？", "未来十四天", ["alternative-option", "hidden-factor", "tradeoff", "recommended-action"], [["stability", ["tradeoff"]], ["growth", ["alternative-option"]], ["freedom", ["alternative-option", "recommended-action"]], ["pressure", ["hidden-factor", "tradeoff"]], ["long-term", ["tradeoff", "recommended-action"]]]),
  definition("decision-threshold", "action-prompt", "行动前必须满足的一项准备阈值是什么？", "未来十四天", ["readiness", "preparation-gap", "recommended-action"]),
  definition("decision-safety", "action-prompt", "选择前要设定的一项可承受边界是什么？", "未来十四天", ["risk", "boundary", "recommended-action"]),
  definition("decision-commitment", "action-prompt", "选择后要持续投入的一项资源是什么？", "未来三十天", ["available-resource", "readiness", "recommended-action"]),
  definition("daily-priority", "action-prompt", "今天最该先完成的一件事是什么？", "今天", ["daily-focus", "readiness", "recommended-action"]),
  definition("daily-boundary", "action-prompt", "今天我要拒绝的一项额外要求是什么？", "今天", ["boundary", "recommended-action"]),
  definition("daily-conversation", "action-prompt", "今天我要发起的一次直接对话是什么？", "今天", ["communication-focus", "daily-focus", "recommended-action"]),
  definition("daily-body", "action-prompt", "今天身体提醒我调整的一项安排是什么？", "今天", ["self-care-need", "recovery-need", "recommended-action"]),
  definition("daily-money", "action-prompt", "今天处理消费前要遵守的一项原则是什么？", "今天", ["resource-allocation", "boundary", "recommended-action"]),
  definition("daily-learning", "action-prompt", "今天要练习的一项能力是什么？", "今天", ["learning-goal", "daily-focus", "recommended-action"]),
  definition("daily-finish", "action-prompt", "今天结束前要收尾的一件事是什么？", "今天", ["daily-focus", "stability", "recommended-action"]),
  definition("daily-uncertainty", "action-prompt", "今天面对不确定时要先验证的一件小事是什么？", "今天", ["hidden-factor", "daily-focus", "recommended-action"]),
];

const tagConstruct = (id, priority, supportTags, counterTags) => ({ id, priority, supportTags, counterTags });
const expectation = (id, label, resultMode, constructs) => ({ id, label, resultMode, constructs });
const observeOnly = (id) => expectation("observe-only", "仅观察当前证据", "situation-map", [tagConstruct(`${id}-evidence`, "core", ["evidence", "awareness"], ["ambiguity", "uncertainty"])]);
const grade = (id, label, supportTags, counterTags) => expectation(id, label, "alignment-grade", [
  tagConstruct(`${id}-core`, "core", supportTags, counterTags),
  tagConstruct(`${id}-support`, "supporting", ["clarity", "evidence"], ["ambiguity", "uncertainty"]),
]);

const ALIGNMENT_EXPECTATIONS = {
  "love-future": [
    expectation("develop-relationship", "希望关系进一步发展", "alignment-grade", [tagConstruct("mutual-investment", "core", ["reciprocity", "connection", "commitment", "growth", "renewal", "openness"], ["isolation", "delay", "ending", "collapse", "detachment"]), tagConstruct("clear-dialogue", "supporting", ["communication", "honesty"], ["ambiguity", "control"])]),
    expectation("maintain-relationship", "希望维持目前状态", "alignment-grade", [tagConstruct("sustainable-balance", "core", ["balance", "stability", "foundation", "structure"], ["rupture", "disruption", "transition", "change", "collapse", "ending"]), tagConstruct("steady-exchange", "supporting", ["communication", "patience"], ["isolation", "ambiguity"])]),
    expectation("end-relationship", "希望逐渐结束关系", "alignment-grade", [tagConstruct("clear-closure", "core", ["ending", "release", "detachment", "transition"], ["commitment", "connection", "stability"]), tagConstruct("self-directed-boundary", "supporting", ["boundary", "agency", "clarity", "independence"], ["control", "ambiguity"])]),
    expectation("observe-only", "仅观察当前互动证据", "situation-map", [tagConstruct("interaction-evidence", "core", ["evidence", "awareness"], ["ambiguity", "uncertainty"])])
  ],
  "career-opportunity": [
    expectation("pursue-opportunity", "希望把握并落实新机会", "alignment-grade", [tagConstruct("usable-opening", "core", ["opportunity", "movement", "growth", "renewal", "openness"], ["delay", "limits", "collapse"]), tagConstruct("usable-readiness", "supporting", ["preparation", "skill", "agency"], ["ambiguity", "isolation"])]),
    expectation("maintain-current-path", "希望维持当前方向，暂不承接新机会", "alignment-grade", [tagConstruct("stable-foundation", "core", ["stability", "foundation", "structure", "balance"], ["disruption", "collapse", "transition", "change"]), tagConstruct("deliberate-pacing", "supporting", ["patience", "discipline", "clarity", "boundary"], ["risk", "ambiguity"])]),
    expectation("observe-only", "仅观察机会条件", "situation-map", [tagConstruct("opportunity-evidence", "core", ["evidence", "awareness"], ["ambiguity", "uncertainty"])])
  ],
  "career-focus": [grade("advance-current-direction", "希望当前方向取得进展", ["growth", "movement", "opportunity"], ["delay", "isolation"]), grade("explore-alternative-direction", "希望探索替代方向", ["openness", "change", "choice"], ["control", "isolation"]), grade("maintain-current-pace", "希望保持当前节奏", ["stability", "foundation", "patience"], ["disruption", "collapse"]), observeOnly("career-focus")],
  "career-change": [grade("change-direction", "希望转向新方向", ["change", "transition", "movement", "opportunity", "openness"], ["delay", "control", "limits"]), grade("remain-current-direction", "希望继续当前方向", ["stability", "foundation", "commitment", "structure"], ["change", "transition", "disruption", "collapse"]), observeOnly("career-change")],
  "career-role-fit": [grade("deepen-current-role", "希望深化当前角色", ["growth", "mastery", "commitment"], ["isolation", "delay"]), grade("prepare-role-change", "希望准备角色变化", ["change", "openness", "opportunity", "transition"], ["control", "delay", "commitment", "stability"]), grade("maintain-role-stability", "希望维持角色稳定", ["stability", "foundation", "structure"], ["disruption", "collapse", "transition"]), observeOnly("career-role-fit")],
  "wealth-purchase": [grade("proceed-purchase", "希望推进这项支出", ["resource", "value", "clarity", "stability"], ["risk", "uncertainty", "limits", "collapse"]), grade("defer-purchase", "希望延后这项支出", ["patience", "boundary", "risk", "uncertainty", "delay"], ["commitment", "movement", "speed"]), grade("abandon-purchase", "希望放弃这项支出", ["release", "independence", "risk", "limits", "ending"], ["commitment", "opportunity", "growth"]), observeOnly("wealth-purchase")],
};

const CRITERION_LABELS = { stability: "稳定性", growth: "成长性", freedom: "自由度", pressure: "压力", "long-term": "长期性" };
function deepFreeze(value) { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.values(value).forEach(deepFreeze); Object.freeze(value); } return value; }
function signals(contract) {
  if (contract === "situation-map") return [{ id: "pattern-noted", label: "是否记录到一项具体模式" }];
  if (contract === "comparison-support") return [{ id: "paths-named", label: "是否写下两条可比较的路径" }, { id: "comparison-recorded", label: "是否记录一项路径差异" }];
  return [{ id: "action-completed", label: "是否完成一个明确的小行动" }, { id: "result-recorded", label: "是否记录一个可观察结果" }];
}
const PILOT_SIGNALS = {
  "love-future": [{ id: "mutual-response", label: "双方是否持续给出可观察的回应" }, { id: "concrete-arrangement", label: "是否提出并兑现具体安排" }],
  "career-opportunity": [{ id: "application-progress", label: "是否完成一个机会材料或报名步骤" }, { id: "external-feedback", label: "是否收到具体的外部反馈" }],
};
function buildPolicy(item) {
  const expectations = ALIGNMENT_EXPECTATIONS[item.id] || [];
  return {
    schemaVersion: "1.0.0", policyVersion: "1.0.0", questionId: item.id, outputContract: item.outputContract,
    displayQuestion: item.displayQuestion, timeframeLabel: item.timeframeLabel,
    allowedSpreads: item.outputContract === "alignment-grade" ? GRADED_SPREADS : item.outputContract === "comparison-support" ? TIMELINE_ONLY : ALL_SPREADS,
    observableSignals: PILOT_SIGNALS[item.id] || signals(item.outputContract), requiredEvidenceDimensions: item.requiredEvidenceDimensions,
    expectations, criterionMode: item.outputContract === "comparison-support" ? "required" : "none",
    criteria: (item.criteriaDimensions || []).map(([id, focusDimensions]) => ({ id, label: CRITERION_LABELS[id], focusDimensions })),
  };
}

const definitionsById = new Map();
for (const item of DEFINITIONS) {
  if (definitionsById.has(item.id)) throw new Error(`Duplicate question evaluation definition: ${item.id}`);
  definitionsById.set(item.id, item);
}
if (definitionsById.size !== QUESTION_PROFILE_IDS.length) throw new Error(`Question evaluation definition count mismatch: ${definitionsById.size}`);
const classificationsById = new Map(QUESTION_CLASSIFICATIONS.map((item) => [item.id, item]));
export const QUESTION_EVALUATION_POLICIES = deepFreeze(QUESTION_PROFILE_IDS.map((id) => {
  const item = definitionsById.get(id); const classification = classificationsById.get(id);
  if (!item || !classification) throw new Error(`Missing question evaluation definition or classification: ${id}`);
  for (const dimension of item.requiredEvidenceDimensions) if (!classification.answerDimensions.includes(dimension)) throw new Error(`${id}: unknown required evidence dimension ${dimension}`);
  for (const [, dimensions] of item.criteriaDimensions || []) for (const dimension of dimensions) if (!classification.answerDimensions.includes(dimension)) throw new Error(`${id}: unknown criterion dimension ${dimension}`);
  return buildPolicy(item);
}));
if (QUESTION_EVALUATION_POLICIES.length !== 90) throw new Error(`Question evaluation policy count mismatch: ${QUESTION_EVALUATION_POLICIES.length}`);
const POLICIES_BY_ID = new Map(QUESTION_EVALUATION_POLICIES.map((item) => [item.questionId, item]));
if (POLICIES_BY_ID.size !== QUESTION_EVALUATION_POLICIES.length) throw new Error("Question evaluation policies contain duplicate IDs.");
export function getQuestionEvaluationPolicy(questionId) { return POLICIES_BY_ID.get(questionId) || null; }
