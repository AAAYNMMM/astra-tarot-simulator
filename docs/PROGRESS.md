# 项目开发进度

> 本文件是继续任务的唯一实时状态入口；任务定义以 `EXECUTION_CONTRACTS.md` 为准。

## 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase 8：评测、恢复、无障碍与UI |
| 当前进行中任务 | 无 |
| 最近完成任务 | Phase 7终态：`AU-003C` 容量、配额和降级 |
| 唯一下一任务 | `EV-001` 单牌测试集与指标 |
| 阻塞项 | 无 |
| 工作分支 | `phase-7-random-history` |
| Phase M状态 | `PARENT-DONE` |
| Phase 1状态 | `PARENT-DONE` |
| Phase 2状态 | `PARENT-DONE` |
| Phase 3状态 | `PARENT-DONE` |
| Phase 4状态 | `PARENT-DONE` |
| Phase 5状态 | `PARENT-DONE` |
| Phase 6状态 | `PARENT-DONE` |
| Phase 7状态 | `PARENT-DONE` |
| Phase 8状态 | `PARENT-PENDING` |
| 最后更新时间 | 2026-08-01 |

## Phase 7完成记录

- `AU-001B`：生产抽牌、正逆位和渲染使用版本化根种子的独立随机流，并保存可重放审计信息。
- `AU-002`：建立ReadingRecord 2.0、IndexedDB readings/meta存储和本次消费artifact指纹。
- `AU-003A`：旧localStorage记录幂等迁移；旧数据不删除，失败不写完成标记。
- `AU-003B`：导出包带稳定校验和；导入支持skip、replace和keep-both冲突策略。
- `AU-003C`：容量与配额分级提醒；IndexedDB失败时保留内存待导出副本，不静默截断。
- 阶段实现CWapi任务：`01KYWGAFBNKMRAH9YE8G0NGYBN`。
- 最终full复验CWapi任务：`01KYWGAFBN7P4JT89VTE1FNESB`；最终commit以终态RESULT和远端分支核验为准。

## 冻结不变量

- draw、orientation和rendering随机流互相独立，同一根种子与版本可稳定重放。
- 结构化历史使用ReadingRecord 2.0和IndexedDB；旧localStorage保留给当前UI兼容读取。
- 迁移失败不得删除或覆盖旧历史。
- 导入必须先完成Schema、重复ID和校验和验证。
- 配额或IndexedDB失败时不得静默丢弃记录。
- 最终Git commit不写入每条历史，commit与manifest对应关系由CWapi保存。
- `automation/validate.py --scope full` 是完整回归入口。

## 唯一NEXT：EV-001

建立单牌测试集与指标，覆盖语义引用、问题贴合、牌位职责、正逆位差异、禁止结论和稳定复现，不提前执行多牌评测或最终盲测。
