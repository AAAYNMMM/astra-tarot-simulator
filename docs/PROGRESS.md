# 项目开发进度

> 本文件是“开始任务”和“继续任务”的唯一实时状态入口。
> 锁定决策定义不能改变什么，执行契约定义怎样推进，本文件记录现在做到哪里、验证了什么以及下一步是什么。

## 1. 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase M：模块化基础 |
| 当前进行中任务 | `MOD-004B` 服务器边界、生命周期保护与强制CSP |
| 最近完成任务 | `MOD-003B` 基础模块与随机边界 |
| 下一任务 | 无；Phase M连续执行中 |
| 阻塞项 | 无 |
| 工作分支 | `phase-m-completion` |
| 实现提交 | `dfd8a1e1ea5428c5e589b50a38173c0224bb0442` |
| 验收修复提交 | `76b7396f8c198d01811a689bc9063f78c94bafb3` |
| 最后更新时间 | 2026-07-31 |
| 规划状态 | 已冻结且执行审查已收敛；不得继续用非阻断性规划推迟开发 |

## 2. 最近完成：MOD-003B

**状态：DONE**

### 目标与结果

配置、核心、平台和存储基础能力已从根目录 `app.js` 抽离，并通过 `src/app/legacy-runtime.js` 安装的冻结 `window.AstraRuntime` 被真实页面使用。没有建立未接线展示模块。

### 新增活动模块

```text
src/config/decks.js
src/config/legacy-storage.js
src/core/html.js
src/core/random/business-random.js
src/platform/assets.js
src/platform/entropy.js
src/platform/lifecycle-client.js
src/platform/pwa-client.js
src/storage/settings.js
src/storage/legacy-history.js
src/storage/legacy-record.js
```

新增测试：

```text
tests/foundation_contract_test.mjs
```

### 已建立边界

- 牌组配置、旧牌组ID映射和资源路径进入 `config/platform`。
- 旧存储键、20条历史上限、设置、历史写入和ReadingRecord进入 `config/storage`。
- HTML转义进入 `core`。
- 业务随机进入 `src/core/random/business-random.js`，Web Crypto优先，普通随机只作为可注入的业务回退。
- 平台生命周期ID进入 `src/platform/entropy.js`，不得使用 `Math.random`；安全熵不可用时禁用生命周期信号。
- Service Worker注册和生命周期客户端进入 `platform`。
- `app.js` 从1526行降至1353行，不再自行实现以上能力，仍是 `MOD-006A` 前必须删除的登记技术债。
- Service Worker临时缓存版本为 `astra-tarot-v8`，包含全部新增活动模块。

### 不变量

- 未修改 `data.js`、`run.py`、78张牌、42个问题、四种牌阵、公开ID、牌义和牌面资源。
- 旧存储键、历史字段和20条上限不变。
- 页面仍通过原生ES Module入口和受控兼容桥启动。
- 未引入npm依赖、构建步骤或GitHub Actions。

## 3. 验证记录

### 固定产物验收

| 项目 | 值 |
|---|---|
| commit | `76b7396f8c198d01811a689bc9063f78c94bafb3` |
| task_id | `01KYG9MOD3B4` |
| RESULT | `COMPLETED` |
| scope | `baseline` |
| Runner | `cwapi-win-01` |
| 工作区 | 执行前后均干净 |
| RESULT manifest SHA-256 | `57b7747fa875a2a8d20288ff985341c35502b5e82fc56c6e863701743b7a40b0` |
| Drive相对路径 | `CWapi/AAAYNMMM__astra-tarot-simulator/01KYG9MOD3B4` |

### 自动测试摘要

| 检查 | 结果 |
|---|---|
| Python unittest | `13 passed` |
| Node数据smoke | `PASS` |
| Node基础模块契约 | `PASS` |
| Node总体模块契约 | `PASS` |
| 模块规模与技术债 | `27 PASS`、`2 WARN`、`0 FAIL` |
| 导入方向与循环依赖 | `PASS` |
| 关键文件哈希 | 20个，0 skipped |
| 工作区 | 执行前后均干净 |

当前预期WARN：

| 文件 | 当前基线 | 最迟清除 |
|---|---:|---|
| `app.js` | 1353行 | `MOD-006A` |
| `data.js` | 637行登记上限 | `MOD-006A` |

### 失败与恢复

- `01KYG9MOD3I3`、`01KYG9MOD3I4`：一次性迁移脚本的确定性匹配范围错误，未产生远端产物提交。
- `01KYG9MOD3I5`、`01KYG9MOD3I6`：Python测试迁移缩进错误，baseline阻断，未产生远端产物提交。
- `01KYG9MOD3I7`：模块迁移、完整baseline、提交和推送成功。
- 固定提交审查发现生命周期测试被嵌套而未被发现；`01KYG9MOD3I8` 恢复测试覆盖并重新取得13项通过。
- `01KYG9MOD3B4`：最终产物固定commit完整复验通过。

## 4. 最终复验

本文件所在最终DONE提交由CWapi task `01KYG9MOD3B5` 使用同一 `baseline` 范围复验。该任务必须匹配本文件所在commit，执行前后工作区必须干净；复验后不得再修改本文件或MOD-003B产物，否则RESULT失效。

## 5. 当前代码与平台基线

| 项目 | 当前状态 | 后续任务 |
|---|---|---|
| `app.js` | 1353行，主要剩余状态、控制器、渲染器、动画和旧解读 | `MOD-004A`、`MOD-005`、`MOD-006A` |
| `data.js` | 635行，建立 `window.TarotData` | `MOD-005`、`MOD-006A/B` |
| 页面入口 | `src/app/bootstrap.js` 原生ESM | 持续保留 |
| 旧运行桥 | 安装 `window.AstraRuntime` 后加载旧脚本 | `MOD-006A`删除 |
| 业务随机 | core模块，可注入，Web Crypto优先 | 后续 `AU-001A/B` 版本化 |
| 平台安全熵 | platform模块，无 `Math.random` 降级 | `MOD-004B` 改为受限Cookie会话 |
| DOM写入 | 多处 `innerHTML` 和动态style | `MOD-004A` |
| 浏览器自动化 | 尚无仓库harness | `MOD-006D`收口 |

## 6. 下一任务：MOD-004A

**状态：NEXT**

目标：拆分页面状态、选择器、控制器、渲染器、动画和事件绑定，并开始清理DOM写入风险；所有抽离模块必须立即由真实页面使用。

主要约束：

- 不改变交互、动画、牌阵布局、公开ID、牌义、随机分布和旧历史读取。
- 用户、历史和导入数据默认使用 `textContent` 或字段白名单。
- 动态URL、颜色、ID和类名使用冻结枚举。
- 建立恶意历史与DOM注入契约测试。
- 不在本任务修改Python服务器、生命周期Cookie或强制CSP。
- 当前完整commit必须取得匹配CWapi RESULT。

## 7. 阶段状态

- Phase 0：`DONE`
- Phase M：`PARENT-IN-PROGRESS`，唯一下一叶子任务 `MOD-004A`
- Phase 1：`BLOCKED`，等待 `MOD-006D`
- Phase 2、3、7、8、9：`PARENT-PENDING`
- Phase 4、5、6：`BACKLOG`

后续完整任务图以 `docs/EXECUTION_CONTRACTS.md` 为唯一来源。

## Phase M连续执行现场

- `MOD-004A`：`IN_PROGRESS`。
- 后续叶子任务将按执行契约连续推进，不在每个任务结束后暂停。

- `MOD-004A`：`DONE`，产物提交 `72b55c0e8b83f44b61b966eb39a849bf613b5436`，CWapi `01KYG9PHM4AB2` COMPLETED。
- `MOD-004B`：`IN_PROGRESS`。
