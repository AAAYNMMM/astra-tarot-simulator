# 项目文件结构与数据架构

## 1. 文档职责

本文档定义星纱塔罗的目标文件结构、数据生命周期、静态知识组织、用户历史、版本、artifact指纹和离线缓存状态。

任务编号、依赖和顺序以 `EXECUTION_CONTRACTS.md` 为准；实时状态以 `PROGRESS.md` 为准。

目标：

- 78张单牌资料和84–96个预设问题扩展后仍可维护。
- 静态知识、临时状态、用户数据、人工源和生成文件完全分离。
- 运行时不依赖AI、大型数据库、npm构建或网络服务。
- 历史保存结构化证据、显示快照、版本和内容指纹。
- 应用继续通过 `python run.py` 直接运行。

## 2. 数据分类

### 2.1 静态知识

随项目版本发布、只读、受Schema和质量门禁约束：

- 78张CardSemanticProfile；
- 预设问题和QuestionProfile；
- 四种固定牌阵定义与关系图；
- 主题、关系、逆位、维度和结论词典；
- 文本模板；
- 资料来源和版本。

目录：`src/knowledge/`。

### 2.2 应用配置

随代码发布、只读：

- 应用版本；
- 默认设置；
- 牌组显示配置；
- 资源路径规则；
- 功能开关。

目录：`src/config/`。

### 2.3 临时状态

只在当前页面生命周期中存在：

- 当前主题、问题和牌阵；
- 当前抽牌、正逆位和翻牌状态；
- 动画阶段；
- 标签页和选中牌；
- 弹窗、错误和更新提示状态。

目录：`src/app/state/`。不得被静态知识反向依赖。

### 2.4 用户持久数据

只保存在本机浏览器：

- 小型设置；
- 历史占卜记录；
- 迁移状态；
- 数据库版本和维护元信息；
- 用户选择的离线牌组状态。

实现：

- 小型设置使用 `localStorage`。
- 完整历史使用IndexedDB。
- IndexedDB不可用时使用兼容降级层。

### 2.5 人工主来源

人工编辑：

- 单张CardSemanticProfile；
- 单题QuestionProfile；
- 固定牌阵与关系图；
- 词典；
- 模板。

人工主来源不得与另一套手工目录并存。

### 2.6 生成文件

由脚本生成并提交：

- 轻量卡牌目录；
- 卡牌动态导入注册表；
- 轻量问题目录；
- 问题动态导入注册表；
- knowledge完整性清单；
- artifact manifest；
- PWA预缓存清单；
- 必要质量报告。

目录：`src/generated/` 或 `.qa/`。文件头记录来源、生成命令和生成器版本，不得人工直接修改。

### 2.7 二进制资源

`assets/` 只保存牌面、牌背、图标和其他媒体，不保存规则数据。

## 3. 统一ID规范

所有业务ID使用小写 `kebab-case`，并保持现有公开值：

| 类型 | 示例 |
|---|---|
| 大阿卡纳 | `major-7` |
| 小阿卡纳 | `cups-two` |
| 问题 | `career-change` |
| 牌阵 | `single`、`timeline`、`cross`、`celtic` |
| 牌位 | `core`、`challenge`、`outcome` |

文件名可以使用序号和英文名，例如：

```text
src/knowledge/cards/major/07-chariot.js
```

文件名不是业务ID。注册表显式映射ID和模块路径。

## 4. 稳定语义单元

每条可进入推理和证据链的语义单元必须有稳定ID：

```js
{
  id: "action.align-direction",
  text: "先统一方向，再增加推进力度",
  tags: ["direction", "agency"],
  allowedRoles: ["action", "boundary"],
  sourceRefs: ["waite-chariot"],
}
```

规则：

- 单张牌内ID唯一。
- 完整引用使用 `cardId#semanticUnitId`。
- 发布后的ID不因文案润色随意更名。
- 删除或替换ID必须记录迁移映射。
- Observation、Claim和历史引用ID，不依赖显示文本。

## 5. 目标目录

```text
src/
├── app/
│   ├── bootstrap.js
│   ├── dom.js
│   ├── state/
│   ├── controllers/
│   └── renderers/
├── config/
├── core/
├── engine/
│   ├── legacy/
│   ├── models/
│   ├── observations/
│   ├── relations/
│   ├── claims/
│   ├── validation/
│   └── rendering/
├── knowledge/
│   ├── versions.js
│   ├── cards/
│   ├── questions/
│   ├── spreads/
│   ├── vocabularies/
│   └── templates/
├── storage/
├── platform/
├── shared/
├── generated/
└── styles/
```

## 6. 静态知识组织

### 6.1 卡牌

人工源一张牌一个模块。轻量目录只包含抽牌、图片路径和基础显示需要的字段。

注册表只提供ID到动态导入函数的映射与会话缓存：

```js
const loaders = {
  "major-7": () => import("../knowledge/cards/major/07-chariot.js"),
};
```

单次占卜只加载抽中的1、3、5或10张完整资料。加载失败不得重抽、替换或影响正逆位。

### 6.2 问题

选择界面只读取轻量目录。完整QuestionProfile一题一个人工源模块，并按questionId动态加载。

### 6.3 领域适配

领域适配优先引用已有语义单元：

```js
domains: {
  career: {
    facetRefs: [
      "state.controlled-progress",
      "risk.direction-conflict",
      "action.align-direction",
    ],
    weightAdjustments: {
      agency: 0.2,
      materiality: 0.1,
    },
    overrides: [],
  },
}
```

只有通用语义无法表达时才增加带稳定ID和来源的override。

### 6.4 牌阵

四种牌阵拆为：

- 可见定义、坐标和说明；
- 固定结构边和推理职责。

不得改变当前1、3、5、10张结构或牌位ID。

## 7. 版本与内容指纹

版本对象至少包含：

```js
export const VERSIONS = Object.freeze({
  appShell: "2.0.0",
  engine: "2.0.0",
  scoring: "1.0.0",
  randomDerivation: "1.0.0",
  drawAlgorithm: "1.0.0",
  cardSchema: "1.0.0",
  cardData: "1.0.0",
  questionSchema: "1.0.0",
  questionData: "1.0.0",
  vocabulary: "1.0.0",
  templates: "1.0.0",
  storageSchema: 1,
});
```

artifact manifest至少包含：

```js
{
  repositoryCommit: "...",
  engineManifestHash: "...",
  knowledgeManifestHash: "...",
  cardModuleHashes: {},
  questionModuleHashes: {},
  vocabularyHash: "...",
  templateHash: "...",
  cacheManifestHash: "...",
}
```

规则：

- 内容变化提升对应data版本。
- 字段契约变化提升Schema版本。
- 结论算法、权重、阈值或平局变化提升engine/scoring版本。
- 随机派生或洗牌变化提升对应版本。
- IndexedDB结构变化提升storageSchema。
- 历史保存实际版本和artifact指纹。
- 版本字符串不能替代内容哈希。
- 验证必须发现内容变化但版本未升、或生成文件对应旧人工源。

## 8. 用户数据存储

### 8.1 `localStorage`

只保存小型设置和轻量能力标记。必须有默认值和容错解析。禁止继续保存完整历史、规则数据或大段结果。

### 8.2 IndexedDB

数据库：`astra-tarot`

| Store | keyPath | 用途 |
|---|---|---|
| `readings` | `id` | 完整结果与证据链 |
| `metadata` | `key` | Schema、迁移、artifact和维护信息 |

建议索引：`createdAt`、`questionId`、`spreadId`、`engineVersion`。

### 8.3 ReadingRecord

```js
{
  id: "reading-...",
  createdAt: "...",
  questionId: "career-change",
  spreadId: "cross",
  deckStyleId: "rws",
  displaySnapshot: {},
  random: {
    rootSeed: "...",
    derivationVersion: "1.0.0",
    algorithmVersion: "1.0.0",
    draw: [],
  },
  versions: {},
  artifactFingerprint: {
    repositoryCommit: "...",
    engineManifestHash: "...",
    knowledgeManifestHash: "...",
    cardModuleHashes: {},
    questionModuleHashes: {},
    vocabularyHash: "...",
    templateHash: "...",
    cacheManifestHash: "...",
  },
  reasoning: {
    observations: [],
    relations: [],
    selectedClaims: [],
    rejectedClaims: [],
    validation: {},
  },
  rendered: {},
}
```

历史保存本次结果、必要显示快照、版本、内容指纹和证据引用，不复制整套知识库。

### 8.4 三类历史承诺

1. **同产物确定性**：相同输入、根种子、版本和哈希产生相同结果。
2. **历史可审计**：旧记录保存当时的结构化证据和文本，即使旧产物不可执行仍可查看。
3. **跨版本重新计算**：只有旧引擎和旧知识产物仍可获得且兼容时保证。

不得仅凭版本号承诺任意未来版本可以重算旧结果。

### 8.5 迁移与降级

旧 `astra-tarot-history-v1` 迁移必须容错、幂等、事务化，失败不破坏旧历史。IndexedDB不可用时应用仍可占卜，使用统一接口保存精简历史并提示能力受限。

## 9. 运行时加载顺序

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
按cardId加载抽中牌资料
  ↓
按questionId加载QuestionProfile
  ↓
规则引擎计算
  ↓
保存ReadingRecord
```

## 10. PWA资源与状态

脚本生成并提交卡牌/问题目录与注册表、knowledge完整性清单、artifact manifest和预缓存清单。

### `APP-SHELL-READY`

shell、knowledge和默认配置可用，应用能启动。

### `DEFAULT-DECK-READY`

默认牌组必要资源可用，可以完成完整离线占卜。

### `SELECTED-DECKS-READY`

用户选择缓存的其他牌组可用。

规则：

- 只有导航请求可以回退 `index.html`。
- JavaScript、CSS、图片和知识模块失败保留正确失败类型。
- 默认牌组失败不能标记完整离线可用。
- 其他牌组失败只影响对应牌组。
- 新版本切换前校验必需资源和artifact版本一致。

## 11. 数据完整性检查

自动检查至少覆盖：

- 业务ID合法且唯一，Phase M不改变公开ID。
- 人工源元数据完整。
- 卡牌目录、资料、注册表和哈希一一对应。
- 问题目录、资料、注册表和哈希一一对应。
- 生成结果可稳定重建且未过期。
- 不存在第二套人工目录或遗留临时目录。
- 语义单元ID在牌内唯一。
- 所有证据和领域引用指向真实语义单元。
- 动态导入文件可解析。
- 牌阵仍为固定1、3、5、10张。
- 静态知识不访问DOM或存储。
- 历史序列化可往返。
- 迁移重复执行不产生重复记录。
- 版本字段和artifact指纹完整。
- 预缓存清单覆盖全部活动模块。
- PWA状态不会夸大离线能力。

具体实施任务见 `EXECUTION_CONTRACTS.md`，不得在本文件另建任务顺序。
