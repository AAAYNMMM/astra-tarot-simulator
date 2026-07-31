# Phase 4：固定结构图与Observation Engine

## 范围

Phase 4完成`PO-002A`至`PO-002D`和`PO-003A`至`PO-003E`，建立四牌阵固定结构图与完整Observation Engine。它不提前实现Relation、Claim或模板渲染。

## 固定图

| 牌阵 | 节点 | 固定边 | 主线 |
|---|---:|---:|---:|
| single | 1 | 0 | 1 |
| timeline | 3 | 2 | 1 |
| cross | 5 | 6 | 3 |
| celtic | 10 | 13 | 4 |

固定图只描述结构连接和牌位路径。Phase 5从这些边生成Relation，不得重新发明牌阵拓扑。

## Observation选择链

```text
CardSemanticProfile
+ QuestionProfile当前牌位职责
+ Position Operator
+ orientation/reversal mode
→ 合法Facet优先级
→ 稳定语义候选排序
→ 真实semanticUnitRef与sourceRefs
→ 逆位维度机制
→ 有限局部分数
→ Observation Schema与契约校验
```

局部分数固定为：

```text
positionWeight
× questionMatch
× semanticStrength
× orientationFit
× dataQuality
```

所有因子和结果必须为有限值。稳定平局使用业务字符串的ASCII次级键，不依赖对象遍历、本地化排序或随机数。

## 逆位

逆位必须使用卡牌声明的supportedModes。引擎保存所选模式、对应语义引用和维度调整；正位不得携带逆位模式。逆位不等于统一负号，也不以正逆位数量决定最终结论。

## 兼容

`createMinimalObservation`保留原入口，但委托正式`createObservation`，避免两套语义选择真相。旧TQ-005消费者夹具继续通过。

## 自动验收

`.qa/observation-engine-report.json`覆盖：

- 90题×19牌位×正逆位；
- 78牌×19牌位×正逆位；
- 四牌阵19节点和21条固定边；
- Schema、确定性、真实语义引用；
- 同牌不同牌位的路径差异；
- 逆位模式覆盖。

自动报告是开发门禁，不冒充独立人工内容评审。
