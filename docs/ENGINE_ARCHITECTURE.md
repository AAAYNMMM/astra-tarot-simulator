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
高质量随机种子 → 确定性洗牌、抽牌、正逆位
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

## 3. 核心对象

### 3.1 QuestionProfile

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

### 3.2 CardSemanticProfile

每张牌的结构化知识。完整要求见 `CARD_DATA_STANDARD.md`。

业务 ID 使用现有 `kebab-case`，例如 `major-7`、`cups-two`。每条可引用语义单元拥有稳定 ID。

### 3.3 Observation

Observation 是卡牌资料、正逆位机制、问题配置和牌位运算共同作用后的局部观察：

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

### 3.4 Relation

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

关系类型至少包括：

- `supports`
- `reinforces`
- `weakens`
- `contradicts`
- `causes`
- `continues`
- `transforms`
- `conditions`
- `repairs`
- `repeats-theme`
- `stage-progression`

### 3.5 ClaimCandidate

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

### 3.6 ReadingResult

```js
{
  readingId: "reading-...",
  versions: {},
  randomSeed: "...",
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

## 4. 固定牌阵职责

### 4.1 心语单张

只输出：

- 一条核心观察
- 一条与问题相关的解释
- 一条行动建议
- 一条边界或条件

不得伪装成完整因果报告，不得确定外部人物事实。

### 4.2 时间之流

固定结构：过去 → 当下 → 未来。

检查延续、强化、缓解、逆转、循环和转折。

### 4.3 五牌十字

主要结构边：

- 根源 → 核心
- 关键影响 → 核心
- 核心 → 趋势
- 建议 → 趋势
- 建议 ↔ 关键影响

重点输出核心结构、根源、影响、趋势、修正和条件。

### 4.4 凯尔特十字

固定十个牌位保持不变。必须先提炼 2–4 条主线，再展开证据，不得按十张牌依次复述。

## 5. Position Operator

牌位运算符决定：

- 可选语义侧面
- 时态
- 主体范围
- 权重
- 条件性
- 是否转化为行动
- 是否可作为核心结论证据

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

## 6. Relation Graph 分层

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

## 7. 评分模型

### 7.1 Observation 分数

```text
局部观察分 =
  牌位权重
× 问题维度匹配度
× 牌义侧面强度
× 正逆位适配度
× 数据质量系数
```

### 7.2 Claim 分数

```text
综合结论分 =
  支持证据总分
+ 关系强化奖励
+ 关键位置奖励
+ 跨层一致奖励
- 反向证据惩罚
- 无法解释的矛盾惩罚
- 重复证据惩罚
- 越权断言惩罚
```

不得使用：

- 正位数量减逆位数量
- 简单吉凶总和
- 单一元素数量直接决定结论
- 大阿卡纳数量直接代表事情重大

## 8. 冲突消解

1. 区分内在与外在。
2. 区分过去、当前与未来。
3. 区分动机与现实条件。
4. 判断建议能否修正趋势。
5. 转化为条件分支。
6. 根据主次证据降权。
7. 仍无法整合时输出趋势分散或不确定。

冲突证据不能被删除，只能被解释、降权或保留为反证。

## 9. 有限结论分类

每种问题意图使用有限结论集合。模板负责表达变化，分类本身保持稳定。

决策类示例：

- `act-now`
- `act-with-conditions`
- `wait-and-prepare`
- `adjust-current-path`
- `currently-unfavorable`
- `indeterminate`

趋势类示例：

- `stabilizing`
- `growing`
- `slowing`
- `conflicted`
- `restructuring`
- `ending-or-redefining`
- `conditional`
- `indeterminate`

## 10. 模板渲染

模板按结论类型、问题领域、置信度和关系结构组织，不按牌名堆积。

必须支持：

- 固定种子下可复现
- 同义句轮换
- 术语重复限制
- 置信度措辞
- 支持证据与反证连接
- 条件与行动顺序
- 四种牌阵不同输出深度

## 11. 校验器

### 数据校验

- 业务 ID 与语义单元 ID 合法且唯一。
- 78 张牌齐全。
- 字段、枚举、数值范围和引用合法。

### 证据校验

- 每条核心结论至少有两个有效证据，单张牌阵除外。
- 证据来自实际抽牌和真实语义单元。
- 牌位与语义侧面匹配。

### 问题贴合校验

- 必答维度达到阈值。
- 结论类型被 QuestionProfile 允许。
- 不跑到无关领域。

### 矛盾校验

- 相反建议被排序、分层或条件化。
- 不允许不同段落无解释地互相否定。

### 安全校验

禁止确定疾病、死亡、怀孕、犯罪、投资收益、第三者、欺骗、精确日期或必然事件。

## 12. 目标模块结构

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

完整卡牌和问题资料不得重新集中到 `card_semantics.js` 或 `question_profiles.js` 之类的大文件。

实现顺序由 `ROADMAP.md` 和 `PROGRESS.md` 决定。