# 代码模块化方案

## 1. 目的

本文件定义项目在纯规则解牌引擎开发前必须完成的代码模块化工作。

模块化目标：

- 后续 AI 可以通过 GitHub 精确读取和修改单个职责文件
- 规则、静态知识、界面、存储、平台能力和动画互不混杂
- 单次任务只修改少量文件
- 代码审查能够定位实际变化
- 78 张高质量单牌和大量问题配置不会形成新的超大文件
- 项目继续保持离线、无强制构建步骤和轻量依赖
- 静态知识与用户历史采用适合各自生命周期的存储方式

本方案插入在 Phase 0 与原 Phase 1 之间，记为 **Phase M：模块化基础**。Phase M 完成前，不开始 `TQ-001`。

数据分层、IndexedDB 和缓存细节同时受 `DATA_ARCHITECTURE.md` 约束。

## 2. 当前基线

截至 2026-07-31：

| 文件 | 行数 | 主要问题 |
|---|---:|---|
| `app.js` | 1528 | 状态、存储、随机、界面渲染、动画、解读、历史和生命周期混合 |
| `styles.css` | 4918 | 基础样式、布局、组件、牌阵、动画、响应式规则集中在一个文件 |
| `data.js` | 637 | 78 张牌、问题分类和牌阵配置集中，未来结构化资料扩展后会迅速膨胀 |
| `run.py` | 243 | 规模可接受，暂不强制拆分 |

当前用户历史保存在 `localStorage`。这适合现有短记录，但不适合后续保存随机种子、Observation、Relation、Claim、版本和校验结果。

优先拆分前三个大文件，并建立新的数据边界。拆分过程中不改变可见功能、四种牌阵、抽牌逻辑和现有历史行为。

## 3. 锁定原则

### 3.1 使用浏览器原生模块

- JavaScript 使用原生 ES Modules。
- 入口使用 `<script type="module">`。
- 不引入 webpack、Vite、Rollup 或其他必须构建才能运行的工具。
- `python run.py` 仍可直接启动完整应用。
- Node.js 只用于可选测试，不得成为运行依赖。
- 开发脚本可以生成缓存清单等文件，但生成结果必须提交仓库。

### 3.2 统一 src 根目录

所有可执行源代码和静态知识统一放入 `src/`。

仓库根目录只保留：

- `index.html`
- `run.py`
- `sw.js`
- `manifest.webmanifest`
- 图标
- `assets/`
- `docs/`
- `scripts/`
- `tests/`

不在根目录继续新增业务 JavaScript 或大型 CSS。

### 3.3 单一职责

一个模块只负责一个明确领域，例如：

- 随机与洗牌
- 状态管理
- 设置存储
- 历史记录
- 牌面资源路径
- 问题选择界面
- 牌阵渲染
- 翻牌动画
- 生命周期
- 旧版解读兼容层
- 新规则引擎
- 静态知识加载

禁止创建名字不同但仍然包揽大部分逻辑的新单体文件。

### 3.4 数据生命周期分离

项目数据分为：

1. `src/knowledge/`：只读卡牌、问题、牌阵、词典和模板。
2. `src/app/state/`：当前页面临时状态。
3. `src/storage/`：设置、历史和迁移。
4. `src/generated/`：由脚本生成并提交的清单。
5. `assets/`：牌面、牌背和媒体资源。

静态知识不得访问 DOM、localStorage、IndexedDB 或应用状态。

### 3.5 依赖方向

```text
knowledge ─────┐
config ─────────┼──> engine ───> app controllers ───> UI renderers
core ───────────┘          └──> result models

storage ───────────────────────> app controllers
platform ──────────────────────> app bootstrap/controllers
```

约束：

- `engine/` 不得访问 DOM、localStorage 或 IndexedDB。
- `knowledge/` 不得访问 DOM、存储或运行状态。
- `storage/` 不得生成解牌结论。
- `platform/` 不得包含塔罗业务规则。
- UI 渲染器不得修改规则数据。
- 不允许循环依赖。
- 全局可变对象应逐步移除。

### 3.6 保持行为不变

模块化阶段属于结构重构，不顺手重写产品逻辑。

每个拆分任务必须证明：

- 抽牌数量和正逆位逻辑不变
- 四种牌阵及牌位不变
- 页面交互和动画不变
- 现有历史记录仍可读取
- PWA 和本地启动仍可用
- 原有测试继续通过

规则引擎缺陷由后续任务修复，不在模块化时混入大规模行为变化。

## 4. 文件规模标准

行数不是代码质量本身，但在本项目中也是 GitHub 可编辑性的工程约束。

### 4.1 JavaScript

| 级别 | 行数 | 处理要求 |
|---|---:|---|
| 理想 | ≤ 300 | 正常范围 |
| 提醒 | 301–450 | 检查是否需要拆分 |
| 超限 | 451–600 | 必须记录保留理由 |
| 禁止 | > 600 | 不得合并，除非是明确生成文件 |

额外约束：

- 应用入口文件建议 ≤ 200 行。
- 单个函数建议 ≤ 80 行；超过 120 行必须拆分或说明原因。
- 一个文件不得同时承担状态、DOM、存储和业务规则中的三个以上职责。

### 4.2 CSS

| 级别 | 行数 | 处理要求 |
|---|---:|---|
| 理想 | ≤ 500 | 正常范围 |
| 提醒 | 501–700 | 检查拆分 |
| 超限 | 701–900 | 必须记录保留理由 |
| 禁止 | > 900 | 不得合并 |

CSS 按设计令牌、基础元素、布局、组件、功能区域、动画和响应式规则拆分。

### 4.3 知识数据文件

- 每张完整 `CardSemanticProfile` 独立一个文件。
- 每个完整 `QuestionProfile` 使用可独立加载的小文件。
- 单个资料文件建议 ≤ 300 行。
- 卡牌和问题目录只保存轻量显示信息。
- 注册表只保存 ID、加载函数和缓存，不包含完整资料。
- 牌阵、模板和词典按职责拆分。
- 禁止把详细资料重新聚合成一个大型静态数组。

### 4.4 例外

只有下列内容可以申请例外：

- 自动生成且不人工编辑的文件
- 第三方原始文件
- 必须保持原样的资源映射

例外文件必须说明生成来源，不能用“以后再拆”作为理由。

## 5. 目标项目结构

```text
astra-tarot-simulator/
├── index.html
├── run.py
├── sw.js
├── manifest.webmanifest
├── icon.svg
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
│   │   │   ├── catalog/
│   │   │   ├── registry.js
│   │   │   ├── major/
│   │   │   └── minor/
│   │   ├── questions/
│   │   │   ├── catalog/
│   │   │   ├── registry.js
│   │   │   └── profiles/
│   │   ├── spreads/
│   │   ├── vocabularies/
│   │   └── templates/
│   ├── storage/
│   │   ├── database.js
│   │   ├── settings-store.js
│   │   ├── reading-store.js
│   │   ├── fallback-store.js
│   │   ├── serializers/
│   │   └── migrations/
│   ├── platform/
│   ├── shared/
│   ├── generated/
│   └── styles/
├── assets/
├── docs/
├── scripts/
└── tests/
```

更完整的目录与数据职责见 `DATA_ARCHITECTURE.md`。

`src/engine/legacy/` 只是迁移期间保留当前解读行为的兼容层。新规则引擎完成后应删除或明确冻结，不得让新旧逻辑长期互相调用。

## 6. 静态知识加载策略

### 6.1 卡牌

- 轻量卡牌目录用于抽牌、图片路径和基础显示。
- 完整牌义一张牌一个模块。
- `registry.js` 使用动态 `import()` 按 cardId 加载。
- 同一次会话缓存已加载资料。
- 每次只加载抽中的 1、3、5 或 10 张详细资料。
- 详细资料加载不得影响抽牌结果。

### 6.2 问题

- 问题选择界面读取轻量目录。
- 完整 `QuestionProfile` 在开始解读时按 questionId 加载。
- 问题目录和完整配置必须通过一一对应测试。

### 6.3 牌阵

牌阵拆为：

- 可见定义与布局
- 推理关系图

两者均保持现有四种牌阵与牌位不变。

## 7. 用户存储策略

### 7.1 设置

小型同步设置继续使用 `localStorage`：

- 牌面风格
- 界面偏好
- 轻量启动选项

### 7.2 历史

完整历史迁移到 IndexedDB：

- `readings`：完整 ReadingRecord
- `metadata`：Schema 和迁移状态

控制器只调用统一存储接口，不直接访问底层浏览器 API。

Phase M 只建立接口边界和兼容层。完整 ReadingRecord、IndexedDB 迁移和审计数据在 `AU-002`、`AU-003` 实现，避免结构重构与业务升级同时爆炸。

## 8. CSS 拆分策略

`styles.css` 按以下顺序迁移：

1. `src/styles/tokens.css`：变量、颜色、字体、圆角和阴影
2. `src/styles/base.css`：reset、HTML、body、通用元素
3. `src/styles/layout.css`：顶栏、工作区、面板和整体栅格
4. `src/styles/components/`：按钮、弹窗、标签、提示、卡片等
5. `src/styles/features/setup.css`：问题、牌阵和牌面选择
6. `src/styles/features/reading.css`：洗牌、发牌、牌桌和解读区
7. `src/styles/features/history.css`：历史记录
8. `src/styles/animations.css`：关键帧和运动规则
9. `src/styles/responsive.css`：媒体查询与移动端

`src/styles/index.css` 只负责按固定顺序导入，禁止继续写大量具体样式。

## 9. Phase M 任务

### MOD-001：模块边界与基线测试

目标：

- 建立当前文件、函数、数据和依赖清单
- 确认最终 `src/` 目录结构
- 建立旧文件到目标模块的迁移映射
- 建立模块规模和依赖检查
- 记录自动测试与关键交互基线

产物：

- `docs/MODULE_MAP.md`
- `scripts/check_module_size.py`
- `scripts/check_import_boundaries.py`，若本任务范围允许
- `tests/module_contract_test.js`
- 最小 `src/` 骨架或说明文件

验收：

- 报告三个大文件超限
- 每个旧职责有唯一目标模块
- 记录静态知识、临时状态和用户存储边界
- 原有测试和人工流程基线已记录
- 运行行为不变

### MOD-002：拆分 CSS

依赖：MOD-001

目标：

- 建立 `src/styles/`
- 按令牌、基础、布局、组件、功能、动画和响应式拆分
- 保持视觉和响应式行为

验收：

- `styles.css` 不再作为大型实现文件
- 任一人工维护 CSS ≤ 900 行
- 截图或人工视觉基线通过
- PWA 能加载全部 CSS

### MOD-003：抽离基础 JavaScript 模块

依赖：MOD-001

目标：

- 抽离 `config/`、`core/`、`platform/` 和基础 `storage/`
- 抽离随机、资源路径、HTML 转义、设置和生命周期
- 保持原有公开行为

验收：

- 抽牌结果生成逻辑等价
- 设置兼容旧 localStorage
- 页面关闭生命周期等价
- 无循环依赖

### MOD-004：拆分应用控制器与渲染器

依赖：MOD-003

目标：

- 拆分状态、DOM 引用、控制器和渲染器
- 应用入口只负责组装和启动

验收：

- `src/app/bootstrap.js` 建议 ≤ 200 行
- 控制器不直接拼装大型知识数据
- 渲染器不修改规则数据
- 准备、洗牌、发牌、翻牌、结果和历史交互等价

### MOD-005：拆分静态知识与旧版解读

依赖：MOD-004

目标：

- 将当前 `data.js` 拆入 `src/knowledge/`
- 建立卡牌和问题轻量目录
- 建立旧资料兼容注册表
- 将旧解读逻辑放入 `src/engine/legacy/`

验收：

- 78 张牌、42 个问题、4 个牌阵数量和 ID 不变
- 抽牌只依赖轻量目录
- 当前解读结果在兼容测试中等价
- 不开始新版 CardSemanticProfile 内容升级

### MOD-006：缓存、回归和清理

依赖：MOD-002 至 MOD-005

目标：

- 更新 `index.html` 为模块入口
- 建立预缓存清单生成脚本
- 按组管理 shell、knowledge 和牌面缓存
- 删除旧大型入口文件
- 完成全量回归

验收：

- 不存在超过硬上限的人工维护文件
- 不存在旧全局 `window.TarotData` 依赖
- 所有动态模块被缓存清单覆盖
- 本地启动和 PWA 均可运行
- 原历史仍可读
- TQ-001 解除阻塞

## 10. 模块化阶段的禁止事项

Phase M 不得：

- 改变四种牌阵或牌位
- 扩展预设问题
- 重写 78 张牌的完整语义
- 实现新版多牌推理
- 改变正逆位概率
- 借重构调整结果倾向
- 引入 npm 运行依赖
- 提前删除旧历史兼容

把结构重构、资料重写和算法升级同时进行，会让任何回归失败都无法定位。项目已经有足够多的塔罗牌，不需要再额外抽一张“维护灾难”。