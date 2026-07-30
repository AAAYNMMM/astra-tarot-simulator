# 项目文件结构与数据架构

## 1. 目的

本文件定义星纱塔罗在代码模块化和纯规则引擎开发中的目标文件结构、静态知识数据组织、运行时数据边界、用户历史存储、迁移和离线缓存策略。

目标是同时满足：

- 后续 AI 可以通过 GitHub 精确读取和修改小范围文件
- 78 张单牌资料、84–96 个预设问题和规则模板扩展后仍可维护
- 静态知识与用户数据完全分离
- 运行时不依赖 AI、大型数据库、npm 构建或网络服务
- 历史记录能够保存完整结果、版本和证据链
- 应用继续通过 `python run.py` 直接运行
- PWA 和本地服务都能正确加载原生 ES Modules

## 2. 当前问题

当前项目主要存在以下数据组织问题：

1. `data.js` 同时保存卡牌、问题分类和牌阵配置，职责混杂。
2. 当前单牌资料很短，未来升级为完整 `CardSemanticProfile` 后，单文件会迅速膨胀。
3. 当前历史记录使用 `localStorage`，只适合少量短文本，不适合保存 Observation、Relation、Claim、版本和校验结果。
4. `app.js` 直接负责设置和历史读写，存储实现与界面逻辑耦合。
5. 当前静态资源缓存依赖集中清单，文件模块化后容易遗漏新增模块。
6. 当前历史只保存显示所需的少量信息，不足以审计或复现旧结果。

## 3. 数据分类

项目中的数据必须先按生命周期分类，不能把所有内容都叫作“数据”后塞进同一个目录。

### 3.1 静态知识数据

随项目版本发布、只读、受 Schema 和质量门禁约束：

- 78 张 `CardSemanticProfile`
- 卡牌轻量目录信息
- 预设问题目录和 `QuestionProfile`
- 四种固定牌阵定义
- 四种固定牌阵关系图
- 主题、关系、逆位、结论等词典
- 文本模板
- 资料和模板版本

目标目录：`src/knowledge/`。

### 3.2 应用配置

随代码发布、只读：

- 牌组样式
- 资源路径规则
- 功能开关
- 默认值
- 版本常量

目标目录：`src/config/`。

### 3.3 临时运行状态

只在当前页面生命周期中存在，不持久化：

- 当前主题、问题和牌阵
- 当前抽牌和翻牌状态
- 动画阶段
- 当前标签页和选中牌
- 弹窗状态

目标目录：`src/app/state/`。临时状态不得被静态知识模块反向依赖。

### 3.4 用户持久数据

仅保存在本机浏览器：

- 设置
- 历史占卜记录
- 迁移状态
- 数据库版本元信息

目标实现：

- 小型同步设置继续使用 `localStorage`
- 完整历史记录使用原生 IndexedDB
- IndexedDB 不可用时提供兼容降级层

### 3.5 生成文件

由项目脚本生成并提交到仓库，不由用户启动时生成：

- PWA 预缓存清单
- 数据索引清单，若人工维护风险过高
- 质量审查报告，按项目策略决定是否提交

目标目录：`src/generated/` 或 `.qa/`。生成文件必须在文件头标明来源和生成命令。

### 3.6 二进制资源

继续保存在 `assets/`：

- 四套牌面
- 牌背
- 图标或其他媒体

二进制资源不得混入 `src/knowledge/`。

## 4. 目标项目结构

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
│   │   │   ├── initial-state.js
│   │   │   ├── store.js
│   │   │   └── selectors.js
│   │   ├── controllers/
│   │   │   ├── setup-controller.js
│   │   │   ├── reading-controller.js
│   │   │   ├── history-controller.js
│   │   │   └── dialog-controller.js
│   │   └── renderers/
│   │       ├── setup-renderer.js
│   │       ├── spread-renderer.js
│   │       ├── insight-renderer.js
│   │       └── history-renderer.js
│   ├── config/
│   │   ├── deck-styles.js
│   │   ├── defaults.js
│   │   └── versions.js
│   ├── core/
│   │   ├── random.js
│   │   ├── reading-factory.js
│   │   ├── card-assets.js
│   │   └── html.js
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
│   │   │       ├── wands/
│   │   │       ├── cups/
│   │   │       ├── swords/
│   │   │       └── pentacles/
│   │   ├── questions/
│   │   │   ├── catalog/
│   │   │   ├── registry.js
│   │   │   └── profiles/
│   │   ├── spreads/
│   │   │   ├── definitions.js
│   │   │   └── graphs/
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
│   │   ├── lifecycle.js
│   │   ├── pwa.js
│   │   └── install-prompt.js
│   ├── shared/
│   │   ├── assertions.js
│   │   └── collections.js
│   ├── generated/
│   │   └── precache-manifest.js
│   └── styles/
│       ├── index.css
│       ├── tokens.css
│       ├── base.css
│       ├── layout.css
│       ├── utilities.css
│       ├── components/
│       ├── features/
│       ├── animations.css
│       └── responsive.css
├── assets/
├── docs/
├── scripts/
└── tests/
```

`src/` 是可执行源代码和静态知识的统一根目录。仓库根目录只保留启动入口、PWA 根文件、资源、测试、脚本和文档，避免几十个一级目录散落。

## 5. 静态知识数据组织

### 5.1 卡牌目录与详细资料分离

应用初始界面只需要卡牌的轻量资料：

- `id`
- 名称
- 大小阿卡纳
- 花色与序号
- 图像资源标识
- 展示符号

这些信息放在 `src/knowledge/cards/catalog/`，可以按大阿卡纳和四个花色拆分。

完整 `CardSemanticProfile` 一张牌一个模块，放在：

```text
src/knowledge/cards/major/07-chariot.js
src/knowledge/cards/minor/cups/02-two-of-cups.js
```

目录数据不得复制完整牌义。详细资料不得重新聚合成一个数千行静态数组。

### 5.2 卡牌注册表按需加载

`src/knowledge/cards/registry.js` 只保存卡牌 ID 到动态导入函数的映射，并提供缓存：

```js
const loaders = {
  "major-7": () => import("./major/07-chariot.js"),
};

const loadedProfiles = new Map();

export async function loadCardProfile(cardId) {
  if (!loadedProfiles.has(cardId)) {
    loadedProfiles.set(cardId, loaders[cardId]());
  }
  const module = await loadedProfiles.get(cardId);
  return module.default;
}
```

每次占卜只需要加载抽中的 1、3、5 或 10 张详细资料，而不是在启动时解析全部高质量资料。

抽牌必须只依赖轻量卡牌目录，不能因为某张详细资料尚未加载而影响牌序或正逆位。

### 5.3 问题目录与问题配置分离

用户选择界面只读取轻量问题目录：

- `id`
- 可见文字
- 标签
- 领域
- 排序

完整 `QuestionProfile` 独立保存到 `src/knowledge/questions/profiles/`，通过注册表在开始解读时加载。

建议一题一个配置文件。若多个极短配置明确属于同一组，也必须遵守单文件行数限制和单一职责。

### 5.4 固定牌阵数据

四种牌阵继续保持不变，但数据拆分为：

- `definitions.js`：名称、牌位、坐标和可见说明
- `graphs/`：各牌阵的关系边和推理职责

界面布局数据和解牌关系图不得混在同一大对象中。

### 5.5 词典与模板

词典按职责拆分：

- `themes.js`
- `relations.js`
- `reversals.js`
- `dimensions.js`
- `conclusions.js`
- `forbidden-claims.js`

模板按输出职责拆分，而不是按 78 张牌复制整句：

- 核心结论
- 支持与冲突关系
- 条件表达
- 行动建议
- 不确定性
- 高风险边界

## 6. 版本策略

静态知识、引擎和存储 Schema 使用独立版本：

```js
export const VERSIONS = Object.freeze({
  engine: "2.0.0",
  cardSchema: "1.0.0",
  cardData: "1.0.0",
  questionSchema: "1.0.0",
  questionData: "1.0.0",
  vocabulary: "1.0.0",
  templates: "1.0.0",
  storageSchema: 1,
});
```

规则：

- 修改牌义内容只提升 `cardData`
- 修改字段契约提升 `cardSchema`
- 修改问题配置内容提升 `questionData`
- 修改结论算法提升 `engine`
- 修改 IndexedDB 结构提升 `storageSchema`
- 历史记录保存本次实际使用的全部版本

## 7. 用户数据存储

### 7.1 localStorage 只保存小型设置

保留以下类型：

- 牌面风格
- 减少动画等界面偏好
- 轻量启动选项

约束：

- 单个设置对象保持小型
- 设置必须有默认值和容错解析
- 不能把完整占卜历史、规则数据或大段结果继续放入 `localStorage`

### 7.2 IndexedDB 保存历史记录

数据库名：`astra-tarot`

首版对象仓库：

| Store | keyPath | 用途 |
|---|---|---|
| `readings` | `id` | 完整占卜结果与证据链 |
| `metadata` | `key` | Schema 版本、迁移状态和维护信息 |

`readings` 建议索引：

- `createdAt`
- `questionId`
- `spreadId`
- `engineVersion`

不提前建立没有实际查询用途的索引。数据库不是收藏索引的玻璃柜。

### 7.3 ReadingRecord 建议结构

```js
{
  id: "reading-...",
  createdAt: "2026-07-31T00:00:00.000Z",

  questionId: "career-change-now",
  spreadId: "cross",
  deckStyleId: "rws",

  displaySnapshot: {
    questionText: "...",
    spreadName: "五牌十字",
    deckStyleName: "经典韦特",
    cards: [
      {
        cardId: "major-7",
        cardName: "战车",
        positionId: "core",
        positionName: "核心现状",
        orientation: "upright"
      }
    ]
  },

  random: {
    seed: "...",
    algorithm: "...",
    draw: []
  },

  versions: {
    engine: "2.0.0",
    cardSchema: "1.0.0",
    cardData: "1.0.0",
    questionData: "1.0.0",
    vocabulary: "1.0.0",
    templates: "1.0.0"
  },

  reasoning: {
    observations: [],
    relations: [],
    selectedClaims: [],
    rejectedClaims: [],
    validation: {}
  },

  rendered: {
    headline: "...",
    summary: "...",
    cards: [],
    actions: []
  }
}
```

### 7.4 历史记录不得复制完整知识库

历史中保存：

- 卡牌和问题 ID
- 必要显示快照
- 本次解析后的 Observation、Relation 和 Claim
- 完整渲染结果
- 使用的版本

历史中不保存：

- 78 张完整牌资料
- 完整问题库
- 全部模板词典
- 未参与本次结果的规则

这样既能保持旧结果可读、可审计，也不会让每条历史复制一遍知识库。

### 7.5 迁移策略

从 `astra-tarot-history-v1` 迁移时：

1. 打开 IndexedDB。
2. 检查 `metadata` 中是否已有迁移标记。
3. 读取并容错解析旧 `localStorage` 数组。
4. 转换为 `legacy-v1` ReadingRecord。
5. 在单个事务中写入历史和迁移标记。
6. 事务成功后再删除或保留一个版本周期的旧数据备份。
7. 任一步失败时不得破坏旧历史。

迁移函数必须是幂等的，重复运行不会生成重复记录。

### 7.6 降级策略

IndexedDB 不可用时：

- 应用仍可运行和占卜
- 使用 `fallback-store.js` 保存精简历史
- 显示本地存储能力受限提示
- 不因历史保存失败阻断当前解读

存储接口对控制器保持一致：

```js
await readingStore.list();
await readingStore.save(record);
await readingStore.remove(id);
await readingStore.clear();
```

控制器不得直接调用 IndexedDB 或 `localStorage`。

## 8. 运行时加载顺序

```text
index.html
  ↓
src/app/bootstrap.js
  ↓
轻量配置、问题目录、牌阵定义、卡牌目录
  ↓
用户选择问题和牌阵
  ↓
抽牌只使用轻量卡牌目录
  ↓
按抽中 cardId 加载详细 CardSemanticProfile
  ↓
加载选中问题的 QuestionProfile
  ↓
规则引擎计算
  ↓
保存 ReadingRecord 到 IndexedDB
```

详细牌义加载失败时必须明确报错，不得悄悄退回错误牌义或重新抽牌。

## 9. PWA 与缓存

模块化后静态文件数量会明显增加，`sw.js` 不应继续依赖一个人工维护的巨大数组。

建议：

1. 使用 `scripts/generate_precache_manifest.py` 扫描允许缓存的源文件和资源。
2. 生成 `src/generated/precache-manifest.js` 并提交仓库。
3. 用户启动应用时不需要运行生成脚本。
4. 缓存按组拆分：
   - shell
   - knowledge
   - deck-rws
   - deck-arnoult
   - deck-swiss
   - deck-piedmont
5. 单个资源失败不得导致全部缓存安装失败。
6. 动态导入的卡牌和问题模块必须包含在 knowledge 清单中。
7. 更新缓存版本时清理旧组，但不得误删当前版本。

生成清单属于允许超过普通行数限制的生成文件，但必须可由脚本稳定重建。

## 10. 数据完整性要求

必须建立自动检查：

- 卡牌目录 ID 与详细资料文件一一对应
- 问题目录 ID 与 QuestionProfile 一一对应
- 注册表不存在缺失路径和重复 ID
- 所有动态导入文件可解析
- 牌阵定义仍为固定 1、3、5、10 张
- 静态知识模块不得访问 DOM、IndexedDB 或 localStorage
- 历史序列化和反序列化可往返
- 迁移重复执行不会产生重复数据
- 版本字段完整
- 预缓存清单包含所有运行必需模块

## 11. 开发任务归属

本文件不新增另一套相互竞争的任务系统，具体执行仍由 `PROGRESS.md` 的唯一 `NEXT` 任务控制。

建议归属：

- `MOD-001`：确定最终目录和旧文件迁移映射
- `MOD-003`：抽离配置、随机和资源路径
- `MOD-005`：拆分静态知识目录、卡牌注册表和旧版资料
- `MOD-006`：更新 service worker、预缓存清单和模块契约
- `AU-002`：实现 IndexedDB ReadingRecord
- `AU-003`：完成 localStorage 历史迁移和降级层

Phase M 期间只建立边界和兼容结构，不提前实现新版规则引擎。