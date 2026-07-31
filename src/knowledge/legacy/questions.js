import { PHASE_3_QUESTION_DEFINITIONS } from "../questions/phase-3-questions.js";

const BASE_CATEGORIES = [
  {
    id: "love",
    name: "感情关系",
    icon: "♡",
    accent: "#d77f95",
    tagline: "看见连结、边界与彼此的真实需要",
    questions: [
      ["love-current", "这段关系当前最核心的能量是什么？", "关系现状"],
      ["love-future", "未来三个月，这段关系可能如何发展？", "近期趋势"],
      ["love-improve", "我可以怎样改善我们之间的关系？", "相处建议"],
      ["love-new", "新的缘分会以怎样的方式靠近我？", "新缘分"],
      ["love-truth", "这段关系里，我最需要看清什么？", "隐藏课题"],
      ["love-self", "在感情关系中，我现在最需要照顾自己的哪一部分？", "自我需求"],
      ["love-communication", "我们之间真正需要被说清楚的是什么？", "沟通重点"],
    ],
  },
  {
    id: "career",
    name: "事业学业",
    icon: "↗",
    accent: "#7fa9d8",
    tagline: "梳理方向、能力与下一阶段的行动",
    questions: [
      ["career-focus", "我当前最值得投入的事业方向是什么？", "方向选择"],
      ["career-block", "阻碍我进步的关键因素是什么？", "突破阻碍"],
      ["career-change", "现在适合转换工作或学习方向吗？", "转型时机"],
      ["career-growth", "未来三个月，我该如何提升竞争力？", "成长策略"],
      ["career-team", "我该如何改善与同事或伙伴的合作？", "协作关系"],
      ["career-balance", "我该如何平衡投入、压力与长期发展？", "节奏平衡"],
      ["career-opportunity", "近期最值得把握的事业或学习机会是什么？", "机会判断"],
    ],
  },
  {
    id: "wealth",
    name: "财运机会",
    icon: "◇",
    accent: "#d1aa62",
    tagline: "理解资源流动、机会质量与现实风险",
    questions: [
      ["wealth-state", "我目前的财务能量处于什么状态？", "资源现状"],
      ["wealth-opportunity", "近期值得关注的机会来自哪里？", "机会来源"],
      ["wealth-risk", "我在金钱决定上最需要防范什么？", "风险提醒"],
      ["wealth-growth", "怎样做更有利于建立长期稳定？", "长期规划"],
      ["wealth-project", "这个项目值得我继续投入吗？", "投入评估"],
      ["wealth-habit", "哪一种金钱习惯正在影响我的稳定感？", "金钱习惯"],
      ["wealth-resource", "我可以怎样更好地运用现有资源？", "资源配置"],
    ],
  },
  {
    id: "growth",
    name: "自我成长",
    icon: "✦",
    accent: "#a58ad4",
    tagline: "听见内在需要，识别正在发生的转变",
    questions: [
      ["growth-lesson", "我当前最重要的人生课题是什么？", "核心课题"],
      ["growth-release", "我需要放下哪一种旧有模式？", "释放模式"],
      ["growth-strength", "我尚未充分使用的力量是什么？", "内在资源"],
      ["growth-heal", "当下最需要被照顾和疗愈的部分是什么？", "自我照顾"],
      ["growth-next", "下一阶段，我会成长为什么样的人？", "阶段蜕变"],
      ["growth-boundary", "我需要为自己建立怎样的边界？", "个人边界"],
      ["growth-purpose", "什么事情能让我重新感到意义和动力？", "内在动力"],
    ],
  },
  {
    id: "decision",
    name: "选择决策",
    icon: "⚖",
    accent: "#79b5a5",
    tagline: "把选项、代价与内心价值放到同一张桌上",
    questions: [
      ["decision-see", "关于这个选择，我尚未看见什么？", "信息盲点"],
      ["decision-a", "如果继续当前方向，最可能的趋势是什么？", "当前路线"],
      ["decision-change", "如果选择改变，我需要准备什么？", "变化准备"],
      ["decision-value", "哪个决定更符合我长期的价值？", "价值校准"],
      ["decision-timing", "现在是行动、等待，还是调整的时机？", "时机判断"],
      ["decision-cost", "这个选择最需要我承担的代价是什么？", "代价评估"],
      ["decision-option", "还有哪一个替代方案值得我认真考虑？", "替代方案"],
    ],
  },
  {
    id: "daily",
    name: "今日指引",
    icon: "☾",
    accent: "#93a0cf",
    tagline: "用一组轻量提示为今天校准节奏",
    questions: [
      ["daily-energy", "今天的核心能量是什么？", "今日能量"],
      ["daily-focus", "今天最值得专注的事情是什么？", "今日重点"],
      ["daily-avoid", "今天需要留意或避免什么？", "注意事项"],
      ["daily-message", "此刻我的内在最想告诉我什么？", "内在讯息"],
      ["daily-action", "今天做哪一个小行动最有帮助？", "行动提示"],
      ["daily-relationship", "今天与他人相处时，我最需要保持什么态度？", "人际提醒"],
      ["daily-rest", "今天我该如何安排休息与恢复？", "身心节奏"],
    ],
  },
].map((category) => ({
  ...category,
  questions: category.questions.map(([id, text, label]) => ({ id, text, label })),
}));

const CATEGORY_DOMAIN = Object.freeze({
  love: "relationship",
  career: "career",
  wealth: "finance",
  growth: "growth",
  decision: "decision",
  daily: "daily",
});

export const CATEGORIES = Object.freeze(BASE_CATEGORIES.map((category) => Object.freeze({
  ...category,
  questions: Object.freeze([
    ...category.questions,
    ...PHASE_3_QUESTION_DEFINITIONS
      .filter((item) => item.categoryId === category.id && item.domain === CATEGORY_DOMAIN[category.id])
      .map((item) => Object.freeze({ id: item.id, text: item.text, label: item.label })),
  ]),
})));
