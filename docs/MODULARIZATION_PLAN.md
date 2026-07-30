# 代码模块化方案

## 1. 目的

本文件定义项目在纯规则解牌引擎开发前必须完成的代码模块化工作。

模块化的目标不是为了让目录看起来复杂，而是为了确保：

- 后续 AI 可以通过 GitHub 精确读取和修改单个职责文件
- 规则、资料、界面、存储和动画互不混杂
- 单次任务只需要修改少量文件
- 代码审查能够定位实际变化
- 新增 78 张高质量单牌资料后不会形成新的超大数据文件
- 项目继续保持离线运行、无构建步骤和轻量依赖

本方案插入在 Phase 0 与原 Phase 1 之间，记为 **Phase M：模块化基础**。Phase M 完成前，不开始 `TQ-001`。

## 2. 当前基线

截至 2026-07-31：

| 文件 | 行数 | 主要问题 |
|---|---:|---|
| `app.js` | 1528 | 状态、存储、随机、界面渲染、动画、解读、历史和生命周期混合 |
| `styles.css` | 4918 | 基础样式、布局、组件、牌阵、动画、响应式规则集中在一个文件 |
| `data.js` | 637 | 78 张牌、问题分类和牌阵配置集中，未来结构化资料扩展后会迅速膨胀 |
| `run.py` | 243 | 规模可接受，暂不强制拆分 |

优先拆分前三个文件。拆分过程中不改变可见功能、四种牌阵、抽牌逻辑和历史行为。

## 3. 锁定原则

### 3.1 使用浏览器原生模块

- JavaScript 使用原生 ES Modules。
- 入口使用 `<script type="module">`。
- 不引入 webpack、Vite、Rollup 或其他必须构建才能运行的工具。
- `python run.py` 仍可直接启动完整应用。
- Node.js 只用于可选测试，不得成为运行依赖。

### 3.2 单一职责

一个模块只负责一个明确领域，例如：

- 随机与洗牌
- 状态管理
- 设置存储
- 历史记录
- 牌面资源路径
- 问题选择界面
- 牌阵渲染
- 翻牌动画
- 旧版解读兼容层
- 新规则引擎

禁止创建名字不同但仍然包揽大部分逻辑的新单体文件。

### 3.3 依赖方向

推荐依赖方向：

```text
data ───────┐
config ─────┼──> engine ───> app controllers ───> UI renderers
utilities ──┘          └──> audit/result models

storage ───────────────────> app controllers
```

约束：

- `engine/` 不得访问 DOM。
- `data/` 不得访问 DOM、localStorage 或应用状态。
- `storage/` 不得生成解牌结论。
- UI 渲染器不得直接修改规则数据。
- 不允许循环依赖。
- 全局可变对象应逐步移除。

### 3.4 保持行为不变

模块化阶段属于结构重构，不顺手重写产品逻辑。

每个拆分任务必须证明：

- 抽牌数量和正逆位逻辑不变
- 四种牌阵及牌位不变
- 页面交互和动画不变
- 历史记录仍可读取
- PWA 和本地启动仍可用
- 原有测试继续通过

规则引擎缺陷由后续任务修复，不在模块化时偷偷混入大规模行为变化。

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

### 4.3 数据文件

- 每张完整 `CardSemanticProfile` 独立一个文件。
- 单张牌文件建议 ≤ 300 行，禁止把多张完整牌资料重新堆回一个大型数组。
- 花色和大阿卡纳目录只使用轻量索引文件聚合导出。
- 问题、牌阵、模板和词典各自独立。
- 索引文件只做导入和导出，不包含大段业务数据。

### 4.4 例外

只有下列内容可以申请例外：

- 自动生成且不人工编辑的文件
- 第三方原始文件
- 必须保持原样的资源映射

例外文件必须在文件头或文档中说明生成来源，不能用“以后再拆”作为理由。

## 5. 目标目录结构

最终结构可在 `MOD-001` 中小幅调整，但职责边界不得倒退。

```text
astra-tarot-simulator/
├── app/
│   ├── bootstrap.js
│   ├── dom.js
│   ├── state.js
│   ├── selectors.js
│   ├── lifecycle.js
│   ├── controllers/
│   │   ├── setup-controller.js
│   │   ├── reading-controller.js
│   │   ├── history-controller.js
│   │   └── dialog-controller.js
│   └── renderers/
│       ├── setup-renderer.js
│       ├── spread-renderer.js
│       ├── insight-renderer.js
│       └── history-renderer.js
├── config/
│   └── deck-styles.js
├── core/
│   ├── random.js
│   ├── reading-factory.js
│   ├── card-assets.js
│   └── html.js
├── storage/
│   ├── settings-store.js
│   ├── history-store.js
│   └── migrations.js
├── engine/
│   ├── legacy/
│   │   ├── card-interpretation.js
│   │   ├── relation-summary.js
│   │   └── synthesis.js
│   └── README.md
├── data/
│   ├── cards/
│   │   ├── index.js
│   │   ├── major/
│   │   │   ├── 00-fool.js
│   │   │   └── ...
│   │   └── minor/
│   │       ├── wands/
│   │       ├── cups/
│   │       ├── swords/
│   │       └── pentacles/
│   ├── questions/
│   │   ├── index.js
│   │   └── categories.js
│   └── spreads.js
├── styles/
│   ├── index.css
│   ├── tokens.css
│   ├── base.css
│   ├── layout.css
│   ├── utilities.css
│   ├── components/
│   ├── features/
│   ├── animations.css
│   └── responsive.css
├── tests/
└── docs/
```

`engine/legacy/` 只是迁移期间保留当前解读行为的兼容层。新规则引擎完成后应删除或明确冻结，不得让新旧逻辑长期互相调用。

## 6. 数据模块策略

高质量单牌资料将明显大于当前每张牌的几行文本，因此采用“一张牌一个模块”。

示例：

```js
// data/cards/major/07-chariot.js
export const chariot = Object.freeze({
  id: "major_07",
  // 完整 CardSemanticProfile
});
```

聚合索引：

```js
// data/cards/major/index.js
export { fool } from "./00-fool.js";
export { magician } from "./01-magician.js";
// ...
```

这样做的理由：

- 修改战车时不需要提交整个 78 张牌文件
- GitHub diff 只显示一张牌的变化
- 单牌评分和审查可以绑定文件
- 多个任务可以处理不同牌组而减少冲突
- 单张牌失败不会让审查者在数千行数据中寻找原因

运行时仍由索引聚合为完整牌组，不改变抽牌接口。

## 7. CSS 拆分策略

`styles.css` 按以下顺序迁移：

1. `tokens.css`：变量、颜色、字体、圆角和阴影
2. `base.css`：reset、HTML、body、通用元素
3. `layout.css`：顶栏、工作区、面板和整体栅格
4. `components/`：按钮、弹窗、标签、提示、卡片等
5. `features/setup.css`：问题、牌阵和牌面选择
6. `features/reading.css`：洗牌、发牌、牌桌和解读区
7. `features/history.css`：历史记录
8. `animations.css`：关键帧和运动规则
9. `responsive.css`：媒体查询与移动端

`styles/index.css` 只负责按固定顺序导入，禁止继续写大量具体样式。

## 8. JavaScript 拆分策略

拆分遵循“先低风险基础模块，后控制器和界面”的顺序。

首先抽离：

- deck style 配置
- HTML 转义
- 随机与洗牌
- 牌面资源路径
- 设置存储
- 历史存储

随后拆分：

- DOM 引用
- 状态与选择器
- 设置页渲染
- 牌桌渲染
- 动画流程
- 历史和弹窗控制
- 生命周期与 PWA 注册

最后把当前解读逻辑移动到 `engine/legacy/`，保持行为不变，为新规则引擎腾出清楚边界。

## 9. Phase M 任务

### MOD-001：模块边界与基线测试

目标：

- 确认现有主要文件、职责和依赖
- 建立目标目录骨架
- 建立模块大小检查脚本
- 建立重构前行为基线

建议产物：

- `scripts/check_module_size.py`
- `tests/module_contract_test.js`
- 目标目录中的说明或最小入口文件

验收：

- 能报告超过限制的源文件
- 明确每个旧函数迁移目标
- 原有测试结果已记录
- 不改变运行行为

### MOD-002：拆分 CSS

依赖：MOD-001

验收：

- `styles.css` 被替换为模块化样式入口
- 所有人工维护 CSS 文件 ≤ 900 行
- 页面主要布局、动画和响应式表现无回归
- PWA 缓存包含新样式文件

### MOD-003：抽离基础 JavaScript 模块

依赖：MOD-001

范围：配置、工具、随机、资源路径、设置和历史存储。

验收：

- 对应逻辑从 `app.js` 移除
- 模块拥有独立测试
- 现有 localStorage 键和数据行为不变
- 随机洗牌行为通过测试

### MOD-004：拆分应用控制器与渲染器

依赖：MOD-003

验收：

- `app.js` 被原生模块入口替代
- 入口文件 ≤ 200 行
- 任一人工维护 JS 文件 ≤ 600 行
- 设置、洗牌、发牌、翻牌、历史、弹窗和关闭生命周期正常

### MOD-005：拆分数据与旧版解读

依赖：MOD-004

验收：

- 牌、问题和牌阵不再集中在 `data.js`
- 当前 78 张牌数量、ID 和含义保持一致
- 旧版解读移动到明确兼容目录
- 为后续“一张牌一个 CardSemanticProfile 文件”建立目录和索引
- 现有 smoke test 适配新数据入口

### MOD-006：缓存、回归和清理

依赖：MOD-002、MOD-005

验收：

- service worker 缓存清单覆盖全部新模块
- 清除旧的单体入口和无用全局变量
- 无循环依赖
- 所有模块规模检查通过
- Python 与 Node 测试通过
- 完成一次本地浏览器全流程检查
- `TQ-001` 可以在稳定模块结构上开始

## 10. 后续任务规则

Phase M 完成后，所有新任务仍必须遵守：

1. 开始前检查目标文件是否接近提醒阈值。
2. 新功能优先新增小模块，不向入口文件堆积。
3. 修改单张牌时只改该牌文件及必要测试。
4. 批量任务按大阿卡纳、花色或明确批次拆分。
5. 每次完成任务后运行模块规模检查。
6. `PROGRESS.md` 必须列出本轮新增和修改文件。

模块化不是一次性清理活动，而是后续开发的持续约束。