import { SPREADS } from "../spreads/definitions.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

const profile = (spreadId, positionResponsibilities, answerDimensions, relationLines, scoringGroups, outputWorkflow) => deepFreeze({
  schemaVersion: "2.0.0",
  spreadId,
  positionResponsibilities,
  answerDimensions,
  relationLines,
  scoringGroups,
  outputWorkflow,
});

export const SPREAD_READING_PROFILES = deepFreeze({
  single: profile(
    "single",
    { essence: ["current-state", "key-condition", "next-response"] },
    ["current-state", "key-condition", "next-response"],
    [],
    { process: ["essence"], stability: ["essence"], resistance: ["essence"], cost: ["essence"], controllability: ["essence"] },
    [{ id: "essence", positionIds: ["essence"], responsibility: "提炼核心状态、关键条件与一个可核验回应" }],
  ),
  timeline: profile(
    "timeline",
    {
      past: ["foundation", "carry-over"],
      present: ["current-state", "process", "controllability"],
      future: ["outcome", "stability", "turning-condition"],
    },
    ["foundation", "carry-over", "current-state", "process", "controllability", "outcome", "stability", "turning-condition"],
    [{ id: "temporal-flow", positionIds: ["past", "present", "future"], responsibility: "区分前因、当前机制与条件性走向" }],
    { foundation: ["past"], process: ["present"], outcome: ["future"], stability: ["future"], resistance: ["present", "future"], cost: ["present", "future"], controllability: ["present"], interCardConflict: ["past", "present", "future"] },
    [
      { id: "past", positionIds: ["past"], responsibility: "确认仍在作用的来源" },
      { id: "present", positionIds: ["present"], responsibility: "判断来源如何成为当前过程" },
      { id: "future", positionIds: ["future"], responsibility: "给出延续当前过程时的条件性趋势" },
    ],
  ),
  cross: profile(
    "cross",
    {
      core: ["current-state", "process"], root: ["foundation", "carry-over"],
      trend: ["outcome", "stability"], influence: ["external-condition", "resistance"],
      action: ["controllability", "turning-condition", "cost"],
    },
    ["foundation", "carry-over", "current-state", "process", "outcome", "stability", "external-condition", "resistance", "controllability", "turning-condition", "cost"],
    [
      { id: "root-core-trend", positionIds: ["root", "core", "trend"], responsibility: "检验根源如何经核心状态延伸为趋势" },
      { id: "influence-core-action", positionIds: ["influence", "core", "action"], responsibility: "检验环境影响如何进入核心并改变行动" },
      { id: "influence-action", positionIds: ["influence", "action"], responsibility: "确认行动受哪些外部条件约束" },
      { id: "action-trend", positionIds: ["action", "trend"], responsibility: "确认行动是否能修正当前趋势" },
    ],
    { foundation: ["root"], process: ["core", "action"], outcome: ["trend"], stability: ["trend"], resistance: ["core", "influence"], cost: ["action", "trend"], controllability: ["core", "action"], interCardConflict: ["core", "root", "trend", "influence", "action"] },
    [
      { id: "core", positionIds: ["core"], responsibility: "锁定核心状态" },
      { id: "root", positionIds: ["root"], responsibility: "解释核心的基础" },
      { id: "influence", positionIds: ["influence"], responsibility: "分离外部支持与限制" },
      { id: "action", positionIds: ["action"], responsibility: "提出能改变结构的行动条件" },
      { id: "trend", positionIds: ["trend"], responsibility: "综合前四项形成条件性趋势" },
    ],
  ),
  celtic: profile(
    "celtic",
    {
      present: ["current-state", "process"], challenge: ["resistance", "turning-condition"],
      above: ["conscious-direction", "controllability"], below: ["foundation", "hidden-driver"],
      past: ["carry-over", "foundation"], future: ["near-future", "process"],
      self: ["self-position", "controllability", "cost"], external: ["external-condition", "resistance"],
      hopes: ["expectation-bias", "turning-condition"], outcome: ["outcome", "stability"],
    },
    ["current-state", "process", "resistance", "turning-condition", "conscious-direction", "controllability", "foundation", "hidden-driver", "carry-over", "near-future", "self-position", "cost", "external-condition", "expectation-bias", "outcome", "stability"],
    [
      { id: "core", positionIds: ["challenge", "present"], responsibility: "识别核心状态与交叉张力" },
      { id: "foundation", positionIds: ["below", "past", "present"], responsibility: "解释深层基础与过去如何进入当前" },
      { id: "direction", positionIds: ["above", "future"], responsibility: "比较意识方向与近期发展" },
      { id: "self-environment", positionIds: ["self", "external"], responsibility: "区分可控位置与环境主导" },
      { id: "support-outcome", positionIds: ["present", "challenge", "above", "below", "past", "future", "self", "external", "hopes", "outcome"], responsibility: "以完整前九位置检验结果支持状态" },
    ],
    { foundation: ["below", "past"], process: ["present", "challenge", "future", "self"], outcome: ["outcome"], stability: ["future", "outcome"], resistance: ["challenge", "external"], cost: ["self", "outcome"], controllability: ["present", "above", "self", "external"], interCardConflict: ["present", "challenge", "above", "below", "past", "future", "self", "external", "hopes", "outcome"] },
    [
      { id: "core", positionIds: ["present", "challenge"], responsibility: "先判断核心与直接挑战" },
      { id: "foundation", positionIds: ["below"], responsibility: "说明深层基础" },
      { id: "past", positionIds: ["past"], responsibility: "说明仍在作用的过去" },
      { id: "conscious", positionIds: ["above"], responsibility: "说明意识方向" },
      { id: "future", positionIds: ["future"], responsibility: "说明近期变化" },
      { id: "self", positionIds: ["self"], responsibility: "判断自我位置与行动空间" },
      { id: "environment", positionIds: ["external"], responsibility: "判断环境支持与限制" },
      { id: "hopes", positionIds: ["hopes"], responsibility: "分离希望、担忧与判断偏差" },
      { id: "outcome", positionIds: ["outcome"], responsibility: "在前九位置支持状态下形成阶段结果" },
    ],
  ),
});

export function getSpreadReadingProfile(spreadId) {
  return SPREAD_READING_PROFILES[spreadId] || null;
}

export function validateSpreadReadingProfile(profileValue) {
  const errors = [];
  if (!profileValue || profileValue.schemaVersion !== "2.0.0") return ["SpreadReadingProfile must use schemaVersion 2.0.0."];
  if (!SPREAD_READING_PROFILES[profileValue.spreadId]) errors.push(`Unknown spreadId: ${profileValue.spreadId}.`);
  const forbiddenFields = new Set([
    "question", "questionId", "questionText", "categoryId", "domain", "intent", "questionType",
    "expectation", "expectationId", "criterionId", "timeframe", "comparison",
  ]);
  const inspectForbidden = (value, path = "$") => {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (forbiddenFields.has(key)) errors.push(`SpreadReadingProfile cannot contain ${path}.${key}.`);
      inspectForbidden(child, `${path}.${key}`);
    }
  };
  inspectForbidden(profileValue);
  const spreadDefinition = SPREADS.find((spread) => spread.id === profileValue.spreadId);
  const expectedPositions = spreadDefinition?.positions.map((position) => position.id) || [];
  const actualPositions = Object.keys(profileValue.positionResponsibilities || {});
  if (JSON.stringify(actualPositions) !== JSON.stringify(expectedPositions)) {
    errors.push(`${profileValue.spreadId} positionResponsibilities do not match the v2 spread order.`);
  }
  const dimensions = new Set(profileValue.answerDimensions || []);
  for (const [positionId, responsibilities] of Object.entries(profileValue.positionResponsibilities || {})) {
    for (const responsibility of responsibilities) {
      if (!dimensions.has(responsibility)) errors.push(`${positionId} references undeclared dimension ${responsibility}.`);
    }
  }
  const positionSet = new Set(expectedPositions);
  for (const [path, positionIds] of [
    ...(profileValue.relationLines || []).map((line) => [`relationLines.${line.id}`, line.positionIds]),
    ...Object.entries(profileValue.scoringGroups || {}).map(([key, ids]) => [`scoringGroups.${key}`, ids]),
    ...(profileValue.outputWorkflow || []).map((stage) => [`outputWorkflow.${stage.id}`, stage.positionIds]),
  ]) {
    for (const positionId of positionIds || []) if (!positionSet.has(positionId)) errors.push(`${path} references unknown position ${positionId}.`);
  }
  return errors;
}
