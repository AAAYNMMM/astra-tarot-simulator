# 项目开发进度

> 本文件是继续任务的唯一实时状态入口；任务定义以 `EXECUTION_CONTRACTS.md` 为准。

## 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase 5：Relation Graph |
| 当前进行中任务 | 无 |
| 最近完成任务 | `MR-001` 固定结构边转Relation候选 |
| 唯一下一任务 | `MR-002` 问题维度与牌位职责关系 |
| 阻塞项 | 无 |
| 工作分支 | `phase-5-relations` |
| Phase M状态 | `PARENT-DONE` |
| Phase 1状态 | `PARENT-DONE` |
| Phase 2状态 | `PARENT-DONE` |
| Phase 3状态 | `PARENT-DONE` |
| Phase 4状态 | `PARENT-DONE` |
| Phase 5状态 | `PARENT-IN-PROGRESS` |
| 最后更新时间 | 2026-07-31 |

## MR-001完成记录

- 以Phase 4冻结的4个结构图、19个节点和21条固定边为唯一拓扑来源。
- 每条固定边生成一个不可变、可审计的Relation候选；心语单张保持零候选。
- 输出顺序跟随结构边，输入Observation顺序变化不影响结果。
- 候选只给出有限类型集合，不提前确定最终类型、强度或语义成立。
- CWapi任务：`01KYG9PH5M03`，scope：`full`，目标分支：`phase-5-relations`。

## 冻结不变量

- 78张牌、90题、四种牌阵和19个Position Operator保持不变。
- Phase 4的4图、19节点、21固定边继续作为唯一结构来源。
- Observation只生成局部结构化证据，不生成Relation、Claim或文本。
- `MR-001`不建立非结构边，不做全量两两组合。
- `automation/validate.py --scope full` 是完整回归入口。

## 唯一NEXT：MR-002

在`MR-001`结构候选上加入QuestionProfile回答维度与Position Operator职责匹配，但仍不提前实现牌义、逆位和辅助关系层。
