function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

const LEGACY_CELTIC_V1 = {
  id: "celtic",
  definitionVersion: "1.0.0",
  name: "凯尔特十字",
  short: "10 张",
  description: "经典全景牌阵，梳理内外因素与结果",
  positions: [
    { id: "present", name: "当前态势", prompt: "位于十字中心，呈现问题当下的状态与提问者的感受。" },
    { id: "challenge", name: "交叉挑战", prompt: "横跨中心牌，指出最直接的阻碍、矛盾或需要解决的课题。" },
    { id: "past", name: "过去影响", prompt: "位于左侧，呈现导致当前局面的经历与仍在作用的前因。" },
    { id: "future", name: "近期发展", prompt: "位于右侧，呈现沿当前路径继续前进时即将出现的变化。" },
    { id: "above", name: "意识目标", prompt: "位于上方，反映主动追求的目标、理想或可达到的最好方向。" },
    { id: "below", name: "潜意识根基", prompt: "位于下方，揭示深层动机、情绪根源与尚未被充分看见的影响。" },
    { id: "advice", name: "行动建议", prompt: "权杖区最下方，给出面对当前挑战时更有帮助的态度与做法。" },
    { id: "external", name: "外界影响", prompt: "呈现他人、环境、资源与不完全由你掌控的外部变量。" },
    { id: "hopes", name: "希望与恐惧", prompt: "呈现期待与担忧交织之处，以及它们如何影响你的判断。" },
    { id: "outcome", name: "发展结果", prompt: "权杖区最上方，呈现保持当前路径时最可能抵达的阶段结果。" },
  ],
};

export const SPREADS = deepFreeze([
  {
    id: "single",
    definitionVersion: "2.0.0",
    name: "单张牌",
    short: "1 张",
    description: "聚焦此刻最需要看见的核心讯息",
    positions: [
      { id: "essence", name: "核心讯息", prompt: "浓缩当前情境最需要被看见的状态、条件与行动线索。" },
    ],
  },
  {
    id: "timeline",
    definitionVersion: "2.0.0",
    name: "时间之流",
    short: "3 张",
    description: "从过去线索看向当下与近期趋势",
    positions: [
      { id: "past", name: "过去", prompt: "塑造当下的背景、前因与旧有模式。" },
      { id: "present", name: "当下", prompt: "此刻最活跃的状态、资源与阻碍。" },
      { id: "future", name: "未来", prompt: "沿当前路径可能展开的条件性趋势。" },
    ],
  },
  {
    id: "cross",
    definitionVersion: "2.0.0",
    name: "五牌十字",
    short: "5 张",
    description: "中心定题，沿根源、影响、行动与趋势综合判断",
    positions: [
      { id: "core", name: "核心现状", prompt: "呈现当前最需要被看清的核心状态。" },
      { id: "root", name: "过去根源", prompt: "指出仍在影响核心现状的过去前因与基础条件。" },
      { id: "trend", name: "发展趋势", prompt: "呈现维持当前结构时可能展开的方向。" },
      { id: "influence", name: "外部影响", prompt: "揭示环境、关系、资源或限制带来的外部变量。" },
      { id: "action", name: "内在立场与行动", prompt: "呈现内在态度、可控空间以及可检验的行动方向。" },
    ],
  },
  {
    id: "celtic",
    definitionVersion: "2.0.0",
    name: "凯尔特十字",
    short: "10 张",
    description: "从核心、根基、时序、内外位置与结果形成全景判断",
    positions: [
      { id: "present", name: "当前态势", prompt: "呈现当下的核心状态与主要机制。" },
      { id: "challenge", name: "交叉阻碍", prompt: "指出当前最直接的阻碍、张力或课题。" },
      { id: "above", name: "意识目标", prompt: "反映已经意识到的目标、判断与可达到方向。" },
      { id: "below", name: "深层基础", prompt: "揭示深层动机、情绪根基与隐性前提。" },
      { id: "past", name: "过去影响", prompt: "呈现形成当前局面的经历与仍在作用的前因。" },
      { id: "future", name: "近期发展", prompt: "呈现当前结构下一阶段的条件性变化。" },
      { id: "self", name: "自我位置", prompt: "呈现提问者在局面中的态度、能力、边界与行动空间。" },
      { id: "external", name: "外部环境", prompt: "呈现他人、环境、资源与不可完全掌控的外部变量。" },
      { id: "hopes", name: "希望与恐惧", prompt: "呈现希望与恐惧如何共同影响判断。" },
      { id: "outcome", name: "最终结果", prompt: "综合前九个位置，呈现保持当前结构时的阶段结果。" },
    ],
  },
]);

// Reading records written against v1 must keep their original `advice` semantics.
export const LEGACY_SPREADS_V1 = deepFreeze([
  {
    id: "single", definitionVersion: "1.0.0", name: "心语单张", short: "1 张",
    description: "快速捕捉问题的核心讯息",
    positions: [{ id: "essence", name: "核心讯息", prompt: "这张牌浓缩了问题最需要被看见的能量。" }],
  },
  {
    id: "timeline", definitionVersion: "1.0.0", name: "时间之流", short: "3 张",
    description: "从过去线索看向近期趋势",
    positions: [
      { id: "past", name: "过去", prompt: "塑造当下的背景与旧有模式。" },
      { id: "present", name: "当下", prompt: "此刻最活跃、最值得关注的能量。" },
      { id: "future", name: "未来", prompt: "沿着当前路径可能展开的近期趋势。" },
    ],
  },
  {
    id: "cross", definitionVersion: "1.0.0", name: "五牌十字", short: "5 张",
    description: "中心定题，四方梳理根源与走向",
    positions: [
      { id: "core", name: "核心现状", prompt: "位于十字中央，呈现问题此刻最需要被看清的核心。" },
      { id: "root", name: "过去根源", prompt: "位于左侧，指出仍在影响当下的经历、惯性或前因。" },
      { id: "trend", name: "发展趋势", prompt: "位于右侧，呈现沿当前路径继续前进时可能展开的方向。" },
      { id: "influence", name: "关键影响", prompt: "位于上方，揭示需要纳入判断的重要变量、资源或提醒。" },
      { id: "action", name: "行动建议", prompt: "位于下方，把整副牌的讯息落到此刻可采取的态度与行动。" },
    ],
  },
  LEGACY_CELTIC_V1,
]);

export function getSpreadDefinition(spreadId, definitionVersion = "2.0.0") {
  if (!["1.0.0", "2.0.0"].includes(definitionVersion)) return null;
  const source = definitionVersion === "1.0.0" ? LEGACY_SPREADS_V1 : SPREADS;
  return source.find((spread) => spread.id === spreadId) || null;
}

export function resolveStoredSpreadDefinition(record = {}) {
  const version = record.spreadDefinitionVersion || record.definitionVersion || record.versions?.spreadDefinition || "1.0.0";
  return getSpreadDefinition(record.spreadId, version);
}

export const SPREADS_V1 = LEGACY_SPREADS_V1;
export const resolveSpreadDefinition = getSpreadDefinition;
