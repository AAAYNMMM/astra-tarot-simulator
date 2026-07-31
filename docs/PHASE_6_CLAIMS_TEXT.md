# Phase 6：Claim与文本

## 完成范围

Phase 6以Phase 5合法Relation和Observation为唯一推理输入，连续完成：

1. `CL-001`：按冻结牌阵节点与结构边顺序生成ClaimCandidate。
2. `CL-002`：有限证据评分与稳定平局顺序。
3. `CL-003`：相同命题去重，方向冲突保留并显式记录。
4. `CL-004`：只从QuestionProfile允许集合中选择有限结论。
5. `CL-005`：模板前校验证据、问题维度、禁止结论、条件、冲突和分数。
6. `AU-001A`：版本化根种子派生以及draw、orientation、rendering独立流，不切换生产抽牌。
7. `TX-001`：人工模板词典与确定性渲染。
8. `TX-002`：single、timeline、cross和celtic分层输出。
9. `TX-003`：渲染后检查矛盾说明、禁止措辞、引用丢失、重复和格式。

## 冻结边界

- Claim只能引用当前批次的Observation、Relation和人工来源。
- 结论类型不得越过QuestionProfile的`allowedConclusionTypes`。
- 禁止结论不得通过模板措辞重新出现。
- 冲突不得静默删除；证据不足必须声明覆盖缺口。
- 渲染随机只消费rendering流，不影响draw和orientation流。
- AU-001A只建立确定性原语；生产抽牌切换留给Phase 7的`AU-001B`。
- 文本是结构化Claim的受控表达，不得反向改写Claim。
- 当前commit必须取得CWapi full RESULT。
