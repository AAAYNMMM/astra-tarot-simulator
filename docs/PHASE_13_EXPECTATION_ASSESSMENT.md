# Phase 13：期待契合评估与问题输出契约

## 1. 目标

Phase 13 在现有 `Observation → Relation → Claim → concise interpretation` 之后增加独立、可审计的评估层。它保留抽牌与解读分离，不调用 AI，也不把等级解释为发生概率。

本阶段最终需要实现：

- 对适合的问题，在抽牌前由用户选择明确期待；
- 以整副牌阵与期待的接近程度生成 `SSS` 至 `E` 离散等级；
- 无期待、反思或行动问题不显示等级；
- 过程、结果、稳定性、负担、可控性与证据充分性分别表达；
- 综合页面不重复逐张牌义，单牌页面继续承担逐牌解释；
- 二选一使用两个独立子读数并排展示，不合并成一个总等级；
- 不鼓励通过重复抽取追逐更高等级。

## 2. 四种输出契约

每个固定问题必须明确声明一种输出契约：

| 契约 | 用途 | 是否显示 SSS–E |
|---|---|---|
| `alignment-grade` | 单一、可观察结果与用户期待的契合程度 | 是；无期待时否 |
| `situation-map` | 当前局面、张力、变化与不确定性 | 否 |
| `action-prompt` | 用户可控的小行动、边界和核验信号 | 否 |
| `comparison-support` | A/B 的过程、代价、稳定性和现实证据并排比较 | 否；两边分别描述 |

本项目是娱乐与自我观察工具，不建立独立的风险审查模式。原有禁止保证性结论、隐藏心理确定性和专业替代建议的边界继续生效。

## 3. 关键不变量

1. 期待、判断标准和输出契约不得影响抽牌、正逆位或随机流。
2. 期待不得参与牌义选择、逆位模式选择、Observation、Relation、ClaimCandidate 排序、冲突处理或 Claim 分类。
3. 先生成完整且冻结的结构化证据，再由评估层比较期待。
4. 相同问题、牌阵和抽牌必须产生相同 Observation、Relation 与 Claim；更换期待只能改变评估结果。
5. `SSS–E` 是有序类别，不是概率或 0–100 精确分数。
6. 单张牌阵不生成 `SSS–E`。
7. 成本、风险和冲突属于牌阵内容：它们可以降低期待契合度或触发等级上限，但不能伪装成“证据质量差”；只有未解释冲突、证据缺口和模式歧义影响证据充分性。
8. 正逆位不得机械取反；逆位有多个适用机制时不得按期待选择最有利机制。
9. 综合页面只解释整副牌阵结构；逐牌证据保留在单牌标签和技术追溯中。

## 4. 分层架构

```text
QuestionProfile + CardSemanticProfile + Position Operator
                         ↓
          Observation → Relation → Claim
                         ↓
          AssessmentSignal（期待无关）
                         ↓
   QuestionEvaluationPolicy + expectation/criterion ID
                         ↓
    alignment / situation / action / comparison result
```

`QuestionEvaluationPolicy` 是独立知识契约，以现有 `questionId` 关联问题，不复制完整 QuestionProfile。`AssessmentSignal` 只消费现有结构化证据与稳定引用，不生成新牌义文本。

## 5. 离散等级规则

评估层先形成以下互相区分的组件：

- 结果契合：`clear-divergence`、`divergence`、`neutral`、`partial-alignment`、`clear-alignment`；
- 过程：`blocked`、`mixed`、`conditional`、`smooth`；
- 稳定性：`fragile`、`conditional`、`stable`；
- 可控性：`limited`、`shared`、`high`；
- 过程负担：`low`、`medium`、`high`；
- 证据：`limited`、`dispersed`、`sufficient`。

结果契合决定基础等级：明显契合为 `S`，部分契合为 `A/B`，中性为 `C`，偏离为 `D`，明显偏离为 `E`。只有过程顺畅、结果稳定、可控性高、负担低、证据充分且无未解释冲突时才可进入 `SS/SSS`。脆弱稳定性、严重过程阻碍、高负担或证据分散通过显式资格门限制上限，不把连续原始分伪装成精确测量。

## 6. 试点范围

首次离线试点固定为六题：

- `love-future`：`alignment-grade`
- `career-opportunity`：`alignment-grade`
- `wealth-growth`：`action-prompt`
- `growth-lesson`：`situation-map`
- `daily-action`：`action-prompt`
- `decision-option`：`comparison-support`

代表牌固定覆盖关系、机会、稳定、阻力、结束、转折和逆位释放：`major-6`、`major-10`、`major-13`、`major-16`、`major-17`、`major-19`、`cups-two`、`cups-five`、`cups-eight`、`pentacles-four`、`pentacles-ten`、`swords-eight`。

试点先只进入 `src/knowledge/evaluation/`、`src/engine/assessment/` 与独立测试。六题矩阵、真实证据不变量和封顶反例通过后，实施已扩展到完整90题策略、Worker、生产 UI、历史与二选一编排；试点策略继续由完整目录派生，避免形成第二套真相。

## 7. 二选一

二选一作为独立编排层处理：

- 默认对 A、B 各执行一次三牌时间之流；
- 使用独立且可重放的 `draw/orientation` 子流；
- 两套牌不跨组建立 Relation；
- 用户先选择固定判断标准；
- 判断标准只在证据冻结后改变评估焦点，并保存覆盖维度与证据缺口；不得只作为展示标题；
- 输出各自过程、结果、稳定性、负担与证据缺口；
- 不生成一个合并总等级，不在证据接近时强行推荐。

## 8. 反依赖要求

- 期待必须在抽牌前确认并在本次读牌中锁定；
- 看牌后不得切换期待并原地重算；
- 不提供等级彩带、成就、连续高分或稀有率；
- 同一问题与期待短时间重复时优先展示上次记录和现实核验提醒；
- 不使用“重抽以改善结果”的文案或交互；
- 历史保存当时的期待与判断标准 ID，但不把等级描述为结果概率。

## 9. 任务顺序

1. `EA-001`：冻结输出契约、试点策略 Schema、校验器和六题策略。
2. `EA-002`：建立期待无关 `AssessmentSignal` 与离散评估器。
3. `EA-003`：完成六题×十二牌离线矩阵、反例和变形测试。
4. `EA-004`：逐题审查90题的输出契约、题面、期限、期待、标准和允许牌阵。
5. `EA-005`：修复逆位机制可达性并扩展全部允许评级问题。
6. `EA-006`：在 Worker 中校验期待/标准 ID，并接入准备页状态。
7. `EA-007`：接入综合/单牌分工、历史兼容与反重复交互。
8. `EA-008`：实现 A/B 独立子流与并排比较。
9. `EA-009`：完整生成物、确定性、浏览器、历史、分布监测和人工评审。
10. `REL-007`：由发布阶段确定正式版本，在最终commit执行exact-commit发布门禁；不在功能实现中擅自沿用2.1.0发布结论。

每个叶子任务必须保持公开卡牌、问题、牌阵和牌位 ID；不得用删除测试、放宽断言或修改旧历史结果制造通过。

## 10. 阶段完成条件

- 90题全部具有经审查的输出契约和允许牌阵；
- 所有 `alignment-grade` 题具有明确期待与可观察现实信号；
- 无期待、单牌、反思和行动问题从不显示 `SSS–E`；
- 同一结构化证据在不同期待下保持字节级不变；
- 逆位机制选择不受期待影响；
- 过程差、结果不稳、负担高和证据分散的封顶反例全部通过；
- 综合页面不重复逐牌牌义；
- A/B 使用独立随机子流并可重放；
- 旧历史可读且不会被重新计算；
- artifact、precache、自动测试与浏览器回归通过；正式发布仍须在最终commit执行仓库既有的exact-commit发布门禁。
