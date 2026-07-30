# 项目开发进度

> 本文件是后续“开始任务”和“继续任务”的唯一实时进度入口。
>
> 路线图定义规则引擎应该做什么；`MODULARIZATION_PLAN.md`、`DATA_ARCHITECTURE.md` 与 `ENGINEERING_GUARDS.md` 定义前置重构和工程护栏；本文件记录目前做到哪里。

## 1. 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase M：模块化基础 |
| 当前进行中任务 | 无 |
| 下一任务 | `MOD-001` 模块边界、数据边界与基线测试 |
| 最近完成任务 | `DOC-006` 增加工程护栏并采用 CWapi 本地验证 |
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
- 记录本项目将由 CWapi 执行的验证入口与范围，不创建 GitHub Actions。

开始前必须读取：

- `AGENTS.md`
- `docs/DECISIONS.md`
- `docs/MODULARIZATION_PLAN.md`
- `docs/DATA_ARCHITECTURE.md`
- `docs/ENGINEERING_GUARDS.md`
- `docs/ENGINE_ARCHITECTURE.md`
- `docs/ROADMAP.md`
- 当前 `app.js`
- 当前 `styles.css`
- 当前 `data.js`
- 当前 `index.html`、`run.py`、`sw.js` 和测试文件

建议产物：

- `scripts/check_module_size.py`
- `scripts/check_import_boundaries.py`，若本轮可在不扩大范围的情况下完成
- `docs/MODULE_MAP.md`
- `tests/module_contract_test.js`
- `src/` 最小目录骨架或职责说明文件
- 当前历史记录字段与迁移基线说明
- CWapi 后续验证入口规划，实际统一验证脚本可在 `MOD-006` 收口

本任务不应：

- 改变四种牌阵或牌位
- 改写 78 张牌的含义
- 改变抽牌结果和正逆位概率
- 扩展预设问题
- 实现新规则引擎
- 直接把历史迁移到 IndexedDB
- 一次性拆完全部代码
- 引入 npm 构建依赖
- 创建 `.github/workflows/`

验收标准：

1. 模块规模脚本能够报告 `app.js`、`styles.css` 和 `data.js` 的当前超限情况。
2. `MODULE_MAP.md` 列出旧文件中各职责的目标 `src/` 模块。
3. 明确依赖方向和禁止循环依赖规则。
4. 明确静态知识、临时状态、用户数据和生成文件的边界。
5. 原有 Python 与 Node 测试结果已记录。
6. 至少记录准备页、洗牌、发牌、翻牌、结果、历史和关闭生命周期的人工基线检查项。
7. 当前 localStorage 历史结构和迁移输入已记录。
8. 明确 CWapi 对固定 commit 的验证方式，不新增 GitHub Actions。
9. 没有改变运行行为。
10. 本文件更新为下一任务 `MOD-002`。

## 3. 当前代码、存储与验证基线

截至 2026-07-31：

| 文件、存储或验证 | 规模/状态 | 判定 |
|---|---|---|
| `app.js` | 1528 行 | 超过 JS 600 行硬上限，待拆分 |
| `styles.css` | 4918 行 | 超过 CSS 900 行硬上限，待拆分 |
| `data.js` | 637 行 | 超过 JS 600 行硬上限，未来资料扩展风险极高 |
| `run.py` | 243 行 | 当前规模可接受，但服务访问边界需加强 |
| `localStorage` 设置 | 小型 JSON | 可继续使用，需抽离存储接口 |
| `localStorage` 历史 | 最多 20 条精简记录 | 当前可用，无法承载目标证据链且存在静默截断 |
| IndexedDB | 尚未使用 | 计划在 AU-002、AU-003 实现完整历史和迁移 |
| GitHub Actions | 不使用 | 复用 CWapi 本地 Runner 工作流 |
| CWapi 验证入口 | 尚未建立项目脚本 | 计划在 MOD-006 收口，期间按任务建立可审计检查入口 |

Phase M 完成后：

- 源代码统一位于 `src/`。
- 应用入口建议 ≤ 200 行。
- 任一人工维护 JavaScript 文件 ≤ 600 行。
- 任一人工维护 CSS 文件 ≤ 900 行。
- 每张完整 `CardSemanticProfile` 使用独立模块。
- 完整 `QuestionProfile` 使用可独立加载的小模块。
- 静态知识通过轻量目录与动态注册表加载。
- 控制器不直接访问 localStorage 或 IndexedDB。
- 卡牌目录、问题目录、动态注册表和缓存清单可由脚本稳定生成。
- 项目提供适合 CWapi 对固定 commit 执行的确定性验证入口。
- `.github/workflows/` 为空或不存在。

## 4. 阶段进度

| 阶段 | 状态 | 完成度 | 说明 |
|---|---|---:|---|
| Phase 0 项目目标与任务系统 | DONE | 100% | 接手协议、决策、架构、标准、数据方案和工程护栏已建立 |
| Phase M 模块化基础 | NEXT | 0% | 下一步 MOD-001，必须在 TQ-001 前完成 |
| Phase 1 单牌数据基础 | BLOCKED | 0% | 等待 MOD-006 完成 |
| Phase 2 78 张牌资料升级 | BACKLOG | 0% | 等待 Phase 1 |
| Phase 3 预设问题系统 | BACKLOG | 0% | 等待问题配置基础 |
| Phase 4 牌位运算系统 | BACKLOG | 0% | 不改变牌阵结构 |
| Phase 5 多牌关系引擎 | BACKLOG | 0% | 等待 Observation 与关系词典 |
| Phase 6 结论与文本系统 | BACKLOG | 0% | 等待多牌关系引擎 |
| Phase 7 审计与历史升级 | BACKLOG | 0% | IndexedDB、迁移、备份、随机和证据链 |
| Phase 8 评测与界面整合 | BACKLOG | 0% | 三项 9.0+、Doctor 与质量门禁 |
| Phase 9 发布稳定化 | BACKLOG | 0% | CWapi 本地回归、安全、许可证和 2.0 收口 |

## 5. 任务状态表

| 任务 ID | 状态 | 完成日期 | 结果 |
|---|---|---|---|
| DOC-001 | DONE | 2026-07-30 | 已建立根目录 `AGENTS.md` |
| DOC-002 | DONE | 2026-07-30 | 已建立锁定决策记录 |
| DOC-003 | DONE | 2026-07-30 | 已建立架构、单牌标准、路线图与进度文档 |
| DOC-004 | DONE | 2026-07-31 | 已建立模块化方案并更新接手规则与锁定决策 |
| DOC-005 | DONE | 2026-07-31 | 已建立 `src/` 目标结构、知识分层、按需加载、IndexedDB 和缓存方案 |
| DOC-006 | DONE | 2026-07-31 | 已建立服务安全、资料治理、备份、Doctor 和 CWapi 本地验证方案 |
| MOD-001 | NEXT |  | 模块边界、数据边界与基线测试 |
| MOD-002 | BACKLOG |  | 拆分 CSS |
| MOD-003 | BACKLOG |  | 抽离基础 JavaScript、随机接口、平台和存储接口 |
| MOD-004 | BACKLOG |  | 拆分应用控制器与渲染器，强化本地服务边界 |
| MOD-005 | BACKLOG |  | 拆分静态知识与旧版解读，建立生成目录和注册表 |
| MOD-006 | BACKLOG |  | 缓存、CWapi 验证入口、回归和清理 |
| TQ-001 | BLOCKED |  | 等待 MOD-006 后定义 CardSemanticProfile Schema |
| TQ-002 | BACKLOG |  | 建立统一语义词典、来源与解释政策 |
| TQ-003 | BACKLOG |  | 制作 6 张黄金样本并验证跨牌边界 |
| TQ-004 | BACKLOG |  | 建立资料评分、反例与审查工具 |
| TQ-101–107 | BACKLOG |  | 完成并审查 78 张牌 |
| QP-001–004 | BACKLOG |  | 建立预设问题与适配系统 |
| PO-001–003 | BACKLOG |  | 牌位运算和 Observation |
| MR-001–004 | BACKLOG |  | 多牌关系推理 |
| CL-001–004 | BACKLOG |  | 结论、评分和冲突消解 |
| TX-001–003 | BACKLOG |  | 模板渲染与校验 |
| AU-001–003 | BACKLOG |  | 随机、IndexedDB 历史、迁移、备份与审计 |
| EV-001–004 | BACKLOG |  | 三项核心质量评测、Doctor 和回归质量门禁 |
| UI-001–002 | BACKLOG |  | 界面和历史接入 |
| REL-001–004 | BACKLOG |  | CWapi 全量本地回归、安全、许可证与发布稳定化 |

## 6. 当前代码基线

截至 2026-07-31 的代码审查结论：

- 项目为离线浏览器应用，Python 只提供本地服务和生命周期控制。
- 当前包含 78 张牌、42 个固定问题和 4 种固定牌阵。
- 当前抽牌使用安全随机源优先的洗牌逻辑，牌面在动画前已确定。
- 当前 `app.js` 同时承担状态、DOM、存储、随机、动画、解读、历史和生命周期，必须拆分。
- 当前 `styles.css` 包含近五千行样式，必须按令牌、基础、布局、组件、功能、动画和响应式拆分。
- 当前 `data.js` 同时保存卡牌、问题和牌阵，后续静态知识必须迁入 `src/knowledge/`。
- 当前 Python 静态服务器以仓库根目录为服务目录，后续必须增加访问白名单和生命周期保护。
- 当前 service worker 预缓存清单由代码手工维护，模块化后必须改为可生成和可校验的分组清单。
- 当前单牌资料主要由关键词、正逆位说明和固定建议组成，适合展示，不足以支持目标规则引擎。
- 当前具体问题没有独立推理配置，综合逻辑主要依赖六大问题分类。
- 当前综合结论存在依赖正逆位数量、主导元素和固定模板的情况。
- 当前全部大阿卡纳归为“灵”，会造成元素统计偏斜。
- 当前历史记录未保存完整证据链、规则版本或可复现随机种子。
- 当前测试主要检查卡牌数量、字段存在和牌阵位置，尚未覆盖语义质量与关系推理。
- 项目验证不使用 GitHub Actions，后续通过 CWapi 对固定 commit 执行本地测试和回归。

这些问题必须按 Phase M 和后续路线图分阶段修复，不要在 MOD-001 中顺手全部改掉。

## 7. 当前开发文档

- `AGENTS.md`
- `docs/DECISIONS.md`
- `docs/MODULARIZATION_PLAN.md`
- `docs/DATA_ARCHITECTURE.md`
- `docs/ENGINEERING_GUARDS.md`
- `docs/ENGINE_ARCHITECTURE.md`
- `docs/CARD_DATA_STANDARD.md`
- `docs/ROADMAP.md`
- `docs/PROGRESS.md`

## 8. 本轮验证记录

本轮只新增和更新开发文档，没有修改运行代码。

已检查：

- CWapi 当前政策明确不使用 GitHub Actions，并要求本地 Runner 对固定 commit 返回 RESULT。
- 工程护栏没有改变现有四种牌阵、固定问题或纯规则引擎目标。
- 安全、生成文件、资料来源、历史备份、Doctor 和浏览器回归已映射到后续阶段。
- 当前唯一 `NEXT` 任务仍为 `MOD-001`。
- AGENTS、DECISIONS、ENGINEERING_GUARDS 和 PROGRESS 的验证政策一致。

未执行运行测试：

- 本轮没有运行代码变更。
- 本轮属于纯文档决策更新，不需要创建 CWapi TASK。
- MOD-001 完成实现和脚本后，必须按适用范围取得当前 commit 的 CWapi RESULT。
