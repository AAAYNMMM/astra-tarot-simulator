# MOD-001 模块、数据与平台基线

**状态：MOD-001 基线**

本文件记录当前大型文件的职责、唯一迁移目标、公开 ID、存储结构和平台行为。它描述当前事实与后续归属，不切换运行入口，也不实现后期架构。

---

## 1. 当前入口与规模

```text
index.html
├── styles.css
├── data.js  → window.TarotData
└── app.js   → 读取 window.TarotData
```

| 文件 | 当前行数 | 当前职责 | 本阶段判定 |
|---|---:|---|---|
| `app.js` | 1528 | 状态、随机、存储、控制器、渲染、动画、旧解读、历史、PWA和生命周期 | 已登记技术债，WARN，不得增长 |
| `styles.css` | 4918 | 令牌、布局、组件、牌桌、牌阵、动画、弹窗、历史和响应式 | 已登记技术债，WARN，不得增长 |
| `data.js` | 637 | 78张牌、42问题、4牌阵及旧全局导出 | 已登记技术债，WARN，不得增长 |
| `run.py` | 243 | 本地HTTP服务、生命周期、端口与浏览器启动 | 规模可接受，访问边界待强化 |
| `sw.js` | 77 | 全资源预缓存、运行时缓存和离线回退 | 行为待 `MOD-006C` 分阶段替换 |

机器规则见 `automation/quality-baseline.json`。

---

## 2. 目标目录与依赖方向

详细职责见 `src/README.md`。目标主层：

```text
src/app
src/config
src/core
src/engine
src/generated
src/knowledge
src/platform
src/storage
src/styles
src/ui
```

主要依赖方向：

```text
app → ui / engine / knowledge / storage / platform / core / config / generated
ui → core / config
engine → knowledge / core / config
knowledge → core / config
storage → core / config
platform → core / config
generated → knowledge / config
core → config
config → 无
```

硬边界：

- `engine` 不访问 DOM 或存储。
- `knowledge` 不访问 UI、状态或存储。
- `ui` 不直接访问 IndexedDB 或 `localStorage`。
- `app` 负责组合依赖，不在控制器里重新实现底层能力。
- `generated` 只能由脚本生成。
- 依赖图不得存在循环。

---

## 3. `app.js` 职责迁移表

每项旧职责只有一个主要目标模块和一个负责迁移的叶子任务。

| 当前职责/代表符号 | 唯一主要目标 | 迁移任务 |
|---|---|---|
| `HISTORY_KEY`、`SETTINGS_KEY`、`HISTORY_LIMIT` | `src/config/legacy-storage.js` | `MOD-003B` |
| `DECK_STYLES`、`LEGACY_DECK_IDS` | `src/config/decks.js` | `MOD-003B` |
| `cardImagePath`、`cardBackPath` | `src/platform/assets.js` | `MOD-003B` |
| `randomUnit`、`secureShuffle` | `src/core/random/legacy-random.js` | `MOD-003B` |
| lifecycle client ID、`lifecycleEndpoint`、通知和EventSource | `src/platform/lifecycle-client.js` | `MOD-003B` |
| `loadSettings`、`saveSettings` | `src/storage/settings.js` | `MOD-003B` |
| `loadHistory`、`writeHistory` | `src/storage/legacy-history.js` | `MOD-003B` |
| DOM引用表和`byId` | `src/ui/dom.js` | `MOD-004A` |
| 页面 `state` | `src/app/state/reading-state.js` | `MOD-004A` |
| `currentCategory`、`currentQuestion`、`currentSpread`、`currentDeckStyle` | `src/app/selectors/current-selection.js` | `MOD-004A` |
| `renderCategories`、`renderQuestions`、`renderSpreads`、`renderDeckStyles` | `src/ui/renderers/setup.js` | `MOD-004A` |
| `setSetupLocked`、`setJourneyStep`、`resetReadingView` | `src/ui/renderers/journey.js` | `MOD-004A` |
| `createReading` | `src/app/services/legacy-reading-factory.js` | `MOD-004A` |
| `startReading`、`dealCards`、`revealCard`、`revealAllCards`、完成流程 | `src/app/controllers/reading-controller.js` | `MOD-004A` |
| 洗牌和发牌动画、`delay` | `src/ui/animations/reading.js` | `MOD-004A` |
| `cardMarkup`、牌面选择和牌桌状态 | `src/ui/renderers/card-table.js` | `MOD-004A` |
| 单牌解读渲染 | `src/ui/renderers/card-insight.js` | `MOD-004A` |
| `categoryLens`、`cardStructureNote`、`orientationNote`、反思提示 | `src/engine/legacy/card-reading.js` | `MOD-005` |
| 旧元素、牌型、连接、标题、叙事和行动综合 | `src/engine/legacy/synthesis.js` | `MOD-005` |
| 综合结果渲染 | `src/ui/renderers/summary.js` | `MOD-004A` |
| `readingRecord`、`persistCurrentReading` | `src/storage/legacy-record.js` | `MOD-003B` |
| `renderHistory`、详情展开和删除交互 | `src/ui/renderers/history.js` | `MOD-004A` |
| `openDialog`、确认框、焦点返回 | `src/ui/components/dialogs.js` | `MOD-004A` |
| `showToast` | `src/ui/components/toast.js` | `MOD-004A` |
| install prompt和Service Worker注册 | `src/platform/pwa-client.js` | `MOD-003B` |
| 事件监听与快捷键 | `src/app/events.js` | `MOD-004A` |
| 初始化和依赖组合 | `src/app/bootstrap.js` | `MOD-003A`、`MOD-004A` |

`MOD-003A`建立真实ES Module入口和兼容桥；`MOD-006A`只删除已经被以上模块验证替代的旧IIFE、全局和根目录大型文件。

---

## 4. `data.js` 职责迁移表

当前 `data.js` 是人工源，但其记录不是最终 `CardSemanticProfile` 或 `QuestionProfile`。

| 当前内容 | Phase M主要目标 | 后续最终目标 | 迁移任务 |
|---|---|---|---|
| 22张大阿卡纳旧记录 | `src/knowledge/legacy/cards/major.js` | `src/knowledge/cards/<cardId>.js` | `MOD-005`；后续 `TQ-101` |
| 权杖旧记录 | `src/knowledge/legacy/cards/wands.js` | 一张牌一个正式模块 | `MOD-005`；后续 `TQ-102` |
| 圣杯旧记录 | `src/knowledge/legacy/cards/cups.js` | 一张牌一个正式模块 | `MOD-005`；后续 `TQ-103` |
| 宝剑旧记录 | `src/knowledge/legacy/cards/swords.js` | 一张牌一个正式模块 | `MOD-005`；后续 `TQ-104` |
| 星币旧记录 | `src/knowledge/legacy/cards/pentacles.js` | 一张牌一个正式模块 | `MOD-005`；后续 `TQ-105` |
| 六领域、42个旧问题 | `src/knowledge/legacy/questions/<domain>.js` | `src/knowledge/questions/<questionId>.js` | `MOD-005`；后续 `QP-003` |
| 四牌阵定义 | `src/knowledge/spreads/definitions.js` | 同一人工源，另建固定结构图 | `MOD-005`；后续 `PO-002` |
| `window.TarotData`导出 | `src/knowledge/legacy/index.js`与兼容桥 | 删除旧全局 | `MOD-003A`、`MOD-006A` |

正式卡牌、问题、牌阵、词典和模板是人工主来源。轻量目录、动态注册表、knowledge清单、artifact manifest和预缓存清单只由 `MOD-006B` 脚本生成。

---

## 5. `styles.css` 职责迁移表

所有拆出的CSS必须立即由真实页面加载，不能成为未接线样品。

| 当前样式组 | 唯一目标文件 | 迁移任务 |
|---|---|---|
| 颜色、间距、字体、阴影和尺寸令牌 | `src/styles/tokens.css` | `MOD-002` |
| reset、页面、隐藏状态和通用排版 | `src/styles/base.css` | `MOD-002` |
| app shell、topbar、footer和三栏布局 | `src/styles/shell.css` | `MOD-002` |
| 主题、问题、牌阵和牌面选择控件 | `src/styles/setup.css` | `MOD-002` |
| reading panel、stage和状态栏 | `src/styles/reading.css` | `MOD-002` |
| 洗牌、牌面、翻牌和四牌阵定位 | `src/styles/cards.css` | `MOD-002` |
| 单牌与综合解读 | `src/styles/insight.css` | `MOD-002` |
| dialog、history、toast和install控件 | `src/styles/overlays.css` | `MOD-002` |
| keyframes、transition和reduced-motion | `src/styles/motion.css` | `MOD-002` |
| 桌面、窄屏和移动端媒体查询 | `src/styles/responsive.css` | `MOD-002` |
| 焦点、高对比度和可访问降级 | `src/styles/accessibility.css` | `MOD-002`、后续 `AX-001` |

人工CSS单文件硬上限900行。`styles.css`在 `MOD-002` 完成时不得继续作为4918行聚合源。

---

## 6. Python服务与平台文件

| 当前职责 | 唯一目标 | 迁移任务 |
|---|---|---|
| `run.py` CLI、端口和浏览器启动 | 根入口 `run.py`，保持薄入口 | `MOD-004B` |
| `AppRequestHandler`静态文件服务 | `src/server/http.py` | `MOD-004B` |
| 活跃客户端和自动关闭 | `src/server/lifecycle.py` | `MOD-004B` |
| 生命周期会话Cookie与Origin检查 | `src/server/session.py` | `MOD-004B` |
| `index.html`脚本入口 | `src/app/bootstrap.js` | `MOD-003A` |
| `sw.js`缓存策略 | 根经典Service Worker + generated清单 | `MOD-006B/C` |
| `manifest.webmanifest`安装元数据 | 根PWA清单 | `PWA-002` |

`run.py`继续通过Python标准库直接启动，不引入后端框架。

---

## 7. 公开业务ID基线

业务ID必须保持现有小写 `kebab-case`。

### 卡牌

- 大阿卡纳：`major-0` 至 `major-21`。
- 小阿卡纳：`<suit>-<rank>`，例如 `cups-two`、`pentacles-king`。
- 总数78，必须唯一。

### 问题

- 六个领域，每个领域7题，总数42。
- 示例：`career-change`。
- Phase M不得重命名。

### 牌阵与牌位

| spreadId | 张数 | positionId顺序 |
|---|---:|---|
| `single` | 1 | 保持当前单牌牌位ID |
| `timeline` | 3 | 保持当前三个牌位ID和顺序 |
| `cross` | 5 | `core`、`root`、`trend`、`influence`、`action` |
| `celtic` | 10 | `present`、`challenge`、`past`、`future`、`above`、`below`、`advice`、`external`、`hopes`、`outcome` |

`tests/smoke_test.js`与`tests/module_contract_test.mjs`共同冻结数量、顺序和ID格式。

---

## 8. 数据生命周期基线

### 8.1 静态人工源

- 当前78张牌、42问题和4牌阵位于 `data.js`。
- 当前四套牌面资源配置位于 `app.js`。
- 后续迁入 `src/knowledge/` 与 `src/config/`。
- 不包含用户数据。

### 8.2 临时页面状态

当前 `state` 包含：

- `categoryId`
- `questionId`
- `spreadId`
- `deckStyleId`
- `phase`
- `reading`
- `revealed`
- `selectedIndex`
- `activeTab`
- `completing`
- `confirmResolver`
- `installPrompt`

另有 `lifecycleStream`、计时器、动画和DOM状态。它们不应进入静态知识或完整历史。

### 8.3 设置

存储键：

```text
astra-tarot-settings-v1
```

当前主要字段：

```json
{
  "deckStyle": "rws"
}
```

旧值兼容映射：

```text
vintage → arnoult
moonlit → swiss
rose → piedmont
```

解析失败返回空对象；存储失败不阻断占卜。

### 8.4 旧历史

存储键：

```text
astra-tarot-history-v1
```

当前为JSON数组，最多20条。写入使用 `records.slice(0, 20)`，会静默截断。

单条当前字段：

```text
id
createdAt
categoryId
categoryName
categoryIcon
categoryAccent
question
spreadName
deckName
cards[]
  name
  orientation
  position
headline
```

当前记录没有：

- `questionId`
- `spreadId`
- `deckStyleId`
- 随机种子和完整牌序
- 牌卡业务ID
- Observation、Relation、Claim
- 引擎、Schema、资料和模板版本
- artifact指纹

`AU-002`与`AU-003`迁移时必须把上述旧结构视为合法输入，迁移容错、幂等且失败不破坏原记录。

### 8.5 生成文件

当前没有正式 generated目录或artifact manifest。

未来正式生成结果：

- 轻量卡牌目录与注册表
- 轻量问题目录与注册表
- knowledge完整性清单
- artifact manifest
- `src/generated/precache-manifest.js`

它们不得成为第二套人工真相。

---

## 9. DOM与CSP基线

### 当前动态HTML写入

`app.js`使用 `innerHTML` 渲染：

- 主题、问题、牌阵和牌面选择
- 洗牌牌堆
- 抽中牌和牌位
- 单牌解读和综合结果
- 历史列表与详情
- 空状态与toast

已有 `escapeHtml`，但历史记录、颜色、图标、URL、类名和内联样式并非全部使用严格字段白名单。

### 当前动态style写入

包括：

- `--category-accent`
- `--card-accent`
- `--mini-accent`
- `--keyword-accent`
- `--guidance-accent`
- `--summary-accent`
- `--history-accent`
- 洗牌索引、进度宽度和部分颜色

当前 `index.html` 没有强制CSP。`MOD-004A`负责安全DOM写入和移除动态内联style依赖；`MOD-004B`先报告后强制CSP。

### 潜在不可信来源

- `localStorage`历史可被同源脚本或开发者工具修改。
- 后续导入文件属于不可信输入。
- 卡牌与问题人工源是仓库受审查内容，但仍必须遵守字段类型和枚举。
- 资源URL、颜色、ID和类名应来自冻结配置，不接受任意用户字符串。

---

## 10. Service Worker与离线基线

当前 `sw.js`：

- 缓存名：`astra-tarot-v5`。
- 手工构建78张卡牌ID和四套牌面路径。
- `CORE_FILES`包含页面、CSS、JS、图标、manifest和四套完整牌面。
- install使用 `cache.addAll(CORE_FILES)`，任一资源失败会使整批失败。
- install无条件 `self.skipWaiting()`。
- activate删除所有旧缓存并立即 `clients.claim()`。
- GET采用network-first，并把成功响应写入同一缓存。
- `/__astra/`请求绕过Service Worker。
- 任意GET失败时尝试请求缓存，否则统一回退 `index.html`。
- 脚本、CSS或图片失败可能收到HTML。
- 没有APP-SHELL、DEFAULT-DECK或SELECTED-DECKS状态。
- 没有artifact/release绑定、用户更新提示、多标签协调或回滚。

归属：

- `MOD-006B`生成资源清单。
- `MOD-006C`修正资源类型、缓存组和离线状态。
- `PLAT-001`实现原子更新、多标签协调和回滚。

---

## 11. Node、Python和验证格式基线

| 文件/命令 | 当前格式 |
|---|---|
| `tests/smoke_test.js` | CommonJS，使用`require`和`vm`读取`data.js` |
| `tests/module_contract_test.mjs` | Node原生ESM，不依赖package.json |
| 应用`data.js`、`app.js` | 浏览器经典脚本/IIFE |
| `sw.js` | 经典Service Worker |
| Python测试 | `python -m unittest discover -s tests -v` |
| GitHub Actions | 不使用 |
| 正式本地验证 | CWapi执行`automation/validate.py` |

`MOD-003A`才提交无依赖 `package.json` 和 `"type": "module"`，并转换现有CommonJS测试。本任务不改变模块格式。

---

## 12. 随机边界基线

### 业务随机

当前 `randomUnit`：

1. 优先 `crypto.getRandomValues`。
2. 不可用时降级 `Math.random()`。

用途：

- Fisher–Yates洗牌。
- 每张牌以 `< 0.33` 判定逆位。
- reading ID随机尾数。

问题和牌义不参与抽牌。Phase M保持当前分布，不在 `MOD-001` 改算法。

### 平台随机

lifecycle client ID：

1. 优先 `crypto.randomUUID()`。
2. 不可用时使用时间戳和 `Math.random()`。

平台标识与安全凭据后续必须使用Web Crypto或服务器安全随机，且不得消费业务随机流。

---

## 13. 当前人工与浏览器基线

本轮通过GitHub连接器修改仓库，没有可用的本地浏览器harness。未亲自执行的环境不得标记为支持。允许状态仅为 `SUPPORTED`、`SUPPORTED-WITH-DEGRADATION`、`NOT-TESTED`、`NOT-SUPPORTED`。

| 环境/能力 | 状态 | 说明 |
|---|---|---|
| Windows 10/11 + Chrome | `NOT-TESTED` | README声明可运行，等待CWapi或人工证据 |
| Windows 10/11 + Edge | `NOT-TESTED` | 等待证据 |
| Windows 10/11 + Brave | `NOT-TESTED` | 等待证据 |
| Firefox稳定版 | `NOT-TESTED` | PWA安装能力允许后期降级 |
| Android Chrome | `NOT-TESTED` | 当前仅有响应式实现声明 |
| iOS Safari | `NOT-TESTED` | 当前仅有响应式实现声明 |
| APP-SHELL-READY | `NOT-TESTED` | 当前实现不单独报告状态 |
| DEFAULT-DECK-READY | `NOT-TESTED` | 当前实现不单独报告状态 |
| SELECTED-DECKS-READY | `NOT-TESTED` | 当前实现不单独报告状态 |

人工流程清单：

1. 准备页显示。
2. 六领域和42问题选择。
3. 四牌阵选择。
4. 四套牌面切换。
5. 开始、洗牌和逐张发牌。
6. 单张与全部翻开。
7. 单牌和综合结果。
8. 重新占卜。
9. 历史展开、删除和清空。
10. 刷新不误停服务。
11. 关闭最后页面后服务退出。
12. PWA安装与离线重开。

当前状态均为 `NOT-TESTED`，不得由文档描述替代实际证据。`MOD-006D`建立浏览器harness，发布矩阵在 `REL-001` 冻结。

---

## 14. MOD-001验证出口

```text
python automation/validate.py --scope baseline
```

通过条件：

- Python unittest通过。
- 旧Node smoke test通过。
- Node ESM模块契约测试通过。
- 三项旧技术债只报告WARN且没有增长。
- 没有新增超限人工JS/CSS。
- 当前 `src/` 依赖方向和循环检查通过。
- 本文件、`src/README.md`、验证脚本和基线JSON存在。
- 当前commit取得匹配CWapi RESULT。
- 没有运行代码、公开ID或用户数据行为变化。

通过后唯一下一叶子任务为 `MOD-002`。

## MOD-002 CSS迁移结果

`styles.css` 已按原始顶层规则边界拆分，字节级拼接结果与原文件一致。`index.html` 只加载 `src/styles/index.css`，该入口按固定顺序导入：

- `src/styles/foundation.css`
- `src/styles/setup.css`
- `src/styles/cards.css`
- `src/styles/insights.css`
- `src/styles/history.css`
- `src/styles/desktop.css`
- `src/styles/wide.css`
- `src/styles/responsive.css`

Service Worker临时资源列表已同步并提升缓存版本。根目录旧样式文件不得重新出现；所有人工CSS继续受900行硬上限约束。
