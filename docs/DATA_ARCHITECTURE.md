# 项目文件结构与数据架构

## 1. 文档职责

本文档定义目标文件结构、数据生命周期、静态知识、用户历史、版本、artifact指纹和离线缓存状态。

任务编号、依赖和顺序以 `EXECUTION_CONTRACTS.md` 为准；实时状态以 `PROGRESS.md` 为准。

目标：

- 78张单牌和84–96个预设问题扩展后仍可维护。
- 静态知识、临时状态、用户数据、人工源和生成文件完全分离。
- 运行时不依赖AI、大型数据库、npm构建或网络服务。
- 历史保存结构化证据、显示快照、版本和本次消费指纹。
- 应用继续通过 `python run.py` 直接运行。

## 2. 数据分类

### 静态知识

目录：`src/knowledge/`。

- CardSemanticProfile；
- QuestionProfile；
- 四种固定牌阵定义与关系图；
- 主题、关系、逆位、维度和结论词典；
- 文本模板；
- 来源和版本。

### 应用配置

目录：`src/config/`。

- 应用版本和默认值；
- 牌组显示配置；
- 资源路径规则；
- 功能开关。

### 临时状态

目录：`src/app/state/`。

- 当前问题、牌阵和牌组；
- 抽牌、正逆位和翻牌；
- 动画、标签页和弹窗；
- 错误、恢复和更新提示。

不得被静态知识反向依赖。

### 用户持久数据

只保存在本机浏览器：

- 小型设置；
- 历史占卜；
- 迁移和数据库元信息；
- 用户选择的离线牌组状态。

小型设置使用localStorage；完整历史使用IndexedDB；不可用时允许精简降级。

### 人工主来源

人工编辑：

- 单张CardSemanticProfile；
- 单题QuestionProfile；
- 固定牌阵与关系图；
- 词典和模板。

不得与第二套手工目录并存。

### 生成文件

由脚本生成并提交：

- 轻量卡牌和问题目录；
- 动态导入注册表；
- knowledge完整性清单；
- artifact manifest；
- PWA预缓存清单；
- 必要质量报告。

位于 `src/generated/` 或 `.qa/`。文件头记录来源、命令和生成器版本，不得人工直接修改。

### 二进制资源

`assets/` 只保存牌面、牌背、图标和媒体，不保存规则数据。

## 3. ID与稳定引用

所有业务ID使用现有小写kebab-case：

| 类型 | 示例 |
|---|---|
| 大阿卡纳 | `major-7` |
| 小阿卡纳 | `cups-two` |
| 问题 | `career-change` |
| 牌阵 | `single`、`timeline`、`cross`、`celtic` |
| 牌位 | `core`、`challenge`、`outcome` |

文件名不是业务ID。注册表显式映射ID与模块路径。

每条可进入推理的语义单元具有稳定ID：

```js
{
  id: "action.align-direction",
  text: "先统一方向，再增加推进力度",
  tags: ["direction", "agency"],
  allowedRoles: ["action", "boundary"],
  sourceRefs: ["waite-chariot"],
}
```

完整引用使用 `cardId#semanticUnitId`。删除或替换已发布ID必须记录迁移映射。

## 4. 目标目录

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

## 5. 静态知识组织

### 卡牌

人工源一张牌一个模块。轻量目录只含抽牌、图片路径和基础显示字段。

```js
const loaders = {
  "major-7": () => import("../knowledge/cards/major/07-chariot.js"),
};
```

单次只加载抽中的1、3、5或10张完整资料。加载失败不得重抽、替换或影响正逆位。

### 问题

选择界面只读取轻量目录。完整QuestionProfile一题一个模块，按questionId加载。

### 领域适配

优先引用已有语义单元：

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

### 牌阵

四种牌阵拆为可见定义/坐标与固定结构边/推理职责，不改变1、3、5、10张结构和牌位ID。

## 6. 版本与规范化哈希

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

### 哈希算法

- SHA-256。
- 文本转为UTF-8并规范LF。
- 结构化JSON使用稳定键序和规范序列化。
- 二进制按原始字节。
- 路径使用规范化仓库相对路径并排序。
- 生成器版本进入manifest。
- `.gitattributes` 固定人工文本换行，避免Windows/Linux无意义漂移。

### artifact manifest

保存完整发布产物索引：

```js
{
  schemaVersion: "1.0.0",
  repositoryCommit: "...",
  generatorVersion: "...",
  engineManifestHash: "...",
  knowledgeManifestHash: "...",
  modules: {
    cards: {},
    questions: {},
    spreads: {},
    vocabularies: {},
    templates: {},
  },
  cacheManifestHash: "...",
}
```

完整78张牌和全部问题的模块哈希只保存在artifact manifest，不复制到每条历史。

规则：

- 内容变化提升对应data版本。
- 字段契约变化提升Schema版本。
- 结论算法、权重、阈值或平局变化提升engine/scoring版本。
- 随机派生或洗牌变化提升对应版本。
- IndexedDB结构变化提升storageSchema。
- 版本字符串不能替代内容哈希。
- 验证发现内容变化但版本未升、生成文件过期或manifest不匹配。

## 7. 用户数据存储

### localStorage

只保存小型设置和轻量能力标记。必须有默认值和容错解析。禁止保存完整历史、规则数据或大段结果。

### IndexedDB

数据库：`astra-tarot`

| Store | keyPath | 用途 |
|---|---|---|
| `readings` | `id` | 完整结果与证据链 |
| `metadata` | `key` | Schema、迁移、artifact和维护元信息 |

建议索引：`createdAt`、`questionId`、`spreadId`、`engineVersion`。

### ReadingRecord

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
    manifestHash: "...",
    repositoryCommit: "...",
    engineHash: "...",
    consumed: {
      cards: {
        "major-7": "...",
        "cups-two": "...",
      },
      question: {
        id: "career-change",
        hash: "...",
      },
      spreadGraph: {
        id: "cross",
        hash: "...",
      },
      vocabularyBundleHash: "...",
      templateBundleHash: "...",
    },
  },
  reasoning: {
    observations: [],
    relations: [],
    selectedClaims: [],
    rejectedClaims: [],
    validation: {
      structured: {},
      rendered: {},
    },
  },
  rendered: {},
}
```

ReadingRecord只保存本次实际消费模块的指纹、总manifest哈希和必要显示快照，不复制整套知识库或完整模块索引。

### 三类历史承诺

1. **同产物确定性**：相同输入、根种子、版本和哈希产生相同结果。
2. **历史可审计**：旧记录保存当时结构化证据和文本，即使旧产物不可执行仍可查看。
3. **跨版本重新计算**：只有旧引擎和旧知识产物仍可获得且兼容时保证。

### 迁移与降级

旧 `astra-tarot-history-v1` 迁移必须容错、幂等、事务化，失败不破坏旧历史。IndexedDB不可用时仍可占卜，统一接口保存精简历史并提示能力受限。

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
加载抽中牌资料和当前QuestionProfile
  ↓
规则引擎计算
  ↓
保存ReadingRecord与本次消费指纹
```

## 9. PWA资源与状态

脚本生成卡牌/问题目录与注册表、knowledge清单、artifact manifest和预缓存清单。

- `APP-SHELL-READY`：shell、knowledge和默认配置可用。
- `DEFAULT-DECK-READY`：默认牌组资源可用，可完成完整离线占卜。
- `SELECTED-DECKS-READY`：用户选择缓存的其他牌组可用。

只有导航请求可以回退index.html。JavaScript、CSS、图片和知识失败保留正确类型。默认牌组失败不能标记完整离线可用；其他牌组失败只影响对应牌组。

## 10. 数据完整性检查

自动检查至少覆盖：

- 业务ID合法且唯一。
- 人工源元数据完整。
- 卡牌/问题目录、资料、注册表和哈希一一对应。
- 生成结果可稳定重建且未过期。
- 不存在第二套人工目录或遗留临时目录。
- 语义单元ID和引用合法。
- 动态导入可解析。
- 牌阵仍为固定1、3、5、10张。
- 静态知识不访问DOM或存储。
- 历史序列化可往返。
- 迁移幂等。
- 版本、manifest和消费指纹完整。
- ReadingRecord不复制全部模块哈希。
- 预缓存清单覆盖活动模块。
- PWA状态不夸大离线能力。

具体任务见 `EXECUTION_CONTRACTS.md`。
