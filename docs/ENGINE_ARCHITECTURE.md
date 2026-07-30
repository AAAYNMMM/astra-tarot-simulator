# 纯规则塔罗解牌引擎目标架构

## 1. 目标

在不使用 AI 大模型、不改变四种固定牌阵、只允许预设问题的前提下，建立一套可复现、可审计、可测试、可解释并能进行多牌综合的确定性解牌引擎。

| 能力 | 目标 |
|---|---:|
| 单牌资料质量 | ≥ 9.0 / 10 |
| 多牌综合能力 | ≥ 9.0 / 10 |
| 预设问题贴合度 | ≥ 9.0 / 10 |
| 核心结论可追溯率 | 100% |
| 同输入复现率 | 100% |

## 2. 总体流水线

```text
固定问题选择
    ↓
QuestionProfile 加载
    ↓
固定牌阵定义、关系图和问题适配加载
    ↓
高质量根种子 → 独立 draw / orientation / rendering 随机流
    ↓
确定性洗牌、抽牌、正逆位
    ↓
按抽牌结果加载 CardSemanticProfile
    ↓
卡牌语义 + 逆位机制 + QuestionProfile + Position Operator
    ↓
Observation 生成
    ↓
固定牌阵结构边
    ↓
语义关系候选与 Relation Graph
    ↓
ClaimCandidate 生成
    ↓
证据评分、反证和冲突消解
    ↓
有限结论分类
    ↓
一致性与安全校验
    ↓
确定性模板渲染
    ↓
历史和审计数据保存
```

抽牌阶段和解释阶段严格分离。问题、牌义加载或期望结果不得影响抽牌。

Position Operator 是 Observation 的输入，不是 Observation 生成后的装饰步骤。

## 3. 确定性契约

### 3.1 随机流

根种子通过版本化派生算法生成：

```text
rootSeed
├── drawSeed
├── orientationSeed
└── renderingSeed
```

规则：

- `drawSeed` 只用于牌序。
- `orientationSeed` 只用于正逆位。
- `renderingSeed` 只用于模板和同义句选择。
- 模板增加或删除一次随机选择不得改变牌序和正逆位。
- 引擎不得直接调用散落的 `Math.random()`。
- ReadingRecord 保存根种子、派生算法版本、随机算法版本和实际抽牌。

### 3.2 稳定排序

- 所有评分排序使用稳定业务 ID 作为明确次级键。
- 不依赖对象属性遍历顺序。
- 不使用本地化字符串排序决定推理结果。
- 分数必须是有限值；`NaN` 和 `Infinity` 立即失败。
- 权重、阈值、平局规则和排序规则全部版本化。
- 相同输入、版本和根种子必须生成相同结构化结果与模板选择。

## 4. 核心对象

### 4.1 QuestionProfile

```js
{
  id: "career-change",
  text: "现在适合转换工作或学习方向吗？",
  domain: "career",
  intent: "change-decision",
  timeframe: "near-term",
  answerDimensions: [
    "change-motivation",
    "current-readiness",
    "main-obstacle",
    "external-condition",
    "development-trend",
    "recommended-action",
  ],
  allowedConclusionTypes: [
    "act-now",
    "act-with-conditions",
    "wait-and-prepare",
    "adjust-current-path",
    "currently-unfavorable",
    "indeterminate",
  ],
  forbiddenClaims: [
    "guaranteed-success",
    "exact-date",
    "certain-external-fact",
  ],
  spreadProfiles: {
    single: {},
    timeline: {},
    cross: {},
    celtic: {},
  },
}
```

`spreadProfiles` 不改变牌阵或牌位，只定义同一固定牌位在该问题中的回答职责。

### 4.2 CardSemanticProfile

每张牌的结构化知识。业务 ID 使用现有 `kebab-case`，例如 `major-7`、`cups-two`。每条可引用语义单元拥有稳定 ID。完整要求见 `CARD_DATA_STANDARD.md`。

### 4.3 Observation

```js
{
  id: "obs-2",
  cardId: "major-7",
  orientation: "reversed",
  positionId: "advice",
  questionId: "career-change",
  semanticUnitRef: "major-7#action.align-direction",
  selectedFacet: "action",
  selectedReversalMode: "misdirected",
  semanticTags: ["direction-conflict", "preparation-gap"],
  dimensions: {
    activation: -1,
    stability: -1,
    clarity: -2,
  },
  localScore: 1.42,
  evidenceType: "primary",
}
```

每个 Observation 必须保留来源引用，不能只保存渲染后的句子。

### 4.4 Relation

```js
{
  id: "rel-3",
  sourceObservationId: "obs-2",
  targetObservationId: "obs-5",
  type: "conditional-tension",
  strength: 0.78,
  tags: ["desire-vs-readiness"],
  explanationKey: "internal-drive-external-delay",
  origin: "spread-structure",
}
```

关系类型至少包括：`supports`、`reinforces`、`weakens`、`contradicts`、`causes`、`continues`、`transforms`、`conditions`、`repairs`、`repeats-theme`、`stage-progression`。

### 4.5 ClaimCandidate

```js
{
  id: "claim-1",
  dimension: "recommended-action",
  conclusionType: "act-with-conditions",
  statementKey: "change-possible-after-preparation",
  evidence: ["obs-2", "obs-5"],
  counterEvidence: ["obs-1"],
  relations: ["rel-3"],
  conditions: ["verify-opportunity", "preserve-security"],
  supportScore: 4.6,
  conflictPenalty: 1.1,
  finalScore: 3.5,
  confidenceBand: "medium-high",
}
```

### 4.6 ReadingResult

```js
{
  readingId: "reading-...",
  versions: {},
  random: {
    rootSeed: "...",
    derivationVersion: "1.0.0",
    algorithmVersion: "1.0.0",
  },
  questionId: "career-change",
  spreadId: "cross",
  draw: [],
  observations: [],
  relations: [],
  selectedClaims: [],
  rejectedClaims: [],
  validation: {},
  renderedText: {},
}
```

最终结果同时保存结构化证据与显示文本。

## 5. 固定牌阵职责

### 心语单张

只输出一条核心观察、一条与问题相关的解释、一条行动建议和一条边界或条件。不得伪装成完整因果报告。

### 时间之流

固定结构：过去 → 当下 → 未来。检查延续、强化、缓解、逆转、循环和转折。

### 五牌十字

主要结构边：根源 → 核心、关键影响 → 核心、核心 → 趋势、建议 → 趋势、建议 ↔ 关键影响。

### 凯尔特十字

固定十个牌位保持不变。必须先提炼 2–4 条主线，再展开证据，不得按十张牌依次复述。

## 6. Position Operator

牌位运算符决定可选语义侧面、时态、主体范围、权重、条件性、是否转化为行动、是否可作为核心结论证据。

```js
const POSITION_OPERATORS = {
  challenge: {
    allowedFacets: ["obstacle", "excess", "deficiency", "distortion"],
    weight: 1.3,
    evidencePriority: "primary",
  },
  advice: {
    allowedFacets: ["action", "adjustment", "boundary", "preparation"],
    weight: 1.5,
    convertToAction: true,
    evidencePriority: "primary",
  },
  outcome: {
    allowedFacets: ["trend", "consequence", "resolution"],
    weight: 1.2,
    conditional: true,
    evidencePriority: "primary",
  },
};
```

## 7. Relation Graph 分层

关系计算按以下顺序：

1. 固定牌阵结构边。
2. 问题维度与牌位职责。
3. 主题、状态和行动方向关系。
4. 正逆位机制关系。
5. 大阿卡纳阶段、元素、数字和宫廷角色等辅助关系。

约束：

- 固定结构连接的牌必须检查。
- 非结构边只有在共享、冲突或转化标签满足条件时才成为候选。
- 不对凯尔特十字的所有两两组合无差别建边。
- 每个 Observation 只保留有限数量的高价值语义关系。
- 辅助关系不得压过问题、牌位和核心牌义。
- 大阿卡纳不作为第五花色元素。
- 平局可以明确保留，不强选唯一主导元素。

## 8. 评分模型

Observation 分数：

```text
牌位权重
× 问题维度匹配度
× 牌义侧面强度
× 正逆位适配度
× 数据质量系数
```

Claim 分数：

```text
支持证据总分
+ 关系强化奖励
+ 关键位置奖励
+ 跨层一致奖励
- 反向证据惩罚
- 无法解释的矛盾惩罚
- 重复证据惩罚
- 越权断言惩罚
```

评分器必须：

- 对每个权重和阈值进行版本化。
- 对平局声明稳定处理。
- 拒绝非有限值。
- 不使用正逆位数量、简单吉凶、单一元素或大阿卡纳数量直接决定结论。

## 9. 冲突消解

依次区分内外、过去/当前/未来、动机与现实条件、建议修正、条件分支和主次证据。仍无法整合时输出趋势分散或不确定。冲突证据不能被删除。

## 10. 模板渲染

模板按结论类型、问题领域、置信度和关系结构组织，不按牌名堆积。

必须支持固定 `renderingSeed` 下可复现、同义句轮换、术语重复限制、置信度措辞、支持证据与反证连接、条件与行动顺序和四种牌阵不同输出深度。

## 11. 校验器

至少覆盖：

- 业务 ID 与语义单元 ID 合法且唯一。
- 78 张牌齐全。
- 字段、枚举、数值范围和引用合法。
- 核心结论证据来自实际抽牌和真实语义单元。
- 问题必答维度、允许结论和领域边界正确。
- 相反建议被排序、分层或条件化。
- 禁止确定疾病、死亡、怀孕、犯罪、投资收益、第三者、欺骗、精确日期或必然事件。
- 所有评分值有限且排序稳定。

## 12. 黄金样本可消费性验证

在批量生产其余 72 张牌前，`TQ-005` 使用 6 张黄金样本、少量试验 QuestionProfile、现有牌位和最小 Observation 路径验证：

- 稳定语义引用可加载。
- 领域 `facetRefs` 可解析。
- 逆位机制能选择合法语义。
- 同一牌在不同牌位生成不同 Observation。
- 随机流和排序契约不被资料加载影响。

本任务不实现完整 Relation、Claim、模板或 UI。

## 13. 目标模块结构

```text
src/engine/
├── models/
├── observations/
│   ├── position-operators.js
│   └── observation-engine.js
├── relations/
│   ├── spread-graph.js
│   └── relation-engine.js
├── claims/
│   ├── claim-engine.js
│   ├── evidence-scorer.js
│   ├── conflict-resolver.js
│   └── conclusion-classifier.js
├── validation/
│   └── validation-engine.js
├── rendering/
│   └── template-renderer.js
└── version.js

src/knowledge/
├── cards/
├── questions/
├── spreads/
├── vocabularies/
└── templates/
```

完整卡牌和问题资料不得重新集中到大型聚合文件。实现顺序由 `ROADMAP.md` 和 `PROGRESS.md` 决定。