# 单牌资料质量标准

## 1. 目的

本文件定义 78 张牌资料达到 **9.0 / 10 以上**所需的数据结构、内容深度、评分方法、审查流程和验收门槛。

单牌资料是规则引擎的知识基础，不是供界面展示的一段普通介绍。

## 2. 质量目标

每张牌必须同时满足：

- 传统含义基本可靠。
- 正逆位机制清楚且不是机械否定。
- 能在不同牌位中选择不同语义侧面。
- 能适配六个问题领域而不偏离核心牌义。
- 能与其他牌进行结构化关系计算。
- 能产生现实可执行、有限制的建议。
- 不依赖万能句、神秘化断言或关键词拼接。
- 所有可进入推理的语义单元具有稳定 ID 和来源。

评分门槛：

| 得分 | 判定 |
|---:|---|
| 9.0–10.0 | 可进入正式引擎 |
| 8.0–8.9 | 可用于内部测试，不得标记完成 |
| 7.0–7.9 | 结构存在明显缺口 |
| 6.0–6.9 | 仍接近普通牌义文案 |
| < 6.0 | 不可用于规则推理 |

整套要求：平均分 ≥ 9.2，最低分 ≥ 9.0，任一必填维度不得为 0，大阿卡纳、四个花色和宫廷牌分别通过组内审查。

## 3. ID 与稳定语义引用

卡牌业务 ID 使用现有 `kebab-case`，例如：`major-7`、`wands-ace`、`cups-two`、`swords-queen`、`pentacles-king`。

所有会被 Observation 或 Claim 引用的内容使用带 ID 的对象：

```js
{
  id: "action.align-direction",
  text: "先统一方向，再增加推进力度",
  tags: ["direction", "agency"],
  allowedRoles: ["action", "boundary"],
  sourceRefs: ["waite-chariot"],
}
```

规则：

- ID 在单张牌内唯一。
- 完整证据引用为 `cardId#semanticUnitId`。
- 文案润色不得随意更改 ID。
- 删除或替换已发布 ID 必须记录迁移映射。
- `tags`、`allowedRoles` 和 `sourceRefs` 必须通过词典和引用检查。

## 4. Schema 与词典职责

### TQ-001：结构 Schema

负责：

- 对象结构和必填字段。
- 业务 ID、语义单元 ID 和引用格式。
- 数值类型和范围。
- 基础枚举。
- 结构级引用格式与重复 ID 检查。

`TQ-001` 不得在词典尚未冻结时声称能够判断所有主题或关系标签是否合法。

### TQ-002：统一词典

负责：

- 主题、关系、逆位、维度、结论和禁止断言词典。
- 标签成员资格。
- 同义词合并。
- 跨词典引用和来源政策。

### TQ-004：完整质量门禁

统一运行 Schema、词典、来源、重复率、反例和人工评分检查。

## 5. 建议数据结构

字段名由 `TQ-001` 最终冻结，结构至少表达：

```js
{
  id: "major-7",
  name: "战车",
  arcana: "major",
  number: 7,
  identity: {
    coreArchetype: "驾驭相反力量并朝目标推进",
    essence: "方向、意志、控制与推进",
    developmentalStage: "主动确立方向并承担控制责任",
  },
  traditions: {
    uprightSummary: "...",
    reversedSummary: "...",
    symbols: [],
    cautions: [],
  },
  themes: ["direction", "agency", "control", "movement"],
  dimensions: {
    activation: 3,
    stability: 1,
    clarity: 2,
    agency: 3,
    openness: 0,
    reciprocity: 0,
    materiality: 0,
    emotionality: -1,
    risk: 1,
    transition: 2,
    speed: 3,
  },
  facets: {
    state: [],
    cause: [],
    motivation: [],
    obstacle: [],
    opportunity: [],
    resource: [],
    relationship: [],
    action: [],
    boundary: [],
    trend: [],
    outcome: [],
    reflection: [],
  },
  reversal: {
    supportedModes: ["blocked", "excessive", "misdirected", "loss-of-control"],
    defaultWeights: {},
    modeFacetRefs: {},
  },
  domains: {
    relationship: {},
    career: {},
    finance: {},
    growth: {},
    decision: {},
    daily: {},
  },
  relations: {
    supportsTags: [],
    conflictsTags: [],
    transformsTags: [],
    stageTags: [],
    roleTags: [],
  },
  boundaries: {
    forbiddenClaims: [],
    commonMisreadings: [],
    ambiguityNotes: [],
  },
  provenance: {
    tradition: "rws-core",
    sourceRefs: [],
    modernizedScope: [],
  },
  metadata: {
    version: "1.0.0",
    status: "draft",
    reviewedBy: [],
    reviewDate: null,
    score: null,
  },
}
```

## 6. 内容要求

### 核心原型

每张牌必须有一句核心原型、一句不超过两个概念层级的本质描述和对应发展过程。不能使用“无限可能”“宇宙能量”等不可计算万能词替代含义。

### 传统与象征

每张牌至少记录 3 个核心象征，大阿卡纳建议 5 个以上，并区分跨牌组稳定含义、特定传统视觉符号和项目现代化解释。

### Facets

至少覆盖：`state`、`cause`、`motivation`、`obstacle`、`opportunity`、`resource`、`relationship`、`action`、`boundary`、`trend`、`outcome`、`reflection`。

最低要求：

- 每类至少 2 条可用语义单元。
- 核心侧面至少 3 条。
- 大阿卡纳总语义单元不少于 32 条。
- 数字牌不少于 26 条。
- 宫廷牌不少于 30 条。

### 逆位机制

标准机制包括：`blocked`、`delayed`、`internalized`、`excessive`、`deficient`、`misdirected`、`distorted`、`released`、`avoided`、`loss-of-control`。

每张牌只声明真正适用的 3–6 种机制，每种机制必须包含具体表现、可适用 Facet 或语义引用、条件与边界以及与其他机制的区别。

### 可计算维度

统一范围建议为 `-3` 至 `3`：activation、stability、clarity、agency、openness、reciprocity、materiality、emotionality、risk、transition、speed。

数值只用于关系和权重，不得直接相加生成吉凶分。

### 领域适配

六个领域：relationship、career、finance、growth、decision、daily。

领域配置优先引用已有语义单元：

```js
domains: {
  career: {
    facetRefs: [
      "state.controlled-progress",
      "risk.direction-conflict",
      "action.align-direction",
    ],
    weightAdjustments: {
      agency: 0.2,
      materiality: 0.1,
    },
    overrides: [],
  },
}
```

每个领域至少能提供状态、风险和行动，但不要求复制 18 段换皮文案。只有确实无法由通用语义表达时才增加带稳定 ID 的 override。

### 关系标签与行动建议

关系标签必须来自统一词典。行动建议必须包含现实动作、对象或边界，不提供医疗、法律、投资替代意见，也不把“顺其自然”“相信自己”作为无条件答案。

## 7. 来源与边界

每张牌记录主要传统体系、参考资料 ID 和相关章节、项目现代化解释范围、审查状态和日期、常见误读和禁止推断。禁止直接把来源不明的网络牌义当正式资料。

## 8. 评分量表

| 维度 | 分值 |
|---|---:|
| 传统与原型准确性 | 16 |
| 语义侧面完整度 | 18 |
| 正逆位机制质量 | 14 |
| 牌位适配能力 | 10 |
| 问题领域适配 | 10 |
| 多牌关系可计算性 | 10 |
| 可计算维度一致性 | 6 |
| 行动性与现实价值 | 6 |
| 语言清晰度与差异化 | 5 |
| 数据完整性与可验证性 | 5 |
| **总分** | **100** |

正式准入 ≥ 90。

单项否决包括：缺少必填 Facet、语义单元无稳定 ID、证据引用无法解析、正逆位只是简单否定、近义牌无边界、领域适配漂移、高风险确定性指令、未注册标签、数值越界、来源冲突无说明或大段文案无法被算法使用。

## 9. 组内一致性

- 大阿卡纳：检查阶段、相邻转化、原型重叠和关键位置权重。
- 数字牌：检查同一数字跨花色阶段和同一花色 Ace 至 Ten 的连续发展。
- 宫廷牌：支持人物、行为方式、角色和阶段四种解释模式，避免性别刻板印象和强制人物指认。

## 10. 审查状态

```text
DRAFT
  ↓
SCHEMA_VALID
  ↓
CONTENT_REVIEWED
  ↓
CROSS_CARD_REVIEWED
  ↓
SCENARIO_TESTED
  ↓
APPROVED
```

自动检查：Schema、字段、数量、ID、引用、标签、数值、重复文本、空泛词和禁止词。

人工检查：传统含义、正逆位、相似牌边界、六领域、行动价值和来源。

场景测试至少覆盖六领域、五种典型牌位、正位和多种逆位机制。

## 11. 生产与评测顺序

1. `TQ-001`：冻结结构 Schema 和 ID/引用规则。
2. `TQ-002`：冻结词典、来源与解释政策。
3. `EV-000A`：冻结评分量表、评审协议和开发集/盲测集边界。
4. `TQ-003`：制作 6 张黄金样本初稿，达到 Schema 完整和可审查状态。
5. `TQ-004`：建立审查工具，修订并冻结 6 张黄金样本，全部达到 9.0 以上。
6. `TQ-005`：验证黄金样本能被最小 QuestionProfile、Position Operator 和 Observation 路径真实消费。
7. 分批完成其余 72 张牌。
8. 整套交叉审查、场景测试和评分。
9. 建立 EV-001 至 EV-004 评测资产与门禁。
10. `EV-000B` 执行最终盲测。

### TQ-005 验收

只使用 6 张黄金样本和最小试验配置，必须证明：

- 所有稳定语义引用可加载。
- 领域 `facetRefs` 可解析。
- 逆位机制能选到合法语义。
- 同一牌在不同牌位产生不同 Observation。
- 资料加载不会影响抽牌、正逆位或随机流。

`TQ-005` 不实现完整 Relation、Claim、模板或 UI。

## 12. 批量任务粒度

大型资料任务是父任务，不能直接成为 `NEXT`。单次推荐 4–6 张牌；宫廷牌按一个阶级或一个花色拆分；每批立即运行 Schema、重复率、来源和相邻牌边界检查。

父任务只有在全部必需叶子任务完成和组级验收通过后，才派生为 `PARENT-DONE`。

## 13. 完成定义

单牌资料阶段完成需要：

- 78 张全部通过 Schema。
- 每张 ≥ 90，整套平均 ≥ 92。
- 所有语义单元 ID 与引用合法。
- 组内一致性通过。
- 场景测试通过率 ≥ 95%。
- 无高风险越权断言。
- 自动测试、独立人工审查和评测记录已保存。
- `PROGRESS.md` 已更新。