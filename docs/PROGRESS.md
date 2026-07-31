# 项目开发进度

> 本文件是“开始任务”和“继续任务”的唯一实时状态入口。
> 锁定决策定义不能改变什么，执行契约定义怎样推进，本文件记录现在做到哪里、验证了什么以及下一步是什么。

## 1. 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase M：模块化基础 |
| 当前进行中任务 | `MOD-001` 模块边界、数据边界与基线验证 |
| 任务状态 | `BLOCKED` |
| 下一任务 | 暂不选择；`MOD-001` 取得匹配 CWapi RESULT 后更新为 `MOD-002` |
| 最近完成任务 | `DOC-010` 唯一执行契约与连续审查收口 |
| 阻塞项 | CWapi 本机配置尚未允许 `AAAYNMMM/astra-tarot-simulator` |
| 最后更新时间 | 2026-07-31 |
| 规划状态 | 已冻结且执行审查已收敛；不得继续用非阻断性规划推迟开发 |

## 2. 当前活动任务

| 字段 | 当前值 |
|---|---|
| 任务 ID | `MOD-001` |
| 状态 | `BLOCKED` |
| 规范来源 | `AGENTS.md`、`DECISIONS.md`、`EXECUTION_CONTRACTS.md`、`MODULARIZATION_PLAN.md`、`DATA_ARCHITECTURE.md`、`ENGINEERING_GUARDS.md` |
| 工作分支 | `mod-001-baseline-contracts` |
| 起始完整 commit | `9b99b0337d93ea39f31417c56d6b75256df48533` |
| 实现产物 commit | `deb1bda56cef85e113716f61019e0329c56bf625` |
| 后续验证 commit | 解锁后必须读取并绑定当前分支完整 HEAD，不得复用旧 commit |
| CWapi task_id | `01KYG9MODH01` |
| CWapi RESULT | `REJECTED` |
| CWapi scope | 只读哈希收集，尚未进入 `baseline` 执行 |
| 受影响父任务 | Phase M |
| 父任务派生状态 | `PARENT-BLOCKED` |
| 开始时间 | 2026-07-31 08:57 +08:00 |
| 最后更新时间 | 2026-07-31 09:31 +08:00 |

### 已完成验收项

- [x] 读取唯一执行契约和当前任务规范。
- [x] 建立独立工作分支。
- [x] 确认任务不改变运行行为、公开 ID、牌义、问题库或抽牌概率。
- [x] 建立模块规模检查和已知技术债基线。
- [x] 建立依赖方向与循环依赖检查。
- [x] 建立 Node ESM 模块契约测试。
- [x] 建立 `automation/validate.py --scope baseline`。
- [x] 完成 `MODULE_MAP.md`、`src/README.md` 和数据、DOM、CSP、PWA、Node、随机及人工流程基线。
- [x] 审查分支 diff，确认仅修改文档、测试和验证工具。
- [x] 创建绑定实现 commit 的 CWapi 只读任务并保存终态拒绝证据。

### 剩余验收项

- [ ] 在 CWapi 本机配置中登记项目路径、remote 和允许仓库。
- [ ] 重启或重新加载 CWapi Runner 配置。
- [ ] 为当前分支 HEAD 创建新的 task_id，先收集 `automation/validate.py` 的 SHA-256。
- [ ] 使用准确 SHA-256 创建正式 `repository_automation` baseline TASK。
- [ ] 核对 Python、Node、规模、技术债、依赖边界、commit 和工作区证据。
- [ ] 若验证失败，修复后使用新 commit 和新 task_id 重跑。
- [ ] 取得匹配终态 RESULT 后把任务标记 `DONE`，父任务恢复 `PARENT-IN-PROGRESS`，唯一 `NEXT` 更新为 `MOD-002`。

### 本轮修改文件

- `automation/README.md`
- `automation/quality-baseline.json`
- `automation/validate.py`
- `docs/MODULE_MAP.md`
- `docs/PROGRESS.md`
- `scripts/check_import_boundaries.py`
- `scripts/check_module_size.py`
- `src/README.md`
- `tests/module_contract_test.mjs`

### 自动测试摘要

- 正式 CWapi baseline 尚未执行。
- task `01KYG9MODH01` 在执行前被 Runner 拒绝，未运行任何仓库命令。
- 不得把静态审查或连接器可读性检查表述为本地测试通过。

### 人工检查摘要

- 变更只包含 MOD-001 的文档、测试和验证入口，没有修改 `app.js`、`data.js`、`styles.css`、`index.html`、`sw.js` 或 `run.py`。
- 当前公开 ID、四牌阵、旧存储键、脚本入口、Service Worker 行为和随机降级均由模块契约测试冻结。
- `MODULE_MAP.md` 已记录唯一迁移目标、旧历史输入、DOM/CSP风险、PWA缓存、Node格式、业务随机与平台随机边界。

### 关键产物与证据

- 实现产物 commit：`deb1bda56cef85e113716f61019e0329c56bf625`
- 拒绝 task_id：`01KYG9MODH01`
- 拒绝原因：`不允许的仓库：AAAYNMMM/astra-tarot-simulator`
- 验证脚本 SHA-256：尚未取得；Git blob SHA 不得冒充 SHA-256。

### 阻塞原因

CWapi 本机 `config/cwapi.yaml` 的 `projects` 与 `security.allowed_repositories` 尚未登记 `AAAYNMMM/astra-tarot-simulator`。Runner 因协议白名单在执行前拒绝任务，仓库代码本身尚未进入验证。

### 下一具体动作

在 CWapi 本机配置中增加该仓库的真实本地路径和 remote，并把仓库名加入 `security.allowed_repositories`；重新加载 Runner 后，为当前分支 HEAD 使用新 task_id 创建只读哈希任务。

## 3. MOD-001 产物

- `docs/MODULE_MAP.md`
- `scripts/check_module_size.py`
- `scripts/check_import_boundaries.py`
- `tests/module_contract_test.mjs`
- `automation/validate.py`
- `automation/README.md`
- `automation/quality-baseline.json`
- `src/README.md`

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
- Phase M：`PARENT-BLOCKED`，当前叶子任务 `MOD-001`
- Phase 1：`BLOCKED`，等待 `MOD-006D`
- Phase 2、3、7、8、9：`PARENT-PENDING`
- Phase 4、5、6：`BACKLOG`

后续完整任务图以 `docs/EXECUTION_CONTRACTS.md` 为唯一来源。
