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

当前历史保存在 `localStorage`，只适合短记录。Phase M 只建立存储接口与兼容边界；完整 IndexedDB 历史、证据链和迁移在 `AU-002`、`AU-003A–C` 实现。

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

所有可执行业务源码和静态知识进入 `src/`。不得在根目录继续新增业务 JavaScript 或大型 CSS。

### 3.3 单一职责

一个模块只负责一个明确领域，例如：随机与洗牌、状态、设置、历史、资源路径、问题选择、牌阵渲染、翻牌动画、生命周期、旧版解读兼容或静态知识加载。

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

业务 ID 使用现有 `kebab-case` 并保持不变：

- 卡牌：`major-7`、`cups-two`
- 问题：`career-change`
- 牌阵：`single`、`timeline`、`cross`、`celtic`
- 牌位：保留当前值

文件名可以使用零填充和英文名称，例如 `07-chariot.js`，但不得反向决定业务 ID。

### 3.7 人工源与生成文件

- 人工主来源：完整卡牌、完整问题、牌阵、词典和模板。
- 正式生成结果：轻量目录、动态注册表、knowledge 清单和预缓存清单。
- Phase M 过渡期间若存在临时目录，必须标注 `temporary`，并在 `MOD-006B` 删除或替换。
- 不允许人工目录与生成目录长期并存为两套真相。

## 4. 文件规模标准

### JavaScript

| 级别 | 行数 | 处理要求 |
|---|---:|---|
| 理想 | ≤ 300 | 正常范围 |
| 提醒 | 301–450 | 检查拆分 |
| 超限 | 451–600 | 必须记录保留理由 |
| 禁止 | > 600 | 不得合并，明确生成文件除外 |

应用入口建议 ≤ 200 行；单个函数建议 ≤ 80 行，超过 120 行必须拆分或说明。

### CSS

| 级别 | 行数 | 处理要求 |
|---|---:|---|
| 理想 | ≤ 500 | 正常范围 |
| 提醒 | 501–700 | 检查拆分 |
| 超限 | 701–900 | 必须记录保留理由 |
| 禁止 | > 900 | 不得合并 |

### 知识文件

- 每张完整 `CardSemanticProfile` 独立一个文件。
- 每个完整 `QuestionProfile` 使用可独立加载的小文件。
- 单个资料文件建议 ≤ 300 行。
- 轻量目录不得复制完整资料。
- 注册表只保存 ID、加载函数和缓存。
- 禁止重新聚合为大型静态数组。

例外仅允许自动生成文件、第三方原始文件和必须保持原样的资源映射，并记录来源和生成方式。

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

## 6. CSS 拆分顺序

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

## 7. Phase M 任务

### MOD-001：模块边界、数据边界与基线验证

目标：

- 建立当前文件、函数、数据和依赖清单。
- 确认最终 `src/` 结构、ID 规范和人工源/生成文件边界。
- 建立旧文件到目标模块的唯一迁移映射。
- 建立模块规模和依赖方向检查。
- 记录自动测试、人工交互、旧历史字段和浏览器支持基线。
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
- 原有自动测试、人工流程和浏览器环境基线已记录。
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

目标：抽离 `config/`、`core/`、`platform/` 和基础 `storage/` 接口，包括随机、资源路径、HTML 转义、设置和生命周期客户端。

验收：

- 抽牌结果生成逻辑等价。
- 随机源可注入但生产分布不变。
- 设置兼容旧 `localStorage`。
- 客户端生命周期行为等价。
- 无循环依赖。
- 统一验证入口覆盖新增模块测试。

### MOD-004A：拆分应用状态、控制器与渲染器

依赖：`MOD-003`

目标：拆分状态、DOM 引用、控制器和渲染器；应用入口只负责组装和启动。

验收：

- `src/app/bootstrap.js` 建议 ≤ 200 行。
- 控制器不直接拼装大型知识数据或访问底层存储 API。
- 渲染器不修改规则数据。
- 准备、洗牌、发牌、翻牌、结果和历史交互等价。
- 前端回归失败可定位到明确职责模块。

### MOD-004B：强化本地服务器访问边界

依赖：`MOD-003`

目标：修改 `run.py` 及相关测试，建立静态资源白名单、路径穿越防护、生命周期随机令牌、同源检查、非本机监听警告和 CSP。

验收：

- 只允许应用运行所需路径。
- 内部目录、隐藏文件、编码路径穿越和反斜杠变体被拒绝。
- 生命周期接口拒绝缺失或错误令牌及错误 Origin。
- 默认本机监听行为保持可用。
- 安全测试与前端模块回归独立执行。

### MOD-005：规范化静态知识人工源与旧版解读

依赖：`MOD-004A`

目标：

- 将 `data.js` 内容拆入规范化人工源模块。
- 定义完整卡牌、问题和牌阵源模块需要的轻量元数据。
- 建立旧版解读兼容适配器并放入 `src/engine/legacy/`。
- 建立供后续生成脚本消费的源文件契约。
- 若使用临时目录或注册表，明确标记为过渡产物。

验收：

- 78 张牌、42 个问题、4 个牌阵数量和公开 ID 不变。
- 抽牌只依赖轻量元数据，不依赖完整牌义。
- 当前解读结果在兼容测试中等价。
- 人工源模块不存在重复 ID 和缺失元数据。
- 不开始新版 `CardSemanticProfile` 内容升级。

### MOD-006A：模块入口切换与旧全局清理

依赖：`MOD-002`、`MOD-004A`、`MOD-004B`、`MOD-005`

目标：

- 将 `index.html` 切换为模块入口。
- 删除 `window.TarotData` 等旧全局依赖。
- 在确认兼容后删除旧大型入口文件。

验收：

- 不存在超过硬上限的人工维护文件。
- 原功能和旧历史仍可使用。
- 本地启动正常。

### MOD-006B：正式生成目录、注册表与基础分组缓存

依赖：`MOD-006A`

目标：

- 编写正式生成脚本。
- 从人工源模块生成轻量卡牌目录、轻量问题目录和动态注册表。
- 生成 knowledge 完整性清单和预缓存清单。
- 删除或替换 `MOD-005` 的临时目录和注册表。
- 缓存区分 shell、knowledge 和四套牌面。

验收：

- 所有动态模块进入完整性和缓存清单。
- 生成结果可稳定重建且无人工差异。
- 仓库中不存在第二套手工维护目录。
- 用户启动时不运行生成脚本。

### MOD-006C：PWA 资源类型回退与缓存验证

依赖：`MOD-006B`

目标：

- 只有导航请求可回退 `index.html`。
- JavaScript、CSS、图片和知识模块失败时返回正确失败。
- 区分必需资源和可选牌组资源。
- 验证分组缓存、离线加载和旧缓存清理。

资源等级：

- 必需：shell、knowledge、默认启动配置。
- 可选：`deck-rws`、`deck-arnoult`、`deck-swiss`、`deck-piedmont`。

验收：

- 任一必需资源失败时新版本不进入可用状态。
- 单套可选牌组失败不破坏应用壳和当前稳定缓存。
- 失败牌组能够被标记为未离线可用。

本任务只完成模块化所需的 PWA 基础正确性。完整原子更新、用户更新提示和上一版本回滚由 `PLAT-001` 完成。

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

## 8. 任务粒度规则

- 只有没有未拆分子任务的叶子任务可以成为 `NEXT`。
- 父任务不直接执行，其状态由叶子任务和父级验收派生。
- 单次任务应能在一个明确 commit 与一组可审计验证中完成。
- 若任务仍包含多个独立风险面，必须先拆分。

## 9. 禁止事项

Phase M 不得：

- 改变四种牌阵或牌位。
- 扩展预设问题。
- 重写 78 张牌的完整语义。
- 实现新版多牌推理。
- 改变正逆位概率。
- 借重构调整结果倾向。
- 引入 npm 运行依赖。
- 提前删除旧历史兼容。

结构重构、资料重写和算法升级必须分开。