# 纯规则塔罗解牌引擎目标架构

## 1. 目标

在不使用 AI 大模型、不改变四种固定牌阵、只允许预设问题的前提下，建立一套：

- 可复现
- 可审计
- 可测试
- 可解释
- 能进行多牌综合
- 能针对具体预设问题输出贴合结论

的确定性解牌引擎。

核心质量目标：

| 能力 | 目标 |
|---|---:|
| 单牌资料质量 | ≥ 9.0 / 10 |
| 多牌综合能力 | ≥ 9.0 / 10 |
| 预设问题贴合度 | ≥ 9.0 / 10 |
| 证据可追溯性 | 100% 核心结论可追溯 |
| 同输入复现率 | 100% |

## 2. 总体流水线

```text
固定问题选择
    ↓
QuestionProfile 加载
    ↓
固定牌阵与牌位语义适配
    ↓
随机种子、洗牌、抽牌、正逆位
    ↓
单牌观察 Observation 生成
    ↓
牌位运算 Position Operator
    ↓
牌间关系 Relation Graph
    ↓
候选结论 Claim Candidate
    ↓
证据评分与冲突消解
    ↓
结论分类 Conclusion Classifier
    ↓
一致性与安全校验
    ↓
模板化自然语言输出
    ↓
历史记录与审计数据保存
```

抽牌阶段和解释阶段必须严格分离。

## 3. 核心数据对象

### 3.1 QuestionProfile

每个预设问题必须有独立配置。

```js
{
  id: "career_change_now",
  text: "现在适合转换工作或学习方向吗？",
  domain: "career",
  intent: "change_decision",
  timeframe: "near_term",

  answerDimensions: [
    "change_motivation",
    "current_readiness",
    "main_obstacle",
    "external_condition",
    "development_trend",
    "recommended_action"
  ],

  allowedConclusionTypes: [
    "act_now",
    "act_with_conditions",
    "wait_and_prepare",
    "adjust_current_path",
    "currently_unfavorable",
    "indeterminate"
  ],

  forbiddenClaims: [
    "guaranteed_success",
    "exact_date",
    "certain_external_fact"
  ],

  spreadProfiles: {
    single: {},
    timeline: {},
    cross: {},
    celtic: {}
  }
}
```

`spreadProfiles` 不改变牌阵，只说明同一固定牌位在该问题中的具体职责。

### 3.2 CardSemanticProfile

每张牌的结构化资料。完整标准见 `CARD_DATA_STANDARD.md`。

### 3.3 Observation

牌面经过问题与牌位适配后的局部观察。

```js
{
  cardId: "major_07",
  orientation: "reversed",
  positionId: "advice",
  questionId: "career_change_now",

  selectedFacet: "action",
  selectedReversalMode: "blocked",
  semanticTags: ["direction_conflict", "preparation_gap"],
  dimensions: {
    activation: -1,
    stability: -1,
    clarity: -2
  },

  statementKey: "align_direction_before_action",
  localScore: 1.42,
  evidenceType: "primary"
}
```

### 3.4 Relation

描述两张牌或两个牌位观察之间的关系。

```js
{
  sourceObservationId: "obs_2",
  targetObservationId: "obs_5",
  type: "conditional_tension",
  strength: 0.78,
  tags: ["desire_vs_readiness"],
  explanationKey: "internal_drive_external_delay"
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
- `repeats_theme`
- `stage_progression`

### 3.5 ClaimCandidate

```js
{
  id: "claim_01",
  dimension: "recommended_action",
  conclusionType: "act_with_conditions",
  statementKey: "change_possible_after_preparation",

  evidence: ["obs_2", "obs_5"],
  counterEvidence: ["obs_1"],
  relations: ["rel_3"],
  conditions: ["verify_opportunity", "preserve_security"],

  supportScore: 4.6,
  conflictPenalty: 1.1,
  finalScore: 3.5,
  confidenceBand: "medium_high"
}
```

### 3.6 ReadingResult

最终结果必须同时保存显示文本和结构化证据。

```js
{
  readingId: "...",
  engineVersion: "2.0.0",
  cardDataVersion: "1.0.0",
  questionProfileVersion: "1.0.0",
  templateVersion: "1.0.0",
  randomSeed: "...",

  questionId: "career_change_now",
  spreadId: "cross",
  draw: [],
  observations: [],
  relations: [],
  selectedClaims: [],
  rejectedClaims: [],
  validation: {},
  renderedText: {}
}
```

## 4. 固定牌阵关系图

### 4.1 心语单张

职责：核心观察，不伪装成完整因果报告。

允许输出：

- 一条核心状态或提醒
- 一条与问题相关的解释
- 一条行动建议
- 一条边界或条件

不得输出复杂的过去、未来、外部人物确定事实。

### 4.2 时间之流

固定结构：过去 → 当下 → 未来。

关系计算：

- 过去是否延续到当下
- 当下是否强化、缓解或逆转过去
- 当下如何导向未来
- 未来是否重复旧模式
- 三张牌是否形成递进、停滞、循环或转折

### 4.3 五牌十字

固定牌位保持现状。

主要关系：

- 根源 → 核心
- 关键影响 → 核心
- 核心 → 趋势
- 建议 → 趋势
- 建议 ↔ 关键影响

重点输出：

- 当前局面的核心结构
- 根源与关键影响
- 当前路径的趋势
- 建议如何修正趋势
- 条件性结论

### 4.4 凯尔特十字

固定十个牌位保持现状。

重点关系：

- 当前态势与交叉挑战
- 意识目标与潜意识根基
- 过去影响与近期发展
- 建议对挑战的修正
- 外界条件对当前目标的支持或阻碍
- 希望恐惧对判断的影响
- 近期发展与最终结果是否同向

凯尔特十字不能按十张牌顺序逐段复述。必须先提炼 2 至 4 条主线，再展开证据。

## 5. 牌位运算符

牌位必须改变以下内容：

- 可选语义侧面
- 时态
- 主体
- 权重
- 条件性
- 是否转化为行动
- 是否可作为核心结论证据

示例：

```js
const POSITION_OPERATORS = {
  challenge: {
    allowedFacets: ["obstacle", "excess", "deficiency", "distortion"],
    weight: 1.3,
    evidencePriority: "primary"
  },

  advice: {
    allowedFacets: ["action", "adjustment", "boundary", "preparation"],
    weight: 1.5,
    convertToAction: true,
    evidencePriority: "primary"
  },

  outcome: {
    allowedFacets: ["trend", "consequence", "resolution"],
    weight: 1.2,
    conditional: true,
    evidencePriority: "primary"
  }
};
```

## 6. 多牌关系层级

关系计算按以下优先级执行：

1. 问题维度与牌位关系
2. 结构化主题关系
3. 状态与行动方向关系
4. 正逆位机制关系
5. 固定牌阵位置关系
6. 大阿卡纳阶段关系
7. 花色与元素关系
8. 数字、宫廷角色与重复模式

元素和数字只能作为辅助证据，不得压过问题、牌位和核心牌义。

## 7. 评分模型

### 7.1 局部观察分

```text
局部观察分 =
  牌位权重
× 问题维度匹配度
× 牌义侧面强度
× 正逆位适配度
× 数据质量系数
```

### 7.2 综合结论分

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
- 大阿卡纳数量直接代表“事情重大”而忽略位置

## 8. 冲突消解顺序

1. 是否属于内在与外在不同层面
2. 是否属于过去、现在与未来不同阶段
3. 是否属于动机与现实条件不同层面
4. 建议是否可以修正趋势
5. 是否可转化为“满足条件后成立”
6. 是否存在主次证据差异
7. 仍无法整合时输出“趋势分散”

冲突牌不能被删除，只能被解释、降权或保留为反证。

## 9. 结论分类

每种问题意图必须使用有限结论集合。

决策类示例：

- `act_now`
- `act_with_conditions`
- `wait_and_prepare`
- `adjust_current_path`
- `currently_unfavorable`
- `indeterminate`

趋势类示例：

- `stabilizing`
- `growing`
- `slowing`
- `conflicted`
- `restructuring`
- `ending_or_redefining`
- `conditional`
- `indeterminate`

有限分类用于保证一致性，模板负责表达变化。

## 10. 模板渲染

模板按结论类型、问题领域、置信度和关系结构组织，不按牌名堆积。

模板渲染必须支持：

- 同义句轮换
- 固定随机种子下可复现
- 术语重复限制
- 高、中、低置信度措辞
- 支持证据与反证的自然连接
- 条件与行动顺序
- 单张、三张、五张和十张不同输出深度

## 11. 校验器

至少实现：

### 11.1 数据校验

- 78 张牌齐全且 ID 唯一
- 字段完整
- 枚举合法
- 数值范围合法
- 引用标签存在

### 11.2 证据校验

- 每条核心结论至少有两个有效证据，单张牌阵除外
- 证据必须来自实际抽牌
- 牌位与语义侧面匹配

### 11.3 问题贴合校验

- 必答维度覆盖率达到阈值
- 禁止输出未允许的结论类型
- 不得跑到无关领域

### 11.4 矛盾校验

- 相反行动建议必须被排序、分层或条件化
- 不得在不同段落给出互斥结论而无说明

### 11.5 安全校验

禁止：

- 确定疾病、死亡、怀孕或犯罪事实
- 保证投资收益
- 建议停止治疗或替代专业意见
- 确定第三者、欺骗、恶意等外部事实
- 精确日期和必然事件

## 12. 建议模块结构

```text
engine/
├── question_profiles.js
├── card_semantics.js
├── card_schema.js
├── reversal_rules.js
├── position_operators.js
├── spread_relations.js
├── observation_engine.js
├── relation_engine.js
├── claim_engine.js
├── conflict_resolver.js
├── conclusion_classifier.js
├── template_renderer.js
├── validation_engine.js
└── version.js
```

实现顺序由 `ROADMAP.md` 和 `PROGRESS.md` 决定，不应一次性创建空架子冒充完成。
