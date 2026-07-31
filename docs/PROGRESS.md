# 项目开发进度

> 本文件是“开始任务”和“继续任务”的唯一实时状态入口。
> 锁定决策定义不能改变什么，执行契约定义怎样推进，本文件记录现在做到哪里、验证了什么以及下一步是什么。

## 1. 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase M：模块化基础 |
| 当前进行中任务 | `MOD-003B` 基础模块与随机边界 |
| 最近完成任务 | `MOD-003A` ES Module 入口、Node 模块格式与兼容桥 |
| 下一任务 | 无；`MOD-003B` 正在执行 |
| 阻塞项 | 无 |
| 工作分支 | `mod-003b-foundation-boundaries` |
| 起始提交 | `91fee6f851847c4be4840229bd753c7ca440e10f` |
| 最后更新时间 | 2026-07-31 |
| 规划状态 | 已冻结且执行审查已收敛；不得继续用非阻断性规划推迟开发 |

## 2. 当前任务：MOD-003B

**状态：IN_PROGRESS**

### 目标

抽离配置、核心、平台和存储基础接口，建立业务随机注入与平台安全熵边界，让后续状态、控制器、渲染器和服务器安全任务拥有稳定依赖。

### 范围

- 牌组配置、旧存储常量和资源路径。
- HTML转义。
- 设置、旧历史和旧ReadingRecord基础接口。
- 可注入的业务随机与洗牌接口。
- 平台安全熵与生命周期客户端。
- Service Worker注册基础接口。
- 兼容桥在加载旧脚本前安装冻结的运行时绑定，旧 `app.js` 立即使用这些模块。

### 不变量

- 不改78张牌、42个问题、四种牌阵、公开ID和牌义。
- 不改旧存储键、历史字段和20条上限。
- 业务随机仍优先Web Crypto，缺失时可使用明确注入的普通随机回退。
- 平台生命周期ID不得使用 `Math.random`；安全熵不可用时禁用本地生命周期信号。
- 不提前拆状态、控制器、渲染器或服务器。
- 不引入npm依赖、构建步骤或GitHub Actions。

### 验收

- 每个新增模块由真实页面兼容桥使用，不存在未接线展示模块。
- Node直接测试配置、资源、存储、ReadingRecord、业务随机和平台熵。
- `app.js` 不再自行实现已抽离能力。
- 新活动模块进入临时Service Worker资源列表。
- baseline、规模和依赖边界全部通过。
- 固定完整commit取得CWapi终态RESULT，执行前后工作区干净。

## 3. 最近完成：MOD-003A

- 实现提交：`4733e11c945ac86ef264fe6c0b3bf7902c6fe724`。
- 最终状态提交：`91fee6f851847c4be4840229bd753c7ca440e10f`。
- 最终复验task：`01KYG9MOD3B2`，RESULT `COMPLETED`。
- RESULT manifest SHA-256：`04059b46aad92ca425c5236be23f6ae99c38d9aface976afe3a7f3dcb395465d`。
- 页面已使用 `src/app/bootstrap.js` 和受控 `src/app/legacy-runtime.js`。

## 4. 当前基线

| 项目 | 当前状态 | 后续任务 |
|---|---|---|
| `app.js` | 1526行，含配置、随机、存储、资源与生命周期实现 | 本任务抽离基础能力；`MOD-004A`继续拆UI |
| `data.js` | 635行，建立 `window.TarotData` | `MOD-005`、`MOD-006A/B` |
| 活动CSS | `src/styles/index.css` + 8个模块 | 持续受900行门禁约束 |
| 页面入口 | `src/app/bootstrap.js` 原生ESM | 持续保留 |
| 旧运行桥 | `src/app/legacy-runtime.js` | `MOD-006A`删除 |
| 业务随机 | Web Crypto优先，直接在 `app.js` 中实现 | 本任务抽离并建立注入点 |
| 平台随机 | 生命周期ID可降级 `Math.random` | 本任务移除不安全降级 |
| 浏览器自动化 | 尚无仓库harness | `MOD-006D`收口 |

## 5. 阶段状态

- Phase 0：`DONE`
- Phase M：`PARENT-IN-PROGRESS`，当前叶子任务 `MOD-003B`
- Phase 1：`BLOCKED`，等待 `MOD-006D`
- Phase 2、3、7、8、9：`PARENT-PENDING`
- Phase 4、5、6：`BACKLOG`

后续完整任务图以 `docs/EXECUTION_CONTRACTS.md` 为唯一来源。