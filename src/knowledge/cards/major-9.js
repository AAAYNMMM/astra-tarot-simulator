import { defineCardProfile, evidenceUnit, semanticUnit, symbolUnit } from "./define-card-profile.js";

const facets = {
  state: [
    semanticUnit("state.primary", "外部信息过多，主动减少刺激有助于恢复判断。", ["introspection","state"], ["state"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("state.secondary", "问题进入需要独立消化而非立即表态的阶段。", ["introspection","state"], ["state"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("state.tertiary", "隐者在state职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["introspection","state"], ["state"], ["waite-1910","project-modernization-policy"]),
  ],
  cause: [
    semanticUnit("cause.primary", "过去经验尚未被整理成可用结论。", ["clarity","cause"], ["cause"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("cause.secondary", "外界意见彼此冲突，迫使判断回到个人标准。", ["clarity","cause"], ["cause"], ["waite-1910","project-modernization-policy"]),
  ],
  motivation: [
    semanticUnit("motivation.primary", "希望找到不依赖掌声或压力的真实答案。", ["detachment","motivation"], ["motivation"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("motivation.secondary", "需要保护尚未成熟的理解，避免被过早定义。", ["detachment","motivation"], ["motivation"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("motivation.tertiary", "隐者在motivation职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["detachment","motivation"], ["motivation"], ["waite-1910","project-modernization-policy"]),
  ],
  obstacle: [
    semanticUnit("obstacle.primary", "独处变成封闭，缺少事实和他人反馈校正。", ["learning","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("obstacle.secondary", "思考反复循环，却没有期限、行动或新证据。", ["learning","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("obstacle.tertiary", "隐者在obstacle职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["learning","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
  ],
  opportunity: [
    semanticUnit("opportunity.primary", "通过有期限的退后，识别真正重要的变量。", ["boundary","opportunity"], ["opportunity"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("opportunity.secondary", "把经验整理成可传递原则，减少未来重复试错。", ["boundary","opportunity"], ["opportunity"], ["waite-1910","project-modernization-policy"]),
  ],
  resource: [
    semanticUnit("resource.primary", "耐心观察和独立判断是当前可靠资源。", ["introspection","resource"], ["resource"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("resource.secondary", "既有经验能够照亮下一小段路，而非整个未来。", ["introspection","resource"], ["resource"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("resource.tertiary", "隐者在resource职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["introspection","resource"], ["resource"], ["waite-1910","project-modernization-policy"]),
  ],
  relationship: [
    semanticUnit("relationship.primary", "需要尊重彼此空间，同时说明距离的目的和期限。", ["clarity","relationship"], ["relationship"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("relationship.secondary", "成熟的指引提供问题和经验，不替对方做决定。", ["clarity","relationship"], ["relationship"], ["waite-1910","project-modernization-policy"]),
  ],
  action: [
    semanticUnit("action.primary", "设定一段有截止时间的安静研究期，并记录结论。", ["detachment","action"], ["action"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("action.secondary", "结束独处后向可信对象或现实数据验证关键假设。", ["detachment","action"], ["action"], ["waite-1910","project-modernization-policy"]),
  ],
  boundary: [
    semanticUnit("boundary.primary", "退后不能成为逃避沟通、责任或现实检验的永久理由。", ["learning","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("boundary.secondary", "个人经验不能被包装成对所有人的唯一答案。", ["learning","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("boundary.tertiary", "隐者在boundary职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["learning","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
  ],
  trend: [
    semanticUnit("trend.primary", "有目的的独处会提高判断质量并减少外界噪声。", ["boundary","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("trend.secondary", "若持续封闭，清晰会逐渐变成偏见和孤立。", ["boundary","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("trend.tertiary", "隐者在trend职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["boundary","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
  ],
  outcome: [
    semanticUnit("outcome.primary", "形成更稳定的个人标准，并能谨慎地重新参与现实。", ["introspection","outcome"], ["outcome"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("outcome.secondary", "缺乏验证时可能得到自洽但不准确的结论。", ["introspection","outcome"], ["outcome"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("outcome.tertiary", "隐者在outcome职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["introspection","outcome"], ["outcome"], ["waite-1910","project-modernization-policy"]),
  ],
  reflection: [
    semanticUnit("reflection.primary", "我需要安静，是为了看清还是为了不被挑战？", ["clarity","reflection"], ["reflection"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("reflection.secondary", "哪项结论必须回到现实或关系中验证？", ["clarity","reflection"], ["reflection"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("reflection.tertiary", "隐者在reflection职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["clarity","reflection"], ["reflection"], ["waite-1910","project-modernization-policy"]),
  ],
};

export const CARD_PROFILE = defineCardProfile({
  schemaVersion: "1.0.0",
  id: "major-9",
  name: "隐者",
  arcana: "major",
  number: 9,
  identity: {"coreArchetype":"主动退后以寻找内在标准和可靠经验的独行求索者","essence":"独处、辨别、经验沉淀与有限指引","developmentalStage":"从外界答案转向形成自己的判断尺度"},
  traditions: {
    uprightSummary: "隐者表示有目的的退后、独立思考和经验沉淀。距离的价值在于看清，而不是永久隔绝。",
    reversedSummary: "逆位隐者可能是封闭、孤立、反刍或拒绝验证，也可能表示独处阶段已经结束，需要重新连接现实。",
    symbols: [
      symbolUnit("lantern", "提灯", "有限但可靠的当前认识", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("staff", "手杖", "经验提供的支撑", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("mountain", "山巅", "通过距离获得视野", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("cloak", "灰色斗篷", "减少外部刺激", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("star", "六芒星", "可传递但不能替代他人判断的智慧", ["rws-core"], ["smith-waite-imagery"]),
    ],
    cautions: [
      evidenceUnit("tradition-boundary", "RWS视觉符号只用于说明该传统，不得因切换牌面而改变核心算法牌义。", ["smith-waite-imagery","project-modernization-policy"]),
    ],
  },
  themes: ["introspection","clarity","detachment","learning","boundary"],
  dimensions: {"activation":-2,"stability":1,"clarity":2,"agency":1,"openness":0,"reciprocity":-2,"materiality":-1,"emotionality":0,"risk":-1,"transition":1,"speed":-3},
  facets,
  reversal: {"supportedModes":["blocked","internalized","excessive","avoided"],"defaultWeights":{"blocked":0.25,"internalized":0.25,"excessive":0.25,"avoided":0.25},"modeFacetRefs":{"blocked":["reflection.primary","resource.primary"],"internalized":["motivation.primary","state.primary"],"excessive":["obstacle.primary","boundary.primary"],"avoided":["relationship.secondary","action.secondary"]}},
  domains: {"relationship":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0.2,"materiality":0},"overrides":[]},"career":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.2,"emotionality":0,"materiality":0},"overrides":[]},"finance":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0.2},"overrides":[]},"growth":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0},"overrides":[]},"decision":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.2,"emotionality":0,"materiality":0},"overrides":[]},"daily":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0},"overrides":[]}},
  relations: {"supportsTags":["introspection","clarity","learning"],"conflictsTags":["speed","communication"],"transformsTags":["detachment","awareness"],"stageTags":["reflection"],"roleTags":["reflection","boundary"]},
  language: {"keywordsUpright":["独处","求索","辨别","经验"],"keywordsReversed":["孤立","反刍","拒绝验证","结束退隐"],"conciseUprightRefs":["state.primary","opportunity.primary"],"conciseReversedRefs":["obstacle.primary","boundary.primary"],"actionPhraseRefs":["action.primary","action.secondary"],"cautionPhraseRefs":["boundary.primary","obstacle.primary"]},
  boundaries: {
    forbiddenClaims: [evidenceUnit("forbid-certainty", "不得把隐者解释为永久断联或拒绝求助。", ["project-safety-policy"])],
    commonMisreadings: [evidenceUnit("common-misreading", "不得把个人直觉当作无需验证的外部事实。", ["project-modernization-policy"])],
    ambiguityNotes: [evidenceUnit("ambiguity-condition", "独处应有目的、期限和重新连接的路径。", ["project-modernization-policy"])],
  },
  provenance: {"tradition":"rws-core","sourceRefs":["waite-1910","smith-waite-imagery","project-modernization-policy"],"modernizedScope":["将传统含义改写为有限、可执行且不替代专业意见的现代语言。","区分跨牌组核心含义与RWS特有视觉符号。"]},
  metadata: {"version":"1.0.0","status":"CONTENT_REVIEWED","reviewedBy":["phase-1-development-gate"],"reviewDate":"2026-07-31","score":100},
});

export default CARD_PROFILE;
