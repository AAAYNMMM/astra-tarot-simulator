# 项目开发进度

> 本文件是继续任务的唯一实时状态入口；任务定义以 `EXECUTION_CONTRACTS.md` 为准。

## 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase 9：发布稳定化 |
| 当前进行中任务 | 无 |
| 最近完成任务 | Phase 8终态：`AX-002` 动态牌桌无障碍回归 |
| 唯一下一任务 | `PLAT-001` PWA原子更新和回滚 |
| 阻塞项 | 无 |
| 工作分支 | `phase-8-quality-ui` |
| Phase M状态 | `PARENT-DONE` |
| Phase 1状态 | `PARENT-DONE` |
| Phase 2状态 | `PARENT-DONE` |
| Phase 3状态 | `PARENT-DONE` |
| Phase 4状态 | `PARENT-DONE` |
| Phase 5状态 | `PARENT-DONE` |
| Phase 6状态 | `PARENT-DONE` |
| Phase 7状态 | `PARENT-DONE` |
| Phase 8状态 | `PARENT-DONE` |
| Phase 9状态 | `PARENT-PENDING` |
| 最后更新时间 | 2026-08-01 |

## Phase 8完成记录

- `EV-001`：78张牌正逆位单牌评测，语义引用、问题职责、禁止结论和复现指标进入固定报告。
- `EV-002`：90题×四牌阵问题贴合评测，结论类型、维度覆盖和稳定性通过。
- `EV-003A/B/C`：建立六领域36例多牌语料、自动指标以及18例匿名人工评审包。
- `EV-004`：建立 `scripts/doctor.py`，检查三项核心质量、盲测、恢复和UI门禁。
- `EV-000B`：48例最终盲测在CWapi受控外部文件中执行；仓库只保存 `833898d81c5dea731ec43e567024a5c7586c44189bfb0209eaec6c0ba5c4d58e`、数量和聚合结果。
- `ERR-001A-D`：统一错误、脱敏诊断、恢复协调器和可复用恢复面板完成。
- `AX-001`：标签页、对话框、焦点、状态朗读和键盘导航完成。
- `UI-001`：真实应用综合解读切换为新版 Observation→Relation→Claim→Text 引擎。
- `UI-002`：兼容历史显示结构化结论、置信度、证据、关系、条件、冲突和覆盖缺口摘要。
- `AX-002`：动态牌桌序号、牌位、正逆位、状态和方向键回归完成。
- 阶段实现CWapi任务：`01KYWN5T8C2M7R4H9V1Q6P0ZAD`。
- 最终full复验CWapi任务：`01KYWP3H7M1B8F6D2Q9S7V0ZKC`；最终commit以终态RESULT和远端分支核验为准。

## 冻结不变量

- 运行时仍为纯规则、离线、固定问题和四牌阵。
- UI只消费新版引擎结果，不复制或改写引擎规则。
- 已抽牌在资料或引擎失败时保持不变，不隐藏重抽。
- 最终盲测正文不进入仓库和日志。
- 诊断不包含问题正文、完整解读、历史正文或根种子。
- 三项核心质量分数均不低于9.0。
- `automation/validate.py --scope full` 是完整回归入口。

## 唯一NEXT：PLAT-001

实现PWA原子更新、多标签协调、等待态、受控切换和上一完整release回滚，不提前执行性能预算、安装图标、许可证或最终发布。
