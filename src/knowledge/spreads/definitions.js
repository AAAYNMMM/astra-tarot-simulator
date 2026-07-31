export const SPREADS = [
  {
    id: "single",
    name: "心语单张",
    short: "1 张",
    description: "快速捕捉问题的核心讯息",
    positions: [
      {
        id: "essence",
        name: "核心讯息",
        prompt: "这张牌浓缩了问题最需要被看见的能量。",
      },
    ],
  },
  {
    id: "timeline",
    name: "时间之流",
    short: "3 张",
    description: "从过去线索看向近期趋势",
    positions: [
      { id: "past", name: "过去", prompt: "塑造当下的背景与旧有模式。" },
      { id: "present", name: "当下", prompt: "此刻最活跃、最值得关注的能量。" },
      { id: "future", name: "未来", prompt: "沿着当前路径可能展开的近期趋势。" },
    ],
  },
  {
    id: "cross",
    name: "五牌十字",
    short: "5 张",
    description: "中心定题，四方梳理根源与走向",
    positions: [
      {
        id: "core",
        name: "核心现状",
        prompt: "位于十字中央，呈现问题此刻最需要被看清的核心。",
      },
      {
        id: "root",
        name: "过去根源",
        prompt: "位于左侧，指出仍在影响当下的经历、惯性或前因。",
      },
      {
        id: "trend",
        name: "发展趋势",
        prompt: "位于右侧，呈现沿当前路径继续前进时可能展开的方向。",
      },
      {
        id: "influence",
        name: "关键影响",
        prompt: "位于上方，揭示需要纳入判断的重要变量、资源或提醒。",
      },
      {
        id: "action",
        name: "行动建议",
        prompt: "位于下方，把整副牌的讯息落到此刻可采取的态度与行动。",
      },
    ],
  },
  {
    id: "celtic",
    name: "凯尔特十字",
    short: "10 张",
    description: "经典全景牌阵，梳理内外因素与结果",
    positions: [
      {
        id: "present",
        name: "当前态势",
        prompt: "位于十字中心，呈现问题当下的状态与提问者的感受。",
      },
      {
        id: "challenge",
        name: "交叉挑战",
        prompt: "横跨中心牌，指出最直接的阻碍、矛盾或需要解决的课题。",
      },
      {
        id: "past",
        name: "过去影响",
        prompt: "位于左侧，呈现导致当前局面的经历与仍在作用的前因。",
      },
      {
        id: "future",
        name: "近期发展",
        prompt: "位于右侧，呈现沿当前路径继续前进时即将出现的变化。",
      },
      {
        id: "above",
        name: "意识目标",
        prompt: "位于上方，反映主动追求的目标、理想或可达到的最好方向。",
      },
      {
        id: "below",
        name: "潜意识根基",
        prompt: "位于下方，揭示深层动机、情绪根源与尚未被充分看见的影响。",
      },
      {
        id: "advice",
        name: "行动建议",
        prompt: "权杖区最下方，给出面对当前挑战时更有帮助的态度与做法。",
      },
      {
        id: "external",
        name: "外界影响",
        prompt: "呈现他人、环境、资源与不完全由你掌控的外部变量。",
      },
      {
        id: "hopes",
        name: "希望与恐惧",
        prompt: "呈现期待与担忧交织之处，以及它们如何影响你的判断。",
      },
      {
        id: "outcome",
        name: "发展结果",
        prompt: "权杖区最上方，呈现保持当前路径时最可能抵达的阶段结果。",
      },
    ],
  },
];
