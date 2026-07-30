# 代码模块化方案

## 1. 目的

本文件定义纯规则解牌引擎开发前必须完成的 **Phase M：模块化基础**。

目标：

- 后续 AI 可以通过 GitHub 精确读取和修改单个职责文件。
- 规则、静态知识、界面、存储、平台能力和动画互不混杂。
- 单次任务只修改少量文件，回归失败能够定位。
- 78 张高质量单牌和大量问题配置不会形成新的超大文件。
- 项目保持完全离线、无强制构建步骤和轻量依赖。
- 静态知识、临时状态、用户历史和生成文件按生命周期分离。
- 从第一个非纯文档任务开始即可通过 CWapi 对固定 commit 执行统一验证。

Phase M 位于 Phase 0 与 Phase 1 之间。完成 `MOD-001` 至 `MOD-006D` 前，不开始 `TQ-001`。

数据组织受 `DATA_ARCHITECTURE.md` 约束；工程验证受 `ENGINEERING_GUARDS.md` 约束；PWA、错误恢复和发布质量受 `FINAL_QUALITY_GUARDS.md` 约束。

## 2. 当前基线

截至 2026-07-31：

| 文件 | 行数 | 主要问题 |
|---|---:|---|
| `app.js` | 1528 | 状态、存储、随机、渲染、动画、解读、历史和生命周期混合 |
| `styles.css` | 4918 | 基础、布局、组件、牌阵、动画和响应式规则集中 |
| `data.js` | 637 | 78 张牌、42 个问题和 4 个牌阵集中 |
| `run.py` | 243 | 规模可接受，但静态服务访问边界需要强化 |

当前历史保存在 `localStorage`，只适合短记录。Phase M 只建立存储接口与兼容边界；完整 IndexedDB 历史、证据链和迁移在 `AU-002`、`AU-003` 实现。

模块化阶段不得改变：

- 四种牌阵及牌位。
- 78 张牌和 42 个问题的现有公开 ID。
- 抽牌数量、顺序和正逆位概率。
- 当前可见交互、动画和旧历史读取行为。
- 现有解读倾向。

## 3. 锁定原则

### 3.1 原生模块与直接运行

- JavaScript 使用浏览器原生 ES Modules。
- 入口使用 `<script type="module">`。
- 不引入 webpack、Vite、Rollup 或其他强制构建工具。
- `python run.py` 继续直接启动完整应用。
- Node.js 只用于开发测试，不是运行依赖。
- 开发脚本可以生成注册表和缓存清单，但生成结果必须提交仓库。

### 3.2 统一 `src/` 根目录

所有可执行源代码和静态知识统一放入 `src/`。

仓库根目录只保留：

- `index.html`
- `run.py`
- `sw.js`
- `manifest.webmanifest`
- 图标
- `assets/`
- `automation/`
- `docs/`
- `scripts/`
- `tests/`

不得在根目录继续新增业务 JavaScript 或大型 CSS。

### 3.3 单一职责

一个模块只负责一个明确领域，例如：

- 随机与洗牌
- 状态管理
- 设置存储
- 历史存储
- 牌面资源路径
- 问题选择
- 牌阵渲染
- 翻牌动画
- 生命周期
- 旧版解读兼容层
- 新规则引擎
- 静态知识加载

不得建立名字不同但仍包揽大部分逻辑的新单体文件。

### 3.4 数据生命周期分离

1. `src/knowledge/`：只读卡牌、问题、牌阵、词典和模板。
2. `src/app/state/`：当前页面临时状态。
3. `src/storage/`：设置、历史和迁移接口。
4. `src/generated/`：由脚本生成并提交的目录、注册表和清单。
5. `assets/`：牌面、牌背、图标和媒体。

静态知识不得访问 DOM、`localStorage`、IndexedDB 或应用状态。

### 3.5 依赖方向

```text
knowledge ─────┐
config ─────────┼──> engine ───> app controllers ───> UI renderers
core ───────────┘          └──> result models

storage ───────────────────────> app controllers
platform ──────────────────────> app bootstrap/controllers
```

约束：

- `src/engine/` 不得访问 DOM、`localStorage` 或 IndexedDB。
- `src/knowledge/` 不得访问 DOM、存储或运行状态。
- `src/storage/` 不得生成解牌结论。
- `src/platform/` 不得包含塔罗业务规则。
- UI 渲染器不得修改规则数据。
- 不允许循环依赖。
- 全局可变对象应逐步移除。

### 3.6 ID 与文件名

业务 ID 使用现有 `kebab-case` 形式，并在 Phase M 中保持不变：

- 卡牌：`major-7`、`cups-two`
- 问题：`career-change`
- 牌阵：`single`、`timeline`、`cross`、`celtic`
- 牌位：保留当前值

文件名可以使用零填充和英文名称，例如 `07-chariot.js`，但文件名不得反向决定或改变业务 ID。

## 4. 文件规模标准

### 4.1 JavaScript

| 级别 | 行数 | 处理要求 |
|---|---:|---|
| 理想 | ≤ 300 | 正常范围 |
| 提醒 | 301–450 | 检查拆分 |
| 超限 | 451–600 | 必须记录保留理由 |
| 禁止 | > 600 | 不得合并，明确生成文件除外 |

额外约束：

- 应用入口建议 ≤ 200 行。
- 单个函数建议 ≤ 80 行；超过 120 行必须拆分或说明。
- 一个文件不得同时承担状态、DOM、存储和业务规则中的三个以上职责。

### 4.2 CSS

| 级别 | 行数 | 处理要求 |
|---|---:|---|
| 理想 | ≤ 500 | 正常范围 |
| 提醒 | 501–700 | 检查拆分 |
| 超限 | 701–900 | 必须记录保留理由 |
| 禁止 | > 900 | 不得合并 |

### 4.3 知识文件

- 每张完整 `CardSemanticProfile` 独立一个文件。
- 每个完整 `QuestionProfile` 使用可独立加载的小文件。
- 单个资料文件建议 ≤ 300 行。
- 轻量目录不得复制完整资料。
- 注册表只保存 ID、加载函数和缓存。
- 禁止重新聚合为大型静态数组。

### 4.4 例外

仅允许：

- 自动生成且不人工编辑的文件
- 第三方原始文件
- 必须保持原样的资源映射

例外必须记录来源和生成方式，不能用“以后再拆”作为理由。

## 5. 目标结构

```text
astra-tarot-simulator/
├── index.html
├── run.py
├── sw.js
├── manifest.webmanifest
├── icon.svg
├── automation/
│   ├── validate.py
│   ├── browser_smoke.py
│   └── README.md
├── src/
│   ├── app/
│   │   ├── bootstrap.js
│   │   ├── dom.js
│   │   ├── state/
│   │   ├── controllers/
│   │   └── renderers/
│   ├── config/
│   ├── core/
│   ├── engine/
│   │   ├── legacy/
│   │   ├── models/
│   │   ├── observations/
│   │   ├── relations/
│   │   ├── claims/
│   │   ├── validation/
│   │   └── rendering/
│   ├── knowledge/
│   │   ├── versions.js
│   │   ├── cards/
│   │   ├── questions/
│   │   ├── spreads/
│   │   ├── vocabularies/
│   │   └── templates/
│   ├── storage/
│   ├── platform/
│   ├── shared/
│   ├── generated/
│   └── styles/
├── assets/
├── docs/
├── scripts/
└── tests/
```

`src/engine/legacy/` 只用于迁移期间保持当前解读行为。新引擎完成后必须删除或明确冻结，不得让新旧逻辑长期互调。

## 6. 静态知识加载

### 6.1 卡牌

- 轻量卡牌目录用于抽牌、图片路径和基础显示。
- 完整牌义一张牌一个模块。
- 注册表按 `cardId` 动态 `import()` 并缓存。
- 单次只加载抽中的 1、3、5 或 10 张资料。
- 资料加载状态不得影响抽牌。

### 6.2 问题

- 选择界面读取轻量问题目录。
- 完整 `QuestionProfile` 在开始解读时按 `questionId` 加载。
- 目录、资料和注册表必须一一对应。

### 6.3 牌阵

牌阵拆为：

- 可见定义与布局
- 固定推理关系图

两者均不得改变当前四种牌阵及牌位。

## 7. CSS 拆分顺序

1. `src/styles/tokens.css`
2. `src/styles/base.css`
3. `src/styles/layout.css`
4. `src/styles/components/`
5. `src/styles/features/setup.css`
6. `src/styles/features/reading.css`
7. `src/styles/features/history.css`
8. `src/styles/animations.css`
9. `src/styles/responsive.css`

`src/styles/index.css` 只负责固定顺序导入，不得继续写大量具体样式。

## 8. Phase M 任务

### MOD-001：模块边界、数据边界与基线验证

目标：

- 建立当前文件、函数、数据和依赖清单。
- 确认最终 `src/` 结构与 ID 规范。
- 建立旧文件到目标模块的唯一迁移映射。
- 建立模块规模和依赖方向检查。
- 记录自动测试、人工交互和旧历史字段基线。
- 建立最小统一 CWapi 验证入口。

产物：

- `docs/MODULE_MAP.md`
- `scripts/check_module_size.py`
- `scripts/check_import_boundaries.py`
- `tests/module_contract_test.js`
- `automation/validate.py`
- `automation/README.md`
- 最小 `src/` 骨架或职责说明

`automation/validate.py --scope baseline` 至少执行：

- 当前 Python 测试
- 当前 Node smoke test
- 模块规模检查
- 依赖边界检查
- 机器可读摘要和可靠退出码

验收：

- 报告三个大文件超限。
- 每个旧职责有唯一目标模块。
- 现有公开 ID 被记录并锁定。
- 静态知识、临时状态、用户数据和生成文件边界明确。
- 原有自动测试与人工流程基线已记录。
- CWapi 能对固定 commit 调用 baseline 验证入口。
- 运行行为不变。

### MOD-002：拆分 CSS

依赖：`MOD-001`

目标：建立 `src/styles/`，按令牌、基础、布局、组件、功能、动画和响应式拆分。

验收：

- `styles.css` 不再作为大型实现文件。
- 任一人工维护 CSS ≤ 900 行。
- 视觉和响应式基线通过。
- PWA 能加载全部 CSS。
- `automation/validate.py` 增加 CSS 与路径检查。

### MOD-003：抽离基础 JavaScript

依赖：`MOD-001`

目标：抽离 `config/`、`core/`、`platform/` 和基础 `storage/` 接口，包括随机、资源路径、HTML 转义、设置和生命周期。

验收：

- 抽牌结果生成逻辑等价。
- 随机源可注入但生产分布不变。
- 设置兼容旧 `localStorage`。
- 页面关闭生命周期等价。
- 无循环依赖。
- 统一验证入口覆盖新增模块测试。

### MOD-004：拆分应用控制器与渲染器

依赖：`MOD-003`

目标：拆分状态、DOM 引用、控制器和渲染器；应用入口只负责组装和启动；强化本地服务访问边界。

验收：

- `src/app/bootstrap.js` 建议 ≤ 200 行。
- 控制器不直接拼装大型知识数据或访问底层存储 API。
- 渲染器不修改规则数据。
- 准备、洗牌、发牌、翻牌、结果和历史交互等价。
- 静态服务白名单和生命周期保护有测试。

### MOD-005：拆分静态知识与旧版解读

依赖：`MOD-004`

目标：

- 将 `data.js` 拆入 `src/knowledge/`。
- 建立轻量卡牌和问题目录。
- 建立旧资料兼容注册表和生成入口。
- 将旧解读逻辑放入 `src/engine/legacy/`。

验收：

- 78 张牌、42 个问题、4 个牌阵数量和公开 ID 不变。
- 抽牌只依赖轻量目录。
- 当前解读结果在兼容测试中等价。
- 目录、注册表和文件路径完整性可自动检查。
- 不开始新版 `CardSemanticProfile` 内容升级。

### MOD-006A：模块入口切换与旧全局清理

依赖：`MOD-002` 至 `MOD-005`

目标：

- 将 `index.html` 切换为模块入口。
- 删除 `window.TarotData` 等旧全局依赖。
- 在确认兼容后删除旧大型入口文件。

验收：

- 不存在超过硬上限的人工维护文件。
- 原功能和旧历史仍可使用。
- 本地启动正常。

### MOD-006B：生成清单与基础分组缓存

依赖：`MOD-006A`

目标：

- 建立卡牌目录、问题目录、动态注册表和预缓存清单生成脚本。
- 缓存区分 shell、knowledge 和四套牌面。
- 验证生成文件是否过期。

验收：

- 所有动态模块进入完整性和缓存清单。
- 生成结果可稳定重建。
- 用户启动时不运行生成脚本。

### MOD-006C：PWA 资源类型回退与缓存验证

依赖：`MOD-006B`

目标：

- 只有导航请求可回退 `index.html`。
- JavaScript、CSS、图片和知识模块失败时返回正确失败。
- 验证分组缓存、离线加载和旧缓存清理。

本任务只完成模块化所需的 PWA 基础正确性。完整原子更新、用户更新提示和上一版本回滚继续由 `PLAT-001` 在发布稳定化前完成。

### MOD-006D：统一验证、全量回归与 Phase M 收口

依赖：`MOD-006C`

目标：

- 完善 `automation/validate.py --scope full`。
- 完成本地启动、浏览器流程、PWA、历史兼容和模块契约回归。
- 通过 CWapi 对固定 commit 获取终态 RESULT。
- 清理临时兼容代码和文档漂移。

验收：

- Phase M 所有验收通过。
- 当前 commit 具有匹配的 CWapi RESULT。
- `TQ-001` 解除阻塞。
- `PROGRESS.md` 将唯一 `NEXT` 更新为 `TQ-001`。

## 9. 任务粒度规则

- 只有没有未拆分子任务的叶子任务可以成为 `NEXT`。
- 父任务只用于汇总，不得直接执行或标记完成。
- 单次任务应能在一个明确 commit 与一组可审计验证中完成。
- 若任务在实施时仍包含多个独立风险面，必须先拆分，不得靠一份巨大检查表硬撑。

## 10. 禁止事项

Phase M 不得：

- 改变四种牌阵或牌位。
- 扩展预设问题。
- 重写 78 张牌的完整语义。
- 实现新版多牌推理。
- 改变正逆位概率。
- 借重构调整结果倾向。
- 引入 npm 运行依赖。
- 提前删除旧历史兼容。

结构重构、资料重写和算法升级必须分开。项目已经有足够多的塔罗牌，不需要再额外抽一张“维护灾难”。