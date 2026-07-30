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

### 2.1 评分门槛

| 得分 | 判定 |
|---:|---|
| 9.0–10.0 | 可进入正式引擎 |
| 8.0–8.9 | 可用于内部测试，不得标记完成 |
| 7.0–7.9 | 结构存在明显缺口 |
| 6.0–6.9 | 仍接近普通牌义文案 |
| < 6.0 | 不可用于规则推理 |

整套要求：

- 平均分 ≥ 9.2。
- 最低分 ≥ 9.0。
- 任一必填维度不得为 0。
- 大阿卡纳、四个花色和宫廷牌分别通过组内审查。

## 3. 业务 ID 与语义引用

### 3.1 卡牌 ID

卡牌业务 ID 使用现有 `kebab-case`：

- `major-7`
- `wands-ace`
- `cups-two`
- `swords-queen`
- `pentacles-king`

不得使用 `major_07` 等另一套形式。

### 3.2 稳定语义单元

所有会被 Observation 或 Claim 引用的内容使用对象，不使用无 ID 的裸字符串：

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

## 4. 建议数据结构

字段名由 `TQ-001` 最终冻结，结构至少表达以下内容：

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

  language: {
    keywordsUpright: [],
    keywordsReversed: [],
    conciseUprightRefs: [],
    conciseReversedRefs: [],
    actionPhraseRefs: [],
    cautionPhraseRefs: [],
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

## 5. 内容要求

### 5.1 核心原型

每张牌必须有：

- 一句核心原型。
- 一句不超过两个概念层级的本质描述。
- 对应的发展过程或阶段。

不能把一张牌写成无所不包，也不能使用“无限可能”“宇宙能量”等不可计算万能词替代含义。

### 5.2 传统与象征

每张牌至少记录：

- 3 个核心象征，大阿卡纳建议 5 个以上。
- 象征与语义的对应关系。
- 哪些象征属于特定牌面传统。
- 项目现代化解释与传统来源的边界。

项目包含多套历史牌面。算法必须区分跨牌组稳定含义与 RWS 特有视觉符号，不因切换图片就改变核心算法牌义。

### 5.3 Facets

至少覆盖：

| Facet | 用途 |
|---|---|
| `state` | 当前状态 |
| `cause` | 形成原因 |
| `motivation` | 内在动机 |
| `obstacle` | 阻碍、过度或缺失 |
| `opportunity` | 可利用空间 |
| `resource` | 已有资源与能力 |
| `relationship` | 互动模式 |
| `action` | 可执行行动 |
| `boundary` | 需要保持的限制 |
| `trend` | 当前路径趋势 |
| `outcome` | 条件性结果 |
| `reflection` | 自我觉察问题 |

最低要求：

- 每类至少 2 条可用语义单元。
- 核心侧面至少 3 条。
- 大阿卡纳总语义单元不少于 32 条。
- 数字牌不少于 26 条。
- 宫廷牌不少于 30 条。

语义单元应短而明确，不把整篇文章塞进数组。

### 5.4 逆位机制

标准机制包括：

- `blocked`
- `delayed`
- `internalized`
- `excessive`
- `deficient`
- `misdirected`
- `distorted`
- `released`
- `avoided`
- `loss-of-control`

每张牌只声明真正适用的 3–6 种机制。每种机制必须包含：

- 具体表现。
- 可适用 Facet 或语义单元引用。
- 条件与边界。
- 与其他机制的区别。

### 5.5 可计算维度

统一范围建议为 `-3` 至 `3`：

- activation
- stability
- clarity
- agency
- openness
- reciprocity
- materiality
- emotionality
- risk
- transition
- speed

数值必须由语义解释支持，只用于关系和权重，不得直接相加生成吉凶分。

### 5.6 领域适配

六个领域：

- relationship
- career
- finance
- growth
- decision
- daily

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

每个领域至少能提供状态、风险和行动，但不要求复制 18 段轻微改写文案。只有确实无法由通用语义表达时才增加 override。

### 5.7 关系标签

关系标签必须来自统一词典，例如：

- movement / delay
- control / release
- reciprocity / isolation
- communication
- resource-growth / resource-loss
- ending / renewal
- clarity / illusion

禁止每张牌自由创建近义标签。

### 5.8 行动建议

建议必须包含现实动作、对象或边界，不提供医疗、法律、投资替代意见，也不把“顺其自然”“相信自己”作为无条件答案。

## 6. 来源与边界

每张牌记录：

- 主要传统体系。
- 参考资料 ID 和相关章节。
- 项目现代化解释范围。
- 审查状态和日期。
- 常见误读和禁止推断。

禁止直接把来源不明的网络牌义当正式资料。

## 7. 评分量表

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

### 7.1 单项否决

出现任一情况不得完成：

- 缺少必填 Facet。
- 语义单元没有稳定 ID。
- 证据引用无法解析。
- 正逆位只是简单否定。
- 与另一张牌大面积同义且无边界。
- 领域适配造成核心牌义漂移。
- 行动建议涉及高风险确定性指令。
- 使用未注册标签。
- 数值越界或定义不一致。
- 来源与常见传统明显冲突且无说明。
- 大段文案无法被算法使用。

## 8. 组内一致性

### 大阿卡纳

检查阶段、相邻转化、原型重叠和关键位置权重。不得统一作为“灵元素”进入四花色统计。

### 数字牌

检查同一数字跨花色的共同阶段，以及同一花色 Ace 至 Ten 的连续发展。元素和数字只能作为辅助。

### 宫廷牌

支持人物、行为方式、角色和阶段四种解释模式；避免性别刻板印象和强制人物指认。

## 9. 审查状态

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

## 10. 生产与评测顺序

正确顺序：

1. `TQ-001`：冻结 Schema 和 ID 规则。
2. `TQ-002`：冻结词典、来源与解释政策。
3. `EV-000A`：冻结评分量表、评审协议和开发集/盲测集边界。
4. `TQ-003`：制作 6 张黄金样本初稿，达到 Schema 完整和可审查状态。
5. `TQ-004`：建立审查工具，修订并冻结 6 张黄金样本，全部达到 9.0 以上。
6. 分批完成其余 72 张牌。
7. 整套交叉审查、场景测试和评分。
8. `EV-000B` 与 Phase 8 评测执行最终盲测。

不能先要求黄金样本达到 9.0，再在下一任务才发明评分工具。项目虽然是塔罗软件，也不采用倒序预言式验收。

### 黄金样本

- 愚者
- 战车
- 隐者
- 高塔
- 圣杯二
- 星币八

## 11. 批量任务粒度

大型资料任务是父任务，不能直接成为 `NEXT`。

推荐叶子任务粒度：

- 单次 4–6 张牌。
- 宫廷牌按一个阶级或一个花色拆分。
- 每批完成后立即进行 Schema、重复率、来源和相邻牌边界检查。
- 组级父任务只在全部叶子任务和交叉审查完成后标记完成。

## 12. 完成定义

单牌资料阶段完成需要：

- 78 张全部通过 Schema。
- 每张 ≥ 90，整套平均 ≥ 92。
- 所有语义单元 ID 与引用合法。
- 组内一致性通过。
- 场景测试通过率 ≥ 95%。
- 无高风险越权断言。
- 自动测试、独立人工审查和评测记录已保存。
- `PROGRESS.md` 已更新。