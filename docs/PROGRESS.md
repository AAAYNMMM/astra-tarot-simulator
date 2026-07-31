# 项目开发进度

> 本文件是“开始任务”和“继续任务”的唯一实时状态入口。
> 锁定决策定义不能改变什么，执行契约定义怎样推进，本文件记录现在做到哪里、验证了什么以及下一步是什么。

## 1. 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase M：模块化基础 |
| 当前进行中任务 | `MOD-001` 模块边界、数据边界与基线验证 |
| 下一任务 | 暂不选择；`MOD-001` 完成并取得匹配 CWapi RESULT 后更新 |
| 最近完成任务 | `DOC-010` 唯一执行契约与连续审查收口 |
| 阻塞项 | 无 |
| 最后更新时间 | 2026-07-31 |
| 规划状态 | 已冻结且执行审查已收敛；不得继续用非阻断性规划推迟开发 |

## 2. 当前活动任务

| 字段 | 当前值 |
|---|---|
| 任务 ID | `MOD-001` |
| 状态 | `IN_PROGRESS` |
| 规范来源 | `AGENTS.md`、`DECISIONS.md`、`EXECUTION_CONTRACTS.md`、`MODULARIZATION_PLAN.md`、`DATA_ARCHITECTURE.md`、`ENGINEERING_GUARDS.md` |
| 工作分支 | `mod-001-baseline-contracts` |
| 起始完整 commit | `9b99b0337d93ea39f31417c56d6b75256df48533` |
| 当前完整 commit | 待本轮实现提交后更新 |
| CWapi task_id | 待创建 |
| CWapi RESULT | `PENDING` |
| CWapi scope | `baseline` |
| 受影响父任务 | Phase M |
| 父任务派生状态 | `PARENT-IN-PROGRESS` |
| 开始时间 | 2026-07-31 08:57 +08:00 |
| 最后更新时间 | 2026-07-31 08:57 +08:00 |

### 已完成验收项

- [x] 读取唯一执行契约和当前任务规范。
- [x] 建立独立工作分支。
- [x] 确认任务不改变运行行为、公开 ID、牌义、问题库或抽牌概率。

### 剩余验收项

- [ ] 建立模块规模检查和已知技术债基线。
- [ ] 建立依赖方向与循环依赖检查。
- [ ] 建立 Node ESM 模块契约测试。
- [ ] 建立 `automation/validate.py --scope baseline`。
- [ ] 完成 `MODULE_MAP.md`、`src/README.md` 和数据/平台/人工流程基线。
- [ ] 审查修改文件和生成摘要。
- [ ] 提交固定 commit 并取得匹配 CWapi RESULT。
- [ ] 验收通过后把唯一 `NEXT` 更新为 `MOD-002`。

### 本轮修改文件

- `docs/PROGRESS.md`

### 自动测试摘要

- 尚未执行；统一入口正在建立。

### 人工检查摘要

- 已确认当前运行入口仍为根目录 `data.js` 与 `app.js`，本任务不切换入口。

### 关键产物哈希

- 待最终提交与 CWapi RESULT 生成。

### 阻塞原因

- 无。

### 下一具体动作

- 创建 `MOD-001` 要求的脚本、测试、模块映射、技术债基线和最小 `src/` 职责说明。

## 3. MOD-001 目标与产物

### 目标

- 核对主要文件、函数职责和依赖关系。
- 为 `app.js`、`styles.css`、`data.js` 建立唯一迁移映射。
- 确认 `src/` 结构和现有 `kebab-case` 业务 ID。
- 区分静态知识、状态、用户数据、人工源、临时生成物和正式生成文件。
- 建立模块规模、依赖方向和循环依赖检查。
- 建立已知技术债基线和单调收紧规则。
- 记录自动测试、关键交互、旧历史、浏览器、DOM 写入、CSP、Service Worker、Node 模块格式和随机调用基线。
- 建立最小 CWapi 统一验证入口。

### 产物

- `docs/MODULE_MAP.md`
- `scripts/check_module_size.py`
- `scripts/check_import_boundaries.py`
- `tests/module_contract_test.mjs`
- `automation/validate.py`
- `automation/README.md`
- `automation/quality-baseline.json`
- `src/README.md`

### 禁止范围

- 不改变四种牌阵、牌位或公开 ID。
- 不改写牌义、抽牌概率或问题库。
- 不实现新规则引擎或 IndexedDB 迁移。
- 不拆分当前大型业务文件。
- 不提前建立 ESM 兼容桥、CSP 或新 Service Worker 实现。
- 不引入 npm 依赖、构建链或 GitHub Actions。

## 4. 已知技术债

| 文件 | 当前行数 | 本任务结果 | 最迟清除 |
|---|---:|---|---|
| `app.js` | 1528 | WARN，不得增长 | `MOD-006A` |
| `styles.css` | 4918 | WARN，不得增长 | `MOD-002` |
| `data.js` | 637 | WARN，不得增长 | `MOD-006A` |

旧债增长、新人工超限、未登记越界和已清除债务重现必须 FAIL；Phase M full 时清零。

## 5. 当前代码与平台基线

| 项目 | 当前状态 | 后续任务 |
|---|---|---|
| `app.js` | 1528 行，IIFE 和 `window.TarotData` | `MOD-003A` 至 `MOD-006A` |
| `styles.css` | 4918 行 | `MOD-002` |
| `data.js` | 637 行 | `MOD-005`、`MOD-006A/B` |
| `run.py` | 服务仓库根目录，生命周期无会话 Cookie | `MOD-004B` |
| ES Module 入口 | 尚未建立 | `MOD-003A` |
| Node 测试 | `smoke_test.js` 使用 CommonJS | `MOD-003A` 转换 ESM |
| DOM 写入 | 多处 `innerHTML` 和动态 style | `MOD-004A` |
| CSP | 尚未强制 | `MOD-004B` |
| 业务随机 | 安全随机优先，存在 `Math.random` 降级 | `MOD-003B`、`AU-001A/B` |
| 平台随机 | lifecycle client ID 可降级 `Math.random` | `MOD-003B/004B` |
| `localStorage` 历史 | 最多 20 条并静默 `slice` | `AU-002`、`AU-003` |
| Service Worker | `cache.addAll` 四套牌、统一回退、立即 skip/claim | `MOD-006C`、`PLAT-001` |
| Artifact | 尚无规范哈希和 manifest | `MOD-006B` |
| 浏览器自动化 | 尚无仓库 harness | `MOD-006D` 逐步建立 |
| GitHub Actions | 不使用 | CWapi 本地验证 |

## 6. 阶段状态

- Phase 0：`DONE`
- Phase M：`PARENT-IN-PROGRESS`，当前叶子任务 `MOD-001`
- Phase 1：`BLOCKED`，等待 `MOD-006D`
- Phase 2、3、7、8、9：`PARENT-PENDING`
- Phase 4、5、6：`BACKLOG`

后续完整任务图以 `docs/EXECUTION_CONTRACTS.md` 为唯一来源。
