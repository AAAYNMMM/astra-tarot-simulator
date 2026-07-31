import { defineCardProfile, evidenceUnit, semanticUnit, symbolUnit } from "./define-card-profile.js";

const facets = {
  state: [
    semanticUnit("state.primary", "双方存在真实回应或建立回应的窗口。", ["connection","state"], ["state"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("state.secondary", "关系质量取决于交换是否平等和明确。", ["connection","state"], ["state"], ["waite-1910","project-modernization-policy"]),
  ],
  cause: [
    semanticUnit("cause.primary", "彼此价值、需要或情感出现可被共同承认的交集。", ["reciprocity","cause"], ["cause"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("cause.secondary", "一次坦诚回应降低了猜测和防御。", ["reciprocity","cause"], ["cause"], ["waite-1910","project-modernization-policy"]),
  ],
  motivation: [
    semanticUnit("motivation.primary", "希望被理解，也愿意看见对方的主体性。", ["communication","motivation"], ["motivation"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("motivation.secondary", "渴望通过关系确认自身价值，可能带来投射风险。", ["communication","motivation"], ["motivation"], ["waite-1910","project-modernization-policy"]),
  ],
  obstacle: [
    semanticUnit("obstacle.primary", "一方提供承诺，另一方只提供模糊希望。", ["balance","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("obstacle.secondary", "把强烈吸引误认为已经形成稳定契约。", ["balance","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
  ],
  opportunity: [
    semanticUnit("opportunity.primary", "建立清晰、对等且可以修订的合作或关系约定。", ["commitment","opportunity"], ["opportunity"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("opportunity.secondary", "通过一次具体回应恢复信任和交流。", ["commitment","opportunity"], ["opportunity"], ["waite-1910","project-modernization-policy"]),
  ],
  resource: [
    semanticUnit("resource.primary", "双方都有参与、回应或修复的意愿。", ["connection","resource"], ["resource"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("resource.secondary", "共同价值能够支持进一步协商。", ["connection","resource"], ["resource"], ["waite-1910","project-modernization-policy"]),
  ],
  relationship: [
    semanticUnit("relationship.primary", "核心是相互承认，而不是一方定义另一方。", ["reciprocity","relationship"], ["relationship"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("relationship.secondary", "亲密与合作都需要边界、反馈和持续同意。", ["reciprocity","relationship"], ["relationship"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("relationship.tertiary", "圣杯二在relationship职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["reciprocity","relationship"], ["relationship"], ["waite-1910","project-modernization-policy"]),
  ],
  action: [
    semanticUnit("action.primary", "直接确认双方期待、投入和不能接受的部分。", ["communication","action"], ["action"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("action.secondary", "用一个可观察的互惠行动替代含糊暗示。", ["communication","action"], ["action"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("action.tertiary", "圣杯二在action职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["communication","action"], ["action"], ["waite-1910","project-modernization-policy"]),
  ],
  boundary: [
    semanticUnit("boundary.primary", "吸引力不等于承诺，承诺也不能取消个人边界。", ["balance","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("boundary.secondary", "不得依据单张牌断言对方真实想法或忠诚事实。", ["balance","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
  ],
  trend: [
    semanticUnit("trend.primary", "持续互惠会让关系逐渐稳定并增加信任。", ["commitment","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("trend.secondary", "回应失衡若长期不谈，会从误会发展为怨怼。", ["commitment","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
  ],
  outcome: [
    semanticUnit("outcome.primary", "条件一致时可形成更明确的关系或合作。", ["connection","outcome"], ["outcome"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("outcome.secondary", "若双方期待不同，诚实协商可能带来重新定义或分开。", ["connection","outcome"], ["outcome"], ["waite-1910","project-modernization-policy"]),
  ],
  reflection: [
    semanticUnit("reflection.primary", "我是在回应真实的对方，还是回应自己的投射？", ["reciprocity","reflection"], ["reflection"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("reflection.secondary", "这段交换中，双方分别提供了什么并承担了什么？", ["reciprocity","reflection"], ["reflection"], ["waite-1910","project-modernization-policy"]),
  ],
};

export const CARD_PROFILE = defineCardProfile({
  schemaVersion: "1.0.0",
  id: "cups-two",
  name: "圣杯二",
  arcana: "minor",
  suit: "cups",
  rank: "two",
  identity: {"coreArchetype":"两个主体在平等回应中建立真实连结","essence":"互惠、承认、协商与关系契约","developmentalStage":"从个人情感进入可被双方共同承载的交换"},
  traditions: {
    uprightSummary: "圣杯二强调互相承认、情感交换和可协商的关系。它可以指亲密、合作或和解，但不自动等于永久承诺。",
    reversedSummary: "逆位圣杯二常表现为回应不对等、沟通错位、投射、失衡或关系契约需要重新谈判。",
    symbols: [
      symbolUnit("two-cups", "两只圣杯", "双方都需要提供和接收", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("exchange", "相对而立", "互相看见而非单向想象", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("caduceus", "赫尔墨斯杖", "交流、协商与调和", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("lion", "有翼狮首", "吸引力需要被成熟结构承载", ["rws-core"], ["smith-waite-imagery"]),
    ],
    cautions: [
      evidenceUnit("tradition-boundary", "RWS视觉符号只用于说明该传统，不得因切换牌面而改变核心算法牌义。", ["smith-waite-imagery","project-modernization-policy"]),
    ],
  },
  themes: ["connection","reciprocity","communication","balance","commitment"],
  dimensions: {"activation":1,"stability":1,"clarity":1,"agency":1,"openness":2,"reciprocity":3,"materiality":-1,"emotionality":3,"risk":0,"transition":1,"speed":0},
  facets,
  reversal: {"supportedModes":["blocked","deficient","distorted","released"],"defaultWeights":{"blocked":0.25,"deficient":0.25,"distorted":0.25,"released":0.25},"modeFacetRefs":{"blocked":["relationship.primary","action.primary"],"deficient":["resource.secondary","relationship.secondary"],"distorted":["motivation.secondary","obstacle.primary"],"released":["boundary.secondary","outcome.primary"]}},
  domains: {"relationship":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0.2,"materiality":0},"overrides":[]},"career":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.2,"emotionality":0,"materiality":0},"overrides":[]},"finance":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0.2},"overrides":[]},"growth":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0},"overrides":[]},"decision":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.2,"emotionality":0,"materiality":0},"overrides":[]},"daily":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0},"overrides":[]}},
  relations: {"supportsTags":["connection","reciprocity","communication"],"conflictsTags":["isolation","control"],"transformsTags":["cooperation","commitment"],"stageTags":["foundation"],"roleTags":["relationship","resource"]},
  language: {"keywordsUpright":["互惠","连结","协商","相互承认"],"keywordsReversed":["失衡","错位","投射","契约破裂"],"conciseUprightRefs":["state.primary","opportunity.primary"],"conciseReversedRefs":["obstacle.primary","boundary.primary"],"actionPhraseRefs":["action.primary","action.secondary"],"cautionPhraseRefs":["boundary.primary","obstacle.primary"]},
  boundaries: {
    forbiddenClaims: [evidenceUnit("forbid-certainty", "不得用圣杯二确定第三方感情、忠诚或未来承诺。", ["project-safety-policy"])],
    commonMisreadings: [evidenceUnit("common-misreading", "互惠需要可观察的双方行动，不能只凭愿望成立。", ["project-modernization-policy"])],
    ambiguityNotes: [evidenceUnit("ambiguity-condition", "关系建议必须保留同意、边界和退出空间。", ["project-modernization-policy"])],
  },
  provenance: {"tradition":"rws-core","sourceRefs":["waite-1910","smith-waite-imagery","project-modernization-policy"],"modernizedScope":["将传统含义改写为有限、可执行且不替代专业意见的现代语言。","区分跨牌组核心含义与RWS特有视觉符号。"]},
  metadata: {"version":"1.0.0","status":"CONTENT_REVIEWED","reviewedBy":["phase-1-development-gate"],"reviewDate":"2026-07-31","score":100},
});

export default CARD_PROFILE;
