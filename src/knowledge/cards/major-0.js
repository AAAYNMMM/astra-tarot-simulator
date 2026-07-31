import { defineCardProfile, evidenceUnit, semanticUnit, symbolUnit } from "./define-card-profile.js";

const facets = {
  state: [
    semanticUnit("state.primary", "局面处在尚未定型的开端，选择空间大于既有承诺。", ["openness","state"], ["state"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("state.secondary", "当前经验不足以提供完整地图，需要边走边校准。", ["openness","state"], ["state"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("state.tertiary", "愚者在state职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["openness","state"], ["state"], ["waite-1910","project-modernization-policy"]),
  ],
  cause: [
    semanticUnit("cause.primary", "旧结构已经松开，为新的尝试腾出了空间。", ["movement","cause"], ["cause"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("cause.secondary", "好奇心或对自由的需要推动了这次变化。", ["movement","cause"], ["cause"], ["waite-1910","project-modernization-policy"]),
  ],
  motivation: [
    semanticUnit("motivation.primary", "想亲自验证可能性，而不是继续接受他人的结论。", ["courage","motivation"], ["motivation"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("motivation.secondary", "渴望摆脱过度控制，恢复行动的轻盈感。", ["courage","motivation"], ["motivation"], ["waite-1910","project-modernization-policy"]),
  ],
  obstacle: [
    semanticUnit("obstacle.primary", "把未知误认为没有代价，导致准备和风险评估缺席。", ["risk","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("obstacle.secondary", "对失败的想象让人停在起点，用等待保护自我形象。", ["risk","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("obstacle.tertiary", "愚者在obstacle职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["risk","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
  ],
  opportunity: [
    semanticUnit("opportunity.primary", "允许小规模试验，以低成本获得真实反馈。", ["learning","opportunity"], ["opportunity"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("opportunity.secondary", "暂时放下旧身份，为新的能力和关系留下空间。", ["learning","opportunity"], ["opportunity"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("opportunity.tertiary", "愚者在opportunity职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["learning","opportunity"], ["opportunity"], ["waite-1910","project-modernization-policy"]),
  ],
  resource: [
    semanticUnit("resource.primary", "开放心态使新信息更容易进入判断。", ["openness","resource"], ["resource"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("resource.secondary", "轻装状态意味着仍可快速调整方向。", ["openness","resource"], ["resource"], ["waite-1910","project-modernization-policy"]),
  ],
  relationship: [
    semanticUnit("relationship.primary", "关系需要真实探索，而不是过早承诺一个尚未验证的未来。", ["movement","relationship"], ["relationship"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("relationship.secondary", "双方对自由和责任的理解需要先说清楚。", ["movement","relationship"], ["relationship"], ["waite-1910","project-modernization-policy"]),
  ],
  action: [
    semanticUnit("action.primary", "设计一个可撤回的第一步，并提前写下停止条件。", ["courage","action"], ["action"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("action.secondary", "在行动前确认最低准备、现实边界和可求助对象。", ["courage","action"], ["action"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("action.tertiary", "愚者在action职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["courage","action"], ["action"], ["waite-1910","project-modernization-policy"]),
  ],
  boundary: [
    semanticUnit("boundary.primary", "自由不能取消对后果、他人和基本安全的责任。", ["risk","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("boundary.secondary", "未经验证的乐观不能替代事实和风险检查。", ["risk","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("boundary.tertiary", "愚者在boundary职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["risk","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
  ],
  trend: [
    semanticUnit("trend.primary", "持续行动会快速积累经验，但方向仍可能多次调整。", ["learning","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("trend.secondary", "若忽略反馈，轻盈会逐渐变成失控和资源浪费。", ["learning","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("trend.tertiary", "愚者在trend职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["learning","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
  ],
  outcome: [
    semanticUnit("outcome.primary", "条件充分时会开启新的学习周期，而不是立即保证成功。", ["openness","outcome"], ["outcome"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("outcome.secondary", "准备不足时可能以一次可避免的碰撞换取边界认识。", ["openness","outcome"], ["outcome"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("outcome.tertiary", "愚者在outcome职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["openness","outcome"], ["outcome"], ["waite-1910","project-modernization-policy"]),
  ],
  reflection: [
    semanticUnit("reflection.primary", "我真正想探索的是什么，而不是只想逃离什么？", ["movement","reflection"], ["reflection"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("reflection.secondary", "哪一项最低准备能让我保持自由又不把代价推给未来？", ["movement","reflection"], ["reflection"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("reflection.tertiary", "愚者在reflection职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["movement","reflection"], ["reflection"], ["waite-1910","project-modernization-policy"]),
  ],
};

export const CARD_PROFILE = defineCardProfile({
  schemaVersion: "1.0.0",
  id: "major-0",
  name: "愚者",
  arcana: "major",
  number: 0,
  identity: {"coreArchetype":"在未知中带着信任迈出第一步的自由旅人","essence":"开放、启程、经验不足与真实可能并存","developmentalStage":"从尚未被旧经验固定的状态进入主动探索"},
  traditions: {
    uprightSummary: "愚者表示一个尚未被经验完全定义的新起点。它支持探索和试错，但不把无准备的冲动称为勇敢。",
    reversedSummary: "逆位愚者常表现为准备不足、逃避后果、因恐惧而不敢开始，或用所谓自由掩盖责任缺口。",
    symbols: [
      symbolUnit("cliff", "悬崖", "未知边界与行动后果", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("bundle", "行囊", "轻装与尚未展开的经验", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("dog", "白犬", "本能提醒与现实反馈", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("sun", "太阳", "开放意识与可见可能", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("white-rose", "白玫瑰", "动机纯粹但不等于判断成熟", ["rws-core"], ["smith-waite-imagery"]),
    ],
    cautions: [
      evidenceUnit("tradition-boundary", "RWS视觉符号只用于说明该传统，不得因切换牌面而改变核心算法牌义。", ["smith-waite-imagery","project-modernization-policy"]),
    ],
  },
  themes: ["openness","movement","courage","risk","learning"],
  dimensions: {"activation":2,"stability":-2,"clarity":0,"agency":2,"openness":3,"reciprocity":0,"materiality":-1,"emotionality":1,"risk":2,"transition":3,"speed":2},
  facets,
  reversal: {"supportedModes":["blocked","excessive","avoided","misdirected"],"defaultWeights":{"blocked":0.25,"excessive":0.25,"avoided":0.25,"misdirected":0.25},"modeFacetRefs":{"blocked":["opportunity.primary","action.primary"],"excessive":["obstacle.primary","boundary.primary"],"avoided":["motivation.primary","reflection.primary"],"misdirected":["action.secondary","trend.secondary"]}},
  domains: {"relationship":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0.2,"materiality":0},"overrides":[]},"career":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.2,"emotionality":0,"materiality":0},"overrides":[]},"finance":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0.2},"overrides":[]},"growth":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0},"overrides":[]},"decision":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.2,"emotionality":0,"materiality":0},"overrides":[]},"daily":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0},"overrides":[]}},
  relations: {"supportsTags":["openness","movement","learning"],"conflictsTags":["control","stability"],"transformsTags":["transition","courage"],"stageTags":["foundation"],"roleTags":["opportunity","action"]},
  language: {"keywordsUpright":["启程","开放","试探","自由"],"keywordsReversed":["鲁莽","逃避准备","停在门口","责任缺口"],"conciseUprightRefs":["state.primary","opportunity.primary"],"conciseReversedRefs":["obstacle.primary","boundary.primary"],"actionPhraseRefs":["action.primary","action.secondary"],"cautionPhraseRefs":["boundary.primary","obstacle.primary"]},
  boundaries: {
    forbiddenClaims: [evidenceUnit("forbid-certainty", "不得把愚者解释为无条件冒险许可。", ["project-safety-policy"])],
    commonMisreadings: [evidenceUnit("common-misreading", "不得保证新开始必然成功或完全没有代价。", ["project-modernization-policy"])],
    ambiguityNotes: [evidenceUnit("ambiguity-condition", "对未知的开放必须与可撤回步骤和现实安全并存。", ["project-modernization-policy"])],
  },
  provenance: {"tradition":"rws-core","sourceRefs":["waite-1910","smith-waite-imagery","project-modernization-policy"],"modernizedScope":["将传统含义改写为有限、可执行且不替代专业意见的现代语言。","区分跨牌组核心含义与RWS特有视觉符号。"]},
  metadata: {"version":"1.0.0","status":"CONTENT_REVIEWED","reviewedBy":["phase-1-development-gate"],"reviewDate":"2026-07-31","score":100},
});

export default CARD_PROFILE;
