# 项目开发进度

> 本文件是“开始任务”和“继续任务”的唯一实时状态入口。
> 锁定决策定义不能改变什么，执行契约定义怎样推进，本文件记录现在做到哪里、验证了什么以及下一步是什么。

## 1. 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase M：模块化基础 |
| 当前进行中任务 | 无 |
| 最近完成任务 | `MOD-001` 模块边界、数据边界与基线验证 |
| 下一任务 | `MOD-002` 拆分 CSS |
| 阻塞项 | 无 |
| 工作分支 | `mod-001-baseline-contracts` |
| 最后更新时间 | 2026-07-31 |
| 规划状态 | 已冻结且执行审查已收敛；不得继续用非阻断性规划推迟开发 |

## 2. 最近完成：MOD-001

**状态：DONE**

### 任务范围

`MOD-001` 只建立模块边界、技术债基线、契约测试和统一验证入口，没有改变运行行为、四种牌阵、公开 ID、牌义、问题库、抽牌概率或旧历史读取方式。

### 产物

- `docs/MODULE_MAP.md`
- `scripts/check_module_size.py`
- `scripts/check_import_boundaries.py`
- `tests/module_contract_test.mjs`
- `automation/validate.py`
- `automation/README.md`
- `automation/quality-baseline.json`
- `src/README.md`

### 修改文件

- `automation/README.md`
- `automation/quality-baseline.json`
- `automation/validate.py`
- `docs/MODULE_MAP.md`
- `docs/PROGRESS.md`
- `scripts/check_import_boundaries.py`
- `scripts/check_module_size.py`
- `src/README.md`
- `tests/module_contract_test.mjs`

未修改：

- `app.js`
- `data.js`
- `styles.css`
- `index.html`
- `sw.js`
- `run.py`

### 验收结果

- [x] 三个现有大型文件按已知技术债规则报告 `WARN`，没有增长。
- [x] 新人工文件超限、旧债增长、未登记越界和已解决债务重现会返回 `FAIL`。
- [x] 旧职责拥有唯一目标模块和迁移任务。
- [x] 依赖方向、裸导入、越界导入和循环依赖可机器检查。
- [x] 静态知识、运行状态、用户数据、人工源和生成文件边界已记录。
- [x] 78 张牌、42 个问题、六个领域和四种固定牌阵契约已冻结。
- [x] `localStorage` 设置键、历史键、历史字段和迁移输入已记录。
- [x] DOM/CSP、Service Worker、Node 格式、业务随机和平台随机基线已记录。
- [x] `automation/validate.py --scope baseline` 可由 CWapi 对固定 commit 执行。
- [x] 没有运行行为变化。

## 3. CWapi 验证记录

### 已通过的实现提交

| 项目 | 值 |
|---|---|
| commit | `280b63b50044a8f4d153e0ba162fc66c4b772bbe` |
| task_id | `01KYG9MODB03` |
| RESULT | `COMPLETED` |
| scope | `baseline` |
| Runner | `cwapi-win-01` |
| Python | `3.12.2` |
| Node | `24.18.0`，WinGet 当前用户安装 |
| 工作区 | 执行前后均干净 |
| RESULT manifest SHA-256 | `f59e0f4ed2ed4eda04046262efab940064a2b77303ba978f933ffeebac6525dc` |
| Drive 相对路径 | `CWapi/AAAYNMMM__astra-tarot-simulator/01KYG9MODB03` |

### 自动测试摘要

| 检查 | 结果 |
|---|---|
| Python unittest | `13 passed` |
| 旧 Node 数据 smoke test | `PASS` |
| Node ESM 模块契约测试 | `PASS` |
| 模块规模和技术债 | `PASS`，3 个预期 `WARN` |
| 导入边界和循环依赖 | `PASS` |
| Python compileall | `PASS` |
| 关键产物哈希收集 | 8 个文件，0 skipped |

### 关键产物 SHA-256

| 文件 | SHA-256 |
|---|---|
| `automation/README.md` | `56177c653cd0cacc4742740bb8dacbff1e6266816d32591ccbcaf66781036c25` |
| `automation/quality-baseline.json` | `a5a9340cdc384c6069bb15cb872fb3584435a5dbbfe6d91116d6c422f8e93bc6` |
| `automation/validate.py` | `229768a22fd665daac5b60205a22cee200923da787ed90841513222e2d5d2b5a` |
| `docs/MODULE_MAP.md` | `0593892b3613ed0e91ae48e08d0dd9c80f9e25ea92c700a5861b2ed43e63e0c6` |
| `scripts/check_import_boundaries.py` | `6aa5b3550a7c9db6abfaa3861691bbfa5b83624e89979fe2ca44de09e0b75a29` |
| `scripts/check_module_size.py` | `c820814a16746f30ccdd1bc9f9ea0050ef49688cd33b1197f15867d9b0d709ce` |
| `src/README.md` | `8a721c07536ccf5320adfa59c2277d85440312f1310534d19afb704a74badec9` |
| `tests/module_contract_test.mjs` | `634f4a6ccca61f03bde0598848609517fd527ba675a9b7a96e9d16a8acd7e924` |

### 闭环复验

本文件所在最终进度 commit 由 CWapi task `01KYG9MODB04` 使用相同 `baseline` 范围复验。该任务必须匹配本文件所在 commit，且执行后不得再修改 MOD-001 产物或本文件；否则旧 RESULT 失效。

### 失败与恢复记录

- `01KYG9MODH01`：Runner 白名单尚未登记仓库，`REJECTED`，未执行仓库命令。
- `01KYG9MODB01`：CWapi 隔离 PATH 中找不到 Node，`FAILED`。
- `01KYG9MODB02`：常见安装位置无 Node，`FAILED`。
- `01KYG9MODN02`：WinGet 已成功安装 Node 24.18.0，但同一旧进程未刷新命令别名；安装后验证脚本增加 WinGet Links/Packages 发现逻辑。
- `01KYG9MODB03`：正式 baseline 全部通过。

## 4. 已知技术债

| 文件 | 冻结行数 | 当前判定 | 最迟清除 |
|---|---:|---|---|
| `app.js` | 1528 | `WARN`，不得增长 | `MOD-006A` |
| `styles.css` | 4918 | `WARN`，不得增长 | `MOD-002` |
| `data.js` | 637 | `WARN`，不得增长 | `MOD-006A` |

旧债增长、新人工超限、未登记越界和已清除债务重现必须 `FAIL`；`MOD-006D` 时人工文件超限清零。

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

## 6. 下一任务：MOD-002

**状态：NEXT**

目标：把活动样式从根目录 `styles.css` 渐进迁入 `src/styles/`，真实页面立即使用拆出的文件，保持现有视觉、动画、响应式和可访问行为。

主要约束：

- 不改变产品视觉设计或交互流程。
- 不一次性重写全部 CSS。
- 每个新增活动样式文件立即加入当前页面和临时 Service Worker 资源列表。
- `styles.css` 不得增长，任务结束时旧超限技术债必须清除。
- 人工 CSS 文件不得超过 900 行。
- 继续使用 CWapi 固定 commit 验证，不使用 GitHub Actions。

## 7. 阶段状态

- Phase 0：`DONE`
- Phase M：`PARENT-IN-PROGRESS`，下一叶子任务 `MOD-002`
- Phase 1：`BLOCKED`，等待 `MOD-006D`
- Phase 2、3、7、8、9：`PARENT-PENDING`
- Phase 4、5、6：`BACKLOG`

后续完整任务图以 `docs/EXECUTION_CONTRACTS.md` 为唯一来源。
