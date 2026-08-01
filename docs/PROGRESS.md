# 项目开发进度

> 本文件是继续任务的唯一实时状态入口；任务定义以 `EXECUTION_CONTRACTS.md` 为准。

## 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase 9：发布稳定化 |
| 当前进行中任务 | 无 |
| 最近完成任务 | Phase 9终态：`REL-004` 发布2.0 |
| 唯一下一任务 | `无（2.0.0终态）` |
| 阻塞项 | 无 |
| 工作分支 | `phase-9-release` |
| Phase M状态 | `PARENT-DONE` |
| Phase 1状态 | `PARENT-DONE` |
| Phase 2状态 | `PARENT-DONE` |
| Phase 3状态 | `PARENT-DONE` |
| Phase 4状态 | `PARENT-DONE` |
| Phase 5状态 | `PARENT-DONE` |
| Phase 6状态 | `PARENT-DONE` |
| Phase 7状态 | `PARENT-DONE` |
| Phase 8状态 | `PARENT-DONE` |
| Phase 9状态 | `PARENT-DONE` |
| 最后更新时间 | 2026-08-01 |

## Phase 9完成记录

- `PLAT-001`：必需资源临时缓存、传输哈希、waiting协调、受控激活、两代保留和回滚完成。
- `PERF-001`：shell、knowledge、牌组、规则计算、记录、诊断和目标历史规模预算进入固定报告。
- `PWA-002`：192/512普通与maskable PNG图标、按需牌组进度、空间估算和单牌组删除完成。
- `REL-002`：性能、离线、隐私、盲测和平台验收报告通过。
- `REL-005`：机器可读兼容矩阵、混合版本检测、只读旧历史和回滚策略完成。
- `REL-003`：README、CHANGELOG、MIT LICENSE、第三方声明、浏览器支持和发布说明完成。
- `REL-001`：所有发布前代码、数据、缓存、迁移、资源清单和生成产物之后执行 full 回归。
- `REL-004`：2.0.0 release manifest生成并冻结关键产物哈希。
- 阶段实现CWapi任务：`01KYXMJ0PH9M7AG00000000009`。
- 发布证据修正CWapi任务：`01KYXMP0PH9M7AG0000000000C`。
- 最终full复验CWapi任务：`01KYXMR0PH9V7AG0000000000B`；最终commit以终态RESULT和远端分支核验为准。

## 冻结不变量

- 运行时纯规则、离线、固定问题和四牌阵。
- 抽牌、正逆位和渲染随机流彼此独立。
- 最终盲测正文不进入仓库或日志。
- 更新失败不激活不完整release；回滚不破坏已升级历史。
- 项目不使用GitHub Actions或强制构建步骤。
- `automation/validate.py --scope full` 是2.0.0完整回归入口。

## 发布终态

2.0.0已经完成代码、数据、评测、恢复、无障碍、PWA、性能、兼容、许可证和发布证据收口。后续任何运行代码、数据、缓存、迁移、资源清单或生成产物变化，都必须建立新的任务现场并重新执行 full 回归。
