# 项目开发进度

> 本文件是继续任务的唯一实时状态入口；任务定义以 `EXECUTION_CONTRACTS.md` 为准。

## 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase 1：质量门禁与知识协议 |
| 当前进行中任务 | 无 |
| 最近完成任务 | `TQ-001` CardSemanticProfile结构Schema |
| 唯一下一任务 | `TQ-002` 词典、来源和解释政策 |
| 阻塞项 | 无 |
| 工作分支 | `phase-m-completion` |
| Phase M状态 | `PARENT-DONE` |
| Phase 1状态 | `PARENT-IN-PROGRESS` |
| 最后更新时间 | 2026-07-31 |

## Phase M完成记录

| 任务 | 状态 | 产物/证据 |
|---|---|---|
| `MOD-001`–`MOD-003B` | `DONE` | 基线、CSS、ESM入口与基础模块 |
| `MOD-004A` | `DONE` | `72b55c0e8b83f44b61b966eb39a849bf613b5436` |
| `MOD-004B` | `DONE` | `e1b2c8e73ad9c4e40cb5264aade7f60fe86618a9`；发现修复 `b31c2af465eb68466929d1c40938c409b60937d8` |
| `MOD-005` | `DONE` | `b03ca2602a36c4f96f2f2cf3c54d085db729116f`；固定复验 `01KYG9PHM5B2` |
| `MOD-006A` | `DONE` | `72cd7fa7ba05dab81b0f36a41c17d025002d8e29`；固定复验 `01KYG9PHM6AK2` |
| `MOD-006B` | `DONE` | `a710750d207cf13c6a4c61852356a4aaedc39c15`；永久生成器与规范manifest |
| `MOD-006C` | `DONE` | `b8973a7f1077234a04d115652e05324706dafd07`；分类缓存与离线状态 |
| `MOD-006D` | `DONE` | `70e5a70ee1f66802afdff73aa97522a5183f7181`；固定full复验 `01KYG9PHM6AN7` |

## Phase 1完成记录

| 任务 | 状态 | 产物/证据 |
|---|---|---|
| `TQ-001` | `DONE` | Draft 2020-12 CardSemanticProfile Schema、无依赖验证器、合法/失败夹具、稳定错误码和full接入 |

## 冻结不变量

- 78张牌、42个固定问题、1/3/5/10牌阵、公开ID、旧历史键和随机分布不变。
- 人工JS/CSS无超限技术债；不引入npm依赖、构建步骤或GitHub Actions。
- 人工源是唯一真相；`src/generated/` 必须由永久生成器重建并通过陈旧检查。
- `automation/validate.py --scope full` 是完整回归入口。
- `TQ-001`只冻结Card结构；QuestionProfile和Position Operator仍分别由`QP-002`和`PO-001`冻结。

## 唯一NEXT：TQ-002

建立标签、角色、逆位、领域、维度、来源与解释政策的正式词典和注册规则；验证成员资格、同义词、来源引用和跨词表约束，不修改 `TQ-001` 已冻结的结构职责。
