# 项目文件结构与数据架构

## 1. 目的

本文件定义星纱塔罗的目标文件结构、静态知识组织、运行时数据边界、用户历史、迁移、版本和离线缓存策略。

目标：

- 后续 AI 可以通过 GitHub 精确修改小范围文件。
- 78 张单牌资料和 84–96 个预设问题扩展后仍可维护。
- 静态知识、临时状态、用户数据和生成文件完全分离。
- 运行时不依赖 AI、大型数据库、npm 构建或网络服务。
- 历史可保存完整结果、版本和证据链。
- 应用继续通过 `python run.py` 直接运行。

## 2. 数据分类

### 2.1 静态知识

随项目版本发布、只读、受 Schema 和质量门禁约束：

- 78 张 `CardSemanticProfile`
- 轻量卡牌目录
- 预设问题目录和 `QuestionProfile`
- 四种固定牌阵定义与关系图
- 主题、关系、逆位、结论等词典
- 文本模板
- 资料和模板版本

目录：`src/knowledge/`。

### 2.2 应用配置

随代码发布、只读：

- 牌组样式
- 资源路径规则
- 功能开关
- 默认值
- 应用版本

目录：`src/config/`。

### 2.3 临时状态

只在当前页面生命周期中存在：

- 当前主题、问题和牌阵
- 当前抽牌和翻牌状态
- 动画阶段
- 标签页和选中牌
- 弹窗状态

目录：`src/app/state/`。不得被静态知识反向依赖。

### 2.4 用户持久数据

仅保存在本机浏览器：

- 小型设置
- 历史占卜记录
- 迁移状态
- 数据库版本元信息

实现：

- 小型设置使用 `localStorage`。
- 完整历史使用 IndexedDB。
- IndexedDB 不可用时使用兼容降级层。

### 2.5 生成文件

由开发脚本生成并提交仓库：

- 轻量卡牌目录
- 卡牌动态导入注册表
- 轻量问题目录
- 问题动态导入注册表
- knowledge 完整性清单
- PWA 预缓存清单
- 必要质量报告

目录：`src/generated/` 或 `.qa/`。文件头必须记录来源和生成命令，不得人工直接修改。

### 2.6 二进制资源

`assets/` 只保存牌面、牌背、图标和其他媒体，不保存规则数据。

## 3. 统一 ID 规范

### 3.1 业务 ID

所有业务 ID 使用小写 `kebab-case`，并保持现有公开值不变。

| 类型 | 示例 | 规则 |
|---|---|---|
| 大阿卡纳 | `major-7` | 不使用零填充 |
| 小阿卡纳 | `cups-two` | 花色与牌级均使用稳定英文 ID |
| 问题 | `career-change` | 保留当前问题 ID |
| 牌阵 | `single`、`timeline`、`cross`、`celtic` | 不重命名 |
| 牌位 | `core`、`challenge`、`outcome` | 保留当前值 |

禁止在新资料中混用 `major_07`、`career_change_now` 等下划线形式。

### 3.2 文件名

文件名可以为可读性使用序号和英文名：

```text
src/knowledge/cards/major/07-chariot.js
src/knowledge/cards/minor/cups/02-two-of-cups.js
```

文件名不是业务 ID。注册表必须显式映射业务 ID 与模块路径。

### 3.3 稳定语义单元 ID

每条可进入推理和证据链的语义单元必须有稳定 ID：

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

- 单张牌内语义单元 ID 唯一。
- 完整证据引用使用 `cardId#semanticUnitId`，例如 `major-7#action.align-direction`。
- 发布后的语义单元 ID 不因文案润色而随意更名。
- Observation、Claim 和历史证据链引用 ID，不依赖可变显示文本。

## 4. 目标结构

```text
astra-tarot-simulator/
├── index.html
├── run.py
├── sw.js
├── manifest.webmanifest
├── icon.svg
├── automation/
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
│   │   │   ├── major/
│   │   │   └── minor/
│   │   ├── questions/profiles/
│   │   ├── spreads/graphs/
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

## 5. 静态知识组织

### 5.1 单牌资料是人工主来源

完整 `CardSemanticProfile` 一张牌一个模块。人工维护的牌文件是主要来源，轻量目录和注册表由脚本生成。

抽牌只读取轻量目录：

- `id`
- 名称
- 大小阿卡纳
- 花色和牌级
- 图像资源标识
- 展示符号

完整牌义不得重新聚合成数千行静态数组。

### 5.2 卡牌注册表

注册表只提供业务 ID 到动态导入函数的映射与会话缓存：

```js
const loaders = {
  "major-7": () => import("../knowledge/cards/major/07-chariot.js"),
};
```

单次占卜只加载抽中的 1、3、5 或 10 张完整资料。加载失败不得重抽、替换或影响正逆位。

### 5.3 问题资料

选择界面只读取轻量问题目录：

- `id`
- 可见文字
- 标签
- 领域
- 排序

完整 `QuestionProfile` 一题一个模块，并按 `questionId` 动态加载。目录、资料和注册表必须一一对应。

### 5.4 领域适配使用引用

领域适配优先引用已有语义单元，不复制大量换皮文案：

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

只有领域确实需要特殊语义时才使用 `overrides`。每个 override 也必须拥有稳定 ID 和来源。

### 5.5 固定牌阵

四种牌阵拆为：

- `definitions.js`：名称、牌位、坐标和可见说明。
- `graphs/`：固定结构边和推理职责。

不得改变当前 1、3、5、10 张结构或牌位 ID。

### 5.6 词典与模板

词典按职责拆分：

- `themes.js`
- `relations.js`
- `reversals.js`
- `dimensions.js`
- `conclusions.js`
- `forbidden-claims.js`

模板按结论职责拆分，不按牌名复制整句。

## 6. 版本策略

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
  appShell: "2.0.0",
});
```

规则：

- 修改内容提升对应 data 版本。
- 修改字段契约提升 Schema 版本。
- 修改结论算法提升 engine 版本。
- 修改 IndexedDB 结构提升 storageSchema。
- 历史保存实际使用的全部版本。
- 兼容组合和回滚规则由 `REL-005` 建立机器可读矩阵。

## 7. 用户数据存储

### 7.1 `localStorage`

只保存小型设置：牌面风格、减少动画和轻量启动选项。必须有默认值和容错解析。

禁止继续保存完整历史、规则数据或大段结果。

### 7.2 IndexedDB

数据库：`astra-tarot`

| Store | keyPath | 用途 |
|---|---|---|
| `readings` | `id` | 完整结果与证据链 |
| `metadata` | `key` | Schema、迁移和维护信息 |

建议索引：`createdAt`、`questionId`、`spreadId`、`engineVersion`。不提前建立没有查询用途的索引。

### 7.3 ReadingRecord

```js
{
  id: "reading-...",
  createdAt: "...",
  questionId: "career-change",
  spreadId: "cross",
  deckStyleId: "rws",
  displaySnapshot: {},
  random: {
    seed: "...",
    algorithm: "...",
    draw: [],
  },
  versions: {},
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

历史保存本次结果、必要显示快照、版本和证据引用，不复制 78 张资料、完整问题库或所有模板。

### 7.4 迁移

从 `astra-tarot-history-v1` 迁移：

1. 检查迁移标记。
2. 容错读取旧数组。
3. 转换为 `legacy-v1` 记录。
4. 在同一事务中写入历史和迁移标记。
5. 成功后再删除或保留旧备份一个版本周期。
6. 任一步失败不得破坏旧历史。

迁移必须幂等。

### 7.5 降级

IndexedDB 不可用时：

- 应用仍可占卜。
- 使用 `fallback-store.js` 保存精简历史。
- 明确提示存储能力受限。
- 历史保存失败不得阻断当前解读。

控制器只调用统一接口：

```js
await readingStore.list();
await readingStore.save(record);
await readingStore.remove(id);
await readingStore.clear();
```

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
按 cardId 加载抽中牌资料
  ↓
按 questionId 加载 QuestionProfile
  ↓
规则引擎计算
  ↓
保存 ReadingRecord
```

## 9. PWA 与生成清单

使用脚本生成并提交：

- 卡牌目录和注册表
- 问题目录和注册表
- knowledge 完整性清单
- `src/generated/precache-manifest.js`

缓存分组：

- shell
- knowledge
- deck-rws
- deck-arnoult
- deck-swiss
- deck-piedmont

只有导航请求可以回退 `index.html`。JavaScript、CSS、图片和知识模块加载失败必须保留正确失败类型。

## 10. 数据完整性检查

自动检查至少覆盖：

- 业务 ID 符合规范且唯一。
- 现有公开 ID 在 Phase M 中没有变化。
- 卡牌目录、资料和注册表一一对应。
- 问题目录、资料和注册表一一对应。
- 语义单元 ID 在牌内唯一。
- 所有证据引用指向真实语义单元。
- 领域 `facetRefs` 指向合法 ID。
- 动态导入文件可解析。
- 牌阵仍为固定 1、3、5、10 张。
- 静态知识不访问 DOM 或存储。
- 历史序列化可往返。
- 迁移重复执行不产生重复记录。
- 版本字段完整。
- 预缓存清单覆盖全部运行模块。

## 11. 任务归属

- `MOD-001`：ID、目录、迁移映射和数据边界基线。
- `MOD-003`：配置、随机、资源和存储接口。
- `MOD-005`：静态知识、目录、注册表和旧版资料。
- `MOD-006B`：生成清单和基础分组缓存。
- `MOD-006C`：资源类型回退和离线缓存验证。
- `AU-002`：完整 ReadingRecord 与 IndexedDB。
- `AU-003`：旧历史迁移、导入导出、容量和降级。
- `REL-005`：版本兼容矩阵和回滚。

具体执行始终由 `PROGRESS.md` 的唯一叶子 `NEXT` 任务控制。