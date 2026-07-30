# 星纱塔罗项目 AI 开发指引

本文件是后续 AI、Codex 和自动化代理进入仓库后的工作入口。

## 1. 读取策略

### 1.1 首次进入、跨阶段或规划变更时

按顺序读取：

1. `README.md`
2. `docs/DECISIONS.md`
3. `docs/MODULARIZATION_PLAN.md`
4. `docs/DATA_ARCHITECTURE.md`
5. `docs/ENGINEERING_GUARDS.md`
6. `docs/FINAL_QUALITY_GUARDS.md`
7. `docs/ENGINE_ARCHITECTURE.md`
8. `docs/CARD_DATA_STANDARD.md`
9. `docs/ROADMAP.md`
10. `docs/PROGRESS.md`
11. 当前任务代码、测试和最近 diff

### 1.2 同一阶段内继续任务时

每次必读：

1. `AGENTS.md`
2. `docs/DECISIONS.md`
3. `docs/PROGRESS.md`
4. 当前任务直接引用的规范文档
5. 当前任务代码、测试和最近 diff
6. 当前 commit 对应的 CWapi TASK / RESULT，若存在

不得仅依据用户当前一句话修改项目，也不得为了形式完整在每次小任务中重复装载全部长期文档。首次进入要完整，续接要精确，人类终于可以同时拥有谨慎和效率。

## 2. 用户命令

### “开始任务”

1. 按读取策略确认项目状态。
2. 从 `PROGRESS.md` 选择唯一 `NEXT` 叶子任务。
3. 核对依赖、规范来源和验收标准。
4. 将任务写入“当前活动任务”区块，状态改为 `IN_PROGRESS`。
5. 完成实现、测试和必要文档。
6. 提交后通过 CWapi 对完整 40 位 commit 执行适用验证。
7. 核对终态 RESULT；失败时修复并产生新 commit 和新 task_id。
8. 更新活动任务现场、完成记录和唯一下一任务。

### “继续任务”

1. 优先恢复 `IN_PROGRESS` 或 `BLOCKED` 叶子任务。
2. 核对分支、当前 commit、修改文件、剩余验收项和 CWapi 状态。
3. 不只相信旧文字，检查仓库实际状态和最近 diff。
4. 若存在未终结 CWapi TASK，先处理它。
5. 从“下一具体动作”继续，不重新发明计划。
6. 完成后更新进度和验证记录。

若没有活动任务，则把唯一 `NEXT` 叶子任务视为继续目标。

## 3. 任务粒度

- 一次只推进一个明确叶子任务 ID。
- 父任务不能成为 `NEXT`，必须先拆分。
- 一个叶子任务必须对应明确范围、commit、验收和 CWapi RESULT。
- 单牌资料推荐每批 4–6 张。
- 问题资料和四牌阵适配按领域拆分。
- 大型评测把语料、自动指标和人工盲测分开。
- 若实施中出现多个独立风险面，先拆分，不用一张巨大清单假装任务仍然很小。

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
- 规划已冻结，非阻断性新想法不能推迟当前路线。

## 5. 工程原则

- 原生 ES Modules，`python run.py` 直接启动。
- 业务源码和静态知识进入 `src/`。
- JavaScript 人工文件 ≤ 600 行，入口建议 ≤ 200 行。
- CSS 人工文件 ≤ 900 行。
- 每张 `CardSemanticProfile` 独立一个模块。
- 每个 `QuestionProfile` 使用可独立加载的小模块。
- 业务 ID 使用现有 `kebab-case`，例如 `major-7`、`career-change`。
- 可进入推理的语义单元必须有稳定 ID。
- Observation 和 Claim 引用稳定语义单元，不依赖可变显示文案。
- 领域适配优先引用通用语义单元，不复制大量换皮文本。
- `engine/` 不访问 DOM 或存储。
- `knowledge/` 不访问 UI、状态或存储。
- 控制器不直接访问 IndexedDB 或 `localStorage`。
- 生成目录、注册表和缓存清单优先由脚本生成。
- 模块化阶段保持现有运行行为。
- Position Operator 参与 Observation 生成。
- Relation Graph 先处理固定结构边，再处理语义和辅助关系。
- 不得用正逆位数量、简单吉凶或单一元素决定结论。
- 冲突必须解释、分层、条件化或保留为不确定。

## 6. CWapi 验证

- 不得创建 `.github/workflows/`。
- `MOD-001` 建立最小 `automation/validate.py --scope baseline`。
- 后续任务逐步扩展同一入口，`MOD-006D` 完成 `--scope full`。
- 需要验证的任务绑定完整 40 位 commit SHA。
- 没有当前 commit 对应的终态 RESULT，不得声称本地验证通过。
- 纯文档变更可以不跑完整回归，但必须完成交叉一致性检查。

## 7. 当前活动任务现场

`PROGRESS.md` 必须保存：

- 任务 ID 和状态
- 规范来源
- 分支与完整 commit
- CWapi task_id 和 RESULT 状态
- 已完成和剩余验收项
- 本轮修改文件
- 阻塞原因
- 下一具体动作

聊天记录不能代替该现场。

## 8. 完成定义

任务标记 `DONE` 前必须满足：

1. 实现或文档已提交。
2. 验收标准全部满足。
3. 自动测试通过，或明确记录无法运行原因。
4. 非纯文档任务具有当前 commit 的 CWapi RESULT。
5. 必要人工抽样完成。
6. 没有破坏锁定边界或公开 ID。
7. 文件规模和依赖边界合格。
8. 数据、存储和缓存符合 `DATA_ARCHITECTURE.md`。
9. 工程护栏符合 `ENGINEERING_GUARDS.md`。
10. 当前阶段适用的最终质量护栏已满足。
11. `PROGRESS.md` 保存完整现场、验证证据和唯一下一叶子任务。