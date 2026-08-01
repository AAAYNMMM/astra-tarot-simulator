# 纯规则塔罗解牌引擎目标架构

## 1. 文档职责

本文档定义纯规则解牌引擎的对象、流水线、确定性、关系分层、评分、冲突和双层校验。

任务编号和实施顺序以 `EXECUTION_CONTRACTS.md` 为准；本文件不维护第二套任务图。

## 2. 目标

在不使用 AI 大模型、保留现有 78 张牌与四种牌阵的前提下，建立一套可复现、可审计、可测试、可解释并能进行多牌综合的确定性引擎。新建 V3 占卜允许自由问题，但问题只属于历史外壳，完全不进入解牌引擎。

| 能力 | 目标 |
|---|---:|
| 单牌资料质量 | ≥9.0/10 |
| 多牌综合能力 | ≥9.0/10 |
| 问题与引擎隔离率 | 100% |
| 核心结论可追溯率 | 100% |
| 同输入、版本、artifact和根种子复现率 | 100% |

## 3. 总体流水线

```text
ReadingEnvelopeV3
    ├── question { text, purpose: "history-only" } ──→ 标题与历史
    └── EngineReadingRequestV3（不含任何问题字段）
             ↓
Web Crypto 根种子
    ├── draw 随机流
    ├── orientation 随机流
    └── rendering 随机流
             ↓
确定性洗牌、抽牌和正逆位
             ↓
SpreadReadingProfile + Position Operator + CardSemanticProfile
             ↓
牌位相关逆位机制 → Observation → Spread Graph → Relation → Claim
             ↓
按 spreadId 分派四个独立工作流
             ↓
八项结构评分与等级上限
             ↓
ReadingPresentationV3 + CardDetailV3
             ↓
ReadingRecord 3.0.0 与随机审计
```

抽牌、解释和问题记录三者严格隔离。Worker 只接受协议、reading ID、牌阵定义版本、抽牌和随机审计；旧`QuestionProfile`、`QuestionEvaluationPolicy`与比较流程只供 V1/V2 历史兼容和旧测试使用。

## 4. V1/V2 历史兼容消费者契约

本节及其后出现的`QuestionProfile`字段描述旧引擎资料合同，不是 V3 新建流程的输入。V3 对应的生产事实源是`SpreadReadingProfile 2.0.0`。

批量编写78张牌前，黄金样本必须通过最小消费者契约。

### 4.1 QuestionProfileConsumerContract

至少声明：

- `id`
- `domain`
- `intent`
- `timeframe`
- `answerDimensions`
- `allowedConclusionTypes`
- `forbiddenClaims`
- 当前牌阵中牌位职责的最小映射

### 4.2 PositionOperatorConsumerContract

至少声明：

- `positionId`
- 可选Facet或语义角色
- 时态
- 主体范围
- 权重
- 条件性
- 行动转换
- 证据优先级

### 4.3 ObservationConsumerContract

至少声明：

- 卡牌、问题、牌位和正逆位来源
- 稳定语义单元引用
- 选中语义角色
- 逆位模式
- 语义标签
- 有限局部分数
- 证据类型

后续完整QuestionProfile、Position Operator和Observation Engine必须扩展并兼容这些最小契约。

## 5. 核心对象

### 5.1 QuestionProfile

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

`spreadProfiles`只定义回答职责，不改变牌阵和牌位。

### 5.2 CardSemanticProfile

完整要求见 `CARD_DATA_STANDARD.md`。业务ID使用现有kebab-case；所有可引用语义单元拥有稳定ID和来源。

### 5.3 Observation

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

每个Observation保留真实来源引用，不能只保存渲染句子。

### 5.4 Relation

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

### 5.5 ClaimCandidate

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

### 5.6 ReadingResult

```js
{
  readingId: "reading-...",
  versions: {},
  artifactFingerprint: {},
  rootSeed: "...",
  questionId: "career-change",
  spreadId: "cross",
  draw: [],
  observations: [],
  relations: [],
  selectedClaims: [],
  rejectedClaims: [],
  validation: {
    structured: {},
    rendered: {},
  },
  renderedText: {},
}
```

最终结果同时保存结构化证据、双层校验和显示文本。

## 6. 固定牌阵职责

### 心语单张

只输出一条核心观察、一条问题相关解释、一条行动建议和一条边界或条件。不得伪装成完整因果报告。

### 时间之流

固定结构：过去 → 当下 → 未来。检查延续、强化、缓解、逆转、循环和转折。

### 五牌十字

主要结构边：

- 根源 → 核心
- 关键影响 → 核心
- 核心 → 趋势
- 建议 → 趋势
- 建议 ↔ 关键影响

### 凯尔特十字

固定十个牌位保持不变。先提炼2–4条主线，再展开证据，不按十张牌依次复述。

## 7. Position Operator

牌位运算符决定：

- 可选语义侧面；
- 时态；
- 主体范围；
- 权重；
- 条件性；
- 是否转化为行动；
- 是否可作为核心证据。

完整Position Operator任务只负责配置完整和合法；“同一牌在不同牌位产生不同Observation”的最终行为验收属于Observation Engine。

## 8. Relation Graph分层

关系计算顺序固定：

1. 固定牌阵结构边。
2. 问题维度与牌位职责。
3. 主题、状态、行动和逆位语义关系。
4. 大阿卡纳阶段、元素、数字和宫廷角色等辅助关系。

约束：

- 固定结构连接的牌必须检查。
- 非结构边只有共享、冲突或转化标签满足条件时才成为候选。
- 不对凯尔特十字全部两两组合无差别建边。
- 每个Observation只保留有限数量的高价值语义关系。
- 辅助关系不得压过问题、牌位和核心牌义。
- 大阿卡纳不作为第五花色。
- 平局可以保留，不强选唯一主导元素。

关系类型至少包括：

- supports
- reinforces
- weakens
- contradicts
- causes
- continues
- transforms
- conditions
- repairs
- repeats-theme
- stage-progression

## 9. 评分模型

### Observation分数

```text
局部观察分 =
  牌位权重
× 问题维度匹配度
× 牌义侧面强度
× 正逆位适配度
× 数据质量系数
```

### Claim分数

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

要求：

- 权重、阈值和平局规则版本化。
- 所有分数为有限值。
- 平局使用稳定业务ID次级键。
- 不依赖对象遍历或本地化字符串排序。
- 不使用正逆位数量、简单吉凶、单一元素或大牌数量直接决定结论。

## 10. 冲突消解

依次尝试：

1. 区分内在与外在。
2. 区分过去、当前与未来。
3. 区分动机与现实条件。
4. 判断建议能否修正趋势。
5. 转化为条件分支。
6. 根据主次证据降权。
7. 仍无法整合时输出趋势分散或不确定。

冲突证据不能被删除，只能被解释、降权或保留为反证。

## 11. 有限结论分类

每种问题意图使用有限结论集合。模板负责表达变化，分类本身保持稳定。

决策类示例：

- act-now
- act-with-conditions
- wait-and-prepare
- adjust-current-path
- currently-unfavorable
- indeterminate

趋势类示例：

- stabilizing
- growing
- slowing
- conflicted
- restructuring
- ending-or-redefining
- conditional
- indeterminate

## 12. 双层校验

### 12.1 结构化Claim校验

在模板渲染前检查：

- 核心结论证据来源；
- 反证和冲突；
- 牌位与问题维度；
- 结论类型是否被允许；
- 禁止结论；
- 条件是否缺失；
- 分数、阈值和稳定排序。

非法Claim不得进入模板层。

### 12.2 渲染后文本校验

检查：

- 不同段落无解释地互相否定；
- 禁止措辞或确定性断言泄漏；
- 证据、反证和条件在渲染中丢失；
- 术语重复、空泛句和格式错误；
- 四牌阵输出深度不匹配。

关键词扫描不能替代结构化校验。

## 13. 安全边界

禁止确定：

- 疾病和医疗诊断；
- 死亡和怀孕；
- 犯罪和第三者；
- 投资收益；
- 欺骗或具体外部人物事实；
- 精确日期；
- 必然事件。

安全边界必须同时存在于QuestionProfile、词典、结构化校验和渲染后校验。

## 14. 确定性

- 根种子派生draw、orientation和rendering三条独立随机流。
- 模板只消费rendering流。
- 数据加载、错误重试和日志不得消费任何业务随机流。
- 相同输入、版本、artifact哈希和根种子产生相同结构化结果与渲染选择。
- 随机派生、洗牌、评分、阈值和平局规则全部版本化。

## 15. 目标模块结构

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
│   ├── claim-validator.js
│   └── rendered-text-validator.js
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

完整卡牌和问题资料不得重新集中到大型 `card_semantics.js` 或 `question_profiles.js`。

实现顺序和任务依赖见 `EXECUTION_CONTRACTS.md`。
