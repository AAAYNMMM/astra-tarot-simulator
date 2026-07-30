# 项目开发进度

> 本文件是“开始任务”和“继续任务”的唯一实时状态入口。
> 架构文档定义应该怎样做，本文件记录现在做到哪里、验证了什么以及下一步是什么。

## 1. 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase M：模块化基础 |
| 当前进行中任务 | 无 |
| 下一任务 | `MOD-001` 模块边界、数据边界与基线验证 |
| 最近完成任务 | `DOC-009` 依赖顺序与确定性契约优化 |
| 阻塞项 | 无 |
| 最后更新时间 | 2026-07-31 |
| 规划状态 | 已冻结；非阻断性新想法不得继续推迟开发 |

## 2. 当前活动任务

当前没有活动任务。开始 `MOD-001` 时必须填写以下现场，不得只保存在聊天中。

| 字段 | 当前值 |
|---|---|
| 任务 ID |  |
| 状态 |  |
| 规范来源 |  |
| 工作分支 |  |
| 当前完整 commit |  |
| CWapi task_id |  |
| CWapi RESULT |  |
| 受影响父任务 |  |
| 父任务派生状态 |  |
| 开始时间 |  |
| 最后更新时间 |  |

### 已完成验收项

- [ ]

### 剩余验收项

- [ ]

### 本轮修改文件

- 无

### 阻塞原因

- 无

### 下一具体动作

- 执行 `MOD-001`。

## 3. 下一任务：MOD-001

**状态：NEXT**

### 目标

- 核对当前主要文件、函数职责和依赖关系。
- 为 `app.js`、`styles.css`、`data.js` 建立唯一迁移映射。
- 确认 `src/` 最终结构和现有 `kebab-case` 业务 ID。
- 区分静态知识、临时状态、用户数据、人工源和生成文件。
- 建立模块规模与依赖方向检查。
- 记录自动测试、关键交互、旧历史字段和浏览器环境基线。
- 建立最小 CWapi 统一验证入口。

### 开始前必读

- `AGENTS.md`
- `docs/DECISIONS.md`
- `docs/MODULARIZATION_PLAN.md`
- `docs/DATA_ARCHITECTURE.md`
- `docs/ENGINEERING_GUARDS.md`
- 本文件
- 当前 `app.js`、`styles.css`、`data.js`
- 当前 `index.html`、`run.py`、`sw.js` 和测试

`MOD-001` 不需要重新完整装载后期规则引擎和单牌内容规范，除非发现跨阶段冲突。

### 产物

- `docs/MODULE_MAP.md`
- `scripts/check_module_size.py`
- `scripts/check_import_boundaries.py`
- `tests/module_contract_test.js`
- `automation/validate.py`
- `automation/README.md`
- 最小 `src/` 骨架或职责说明
- 旧历史字段和迁移输入基线
- 当前浏览器与操作系统人工基线
- 人工源、临时目录和生成文件职责说明

### baseline 验证入口

```text
automation/validate.py --scope baseline
```

至少执行：

- 当前 Python 测试
- 当前 Node smoke test
- 模块规模检查
- 依赖边界检查
- 机器可读摘要
- 可靠退出码

### 禁止范围

- 不改变四种牌阵或牌位。
- 不改变任何现有卡牌、问题、牌阵和牌位 ID。
- 不改写 78 张牌含义。
- 不改变抽牌或正逆位概率。
- 不扩展预设问题。
- 不实现新规则引擎。
- 不迁移 IndexedDB。
- 不一次性拆完全部代码。
- 不引入 npm 构建依赖。
- 不创建 `.github/workflows/`。
- 不提前实现后期完整 PWA、无障碍、版本迁移或性能优化。
- 不新增非阻断性规划文档。

### 验收

1. 模块规模脚本报告 `app.js`、`styles.css`、`data.js` 超限。
2. `MODULE_MAP.md` 为每个旧职责指定唯一目标模块。
3. 依赖方向和循环依赖规则可检查。
4. 现有业务 ID、静态知识、临时状态、用户数据、人工源和生成文件边界被记录。
5. Python 和 Node 基线测试结果被记录。
6. 准备、洗牌、发牌、翻牌、结果、历史和关闭生命周期人工基线被记录。
7. 当前 `localStorage` 设置与历史结构被记录。
8. 当前浏览器和操作系统环境被标记为已测试、降级、未测试或不支持。
9. `automation/validate.py --scope baseline` 可由 CWapi 对固定 commit 执行。
10. 没有运行行为变化。
11. 当前 commit 取得匹配的 CWapi RESULT。
12. 本文件将唯一 `NEXT` 更新为 `MOD-002`。

## 4. 当前基线

| 项目 | 当前状态 | 判定 |
|---|---|---|
| `app.js` | 1528 行 | 超过 JS 600 行硬上限 |
| `styles.css` | 4918 行 | 超过 CSS 900 行硬上限 |
| `data.js` | 637 行 | 超过 JS 600 行硬上限 |
| `run.py` | 243 行 | 规模可接受，访问边界待 `MOD-004B` 强化 |
| 业务 ID | 现有代码使用 `kebab-case` | Phase M 保持不变 |
| `localStorage` 设置 | 小型 JSON | 抽离接口后继续使用 |
| `localStorage` 历史 | 最多 20 条精简记录 | 存在静默截断，后期迁移 |
| IndexedDB | 尚未使用 | `AU-002`、`AU-003A–C` 实现 |
| GitHub Actions | 不使用 | CWapi 本地验证 |
| CWapi 统一入口 | 尚未建立 | `MOD-001` 建立 baseline，`MOD-006D` 完成 full |
| PWA 更新 | 统一回退首页 | `MOD-006C` 修资源类型和等级，`PLAT-001` 完成原子更新 |
| 无障碍 | 部分 ARIA 和键盘支持 | `AX-001`、`AX-002` 完成 |
| 错误恢复 | 局部容错 | `ERR-001` 完成统一模型 |
| 版本兼容 | 有独立版本规划 | `REL-005` 建立矩阵并在最终回归前完成 |
| 确定性 | 当前抽牌使用安全随机源 | `MOD-003` 建接口，`AU-001` 建三条独立随机流 |
| 浏览器支持矩阵 | 尚未冻结 | `MOD-001` 记录基线，`REL-001` 冻结发布矩阵 |

## 5. 阶段进度

| 阶段 | 状态 | 完成度 | 说明 |
|---|---|---:|---|
| Phase 0 | DONE | 100% | 接手、决策、架构和执行层文档已对齐 |
| Phase M | NEXT | 0% | 当前执行 `MOD-001` |
| Phase 1 | BLOCKED | 0% | 等待 `MOD-006D` |
| Phase 2 | PARENT-PENDING | 0% | 等待 `TQ-005`，资料按 4–6 张叶子任务拆分 |
| Phase 3 | PARENT-PENDING | 0% | 问题和适配按领域拆分 |
| Phase 4 | BACKLOG | 0% | Position Operator 与 Observation |
| Phase 5 | BACKLOG | 0% | 结构边优先的 Relation Graph |
| Phase 6 | BACKLOG | 0% | Claim、稳定评分、冲突和模板 |
| Phase 7 | PARENT-PENDING | 0% | 独立随机流、IndexedDB、迁移和备份 |
| Phase 8 | PARENT-PENDING | 0% | 评测资产、门禁、最终盲测、错误恢复、无障碍和 UI |
| Phase 9 | PARENT-PENDING | 0% | PWA、性能、兼容、许可证、最终回归和发布 |

## 6. 任务状态表

| 任务 ID | 状态 | 完成日期 | 结果 |
|---|---|---|---|
| DOC-001–007 | DONE | 2026-07-30 至 2026-07-31 | 原始项目文档体系和质量护栏 |
| DOC-008 | DONE | 2026-07-31 | 统一 ID、路径、任务依赖、粒度和恢复现场 |
| DOC-009 | DONE | 2026-07-31 | 父任务状态、任务拆分、确定性、评测和发布顺序优化 |
| MOD-001 | NEXT |  | 模块边界、数据边界与 baseline 验证 |
| MOD-002 | BACKLOG |  | 拆分 CSS |
| MOD-003 | BACKLOG |  | 抽离基础 JavaScript 和随机接口 |
| MOD-004A | BACKLOG |  | 状态、控制器和渲染器 |
| MOD-004B | BACKLOG |  | 服务白名单、路径穿越和生命周期保护 |
| MOD-005 | BACKLOG |  | 人工知识源和旧解读兼容 |
| MOD-006A | BACKLOG |  | 模块入口与旧全局清理 |
| MOD-006B | BACKLOG |  | 正式生成目录、注册表和缓存清单 |
| MOD-006C | BACKLOG |  | PWA 资源类型与资源等级 |
| MOD-006D | BACKLOG |  | full 验证、全量回归和 Phase M 收口 |
| TQ-001 | BLOCKED |  | 等待 `MOD-006D`，只负责结构 Schema |
| TQ-002 | BACKLOG |  | 词典、来源和解释政策 |
| EV-000A | BACKLOG |  | 评测协议和盲测边界 |
| TQ-003 | BACKLOG |  | 6 张黄金样本初稿 |
| TQ-004 | BACKLOG |  | 审查工具和黄金样本冻结 |
| TQ-005 | BACKLOG |  | 黄金样本可消费性验证 |
| TQ-101–107 | PARENT-PENDING |  | 78 张牌父任务，等待 `TQ-005` |
| QP-001–002 | BACKLOG |  | 问题分类与 Schema |
| QP-003–004 | PARENT-PENDING |  | 问题资料和适配按领域拆分 |
| PO-001–003 | BACKLOG |  | 牌位和 Observation |
| MR-001–004 | BACKLOG |  | 多牌关系 |
| CL-001–004 | BACKLOG |  | 结论、稳定评分和冲突 |
| TX-001–003 | BACKLOG |  | 模板和安全校验 |
| AU-001–002 | BACKLOG |  | 独立随机流与 ReadingRecord |
| AU-003 | PARENT-PENDING |  | 迁移、备份、容量和降级父任务 |
| AU-003A–C | BACKLOG |  | 三个顺序叶子任务 |
| EV-001–002 | BACKLOG |  | 单牌与问题评测资产 |
| EV-003 | PARENT-PENDING |  | 多牌评测父任务 |
| EV-003A–C | BACKLOG |  | 语料、自动指标和人工评审 |
| EV-004 | BACKLOG |  | 回归门禁与 Doctor |
| EV-000B | BACKLOG |  | 最终盲测，必须发生在 EV-004 之后 |
| ERR-001 | BACKLOG |  | 统一错误恢复 |
| AX-001–002 | BACKLOG |  | 无障碍 |
| UI-001–002 | BACKLOG |  | 新引擎和历史界面 |
| PLAT-001 | BACKLOG |  | PWA 原子更新 |
| PERF-001 | BACKLOG |  | 性能与资源预算 |
| PWA-002 | BACKLOG |  | 图标和离线牌组 |
| REL-002 | BACKLOG |  | 性能、离线和隐私验收 |
| REL-005 | BACKLOG |  | 版本兼容与回滚，最终回归前完成 |
| REL-003 | BACKLOG |  | 文档、许可证和第三方声明 |
| REL-001 | BACKLOG |  | 所有发布前代码变更后的最终全量回归 |
| REL-004 | BACKLOG |  | 发布 2.0 |

## 7. 当前代码审查结论

- 当前包含 78 张牌、42 个固定问题和 4 种固定牌阵。
- 当前业务 ID 使用 `kebab-case`，未来资料必须沿用。
- `app.js`、`styles.css`、`data.js` 必须分阶段拆分。
- 当前 Python 服务器以仓库根目录为服务目录，需增加白名单和生命周期保护。
- 当前 Service Worker 手工维护资源并统一回退首页，需分两阶段修复。
- 当前单牌资料不足以支撑目标规则引擎。
- 当前具体问题没有独立 QuestionProfile。
- 当前综合解读仍依赖粗糙的正逆位和元素统计。
- 当前历史没有完整证据链、版本和可复现种子。
- 当前测试尚未覆盖语义、关系、盲测和无障碍。

这些问题必须按唯一叶子任务逐步修复，不得在 `MOD-001` 中顺手包办。

## 8. 本轮验证记录

本轮只修改开发文档，没有修改运行代码。

已检查：

- 父任务具有可计算派生状态。
- `MOD-004` 已拆为前端和服务器安全两个叶子任务。
- `TQ-001` 与 `TQ-002` 的校验职责不再互相倒置。
- 根种子、独立随机流、稳定排序和平局规则已纳入路线。
- `MOD-005` 与 `MOD-006B` 的人工源和生成职责已分开。
- `TQ-005` 在批量生产 72 张牌前验证资料可消费性。
- `EV-000B` 移到评测资产和门禁之后。
- `REL-001` 移到所有发布前代码变更之后。
- PWA 必需资源与可选牌组资源已区分。
- 当前唯一 `NEXT` 仍为 `MOD-001`。

未执行运行测试：本轮是纯文档一致性修复，不创建 CWapi TASK。