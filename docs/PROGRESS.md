# 项目开发进度

> 本文件是“开始任务”和“继续任务”的唯一实时状态入口。
> 锁定决策定义不能改变什么，执行契约定义怎样推进，本文件记录现在做到哪里、验证了什么以及下一步是什么。

## 1. 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase M：模块化基础 |
| 当前进行中任务 | 无 |
| 最近完成任务 | `MOD-003A` ES Module 入口、Node 模块格式与兼容桥 |
| 下一任务 | `MOD-003B` 基础模块与随机边界 |
| 阻塞项 | 无 |
| 工作分支 | `mod-003a-esm-entry` |
| 实现提交 | `4733e11c945ac86ef264fe6c0b3bf7902c6fe724` |
| 最后更新时间 | 2026-07-31 |
| 规划状态 | 已冻结且执行审查已收敛；不得继续用非阻断性规划推迟开发 |

## 2. 最近完成：MOD-003A

**状态：DONE**

### 目标

建立真实页面正在使用的原生 ES Module 入口，明确 Node `.js` 文件格式，并把旧 `data.js`、`app.js` 的页面加载限制在一个受控兼容桥内；不修改旧业务代码、牌义、牌阵、随机分布、历史结构或生命周期行为。

### 当前运行入口

```text
index.html
└── src/app/bootstrap.js
    └── src/app/legacy-runtime.js
        ├── data.js  → window.TarotData
        └── app.js   → 读取 window.TarotData
```

- `index.html` 只加载 `<script type="module" src="src/app/bootstrap.js">`。
- `src/app/bootstrap.js` 只在浏览器全局存在时启动；在 Node 导入时不会访问 DOM。
- `src/app/legacy-runtime.js` 固定按 `data.js`、`app.js` 顺序加载经典脚本，并在加载应用前验证 `window.TarotData`。
- 兼容桥和旧全局的删除任务仍为 `MOD-006A`。

### Node 模块格式

新增无依赖 `package.json`：

```json
{
  "private": true,
  "type": "module"
}
```

没有 `dependencies`、`devDependencies`、构建步骤或 `npm install` 要求。`tests/smoke_test.js` 已由 CommonJS 转换为 ESM，原命令 `node tests/smoke_test.js` 保持可用。

### PWA 临时接线

- Service Worker 缓存版本由 `astra-tarot-v6` 提升为 `astra-tarot-v7`。
- 临时资源清单新增 `src/app/bootstrap.js` 和 `src/app/legacy-runtime.js`。
- `data.js` 与 `app.js` 继续缓存，因为兼容桥仍真实使用它们。
- 旧 Service Worker 策略没有在本任务提前重写；正式策略仍由 `MOD-006C` 完成。

### 修改文件

新增：

- `package.json`
- `src/app/bootstrap.js`
- `src/app/legacy-runtime.js`

修改：

- `automation/README.md`
- `automation/quality-baseline.json`
- `docs/MODULE_MAP.md`
- `docs/PROGRESS.md`
- `index.html`
- `src/README.md`
- `sw.js`
- `tests/module_contract_test.mjs`
- `tests/smoke_test.js`
- `tests/test_app_contract.py`

一次性迁移脚本未进入实现产物提交。

### 不变量

- 未修改 `app.js`、`data.js`、`run.py`、CSS模块、牌面资源、牌义、问题、牌阵和公开 ID。
- 未改变本地存储键、历史字段、抽牌概率、生命周期端点和旧结果生成逻辑。
- 运行源码没有裸导入、远程依赖、npm依赖或构建链。
- 新模块均低于人工 JavaScript 600 行硬上限。

## 3. CWapi 验证记录

### 实现与提交

| 项目 | 值 |
|---|---|
| 起始提交 | `fbcb3d0c4b2e99f800bc2adb316870aa1c57e69c` |
| 实现提交 | `4733e11c945ac86ef264fe6c0b3bf7902c6fe724` |
| 实现 task_id | `01KYG9MOD3I2` |
| 实现 RESULT | `COMPLETED` |
| 固定提交验收 task_id | `01KYG9MOD3B1` |
| 固定提交 RESULT | `COMPLETED` |
| 固定提交 RESULT manifest SHA-256 | `15fd1d922f0c1c56d15c41f869c325685d9cd12aa3f4d4ed5713c44f58d8a479` |
| Drive 相对路径 | `CWapi/AAAYNMMM__astra-tarot-simulator/01KYG9MOD3B1` |
| Runner | `cwapi-win-01` |
| Python | `3.12.2` |
| Node | `24.18.0` |
| 工作区 | 验收前后均干净 |

### 自动测试摘要

| 检查 | 结果 |
|---|---|
| Python unittest | `13 passed` |
| Node ESM 数据 smoke test | `PASS` |
| Node 模块契约测试 | `PASS` |
| `package.json` 私有、ESM、无依赖 | `PASS` |
| Node 安全导入 `bootstrap.js`、`legacy-runtime.js` | `PASS` |
| 页面唯一模块入口与旧直连脚本移除 | `PASS` |
| 兼容桥脚本顺序与旧全局检查 | `PASS` |
| Service Worker v7 与活动模块资源 | `PASS` |
| 模块规模和技术债 | `PASS`，15 个 PASS、2 个预期 WARN、0 FAIL |
| 导入边界和循环依赖 | `PASS` |
| 关键产物哈希 | 13 个文件，0 skipped |
| 工作区 | 执行前后均干净 |

### 当前预期 WARN

| 文件 | 当前行数 | 最迟清除 |
|---|---:|---|
| `app.js` | 1526 | `MOD-006A` |
| `data.js` | 635 | `MOD-006A` |

`styles.css` 已清除，重新出现仍为 `FAIL`。

### 未覆盖环境

- 本阶段尚无仓库浏览器自动化 harness，因此没有真实浏览器点击、动画截图或离线重载自动化证据。
- Python本地服务器测试已确认 `index.html` 可服务；Node契约已确认模块格式、入口、兼容桥和缓存清单。
- 浏览器、PWA、CSP和完整交互自动化由 `MOD-006D` 统一收口；该缺口不改变本任务的有限范围。

## 4. 失败与恢复记录

- `01KYG9MOD3H1`：只读收集迁移脚本与验证入口的真实 SHA-256，成功。
- `01KYG9MOD3I1`：Runner 在执行前拒绝旧参数名，仓库未被触碰；随后按当前 schema 使用 `project_root`、`script_path`、`script_sha256` 和 `arguments`。
- `01KYG9MOD3I2`：迁移、baseline、格式检查、提交和推送成功。
- `01KYG9MOD3B1`：实现产物固定提交 baseline 全部通过。

## 5. 最终复验

本文件所在最终 DONE 提交由 CWapi task `01KYG9MOD3B2` 使用相同 `baseline` 范围复验。该任务必须匹配本文件所在 commit，执行前后工作区必须干净；复验后不得再修改本文件或 MOD-003A 产物，否则 RESULT 失效。

## 6. 当前代码与平台基线

| 项目 | 当前状态 | 后续任务 |
|---|---|---|
| 页面脚本入口 | `src/app/bootstrap.js` 原生 ESM | 持续保留 |
| 旧运行兼容桥 | `src/app/legacy-runtime.js` | `MOD-006A` 删除 |
| `package.json` | `private: true`、`type: module`、无依赖 | 不得引入构建链 |
| `tests/smoke_test.js` | ESM，原命令保持可用 | 持续回归 |
| `app.js` | 1526 行，IIFE，读取 `window.TarotData` | `MOD-003B` 至 `MOD-006A` |
| `data.js` | 635 行，建立 `window.TarotData` | `MOD-005`、`MOD-006A/B` |
| 活动 CSS | `src/styles/index.css` + 8 个模块，最大 714 行 | 持续受 900 行门禁约束 |
| `styles.css` | 已删除；重新出现为 FAIL | 不得恢复 |
| `run.py` | 服务仓库根目录，生命周期无会话 Cookie | `MOD-004B` |
| DOM 写入 | 多处 `innerHTML` 和动态 style | `MOD-004A` |
| CSP | 尚未强制 | `MOD-004B` |
| 业务随机 | 安全随机优先，存在 `Math.random` 降级 | `MOD-003B`、`AU-001A/B` |
| 平台随机 | lifecycle client ID 可降级 `Math.random` | `MOD-003B/004B` |
| Service Worker | v7，缓存ESM入口、兼容桥、旧脚本和CSS模块 | `MOD-006C`、`PLAT-001` |
| 浏览器自动化 | 尚无仓库 harness | `MOD-006D` 建立并收口 |
| GitHub Actions | 不使用 | CWapi 本地验证 |

## 7. 下一任务：MOD-003B

**状态：NEXT**

目标：抽离配置、核心、平台和存储基础接口，建立业务随机注入与平台安全熵边界，让后续状态、控制器、渲染器和服务器安全任务有稳定依赖。

主要范围：

- 抽离资源路径、牌组配置、HTML转义与冻结常量。
- 抽离设置、旧历史和ReadingRecord基础接口。
- 建立业务随机接口与可测试注入点。
- 生命周期client ID、Cookie、nonce和安全令牌使用Web Crypto或服务器安全随机。
- 平台随机不得降级为 `Math.random`，也不得消费业务随机流。
- 每个抽离模块立即由真实应用使用，不建立未接线展示模块。
- 保持页面行为、牌义、历史兼容和抽牌分布不变。
- 当前提交必须取得匹配 CWapi RESULT。

## 8. 阶段状态

- Phase 0：`DONE`
- Phase M：`PARENT-IN-PROGRESS`，唯一下一叶子任务 `MOD-003B`
- Phase 1：`BLOCKED`，等待 `MOD-006D`
- Phase 2、3、7、8、9：`PARENT-PENDING`
- Phase 4、5、6：`BACKLOG`

后续完整任务图以 `docs/EXECUTION_CONTRACTS.md` 为唯一来源。
