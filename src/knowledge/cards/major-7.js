import { defineCardProfile, evidenceUnit, semanticUnit, symbolUnit } from "./define-card-profile.js";

const facets = {
  state: [
    semanticUnit("state.primary", "多个力量已被推到行动线上，但尚需同一方向约束。", ["direction","state"], ["state"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("state.secondary", "局面具有明显动能，控制质量比速度更关键。", ["direction","state"], ["state"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("state.tertiary", "战车在state职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["direction","state"], ["state"], ["waite-1910","project-modernization-policy"]),
  ],
  cause: [
    semanticUnit("cause.primary", "目标感增强，使分散资源开始汇聚。", ["agency","cause"], ["cause"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("cause.secondary", "外部竞争或时间压力迫使行动加速。", ["agency","cause"], ["cause"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("cause.tertiary", "战车在cause职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["agency","cause"], ["cause"], ["waite-1910","project-modernization-policy"]),
  ],
  motivation: [
    semanticUnit("motivation.primary", "希望证明自己能够掌握局面并抵达目标。", ["control","motivation"], ["motivation"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("motivation.secondary", "不愿继续被矛盾和犹豫牵制。", ["control","motivation"], ["motivation"], ["waite-1910","project-modernization-policy"]),
  ],
  obstacle: [
    semanticUnit("obstacle.primary", "目标之间互相拉扯，导致表面前进而实际偏航。", ["movement","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("obstacle.secondary", "把控制理解为压制，忽略系统内部的真实反馈。", ["movement","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("obstacle.tertiary", "战车在obstacle职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["movement","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
  ],
  opportunity: [
    semanticUnit("opportunity.primary", "通过明确单一阶段目标，迅速提高协同行动效率。", ["discipline","opportunity"], ["opportunity"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("opportunity.secondary", "将冲突力量分工而非互相消灭，可以形成更强推进力。", ["discipline","opportunity"], ["opportunity"], ["waite-1910","project-modernization-policy"]),
  ],
  resource: [
    semanticUnit("resource.primary", "纪律、执行力和承压能力是当前主要资源。", ["direction","resource"], ["resource"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("resource.secondary", "已经具备把复杂条件组织成行动计划的能力。", ["direction","resource"], ["resource"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("resource.tertiary", "战车在resource职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["direction","resource"], ["resource"], ["waite-1910","project-modernization-policy"]),
  ],
  relationship: [
    semanticUnit("relationship.primary", "关系中的双方需要共同方向，而不是一方拖着另一方前进。", ["agency","relationship"], ["relationship"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("relationship.secondary", "控制与自主的边界决定合作能否持续。", ["agency","relationship"], ["relationship"], ["waite-1910","project-modernization-policy"]),
  ],
  action: [
    semanticUnit("action.primary", "写下唯一阶段目标，并删除不服务于它的两项消耗。", ["control","action"], ["action"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("action.secondary", "建立定期校准点，速度偏离方向时立即减速。", ["control","action"], ["action"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("action.tertiary", "战车在action职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["control","action"], ["action"], ["waite-1910","project-modernization-policy"]),
  ],
  boundary: [
    semanticUnit("boundary.primary", "不得用结果压力合理化对他人或自身的过度控制。", ["movement","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("boundary.secondary", "没有清晰方向时继续加速只会放大偏差。", ["movement","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("boundary.tertiary", "战车在boundary职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["movement","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
  ],
  trend: [
    semanticUnit("trend.primary", "方向稳定时，阻力会被持续行动逐步突破。", ["discipline","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("trend.secondary", "若冲突未被整合，短期推进会转化为疲惫或失控。", ["discipline","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("trend.tertiary", "战车在trend职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["discipline","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
  ],
  outcome: [
    semanticUnit("outcome.primary", "条件协调后可抵达明确阶段成果，但需要持续修正。", ["direction","outcome"], ["outcome"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("outcome.secondary", "若只依赖意志压制矛盾，结果可能是速度快却到达错误位置。", ["direction","outcome"], ["outcome"], ["waite-1910","project-modernization-policy"]),
  ],
  reflection: [
    semanticUnit("reflection.primary", "我是在掌握方向，还是只是在维持高速？", ["agency","reflection"], ["reflection"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("reflection.secondary", "哪些相反需要可以被分工，而不是由一个压倒另一个？", ["agency","reflection"], ["reflection"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("reflection.tertiary", "战车在reflection职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["agency","reflection"], ["reflection"], ["waite-1910","project-modernization-policy"]),
  ],
};

export const CARD_PROFILE = defineCardProfile({
  schemaVersion: "1.0.0",
  id: "major-7",
  name: "战车",
  arcana: "major",
  number: 7,
  identity: {"coreArchetype":"驾驭相反力量并让行动服从明确方向的推进者","essence":"方向、意志、协调与受控推进","developmentalStage":"从拥有动力进入承担方向和控制责任"},
  traditions: {
    uprightSummary: "战车强调统一方向、调动相反力量和持续推进。它的成功来自控制与校准，不是单纯增加速度。",
    reversedSummary: "逆位战车表现为方向冲突、用力失衡、过度控制或失去控制。速度可能正在掩盖目标不清。",
    symbols: [
      symbolUnit("chariot", "战车", "行动平台与承担方向", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("sphinxes", "黑白斯芬克斯", "相反力量必须被协调", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("armor", "盔甲", "保护、纪律与情感克制", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("city", "身后城邦", "离开既有安全结构", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("stars", "星冠", "行动需要服从更高目标", ["rws-core"], ["smith-waite-imagery"]),
    ],
    cautions: [
      evidenceUnit("tradition-boundary", "RWS视觉符号只用于说明该传统，不得因切换牌面而改变核心算法牌义。", ["smith-waite-imagery","project-modernization-policy"]),
    ],
  },
  themes: ["direction","agency","control","movement","discipline"],
  dimensions: {"activation":3,"stability":1,"clarity":2,"agency":3,"openness":0,"reciprocity":0,"materiality":0,"emotionality":-1,"risk":1,"transition":2,"speed":3},
  facets,
  reversal: {"supportedModes":["blocked","excessive","misdirected","loss-of-control"],"defaultWeights":{"blocked":0.25,"excessive":0.25,"misdirected":0.25,"loss-of-control":0.25},"modeFacetRefs":{"blocked":["obstacle.primary","action.primary"],"excessive":["boundary.primary","trend.secondary"],"misdirected":["cause.secondary","action.secondary"],"loss-of-control":["state.secondary","obstacle.secondary"]}},
  domains: {"relationship":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0.2,"materiality":0},"overrides":[]},"career":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.2,"emotionality":0,"materiality":0},"overrides":[]},"finance":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0.2},"overrides":[]},"growth":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0},"overrides":[]},"decision":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.2,"emotionality":0,"materiality":0},"overrides":[]},"daily":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0},"overrides":[]}},
  relations: {"supportsTags":["direction","agency","discipline"],"conflictsTags":["ambiguity","delay"],"transformsTags":["control","movement"],"stageTags":["transition"],"roleTags":["action","trend"]},
  language: {"keywordsUpright":["方向","推进","自律","驾驭"],"keywordsReversed":["失控","方向冲突","过度用力","急进"],"conciseUprightRefs":["state.primary","opportunity.primary"],"conciseReversedRefs":["obstacle.primary","boundary.primary"],"actionPhraseRefs":["action.primary","action.secondary"],"cautionPhraseRefs":["boundary.primary","obstacle.primary"]},
  boundaries: {
    forbiddenClaims: [evidenceUnit("forbid-certainty", "不得把战车解释为只要意志够强就一定成功。", ["project-safety-policy"])],
    commonMisreadings: [evidenceUnit("common-misreading", "不得用推进目标正当化压制他人的自主。", ["project-modernization-policy"])],
    ambiguityNotes: [evidenceUnit("ambiguity-condition", "速度必须服从方向、反馈和现实承载能力。", ["project-modernization-policy"])],
  },
  provenance: {"tradition":"rws-core","sourceRefs":["waite-1910","smith-waite-imagery","project-modernization-policy"],"modernizedScope":["将传统含义改写为有限、可执行且不替代专业意见的现代语言。","区分跨牌组核心含义与RWS特有视觉符号。"]},
  metadata: {"version":"1.0.0","status":"CONTENT_REVIEWED","reviewedBy":["phase-1-development-gate"],"reviewDate":"2026-07-31","score":100},
});

export default CARD_PROFILE;
