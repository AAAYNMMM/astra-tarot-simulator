# 星纱塔罗项目 AI 开发指引

本文件是后续 AI、Codex 和自动化代理进入仓库后的工作入口。

## 1. 文档权威与读取策略

### 1.1 权威顺序

发生冲突时按以下顺序解释：

1. `docs/DECISIONS.md`：锁定产品与技术决策。
2. `docs/EXECUTION_CONTRACTS.md`：任务编号、依赖、状态、验证和发布顺序。
3. `docs/PROGRESS.md`：当前活动任务、证据和唯一下一任务。
4. 各领域规范：模块化、数据、引擎、单牌、工程和最终质量。
5. `docs/ROADMAP.md`：阶段导航和任务目录。
6. `README.md`：项目概览。

聊天记录不能覆盖仓库中的锁定决策、执行契约或任务现场。

### 1.2 首次进入、跨阶段或规划变更时

按顺序读取：

1. `README.md`
2. `docs/DECISIONS.md`
3. `docs/EXECUTION_CONTRACTS.md`
4. `docs/PROGRESS.md`
5. 当前阶段直接相关的领域规范
6. `docs/ROADMAP.md`
7. 当前任务代码、测试和最近 diff
8. 当前 commit 对应的 CWapi TASK / RESULT，若存在

领域规范包括：

- `docs/MODULARIZATION_PLAN.md`
- `docs/DATA_ARCHITECTURE.md`
- `docs/ENGINEERING_GUARDS.md`
- `docs/FINAL_QUALITY_GUARDS.md`
- `docs/ENGINE_ARCHITECTURE.md`
- `docs/CARD_DATA_STANDARD.md`

### 1.3 同一阶段内继续任务时

每次必读：

1. `AGENTS.md`
2. `docs/DECISIONS.md`
3. `docs/EXECUTION_CONTRACTS.md`
4. `docs/PROGRESS.md`
5. 当前任务直接引用的规范
6. 当前任务代码、测试和最近 diff
7. 当前 commit 对应的 CWapi TASK / RESULT，若存在

首次进入要完整，续接要精确。不得仅依据用户当前一句话修改项目，也不得为形式完整在每个小任务中重新装载全部长期文档。

## 2. 用户命令

### “开始任务”

1. 按读取策略确认项目状态。
2. 从 `PROGRESS.md` 选择唯一 `NEXT` 叶子任务。
3. 按 `EXECUTION_CONTRACTS.md` 核对任务就绪定义、依赖和不变量。
4. 将任务写入“当前活动任务”，状态改为 `IN_PROGRESS`。
5. 完成实现、测试和必要文档。
6. 提交后通过 CWapi 对完整 40 位 commit 执行适用验证。
7. 核对终态 RESULT；失败时修复并产生新 commit 和新 task_id。
8. 更新活动任务现场、父任务派生状态、完成记录和唯一下一任务。

### “继续任务”

1. 优先恢复 `IN_PROGRESS` 或 `BLOCKED` 叶子任务。
2. 核对分支、当前 commit、修改文件、剩余验收项和 CWapi 状态。
3. 检查仓库实际状态和最近 diff，不只相信旧文字。
4. 若存在未终结 CWapi TASK，先处理它。
5. 从“下一具体动作”继续，不重新发明计划。
6. 完成后更新进度、父任务派生状态和验证记录。

若没有活动任务，则把唯一 `NEXT` 叶子任务视为继续目标。

### “审查优化”

1. 只检查依赖闭环、任务粒度、验收证据、跨文档漂移和实现可行性。
2. 不重新讨论已锁定产品边界。
3. 每轮只能产生：新重大问题、问题修正、交叉验证或“无新问题”。
4. 连续两轮没有新的阻断级或重大执行问题时停止。
5. 不为凑轮数制造新阶段、新功能或非必要文档。
6. 审查结束后仍保持一个可立即执行的唯一 `NEXT`。

## 3. 任务粒度与状态

### 3.1 叶子任务

- 一次只推进一个明确叶子任务 ID。
- 一个叶子任务必须对应明确范围、输入、输出、不变量、commit、验收和 CWapi RESULT。
- 单牌资料推荐每批 4–6 张。
- 问题资料和四牌阵适配按领域拆分。
- 大型评测把语料、自动指标和人工评审分开。
- 若实施中出现多个可独立失败的主要风险面，先拆分。

叶子状态只允许：`BACKLOG`、`NEXT`、`IN_PROGRESS`、`BLOCKED`、`DONE`。

### 3.2 父任务

父任务不直接执行，状态由必需叶子任务和父级验收派生：

- `PARENT-PENDING`
- `PARENT-IN-PROGRESS`
- `PARENT-BLOCKED`
- `PARENT-DONE`

规则：

- 父任务不能成为 `NEXT`。
- 父任务不能手工宣布完成。
- 依赖父任务表示依赖其 `PARENT-DONE`。
- 顺序明确时优先依赖最后一个叶子任务。
- 不使用 `BACKLOG/PARENT` 等混合状态。

## 4. 锁定边界

除非用户明确改变，否则不得修改：

- 运行时不得调用 AI 大模型或外部生成式服务。
- 用户只能选择固定预设问题。
- 四种牌阵保持不变：心语单张、时间之流、五牌十字、凯尔特十字。
- 不得改变牌阵牌位结构和现有公开 ID。
- 抽牌与解读严格分离，不得隐藏重抽或替换。
- 解牌由可检查、可复现、可测试的规则完成。
- 三项核心质量目标均为 9.0/10 以上。
- “准确”指牌义、贴合、一致性、证据链和条件表达，不宣称科学验证的超自然准确率。
- 项目保持模块化、离线、无强制构建步骤。
- 静态知识、临时状态、用户历史和缓存分层管理。
- 不使用 GitHub Actions，真实验证使用 CWapi 本地 Runner。
- Phase M 完成前不开始新版规则引擎和批量单牌资料。
- 非阻断性新想法不能推迟当前路线。

## 5. 工程原则

- 原生 ES Modules，`python run.py` 直接启动。
- 业务源码和静态知识进入 `src/`。
- JavaScript 人工文件 ≤ 600 行，入口建议 ≤ 200 行。
- CSS 人工文件 ≤ 900 行。
- 已知超限只可通过 `automation/quality-baseline.json` 暂存为技术债，不得增长；`MOD-006D` 前清零。
- 每张 `CardSemanticProfile` 独立一个模块。
- 每个 `QuestionProfile` 使用可独立加载的小模块。
- 业务 ID 使用现有 `kebab-case`，例如 `major-7`、`career-change`。
- 可进入推理的语义单元必须有稳定 ID。
- Observation 和 Claim 引用稳定语义单元，不依赖可变显示文案。
- 领域适配优先引用通用语义单元，不复制大量换皮文本。
- `src/engine/` 不访问 DOM 或存储。
- `src/knowledge/` 不访问 UI、状态或存储。
- 控制器不直接访问 IndexedDB 或 `localStorage`。
- 生成目录、注册表和缓存清单由脚本生成，人工源与生成文件不得形成双重真相。
- 每个拆出的模块必须立刻由真实应用入口使用和回归，不建立未接线的展示模块。
- Position Operator 参与 Observation 生成。
- Relation Graph 按固定结构边、问题与牌位职责、语义关系、辅助关系的顺序处理。
- 不得用正逆位数量、简单吉凶或单一元素决定结论。
- 冲突必须解释、分层、条件化或保留为不确定。
- 结构化 Claim 安全校验发生在模板渲染前，渲染文本再进行第二层校验。

## 6. 确定性与可审计性

- 生产环境只通过统一随机接口取得随机值，不直接散落调用 `Math.random()`。
- 根种子派生独立随机流：`draw`、`orientation`、`rendering`。
- 模板轮换不得消耗抽牌或正逆位随机流。
- 排序必须有稳定次级键，不依赖对象遍历顺序或本地化字符串排序。
- 随机算法、种子派生方式、权重、阈值和平局规则必须版本化。
- 相同输入、版本、artifact哈希和根种子必须产生相同结构化结果与渲染选择。
- ReadingRecord保存版本、artifact指纹、结构化证据和显示快照。
- 版本字符串不能单独替代内容哈希。

## 7. CWapi 验证

- 不得创建 `.github/workflows/`。
- `MOD-001` 建立 `automation/validate.py --scope baseline` 和 `automation/quality-baseline.json`。
- 后续任务逐步扩展同一入口，`MOD-006D` 完成 `--scope full`。
- 需要验证的任务绑定完整 40 位 commit SHA。
- 没有当前 commit 对应的终态 RESULT，不得声称本地验证通过。
- RESULT 后代码、数据、缓存、迁移或资源清单发生变化时，旧 RESULT 立即失效。
- 纯文档变更可以不跑完整回归，但必须完成至少两轮交叉一致性检查。
- `REL-001` 必须发生在所有发布前代码和资源变更之后；其后若有变化必须重新执行。

## 8. 当前活动任务现场

`PROGRESS.md` 必须保存：

- 任务 ID 和状态
- 规范来源
- 分支与完整 commit
- CWapi task_id、RESULT和scope
- 已完成和剩余验收项
- 本轮修改文件
- 自动测试和人工检查摘要
- 关键产物哈希
- 阻塞原因
- 下一具体动作
- 受影响父任务及其派生状态

聊天记录不能代替该现场。

## 9. 完成定义

任务标记 `DONE` 前必须满足：

1. 任务满足 `EXECUTION_CONTRACTS.md` 的就绪与完成定义。
2. 实现或文档已提交。
3. 验收标准全部满足。
4. 自动测试通过，或明确记录无法运行原因。
5. 非纯文档任务具有当前 commit 的 CWapi RESULT。
6. 必要人工抽样完成。
7. 没有破坏锁定边界、公开 ID 或存储兼容。
8. 文件规模、依赖、数据、缓存和生成职责合格。
9. 当前阶段适用的工程与最终质量护栏已满足。
10. `PROGRESS.md` 保存完整现场、父任务派生状态、验证证据和唯一下一叶子任务。
