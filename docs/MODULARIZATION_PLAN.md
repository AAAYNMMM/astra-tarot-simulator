# 代码模块化方案

## 1. 文档职责

本文档定义 Phase M 的架构目标、模块边界、规模限制和迁移不变量。

任务编号、依赖、状态、渐进迁移顺序和验收证据以 `EXECUTION_CONTRACTS.md` 为唯一来源；实时状态以 `PROGRESS.md` 为准。

## 2. 目标

Phase M 必须在新版规则引擎和批量单牌资料之前完成，目标是：

- 后续代理能精确读取和修改小范围文件。
- 规则、知识、界面、状态、存储、平台、动画和PWA互不混杂。
- 每次抽离的模块立刻由真实应用使用和验证。
- 78张牌和84–96个问题不会形成新的巨型文件。
- 项目保持离线、原生ES Modules、无强制构建步骤。
- 静态知识、临时状态、用户数据、人工源和生成文件按生命周期分离。
- 从第一个非纯文档任务开始可由CWapi对固定commit验证。

## 3. 当前基线

截至2026-07-31：

| 文件 | 行数 | 主要问题 |
|---|---:|---|
| `app.js` | 1528 | 状态、DOM、存储、随机、动画、解读、历史和生命周期混合 |
| `styles.css` | 4918 | 基础、布局、组件、牌阵、动画和响应式集中 |
| `data.js` | 637 | 78张牌、42个问题和4个牌阵集中 |
| `run.py` | 243 | 规模可接受，但服务访问边界需要强化 |

这些已知超限由 `automation/quality-baseline.json` 临时登记：未增长时WARN，增长或新增超限时FAIL，Phase M终态必须清零。

## 4. 模块化不变量

Phase M不得改变：

- 四种牌阵及牌位。
- 78张牌、42个问题、4个牌阵和牌位的公开ID。
- 抽牌数量、顺序和正逆位概率。
- 当前可见交互、动画和旧历史读取行为。
- 当前解读倾向。
- `python run.py`直接启动方式。

结构重构、资料重写和算法升级必须分开。

## 5. 原生模块与渐进接线

- JavaScript使用浏览器原生ES Modules。
- 最终入口使用 `<script type="module">`。
- 不引入webpack、Vite、Rollup或其他强制构建工具。
- Node.js只用于开发测试，不是运行依赖。
- 生成脚本可以生成注册表和清单，生成结果必须提交仓库。

迁移采用渐进接线：

1. 建立最小模块入口和受控兼容桥。
2. 新模块逐个替换旧职责，并由真实应用调用。
3. 每步执行自动和人工回归。
4. 最后删除兼容桥、旧全局和旧大型文件。

禁止先建立未接线模块，最后一次性切换全部入口。

在正式预缓存清单生成器完成前，新增并被真实入口使用的JS/CSS模块必须同步更新临时Service Worker资源列表和离线烟雾测试。

## 6. 统一 `src/` 根目录

最终结构：

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
│   ├── quality-baseline.json
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

根目录不得继续新增业务JavaScript或大型CSS。

## 7. 模块职责

### `src/app/`

- 页面启动和组装。
- DOM引用。
- 当前页面状态。
- 用户操作控制器。
- 纯显示渲染器。

### `src/config/`

- 应用版本。
- 默认值。
- 牌组显示配置。
- 资源路径规则。
- 功能开关。

### `src/core/`

- 通用数据结构。
- 不依赖浏览器状态的工具。
- HTML转义和稳定ID工具。
- 随机接口契约。

### `src/engine/`

- Observation、Relation、Claim、校验和渲染规则。
- 不访问DOM、localStorage或IndexedDB。

### `src/knowledge/`

- 卡牌、问题、牌阵、词典和模板人工主来源。
- 不访问UI、状态或存储。

### `src/storage/`

- 设置、历史、迁移和降级接口。
- 不生成解牌结论。

### `src/platform/`

- 浏览器和本地启动器交互。
- 生命周期、PWA、能力检测。
- 不包含塔罗业务规则。

### `src/generated/`

- 脚本生成并提交的轻量目录、注册表、完整性清单、artifact manifest和预缓存清单。
- 不得人工直接编辑。

## 8. 依赖方向

```text
knowledge ─────┐
config ─────────┼──> engine ───> app controllers ───> UI renderers
core ───────────┘          └──> result models

storage ───────────────────────> app controllers
platform ──────────────────────> bootstrap/controllers
```

约束：

- `engine/` 不访问DOM和存储。
- `knowledge/` 不访问UI、状态和存储。
- `storage/` 不生成业务结论。
- `platform/` 不包含塔罗规则。
- 渲染器不修改规则数据。
- 不允许循环依赖。
- 全局可变对象必须移除。

## 9. 文件规模

### JavaScript

| 级别 | 行数 | 处理 |
|---|---:|---|
| 理想 | ≤300 | 正常 |
| 提醒 | 301–450 | 检查拆分 |
| 超限 | 451–600 | 必须记录保留理由 |
| 禁止 | >600 | 人工文件不得合并 |

入口建议≤200行；单个函数建议≤80行，超过120行必须拆分或说明。

### CSS

| 级别 | 行数 | 处理 |
|---|---:|---|
| 理想 | ≤500 | 正常 |
| 提醒 | 501–700 | 检查拆分 |
| 超限 | 701–900 | 必须记录保留理由 |
| 禁止 | >900 | 人工文件不得合并 |

### 知识文件

- 每张完整 `CardSemanticProfile` 独立文件。
- 每个完整 `QuestionProfile` 使用可独立加载的小文件。
- 单个资料文件建议≤300行。
- 轻量目录不得复制完整资料。
- 注册表只保存ID、加载函数和缓存。
- 禁止重新聚合为大型静态数组。

### 例外

只允许自动生成文件、第三方原始文件和必须保持原样的资源映射。例外必须记录来源和生成方式。

## 10. CSS目标结构

```text
src/styles/
├── index.css
├── tokens.css
├── base.css
├── layout.css
├── components/
├── features/
│   ├── setup.css
│   ├── reading.css
│   └── history.css
├── animations.css
└── responsive.css
```

`index.css`只负责固定顺序导入，不继续承载大量具体样式。

## 11. 静态知识加载

### 卡牌

- 轻量目录用于抽牌、图片路径和基础显示。
- 完整牌义一张牌一个人工源模块。
- 注册表按 `cardId` 动态导入并缓存。
- 单次只加载抽中的1、3、5或10张资料。
- 资料加载状态不得影响抽牌和正逆位。

### 问题

- 选择界面读取轻量目录。
- 完整QuestionProfile在解读时按ID加载。
- 人工源、目录、注册表和artifact manifest一一对应。

### 牌阵

牌阵拆为可见定义/布局与固定推理关系图，两者均不得改变当前结构和牌位ID。

## 12. 人工源与生成文件

人工主来源：

- 单张CardSemanticProfile。
- 单题QuestionProfile。
- 固定牌阵与关系图。
- 词典和模板。

正式生成：

- 轻量卡牌目录和动态注册表。
- 轻量问题目录和动态注册表。
- knowledge完整性清单。
- artifact manifest和内容哈希。
- PWA预缓存清单。

过渡期临时目录必须明确标记，并在正式生成器接管时删除。仓库不得保留两套人工目录。

## 13. 服务安全边界

本地服务器最终只允许应用入口、`src/`、`assets/`、manifest、图标和必要PWA文件。拒绝内部目录、隐藏文件、路径穿越和编码绕过。生命周期接口使用随机令牌和Origin检查；默认只监听 `127.0.0.1`。

前端模块拆分与服务器安全属于不同风险面，独立实施和验证。

## 14. Phase M完成条件

- 真实应用完全通过原生ES Modules运行。
- 兼容桥和旧全局已删除。
- 人工JavaScript和CSS均满足硬上限。
- 公开ID、行为、历史读取和随机分布保持。
- 静态知识、状态、存储、平台和UI边界可自动检查。
- 人工源和生成文件没有双重真相。
- PWA清单覆盖全部活动模块并区分离线状态。
- `automation/validate.py --scope full` 由CWapi对固定commit通过。
- 实时进度将唯一 `NEXT` 更新到Phase 1。

任务编号和具体顺序见 `EXECUTION_CONTRACTS.md`，不得在本文件另建一套任务图。
