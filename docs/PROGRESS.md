# 项目开发进度

> 本文件是继续任务的唯一实时状态入口；任务定义以 `EXECUTION_CONTRACTS.md` 为准。

## 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase 7：随机、历史与审计 |
| 当前进行中任务 | 无 |
| 最近完成任务 | Phase 6终态：`TX-003` 渲染后文本校验 |
| 唯一下一任务 | `AU-001B` 生产随机集成和根种子捕获 |
| 阻塞项 | 无 |
| 工作分支 | `phase-6-claims-text` |
| Phase M状态 | `PARENT-DONE` |
| Phase 1状态 | `PARENT-DONE` |
| Phase 2状态 | `PARENT-DONE` |
| Phase 3状态 | `PARENT-DONE` |
| Phase 4状态 | `PARENT-DONE` |
| Phase 5状态 | `PARENT-DONE` |
| Phase 6状态 | `PARENT-DONE` |
| Phase 7状态 | `PARENT-PENDING` |
| 最后更新时间 | 2026-07-31 |

## Phase 6完成记录

- `CL-001`：Observation和合法Relation按冻结图顺序生成结构化ClaimCandidate。
- `CL-002`：证据评分限制在0到1，平局按问题维度、来源顺序和ID稳定处理。
- `CL-003`：重复命题受控去重，支持与警示证据冲突显式保留。
- `CL-004`：结论只从QuestionProfile允许集合中选择，并声明条件与覆盖缺口。
- `CL-005`：非法证据、越权结论、缺失维度、冲突、条件和分数在模板前拦截。
- `AU-001A`：建立版本化根种子派生以及draw、orientation、rendering独立流，未切换生产抽牌。
- `TX-001`：建立人工模板词典和确定性渲染器。
- `TX-002`：四种牌阵均具有固定输出层级。
- `TX-003`：渲染后校验禁止确定性措辞、引用丢失、重复、冲突说明和格式。
- 阶段实现CWapi任务：`01KYWF9QW0K0WMHN723BNRKTKK`。
- 最终full复验CWapi任务：`01KYWE82GSCJW6YSVC0Q2VWZSW`；最终commit以终态RESULT和远端分支核验为准。

## 冻结不变量

- 78张牌、90题、四种牌阵、19个Position Operator和21条固定结构边保持不变。
- Observation、Relation和Claim依次建立，不允许文本层越权补造证据。
- 冲突证据不得静默删除；禁止结论和确定性措辞不得进入输出。
- AU-001A不切换生产抽牌；生产随机接入属于`AU-001B`。
- `automation/validate.py --scope full` 是完整回归入口。

## 唯一NEXT：AU-001B

把AU-001A确定性原语接入生产抽牌和正逆位流程，捕获版本化根种子，但不提前实现ReadingRecord、IndexedDB或旧历史迁移。
