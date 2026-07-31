# 项目开发进度

> 本文件是继续任务的唯一实时状态入口；任务定义以 `EXECUTION_CONTRACTS.md` 为准。

## 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase M：模块化基础 |
| 当前进行中任务 | `MOD-006C` 经典Service Worker策略与离线状态 |
| 最近完成任务 | `MOD-006B` 正式生成、规范哈希与manifest |
| 下一任务 | 无；Phase M连续执行中 |
| 阻塞项 | 无 |
| 工作分支 | `phase-m-completion` |
| Phase M状态 | `PARENT-IN-PROGRESS` |
| Phase 1状态 | `BLOCKED`，等待 `MOD-006D` |
| 最后更新时间 | 2026-07-31 |

## Phase M完成记录

| 任务 | 状态 | 产物/证据 |
|---|---|---|
| `MOD-001`–`MOD-003B` | `DONE` | 基线、CSS、ESM入口与基础模块已建立 |
| `MOD-004A` | `DONE` | `72b55c0e8b83f44b61b966eb39a849bf613b5436` |
| `MOD-004B` | `DONE` | `e1b2c8e73ad9c4e40cb5264aade7f60fe86618a9`；测试发现修复 `b31c2af465eb68466929d1c40938c409b60937d8` |
| `MOD-005` | `DONE` | `b03ca2602a36c4f96f2f2cf3c54d085db729116f`；固定复验 `01KYG9PHM5B2` |
| `MOD-006A` | `DONE` | `72cd7fa7ba05dab81b0f36a41c17d025002d8e29`；固定复验 `01KYG9PHM6AK2` |
| `MOD-006B` | `DONE` | 永久生成器、轻量目录、动态注册表、knowledge/artifact/precache清单和陈旧产物门禁 |
| `MOD-006C` | `IN_PROGRESS` | 下一步接线经典SW与离线状态 |
| `MOD-006D` | `BACKLOG` | 等待 `MOD-006C` |

## 当前不变量

- 根 `app.js`、`data.js`、`styles.css` 和旧运行桥保持删除。
- 78张牌、42个固定问题、1/3/5/10牌阵、公开ID、旧历史键和随机分布不变。
- 人工JS/CSS无超限技术债；不引入npm依赖、构建步骤或GitHub Actions。
- 人工源是唯一真相；`src/generated/` 只能由 `scripts/generate_artifacts.mjs` 重建。

## 当前任务：MOD-006C

按生成的 `src/generated/precache-manifest.js` 分类导航、版本化运行资源和牌组图片；建立 `APP-SHELL-READY`、`DEFAULT-DECK-READY`、`SELECTED-DECKS-READY` 状态，失败图片使用可访问占位且不重抽。
