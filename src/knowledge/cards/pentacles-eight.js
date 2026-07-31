import { defineCardProfile, evidenceUnit, semanticUnit, symbolUnit } from "./define-card-profile.js";

const facets = {
  state: [
    semanticUnit("state.primary", "工作处于需要重复练习和稳定标准的阶段。", ["craft","state"], ["state"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("state.secondary", "当前差距主要在熟练度与细节，而非完全缺少能力。", ["craft","state"], ["state"], ["waite-1910","project-modernization-policy"]),
  ],
  cause: [
    semanticUnit("cause.primary", "长期目标要求把零散经验转成可重复流程。", ["practice","cause"], ["cause"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("cause.secondary", "过去投入较分散，需要重新选择值得积累的技能。", ["practice","cause"], ["cause"], ["waite-1910","project-modernization-policy"]),
  ],
  motivation: [
    semanticUnit("motivation.primary", "希望凭可靠能力而不是运气获得认可。", ["discipline","motivation"], ["motivation"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("motivation.secondary", "对质量的重视推动持续修正，也可能滑向完美主义。", ["discipline","motivation"], ["motivation"], ["waite-1910","project-modernization-policy"]),
  ],
  obstacle: [
    semanticUnit("obstacle.primary", "重复动作没有反馈，努力没有转化为更好方法。", ["learning","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("obstacle.secondary", "只关注细节，忘记技能最终要服务的真实问题。", ["learning","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
  ],
  opportunity: [
    semanticUnit("opportunity.primary", "建立小周期练习、反馈和修正，可以稳定提升。", ["mastery","opportunity"], ["opportunity"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("opportunity.secondary", "把隐性经验写成清单或流程，形成可复用资产。", ["mastery","opportunity"], ["opportunity"], ["waite-1910","project-modernization-policy"]),
  ],
  resource: [
    semanticUnit("resource.primary", "耐心、专注和对细节的敏感已经存在。", ["craft","resource"], ["resource"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("resource.secondary", "已有基础足以进入更系统的训练。", ["craft","resource"], ["resource"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("resource.tertiary", "星币八在resource职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["craft","resource"], ["resource"], ["waite-1910","project-modernization-policy"]),
  ],
  relationship: [
    semanticUnit("relationship.primary", "合作中可靠交付和清楚标准比口头热情更重要。", ["practice","relationship"], ["relationship"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("relationship.secondary", "指导关系应包含示范、反馈和逐步放手。", ["practice","relationship"], ["relationship"], ["waite-1910","project-modernization-policy"]),
  ],
  action: [
    semanticUnit("action.primary", "选择一个核心技能，连续完成可衡量的练习周期。", ["discipline","action"], ["action"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("action.secondary", "每轮记录错误类型，并只改进一个最影响质量的环节。", ["discipline","action"], ["action"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("action.tertiary", "星币八在action职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["discipline","action"], ["action"], ["waite-1910","project-modernization-policy"]),
  ],
  boundary: [
    semanticUnit("boundary.primary", "投入时间不能替代方向检查和外部反馈。", ["learning","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("boundary.secondary", "质量标准应服务实际用途，不应成为拖延交付的借口。", ["learning","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
  ],
  trend: [
    semanticUnit("trend.primary", "持续高质量练习会形成稳定能力和更大自主性。", ["mastery","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("trend.secondary", "机械重复若不修正方法，会固化低效习惯。", ["mastery","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
  ],
  outcome: [
    semanticUnit("outcome.primary", "技能可能达到可被信任和重复交付的水平。", ["craft","outcome"], ["outcome"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("outcome.secondary", "若方向错配，投入会积累成不再需要的熟练度。", ["craft","outcome"], ["outcome"], ["waite-1910","project-modernization-policy"]),
  ],
  reflection: [
    semanticUnit("reflection.primary", "我是在练习最关键的能力，还是只在重复最熟悉的动作？", ["practice","reflection"], ["reflection"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("reflection.secondary", "什么反馈能证明本轮练习真的提高了质量？", ["practice","reflection"], ["reflection"], ["waite-1910","project-modernization-policy"]),
  ],
};

export const CARD_PROFILE = defineCardProfile({
  schemaVersion: "1.0.0",
  id: "pentacles-eight",
  name: "星币八",
  arcana: "minor",
  suit: "pentacles",
  rank: "eight",
  identity: {"coreArchetype":"通过重复练习、反馈和修正把能力变成可靠成果的工匠","essence":"技能、专注、质量控制与长期积累","developmentalStage":"从初步能力进入可重复、可检验的熟练阶段"},
  traditions: {
    uprightSummary: "星币八强调通过重复练习、反馈和质量标准积累可靠能力。成果来自过程，不来自一次灵感。",
    reversedSummary: "逆位星币八可能是机械重复、完美主义、缺少反馈、敷衍，或投入的技能与真实目标不匹配。",
    symbols: [
      symbolUnit("bench", "工作台", "稳定练习环境", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("repeated-coins", "连续完成的星币", "技能通过重复变得可靠", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("tools", "工具", "方法与技术细节", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("distant-city", "远处城镇", "当前专注可能暂时减少外部参与", ["rws-core"], ["smith-waite-imagery"]),
    ],
    cautions: [
      evidenceUnit("tradition-boundary", "RWS视觉符号只用于说明该传统，不得因切换牌面而改变核心算法牌义。", ["smith-waite-imagery","project-modernization-policy"]),
    ],
  },
  themes: ["craft","practice","discipline","learning","mastery"],
  dimensions: {"activation":2,"stability":2,"clarity":2,"agency":2,"openness":1,"reciprocity":0,"materiality":3,"emotionality":-1,"risk":-1,"transition":1,"speed":-1},
  facets,
  reversal: {"supportedModes":["blocked","excessive","deficient","misdirected"],"defaultWeights":{"blocked":0.25,"excessive":0.25,"deficient":0.25,"misdirected":0.25},"modeFacetRefs":{"blocked":["resource.primary","action.primary"],"excessive":["obstacle.primary","boundary.primary"],"deficient":["state.secondary","resource.secondary"],"misdirected":["cause.secondary","trend.secondary"]}},
  domains: {"relationship":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0.2,"materiality":0},"overrides":[]},"career":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.2,"emotionality":0,"materiality":0},"overrides":[]},"finance":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0.2},"overrides":[]},"growth":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0},"overrides":[]},"decision":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.2,"emotionality":0,"materiality":0},"overrides":[]},"daily":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0},"overrides":[]}},
  relations: {"supportsTags":["practice","discipline","mastery"],"conflictsTags":["speed","ambiguity"],"transformsTags":["learning","work"],"stageTags":["growth"],"roleTags":["resource","action"]},
  language: {"keywordsUpright":["练习","专注","工艺","积累"],"keywordsReversed":["机械重复","完美主义","敷衍","方向错配"],"conciseUprightRefs":["state.primary","opportunity.primary"],"conciseReversedRefs":["obstacle.primary","boundary.primary"],"actionPhraseRefs":["action.primary","action.secondary"],"cautionPhraseRefs":["boundary.primary","obstacle.primary"]},
  boundaries: {
    forbiddenClaims: [evidenceUnit("forbid-certainty", "不得把努力时长直接等同于必然成功。", ["project-safety-policy"])],
    commonMisreadings: [evidenceUnit("common-misreading", "不得鼓励以过劳或完美主义换取技能成长。", ["project-modernization-policy"])],
    ambiguityNotes: [evidenceUnit("ambiguity-condition", "训练计划必须包含反馈、方向检查和休息边界。", ["project-modernization-policy"])],
  },
  provenance: {"tradition":"rws-core","sourceRefs":["waite-1910","smith-waite-imagery","project-modernization-policy"],"modernizedScope":["将传统含义改写为有限、可执行且不替代专业意见的现代语言。","区分跨牌组核心含义与RWS特有视觉符号。"]},
  metadata: {"version":"1.0.0","status":"CONTENT_REVIEWED","reviewedBy":["phase-1-development-gate"],"reviewDate":"2026-07-31","score":100},
});

export default CARD_PROFILE;
