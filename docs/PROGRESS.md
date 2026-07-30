# 项目开发进度

> 本文件是后续“开始任务”和“继续任务”的唯一实时进度入口。
>
> 路线图定义规则引擎应该做什么；`MODULARIZATION_PLAN.md` 与 `DATA_ARCHITECTURE.md` 定义前置重构；本文件记录目前做到哪里。

## 1. 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase M：模块化基础 |
| 当前进行中任务 | 无 |
| 下一任务 | `MOD-001` 模块边界、数据边界与基线测试 |
| 最近完成任务 | `DOC-005` 优化文件结构与数据存储方案 |
| 阻塞项 | 无 |
| 最后更新时间 | 2026-07-31 |

## 2. 下一任务说明

### MOD-001：模块边界、数据边界与基线测试

**状态：NEXT**

目标：

- 核对当前主要文件、函数职责和依赖关系。
- 为 `app.js`、`styles.css` 和 `data.js` 建立明确迁移映射。
- 确认以 `src/` 为统一源码根目录的最终结构。
- 区分静态知识、临时状态、用户持久数据和生成清单。
- 建立模块规模与依赖方向检查。
- 记录重构前自动测试和关键交互基线。
- 记录当前 localStorage 历史字段和未来迁移输入契约。

开始前必须读取：

- `AGENTS.md`
- `docs/DECISIONS.md`
- `docs/MODULARIZATION_PLAN.md`
- `docs/DATA_ARCHITECTURE.md`
- `docs/ENGINE_ARCHITECTURE.md`
- `docs/ROADMAP.md`
- 当前 `app.js`
- 当前 `styles.css`
- 当前 `data.js`
- 当前 `index.html`、`sw.js` 和测试文件

建议产物：

- `scripts/check_module_size.py`
- `scripts/check_import_boundaries.py`，若本轮可在不扩大范围的情况下完成
- `docs/MODULE_MAP.md`
- `tests/module_contract_test.js`
- `src/` 最小目录骨架或职责说明文件
- 当前历史记录字段与迁移基线说明

本任务不应：

- 改变四种牌阵或牌位
- 改写 78 张牌的含义
- 改变抽牌结果和正逆位概率
- 扩展预设问题
- 实现新规则引擎
- 直接把历史迁移到 IndexedDB
- 一次性拆完全部代码
- 引入 npm 构建依赖

验收标准：

1. 模块规模脚本能够报告 `app.js`、`styles.css` 和 `data.js` 的当前超限情况。
2. `MODULE_MAP.md` 列出旧文件中各职责的目标 `src/` 模块。
3. 明确依赖方向和禁止循环依赖规则。
4. 明确静态知识、临时状态、用户数据和生成文件的边界。
5. 原有 Python 与 Node 测试结果已记录。
6. 至少记录准备页、洗牌、发牌、翻牌、结果、历史和关闭生命周期的人工基线检查项。
7. 当前 localStorage 历史结构和迁移输入已记录。
8. 没有改变运行行为。
9. 本文件更新为下一任务 `MOD-002`。

## 3. 当前代码与存储基线

截至 2026-07-31：

| 文件或存储 | 规模/状态 | 判定 |
|---|---|---|
| `app.js` | 1528 行 | 超过 JS 600 行硬上限，待拆分 |
| `styles.css` | 4918 行 | 超过 CSS 900 行硬上限，待拆分 |
| `data.js` | 637 行 | 超过 JS 600 行硬上限，未来资料扩展风险极高 |
| `run.py` | 243 行 | 当前规模可接受 |
| `localStorage` 设置 | 小型 JSON | 可继续使用，需抽离存储接口 |
| `localStorage` 历史 | 最多 20 条精简记录 | 当前可用，无法承载目标证据链 |
| IndexedDB | 尚未使用 | 计划在 AU-002、AU-003 实现完整历史和迁移 |

Phase M 完成后：

- 源代码统一位于 `src/`。
- 应用入口建议 ≤ 200 行。
- 任一人工维护 JavaScript 文件 ≤ 600 行。
- 任一人工维护 CSS 文件 ≤ 900 行。
- 每张完整 `CardSemanticProfile` 使用独立模块。
- 完整 `QuestionProfile` 使用可独立加载的小模块。
- 静态知识通过轻量目录与动态注册表加载。
- 控制器不直接访问 localStorage 或 IndexedDB。

## 4. 阶段进度

| 阶段 | 状态 | 完成度 | 说明 |
|---|---|---:|---|
| Phase 0 项目目标与任务系统 | DONE | 100% | 接手协议、决策、架构、标准、路线图和进度已建立 |
| Phase M 模块化基础 | NEXT | 0% | 下一步 MOD-001，必须在 TQ-001 前完成 |
| Phase 1 单牌数据基础 | BLOCKED | 0% | 等待 MOD-006 完成 |
| Phase 2 78 张牌资料升级 | BACKLOG | 0% | 等待 Phase 1 |
| Phase 3 预设问题系统 | BACKLOG | 0% | 等待问题配置基础 |
| Phase 4 牌位运算系统 | BACKLOG | 0% | 不改变牌阵结构 |
| Phase 5 多牌关系引擎 | BACKLOG | 0% | 等待 Observation 与关系词典 |
| Phase 6 结论与文本系统 | BACKLOG | 0% | 等待多牌关系引擎 |
| Phase 7 审计与历史升级 | BACKLOG | 0% | IndexedDB、迁移、随机和证据链 |
| Phase 8 评测与界面整合 | BACKLOG | 0% | 三项 9.0+ 正式验收 |
| Phase 9 发布稳定化 | BACKLOG | 0% | 2.0 发布收口 |

## 5. 任务状态表

| 任务 ID | 状态 | 完成日期 | 结果 |
|---|---|---|---|
| DOC-001 | DONE | 2026-07-30 | 已建立根目录 `AGENTS.md` |
| DOC-002 | DONE | 2026-07-30 | 已建立锁定决策记录 |
| DOC-003 | DONE | 2026-07-30 | 已建立架构、单牌标准、路线图与进度文档 |
| DOC-004 | DONE | 2026-07-31 | 已建立模块化方案并更新接手规则与锁定决策 |
| DOC-005 | DONE | 2026-07-31 | 已建立 `src/` 目标结构、知识分层、按需加载、IndexedDB 和缓存方案 |
| MOD-001 | NEXT |  | 模块边界、数据边界与基线测试 |
| MOD-002 | BACKLOG |  | 拆分 CSS |
| MOD-003 | BACKLOG |  | 抽离基础 JavaScript、平台和存储接口 |
| MOD-004 | BACKLOG |  | 拆分应用控制器与渲染器 |
| MOD-005 | BACKLOG |  | 拆分静态知识与旧版解读 |
| MOD-006 | BACKLOG |  | 缓存、回归和清理 |
| TQ-001 | BLOCKED |  | 等待 MOD-006 后定义 CardSemanticProfile Schema |
| TQ-002 | BACKLOG |  | 建立统一语义词典 |
| TQ-003 | BACKLOG |  | 制作 6 张黄金样本 |
| TQ-004 | BACKLOG |  | 建立资料评分与审查工具 |
| TQ-101–107 | BACKLOG |  | 完成并审查 78 张牌 |
| QP-001–004 | BACKLOG |  | 建立预设问题与适配系统 |
| PO-001–003 | BACKLOG |  | 牌位运算和 Observation |
| MR-001–004 | BACKLOG |  | 多牌关系推理 |
| CL-001–004 | BACKLOG |  | 结论、评分和冲突消解 |
| TX-001–003 | BACKLOG |  | 模板渲染与校验 |
| AU-001–003 | BACKLOG |  | 随机、IndexedDB 历史、迁移与审计 |
| EV-001–004 | BACKLOG |  | 三项核心质量评测 |
| UI-001–002 | BACKLOG |  | 界面和历史接入 |
| REL-001–004 | BACKLOG |  | 发布稳定化 |

## 6. 当前代码基线

截至 2026-07-31 的代码审查结论：

- 项目为离线浏览器应用，Python 只提供本地服务和生命周期控制。
- 当前包含 78 张牌、42 个固定问题和 4 种固定牌阵。
- 当前抽牌使用安全随机源优先的洗牌逻辑，牌面在动画前已确定。
- 当前 `app.js` 同时承担状态、DOM、存储、随机、动画、解读、历史和生命周期，必须拆分。
- 当前 `styles.css` 包含近五千行样式，必须按令牌、基础、布局、组件、功能、动画和响应式拆分。
- 当前 `data.js` 同时保存卡牌、问题和牌阵，后续静态知识必须迁入 `src/knowledge/`。
- 当前单牌资料主要由关键词、正逆位说明和固定建议组成，适合展示，不足以支持目标规则引擎。
- 当前具体问题没有独立推理配置，综合逻辑主要依赖六大问题分类。
- 当前综合结论存在依赖正逆位数量、主导元素和固定模板的情况。
- 当前全部大阿卡纳归为“灵”，会造成元素统计偏斜。
- 当前历史记录未保存完整证据链、规则版本或可复现随机种子。
- 当前测试主要检查卡牌数量、字段存在和牌阵位置，尚未覆盖语义质量与关系推理。

这些问题必须按 Phase M 和后续路线图分阶段修复，不要在 MOD-001 中顺手全部改掉。

## 7. 当前开发文档

- `AGENTS.md`
- `docs/DECISIONS.md`
- `docs/MODULARIZATION_PLAN.md`
- `docs/DATA_ARCHITECTURE.md`
- `docs/ENGINE_ARCHITECTURE.md`
- `docs/CARD_DATA_STANDARD.md`
- `docs/ROADMAP.md`
- `docs/PROGRESS.md`

## 8. 本轮验证记录

本轮只新增和更新开发文档，没有修改运行代码。

已检查：

- `src/` 目标结构与模块化任务一致
- 静态知识与用户历史边界明确
- 单牌一文件与按需加载不影响抽牌独立性
- IndexedDB 实现被安排在 AU-002、AU-003，而非混入 Phase M
- README、AGENTS、DECISIONS、MODULARIZATION_PLAN 和 PROGRESS 引用一致
- `PROGRESS.md` 只有一个 `NEXT` 任务

未执行运行测试：

- 本轮没有代码变更。
- MOD-001 必须记录现有 Python、Node 和人工交互基线。
