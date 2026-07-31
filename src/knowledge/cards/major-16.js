import { defineCardProfile, evidenceUnit, semanticUnit, symbolUnit } from "./define-card-profile.js";

const facets = {
  state: [
    semanticUnit("state.primary", "旧结构正在快速失去可信度，事实比维持表面稳定更重要。", ["disruption","state"], ["state"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("state.secondary", "变化强度较高，优先任务是确认安全、损失和真实边界。", ["disruption","state"], ["state"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("state.tertiary", "高塔在state职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["disruption","state"], ["state"], ["waite-1910","project-modernization-policy"]),
  ],
  cause: [
    semanticUnit("cause.primary", "长期忽视的结构弱点被新的压力集中暴露。", ["truth","cause"], ["cause"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("cause.secondary", "建立在错误假设上的控制终于无法继续维持。", ["truth","cause"], ["cause"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("cause.tertiary", "高塔在cause职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["truth","cause"], ["cause"], ["waite-1910","project-modernization-policy"]),
  ],
  motivation: [
    semanticUnit("motivation.primary", "深层部分希望结束虚假稳定，恢复与事实一致。", ["collapse","motivation"], ["motivation"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("motivation.secondary", "对长期压抑和僵化的耐受已经接近极限。", ["collapse","motivation"], ["motivation"], ["waite-1910","project-modernization-policy"]),
  ],
  obstacle: [
    semanticUnit("obstacle.primary", "只想恢复原样，拒绝承认原结构本身已经失效。", ["release","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("obstacle.secondary", "在冲击中扩大灾难叙事，忽略仍然完好的资源。", ["release","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("obstacle.tertiary", "高塔在obstacle职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["release","obstacle"], ["obstacle"], ["waite-1910","project-modernization-policy"]),
  ],
  opportunity: [
    semanticUnit("opportunity.primary", "快速识别哪些部分必须结束，哪些核心仍可保留。", ["renewal","opportunity"], ["opportunity"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("opportunity.secondary", "借由暴露出的事实建立更简单、更诚实的基础。", ["renewal","opportunity"], ["opportunity"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("opportunity.tertiary", "高塔在opportunity职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["renewal","opportunity"], ["opportunity"], ["waite-1910","project-modernization-policy"]),
  ],
  resource: [
    semanticUnit("resource.primary", "真相已经变得可见，减少了继续自欺的空间。", ["disruption","resource"], ["resource"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("resource.secondary", "危机能暂时打破旧角色，为重新分工创造窗口。", ["disruption","resource"], ["resource"], ["waite-1910","project-modernization-policy"]),
  ],
  relationship: [
    semanticUnit("relationship.primary", "关系中的隐瞒、权力结构或脆弱约定需要被直接看见。", ["truth","relationship"], ["relationship"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("relationship.secondary", "冲突后先处理安全与事实，再讨论是否和如何重建。", ["truth","relationship"], ["relationship"], ["waite-1910","project-modernization-policy"]),
  ],
  action: [
    semanticUnit("action.primary", "先稳定现实风险，区分立即处理、暂停和以后重建的事项。", ["collapse","action"], ["action"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("action.secondary", "列出已经失效的假设，不用新的装饰掩盖同一裂缝。", ["collapse","action"], ["action"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("action.tertiary", "高塔在action职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["collapse","action"], ["action"], ["waite-1910","project-modernization-policy"]),
  ],
  boundary: [
    semanticUnit("boundary.primary", "不得把高塔解释为必然发生死亡、灾难或具体事故。", ["release","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("boundary.secondary", "重建不能以否认损失、跳过修复或继续同一欺骗为代价。", ["release","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("boundary.tertiary", "高塔在boundary职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["release","boundary"], ["boundary"], ["waite-1910","project-modernization-policy"]),
  ],
  trend: [
    semanticUnit("trend.primary", "未处理的结构问题会继续以更高成本暴露。", ["renewal","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("trend.secondary", "主动拆除失效部分可以把全面崩塌转成可管理重构。", ["renewal","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("trend.tertiary", "高塔在trend职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["renewal","trend"], ["trend"], ["waite-1910","project-modernization-policy"]),
  ],
  outcome: [
    semanticUnit("outcome.primary", "接受事实后可能形成更稳固但不同于原来的结构。", ["disruption","outcome"], ["outcome"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("outcome.secondary", "若只修补表面，短暂恢复后同一弱点会再次出现。", ["disruption","outcome"], ["outcome"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("outcome.tertiary", "高塔在outcome职责中要求把核心含义落实为可观察条件，并保留修正空间。", ["disruption","outcome"], ["outcome"], ["waite-1910","project-modernization-policy"]),
  ],
  reflection: [
    semanticUnit("reflection.primary", "我在保护真正重要的东西，还是只在保护旧形式？", ["truth","reflection"], ["reflection"], ["waite-1910","project-modernization-policy"]),
    semanticUnit("reflection.secondary", "这次冲击揭示了哪个早已存在却被忽略的事实？", ["truth","reflection"], ["reflection"], ["waite-1910","project-modernization-policy"]),
  ],
};

export const CARD_PROFILE = defineCardProfile({
  schemaVersion: "1.0.0",
  id: "major-16",
  name: "高塔",
  arcana: "major",
  number: 16,
  identity: {"coreArchetype":"让失效结构被现实击穿并迫使真相显露的突变","essence":"暴露、断裂、重构与不可继续维持的旧形式","developmentalStage":"从依赖脆弱结构进入承认事实并重建基础"},
  traditions: {
    uprightSummary: "高塔表示某个无法继续维持的结构被事实击穿。它不是无差别灾难预言，而是快速暴露、断裂和重建压力。",
    reversedSummary: "逆位高塔可能是延迟必要改变、把冲击内化、局部拆除，或刚刚避免更大崩塌但仍需修复基础。",
    symbols: [
      symbolUnit("lightning", "闪电", "无法由旧结构控制的事实冲击", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("falling-crown", "坠落王冠", "权威或自我叙事失效", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("flames", "火焰", "被压抑能量快速释放", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("falling-figures", "坠落人物", "失去原有位置与确定感", ["rws-core"], ["smith-waite-imagery"]),
      symbolUnit("rock", "岩石高塔", "看似坚固但基础和隔离方式存在问题", ["rws-core"], ["smith-waite-imagery"]),
    ],
    cautions: [
      evidenceUnit("tradition-boundary", "RWS视觉符号只用于说明该传统，不得因切换牌面而改变核心算法牌义。", ["smith-waite-imagery","project-modernization-policy"]),
    ],
  },
  themes: ["disruption","truth","collapse","release","renewal"],
  dimensions: {"activation":3,"stability":-3,"clarity":2,"agency":-1,"openness":1,"reciprocity":0,"materiality":0,"emotionality":2,"risk":3,"transition":3,"speed":3},
  facets,
  reversal: {"supportedModes":["blocked","delayed","internalized","released"],"defaultWeights":{"blocked":0.25,"delayed":0.25,"internalized":0.25,"released":0.25},"modeFacetRefs":{"blocked":["cause.primary","action.primary"],"delayed":["trend.secondary","boundary.primary"],"internalized":["state.secondary","reflection.primary"],"released":["opportunity.primary","outcome.primary"]}},
  domains: {"relationship":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0.2,"materiality":0},"overrides":[]},"career":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.2,"emotionality":0,"materiality":0},"overrides":[]},"finance":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0.2},"overrides":[]},"growth":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0},"overrides":[]},"decision":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.2,"emotionality":0,"materiality":0},"overrides":[]},"daily":{"facetRefs":["state.primary","obstacle.primary","action.primary"],"weightAdjustments":{"agency":0.1,"emotionality":0,"materiality":0},"overrides":[]}},
  relations: {"supportsTags":["truth","release","renewal"],"conflictsTags":["stability","control"],"transformsTags":["collapse","structure"],"stageTags":["ending","transition"],"roleTags":["obstacle","trend"]},
  language: {"keywordsUpright":["暴露","断裂","清理","重构"],"keywordsReversed":["延迟改变","局部拆除","内在冲击","避免更大崩塌"],"conciseUprightRefs":["state.primary","opportunity.primary"],"conciseReversedRefs":["obstacle.primary","boundary.primary"],"actionPhraseRefs":["action.primary","action.secondary"],"cautionPhraseRefs":["boundary.primary","obstacle.primary"]},
  boundaries: {
    forbiddenClaims: [evidenceUnit("forbid-certainty", "不得把高塔当作死亡、事故或灾难的确定预言。", ["project-safety-policy"])],
    commonMisreadings: [evidenceUnit("common-misreading", "不得把破坏本身浪漫化为成长，现实损失需要被承认。", ["project-modernization-policy"])],
    ambiguityNotes: [evidenceUnit("ambiguity-condition", "建议必须先处理安全和基础，再谈象征性重生。", ["project-modernization-policy"])],
  },
  provenance: {"tradition":"rws-core","sourceRefs":["waite-1910","smith-waite-imagery","project-modernization-policy"],"modernizedScope":["将传统含义改写为有限、可执行且不替代专业意见的现代语言。","区分跨牌组核心含义与RWS特有视觉符号。"]},
  metadata: {"version":"1.0.0","status":"CONTENT_REVIEWED","reviewedBy":["phase-1-development-gate"],"reviewDate":"2026-07-31","score":100},
});

export default CARD_PROFILE;
