# 项目开发进度

> 本文件是“开始任务”和“继续任务”的唯一实时状态入口。
> 锁定决策定义不能改变什么，执行契约定义怎样推进，本文件记录现在做到哪里、验证了什么以及下一步是什么。

## 1. 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase M：模块化基础 |
| 当前任务 | `MOD-002` 拆分 CSS |
| 任务状态 | `CLOSURE_PENDING` |
| 最近完成任务 | `MOD-001` 模块边界、数据边界与基线验证 |
| 下一任务 | 暂不选择；闭环完成后更新为 `MOD-003A` |
| 阻塞项 | 无 |
| 工作分支 | `mod-002-split-css` |
| 实现提交 | `4451e5da53d6ba81569a25c81a7d4cb4d77894ab` |
| 最后更新时间 | 2026-07-31 |
| 规划状态 | 已冻结且执行审查已收敛；不得继续用非阻断性规划推迟开发 |

## 2. 当前任务：MOD-002

### 目标

把根目录单体 `styles.css` 拆为真实页面正在使用的活动模块，保持原有级联顺序、视觉、动画、响应式、牌阵布局和可访问行为；清除 CSS 超限技术债，并让旧文件重新出现时直接失败。

### 当前产物

```text
src/styles/
├── index.css
├── foundation.css
├── setup.css
├── cards.css
├── insights.css
├── history.css
├── desktop.css
├── wide.css
└── responsive.css
```

`index.html` 只加载 `src/styles/index.css`；入口按上述固定顺序导入八个规则模块。Service Worker 临时资源列表同步包含入口与八个模块，缓存版本由 `astra-tarot-v5` 提升为 `astra-tarot-v6`。

### CSS 等价性

- 原始 `styles.css`：4916 行，SHA-256 `087ab37e367357fbb1ea4532f0f0d9a81973e2dadd163a6d7c104cfbc6c466db`。
- 拆分点全部位于顶层规则边界。
- 八个模块按入口顺序拼接后与原始文件字节完全一致。
- 分隔空白行被归入后一个模块，避免新增文件末尾空白，同时不改变拼接字节。
- 最大人工 CSS 文件为 `desktop.css`，714 行，低于 900 行硬上限。

### 修改文件

新增：

- `src/styles/index.css`
- `src/styles/foundation.css`
- `src/styles/setup.css`
- `src/styles/cards.css`
- `src/styles/insights.css`
- `src/styles/history.css`
- `src/styles/desktop.css`
- `src/styles/wide.css`
- `src/styles/responsive.css`

修改：

- `automation/README.md`
- `automation/quality-baseline.json`
- `docs/MODULE_MAP.md`
- `index.html`
- `scripts/check_module_size.py`
- `src/README.md`
- `sw.js`
- `tests/module_contract_test.mjs`
- `tests/test_app_contract.py`

删除：

- `styles.css`

一次性审计和迁移脚本未进入实现产物提交。

### 不变量

- 未修改 `app.js`、`data.js`、`run.py`、牌义、问题、牌阵、公开 ID、抽牌概率和历史数据结构。
- 原有 CSS 内容与级联顺序由字节重组哈希冻结。
- Python 契约测试通过入口导入顺序读取完整样式，继续检查牌阵布局、滤镜禁令、静态资源和主要交互契约。
- Node 契约测试检查入口、模块顺序、原始 CSS 哈希、文件规模、Service Worker 资源和旧文件缺失。
- `styles.css` 已加入 `resolvedDebt`；重新创建该路径会返回 `FAIL`。

## 3. 固定提交验证

| 项目 | 值 |
|---|---|
| commit | `4451e5da53d6ba81569a25c81a7d4cb4d77894ab` |
| task_id | `01KYG9MOD2B1` |
| RESULT | `COMPLETED` |
| scope | `baseline` |
| Runner | `cwapi-win-01` |
| Python | `3.12.2` |
| Node | `24.18.0` |
| 工作区 | 执行前后均干净 |
| RESULT manifest SHA-256 | `a80e3a754436309990c25d6e6b7087c06aac01bdc46bcd8b70e3ef827a972bfd` |
| Drive 相对路径 | `CWapi/AAAYNMMM__astra-tarot-simulator/01KYG9MOD2B1` |

### 自动测试摘要

| 检查 | 结果 |
|---|---|
| Python unittest | `13 passed` |
| 旧 Node 数据 smoke test | `PASS` |
| Node 模块契约测试 | `PASS`，CSS 拼接、入口和 PWA 资源契约有效 |
| 模块规模和技术债 | `PASS`，13 个 PASS、2 个预期 WARN、0 FAIL |
| 导入边界和循环依赖 | `PASS` |
| 关键产物哈希 | 15 个文件，0 skipped |
| 工作区 | 执行前后均干净 |

### 当前预期 WARN

| 文件 | 当前行数 | 最迟清除 |
|---|---:|---|
| `app.js` | 1526 | `MOD-006A` |
| `data.js` | 635 | `MOD-006A` |

`styles.css` 技术债已经清除，不再属于 WARN；该路径重新出现即为 FAIL。

### 关键 SHA-256

| 文件 | SHA-256 |
|---|---|
| `automation/validate.py` | `229768a22fd665daac5b60205a22cee200923da787ed90841513222e2d5d2b5a` |
| `automation/quality-baseline.json` | `de7f5e44a4b96a5009bdd2f893c0d7a2ac25a6b2c9450bd393431f44401aa873` |
| `src/styles/index.css` | `d839a90efa2584616b50b70df12ae5e13079c44f824ddcd9f67633f6b9813c2d` |
| `src/styles/foundation.css` | `6e29f5b741dccade55c62ec8239d6c05cdd30a8b605b6609e8de78187faaa1fd` |
| `src/styles/setup.css` | `ed2e4f908847f548db106c1d96f6151a041cd5ea72df64d03c0a22ace580e67a` |
| `src/styles/cards.css` | `e46c23ded4cd6de9dbbfc38bac1bf0ada31272d37475d01cc4b2a5dbbaaefc03` |
| `src/styles/insights.css` | `06e7cbd2adab7f35e11d197aac719c1b1553766988dbd53cf10d5898a95b6ab7` |
| `src/styles/history.css` | `77c8c96d401196e0706bc3badd66c46819b725a20c94c4594b6cc78b4219970e` |
| `src/styles/desktop.css` | `5e3838e272e888fd9f6a77e32a2607f5f8aad4a7b347c1285e0e00bbe701369e` |
| `src/styles/wide.css` | `7e94a513f4ddcdd317b7ecc31586ad2aa0f2bc82095c1c106b3342e5d4fc5662` |
| `src/styles/responsive.css` | `b5a9d1a687a8761d4bd59099c3c2fdd2209b8590ed24ba086fc12b0802dfef3b` |

## 4. 失败与恢复记录

- `01KYG9MOD2A1`：审计脚本 SHA-256 预计算错误，脚本未执行；随后通过只读哈希任务重新绑定。
- `01KYG9MOD2I1`：旧 Python 契约仍直接读取根目录 `styles.css`；已改为通过入口顺序重组样式。
- `01KYG9MOD2I2`、`01KYG9MOD2I3`：拆分文件末尾继承空白分隔行，`git diff --check` 阻断；已移动完整空白行字节并保持拼接哈希不变。
- `01KYG9MOD2I4`：隔离 worktree 没有 Git 作者身份；改为单次 commit 参数使用 GitHub noreply 身份，不修改全局配置。
- `01KYG9MOD2I5`：镜像远端不能与 refspec 同时推送；改为单次覆盖 `remote.origin.mirror=false`。
- `01KYG9MOD2I6`：完整迁移、baseline、格式检查、提交和推送成功。
- `01KYG9MOD2B1`：实现产物固定提交 baseline 全部通过。

## 5. 闭环步骤

本文件所在提交必须由新的 CWapi task 使用同一 `baseline` 范围复验。通过后：

1. 把 `MOD-002` 标记为 `DONE`；
2. 把唯一下一任务更新为 `MOD-003A`；
3. 保存闭环 task_id、RESULT 和 manifest；
4. 对最终 DONE 状态提交再执行一次固定提交 baseline；
5. 最终复验后不得再修改本文件或 MOD-002 产物。

## 6. 当前代码与平台基线

| 项目 | 当前状态 | 后续任务 |
|---|---|---|
| `app.js` | 1526 行，IIFE 和 `window.TarotData` | `MOD-003A` 至 `MOD-006A` |
| 活动 CSS | `src/styles/index.css` + 8 个模块，最大 714 行 | 持续受 900 行门禁约束 |
| `styles.css` | 已删除；重新出现为 FAIL | 不得恢复 |
| `data.js` | 635 行 | `MOD-005`、`MOD-006A/B` |
| `run.py` | 服务仓库根目录，生命周期无会话 Cookie | `MOD-004B` |
| ES Module 入口 | 尚未建立 | `MOD-003A` |
| Node 测试 | `smoke_test.js` 使用 CommonJS | `MOD-003A` 转换 ESM |
| DOM 写入 | 多处 `innerHTML` 和动态 style | `MOD-004A` |
| CSP | 尚未强制 | `MOD-004B` |
| 业务随机 | 安全随机优先，存在 `Math.random` 降级 | `MOD-003B`、`AU-001A/B` |
| 平台随机 | lifecycle client ID 可降级 `Math.random` | `MOD-003B/004B` |
| Service Worker | 临时缓存入口和 8 个 CSS 模块，其他旧策略未改 | `MOD-006C`、`PLAT-001` |
| 浏览器自动化 | 尚无仓库 harness | `MOD-006D` 逐步建立 |
| GitHub Actions | 不使用 | CWapi 本地验证 |

## 7. 阶段状态

- Phase 0：`DONE`
- Phase M：`PARENT-IN-PROGRESS`，当前叶子任务 `MOD-002` 等待闭环
- Phase 1：`BLOCKED`，等待 `MOD-006D`
- Phase 2、3、7、8、9：`PARENT-PENDING`
- Phase 4、5、6：`BACKLOG`

后续完整任务图以 `docs/EXECUTION_CONTRACTS.md` 为唯一来源。
