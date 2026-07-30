# 工程护栏与本地验证方案

## 1. 目的

本文档定义模块化、资料升级、历史迁移和发布过程中必须同步建设的工程护栏。目标是防止重构破坏、知识漂移、历史丢失、缓存遗漏和本地服务暴露内部文件。

本项目不使用 GitHub Actions。需要真实运行环境的测试、构建、浏览器回归和验收统一复用 `AAAYNMMM/CWapi` 本地 Runner。

## 2. CWapi 本地验证

### 2.1 锁定规则

- 不创建、恢复、启用或依赖 `.github/workflows/`。
- 代码、数据、存储、缓存、启动器或发布变更必须绑定完整 40 位 commit SHA。
- 没有当前 commit 对应的终态 CWapi RESULT，不得宣称本地验证通过。
- GitHub 可合并、无冲突或代码审查通过不能替代本地结果。
- 纯文档变更可以不跑完整回归，但必须完成交叉一致性检查。

### 2.2 统一入口分阶段建立

`MOD-001` 建立：

```text
automation/
├── validate.py
└── README.md
```

`automation/validate.py --scope baseline` 至少执行：

1. Python 基础测试。
2. Node smoke test。
3. 模块行数检查。
4. 依赖方向检查。
5. 机器可读摘要。
6. 可靠退出码。

后续扩展：

- `MOD-002`：CSS 路径和规模检查。
- `MOD-003`：基础模块、随机、设置和生命周期客户端测试。
- `MOD-004A`：状态、控制器、渲染器和浏览器交互。
- `MOD-004B`：服务白名单、路径穿越、生命周期令牌、Origin 和 CSP。
- `MOD-005`：人工知识源、旧结果兼容和源契约。
- `MOD-006B`：生成文件和缓存清单一致性。
- `MOD-006C`：PWA 资源类型、资源等级和离线缓存。
- `MOD-006D`：`--scope full`、浏览器回归和 Phase M 收口。

最终结构：

```text
automation/
├── validate.py
├── browser_smoke.py
└── README.md
```

验证脚本不得修改源码，不得依赖人工交互，不得把大型日志或浏览器产物提交仓库。

### 2.3 CWapi 建议序列

```text
git_rev_parse
git_status
repository_automation: automation/validate.py --scope targeted
repository_automation: automation/validate.py --scope full
collect_hashes
git_status
```

实际 scope 按任务阶段选择。每个 RESULT 必须准确说明执行范围，不能用 baseline 结果冒充 full 回归。

## 3. 任务现场与父任务状态

`PROGRESS.md` 必须记录：

- 叶子任务 ID 和状态。
- 规范来源。
- 分支与完整 commit。
- CWapi task_id 和 RESULT 状态。
- 已完成与剩余验收项。
- 修改文件。
- 阻塞原因。
- 下一具体动作。
- 受影响父任务及派生状态。

父任务状态只能由必需叶子任务和父级验收计算：`PARENT-PENDING`、`PARENT-IN-PROGRESS`、`PARENT-DONE`、`PARENT-BLOCKED`。聊天历史不是可靠恢复点。

## 4. 本地服务器访问边界

目标规则：

- 只允许应用入口、`src/`、`assets/`、manifest、图标和必要 PWA 文件。
- 拒绝 `.git/`、`.github/`、`docs/`、`tests/`、`scripts/`、`automation/`、`.qa/`、隐藏文件和临时文件。
- 拒绝 URL 编码、双重编码、反斜杠和路径规范化后的目录穿越。
- 默认监听 `127.0.0.1`。
- 非本机监听时显示安全警告。
- 生命周期接口执行同源检查和启动时随机令牌验证。
- 增加适合原生 ES Modules 的 Content Security Policy。
- 文件访问白名单、路径穿越和生命周期接口必须有自动测试。

不要求构建产物目录，优先通过请求处理器白名单保持 `python run.py` 直接运行。

## 5. 确定性与随机契约

### 5.1 独立随机流

生产继续使用高质量系统随机源生成根种子。根种子通过稳定、版本化的派生算法生成独立随机流：

```text
rootSeed
├── derive(rootSeed, "draw")        → drawSeed
├── derive(rootSeed, "orientation") → orientationSeed
└── derive(rootSeed, "rendering")   → renderingSeed
```

要求：

- 抽牌只消费 `draw` 流。
- 正逆位只消费 `orientation` 流。
- 模板轮换只消费 `rendering` 流。
- 模板新增一次随机选择不得改变牌序或正逆位。
- 引擎代码不得散落调用 `Math.random()`。
- Phase M 只建立依赖注入边界；可保存根种子和确定性算法在 `AU-001` 完成。

### 5.2 稳定排序与平局

- 评分排序必须声明稳定次级键，默认使用稳定业务 ID。
- 不依赖对象属性遍历的偶然顺序。
- 不使用本地化字符串排序决定推理结论。
- 权重、阈值、平局规则和派生算法全部版本化。
- 分数必须为有限值并处于契约范围内；`NaN`、`Infinity` 和未定义排序必须失败。
- 相同输入、版本和根种子必须产生相同结构化结果和渲染选择。

## 6. 静态知识单一来源

人工主来源：

- 单张 `CardSemanticProfile`
- 单题 `QuestionProfile`
- 固定牌阵与关系图
- 词典
- 模板

正式脚本生成：

- 轻量卡牌目录
- 卡牌动态注册表
- 轻量问题目录
- 问题动态注册表
- knowledge 完整性清单
- PWA 预缓存清单

职责边界：

- `MOD-005` 建立规范化人工源、必要轻量元数据和旧版兼容适配器。
- `MOD-005` 若产生临时目录或注册表，必须标记为过渡文件。
- `MOD-006B` 编写正式生成脚本并删除或替换临时文件。
- 生成后仓库不得保留第二套手工维护目录。

生成文件必须位于 `src/generated/` 或明确 generated 路径，文件头记录脚本和命令，提交仓库，可稳定重建，由验证脚本检查是否过期，不得人工直接修改。

## 7. Schema、词典与质量校验职责

### TQ-001

负责：

- 对象结构和必填字段。
- 业务 ID、语义单元 ID 和引用格式。
- 数值类型与范围。
- 基础枚举和结构级引用检查。

不负责判断尚未冻结的主题或关系标签是否属于最终词典。

### TQ-002

负责：

- 主题、关系、逆位、维度、结论和禁止断言词典。
- 标签成员资格和同义词合并。
- 跨词典引用和来源政策。

### TQ-004

统一运行 Schema、词典、来源、重复率、反例和人工评分门禁。

## 8. 黄金样本可消费性验证

`TQ-004` 后、其余 72 张牌批量生产前执行 `TQ-005`：

- 使用 6 张黄金样本。
- 每个领域选择 1–2 个试验 QuestionProfile。
- 使用现有四牌阵牌位与最小 Position Operator。
- 建立只满足验证需要的最小 Observation 路径。
- 验证语义单元、领域 `facetRefs`、逆位模式和牌位职责能够被真正消费。

`TQ-005` 不实现完整 Relation、Claim、模板或用户界面。失败时优先修正 Schema、词典和黄金样本，不得带着已知结构缺陷批量复制到 72 张牌。

## 9. 单牌资料治理

每张牌记录主要传统、参考资料 ID 和章节、项目现代化解释范围、审查状态和日期、稳定语义单元 ID、近义牌边界、常见误读和禁止推断。

建立：

```text
docs/references/
├── bibliography.md
├── interpretation-policy.md
└── source-conflict-policy.md
```

禁止把来源不明网络牌义直接作为正式资料。

## 10. 历史备份与容量

完整历史系统必须支持：

- 全部和单条 JSON 导出。
- 带 Schema 和版本。
- 导入前大小、结构、版本、数量和冲突验证。
- 导入预览。
- 完整导出与仅显示结果导出。
- 导入失败不破坏现有数据。

容量规则：

- 不静默 `slice` 删除记录。
- 初始建议上限 500 条完整记录，最终以真实大小测量。
- 接近配额时提示。
- 支持筛选和批量删除。
- 自动清理必须经用户明确授权。

## 11. 浏览器支持矩阵

### MOD-001 基线

记录当前可运行环境、已知限制和人工基线，不宣称尚未测试的浏览器已受支持。

### REL-001 冻结矩阵

发布前明确：

- Windows 10/11。
- Chrome、Edge、Brave 当前稳定版。
- Firefox 当前稳定版的核心功能与离线能力。
- Chromium 系浏览器的 PWA 安装能力。
- Firefox 不支持的安装能力可降级，但核心占卜、历史和离线访问必须可用。
- 若继续声明移动端支持，明确 Android Chrome 与 iOS Safari 的测试范围。

矩阵必须区分：`SUPPORTED`、`SUPPORTED-WITH-DEGRADATION`、`NOT-TESTED`、`NOT-SUPPORTED`。

## 12. Doctor 与浏览器回归

Doctor 最终通过 `python scripts/doctor.py` 检查 Python 和启动器、必要入口、牌面资源、卡牌和问题目录/资料/注册表、业务 ID 与语义引用、牌阵锁定、生成文件、模块规模、历史版本、LICENSE 和第三方声明。

浏览器回归覆盖启动、选择、洗牌、发牌、翻牌、结果、历史、刷新、生命周期、离线、动态模块和 IndexedDB 降级。

`REL-001` 是所有发布前代码变更完成后的最终全量回归。`REL-001` 后若修改运行代码，必须重新执行并取得新 RESULT。

## 13. 任务映射

| 护栏 | 落地任务 |
|---|---|
| baseline 验证入口与浏览器基线 | `MOD-001` |
| CSS 与模块验证扩展 | `MOD-002` 至 `MOD-005` |
| 前端拆分 | `MOD-004A` |
| 服务安全 | `MOD-004B` |
| 正式生成清单 | `MOD-006B` |
| PWA 资源等级与类型正确性 | `MOD-006C` |
| full 验证和 Phase M 收口 | `MOD-006D` |
| 确定性随机与排序 | `MOD-003`、`AU-001`、`CL-002` |
| Schema/词典职责 | `TQ-001`、`TQ-002`、`TQ-004` |
| 黄金样本可消费性 | `TQ-005` |
| 历史、备份和容量 | `AU-002`、`AU-003A–C` |
| Doctor | `EV-004` |
| 浏览器最终回归 | `REL-001` |
| LICENSE 与第三方声明 | `REL-003` |

## 14. 明确不做

当前不增加 GitHub Actions、图数据库、后端 SQLite、账号、云同步、插件、自定义牌阵、自由文本问题或强制 npm 构建链。