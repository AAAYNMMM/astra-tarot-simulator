# Phase 5：Relation Graph

## 完成范围

Phase 5只在Phase 4冻结的21条结构边上建立Relation，不对凯尔特十字进行无差别两两建边。所有输出均为确定性结构化数据，不生成Claim或最终文本。

### MR-001 固定结构边

- 四个牌阵、19个节点和21条固定边是唯一拓扑来源。
- 每条结构边恰好生成一个候选；single生成零候选。
- 候选限制最终可选Relation类型和稳定解释键。

### MR-002 问题维度与牌位职责

- 直接消费QuestionProfile的answerDimensions和spreadProfiles.positionResponsibilities。
- 记录来源与目标职责、共享职责、职责交接、新引入维度、覆盖率和证据优先级。
- 不建立第二套问题或牌位字段。

### MR-003 语义与逆位关系

- 使用Observation的语义标签、facet、维度向量、牌位角色与逆位机制。
- 使用CardSemanticProfile的themes、relations和dimensions作为正式语义证据。
- 最终类型必须留在MR-001候选集合内；稳定平局按候选顺序解决。
- 支持causes、conditions、supports、weakens、reinforces、contradicts、transforms、repairs和continues九类有限关系。

### MR-004 辅助关系

- 元素、数字、宫廷、阶段和正逆位只作为现有结构边的辅助信号。
- 辅助信号最多小幅调整强度，不得创造新边或越过语义候选限制。

### MR-005 终态门禁

- 全部90个QuestionProfile、四个牌阵、正逆位两种批次均执行复现验证。
- 每批输出顺序严格跟随结构边，Observation和Card输入顺序变化不得改变结果。
- Relation数量必须等于结构边数量，最终类型必须属于候选集合。
- Card、Question、Position、Observation或固定结构图变化会使Phase 5验证失效并重跑。
