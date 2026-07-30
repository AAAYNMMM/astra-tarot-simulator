# 项目开发进度

> 本文件是“开始任务”和“继续任务”的唯一实时状态入口。
> 锁定决策定义不能改变什么，执行契约定义怎样推进，本文件记录现在做到哪里、验证了什么以及下一步是什么。

## 1. 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase M：模块化基础 |
| 当前进行中任务 | 无 |
| 下一任务 | `MOD-001` 模块边界、数据边界与基线验证 |
| 最近完成任务 | `DOC-010` 唯一执行契约与连续审查收口 |
| 阻塞项 | 无 |
| 最后更新时间 | 2026-07-31 |
| 规划状态 | 已冻结；达到审查停止条件后不得继续用规划推迟开发 |

## 2. 当前活动任务

当前没有活动任务。开始 `MOD-001` 时必须填写以下现场，不得只保存在聊天中。

| 字段 | 当前值 |
|---|---|
| 任务 ID |  |
| 状态 |  |
| 规范来源 |  |
| 工作分支 |  |
| 当前完整 commit |  |
| CWapi task_id |  |
| CWapi RESULT |  |
| CWapi scope |  |
| 受影响父任务 |  |
| 父任务派生状态 |  |
| 开始时间 |  |
| 最后更新时间 |  |

### 已完成验收项

- [ ]

### 剩余验收项

- [ ]

### 本轮修改文件

- 无

### 自动测试摘要

- 无活动任务

### 人工检查摘要

- 无活动任务

### 关键产物哈希

- 无

### 阻塞原因

- 无

### 下一具体动作

- 执行 `MOD-001`。

## 3. 下一任务：MOD-001

**状态：NEXT**

### 规范来源

- `AGENTS.md`
- `docs/DECISIONS.md`
- `docs/EXECUTION_CONTRACTS.md`
- `docs/MODULARIZATION_PLAN.md`
- `docs/DATA_ARCHITECTURE.md`
- `docs/ENGINEERING_GUARDS.md`
- 本文件

### 目标

- 核对当前主要文件、函数职责和依赖关系。
- 为 `app.js`、`styles.css`、`data.js` 建立唯一迁移映射。
- 确认 `src/` 最终结构和现有 `kebab-case` 业务 ID。
- 区分静态知识、临时状态、用户数据、人工源、临时生成物和正式生成文件。
- 建立模块规模、依赖方向和循环依赖检查。
- 建立已知技术债基线和单调收紧规则。
- 记录自动测试、关键交互、旧历史字段和浏览器环境基线。
- 建立最小CWapi统一验证入口。

### 产物

- `docs/MODULE_MAP.md`
- `scripts/check_module_size.py`
- `scripts/check_import_boundaries.py`
- `tests/module_contract_test.js`
- `automation/validate.py`
- `automation/README.md`
- `automation/quality-baseline.json`
- 最小 `src/` 骨架或职责说明
- 旧历史字段和迁移输入基线
- 当前浏览器与操作系统人工基线
- 人工源、临时目录和生成文件职责说明

### 已知技术债基线

`automation/quality-baseline.json` 初始至少记录：

| 文件 | 当前行数 | 本任务结果 | 最迟清除 |
|---|---:|---|---|
| `app.js` | 1528 | WARN，不得增长 | `MOD-006A` |
| `styles.css` | 4918 | WARN，不得增长 | `MOD-002` |
| `data.js` | 637 | WARN，不得增长 | `MOD-006A` |

规则：

- 已登记旧超限且未增长：WARN。
- 旧超限增长：FAIL。
- 新增人工超限：FAIL。
- 未登记越界：FAIL。
- 删除技术债后不得重新放宽。
- `MOD-006D` 时人工文件超限清单必须为空。

### baseline验证入口

```text
automation/validate.py --scope baseline
```

至少执行：

- 当前Python测试；
- 当前Node smoke test；
- 模块规模和技术债基线检查；
- 依赖边界检查；
- 机器可读摘要；
- 可靠退出码。

### 浏览器与人工基线

至少记录：

- 实际操作系统和版本；
- 实际浏览器和版本；
- 准备页；
- 问题、牌阵和牌面选择；
- 洗牌、发牌、翻牌和全部翻开；
- 结果生成；
- 历史查看、删除和清空；
- 刷新和关闭生命周期；
- 当前离线重新打开能力；
- 已知降级和未测试环境。

状态只允许：`SUPPORTED`、`SUPPORTED-WITH-DEGRADATION`、`NOT-TESTED`、`NOT-SUPPORTED`。

### 禁止范围

- 不改变四种牌阵或牌位。
- 不改变任何现有卡牌、问题、牌阵和牌位 ID。
- 不改写78张牌含义。
- 不改变抽牌或正逆位概率。
- 不扩展预设问题。
- 不实现新规则引擎。
- 不迁移IndexedDB。
- 不拆分现有大型业务文件。
- 不提前建立 `MOD-003A` 的模块兼容桥。
- 不引入npm构建依赖。
- 不创建 `.github/workflows/`。
- 不提前实现后期PWA、无障碍、版本迁移或性能优化。
- 不新增非阻断性规划文档。

### 验收

1. 模块规模脚本报告三个现有大型文件，并按已知技术债规则返回WARN而非永久豁免。
2. 旧债增长、新债务和未登记越界能够返回FAIL。
3. `MODULE_MAP.md` 为每个旧职责指定唯一目标模块和迁移任务。
4. 依赖方向和循环依赖规则可自动检查。
5. 现有业务ID、静态知识、临时状态、用户数据、人工源和生成职责被记录。
6. Python和Node基线测试结果被记录。
7. 准备、洗牌、发牌、翻牌、结果、历史、离线和关闭生命周期人工基线被记录。
8. 当前 `localStorage` 设置与历史结构被记录。
9. 当前浏览器和操作系统环境被正确标记。
10. `automation/validate.py --scope baseline` 可由CWapi对固定commit执行。
11. 没有运行行为变化。
12. 当前commit取得匹配的CWapi RESULT。
13. 本文件将唯一 `NEXT` 更新为 `MOD-002`。

## 4. 当前代码与平台基线

| 项目 | 当前状态 | 后续任务 |
|---|---|---|
| `app.js` | 1528行，超限 | `MOD-003A` 至 `MOD-006A`渐进迁移 |
| `styles.css` | 4918行，超限 | `MOD-002` |
| `data.js` | 637行，超限 | `MOD-005`、`MOD-006A/B` |
| `run.py` | 243行，仓库根目录服务 | `MOD-004B` |
| ES Module入口 | 尚未建立 | `MOD-003A` |
| 兼容桥 | 尚未建立 | `MOD-003A`建立，`MOD-006A`删除 |
| 业务ID | 现有代码使用kebab-case | Phase M保持不变 |
| `localStorage`设置 | 小型JSON | `MOD-003B`抽离接口 |
| `localStorage`历史 | 最多20条精简记录 | `AU-002`、`AU-003A–C` |
| IndexedDB | 尚未使用 | `AU-002` |
| GitHub Actions | 不使用 | CWapi本地验证 |
| CWapi统一入口 | 尚未建立 | `MOD-001`建立baseline，`MOD-006D`完成full |
| PWA更新 | 统一回退首页 | `MOD-006C`、`PLAT-001` |
| PWA离线状态 | 未区分应用壳和完整占卜 | `MOD-006C` |
| 无障碍 | 部分ARIA和键盘支持 | `AX-001`、`AX-002` |
| 错误恢复 | 局部容错 | `ERR-001A–D` |
| 版本兼容 | 有版本规划，无内容指纹 | `MOD-006B`、`AU-002`、`REL-005` |
| 确定性 | 当前抽牌使用安全随机源 | `MOD-003B`、`AU-001` |
| 浏览器支持矩阵 | 尚未冻结 | `MOD-001`记录基线，`REL-001`冻结 |
| 最终盲测集 | 尚未建立受控保管 | `EV-000A` |

## 5. 阶段进度

| 阶段 | 状态 | 完成度 | 说明 |
|---|---|---:|---|
| Phase 0 | DONE | 100% | 锁定决策、唯一执行契约和实时现场已建立 |
| Phase M | NEXT | 0% | 当前唯一任务 `MOD-001` |
| Phase 1 | BLOCKED | 0% | 等待 `MOD-006D` |
| Phase 2 | PARENT-PENDING | 0% | 等待 `TQ-005B` |
| Phase 3 | PARENT-PENDING | 0% | 问题与适配按领域拆分 |
| Phase 4 | BACKLOG | 0% | 完整牌位和Observation |
| Phase 5 | BACKLOG | 0% | MR-001至MR-005 |
| Phase 6 | BACKLOG | 0% | CL-001至CL-005和TX-001至TX-003 |
| Phase 7 | PARENT-PENDING | 0% | 独立随机流、历史、迁移和artifact指纹 |
| Phase 8 | PARENT-PENDING | 0% | 评测、错误恢复、无障碍和UI |
| Phase 9 | PARENT-PENDING | 0% | PWA、性能、兼容、最终回归和发布 |

## 6. 任务状态表

| 任务 | 状态 | 结果或说明 |
|---|---|---|
| `DOC-001`–`DOC-009` | DONE | 原始文档、质量护栏和前两轮执行优化 |
| `DOC-010` | DONE | 唯一执行契约、技术债基线、渐进迁移、盲测保管和审查收敛 |
| `MOD-001` | NEXT | 模块边界、数据边界与baseline验证 |
| `MOD-002` | BACKLOG | CSS拆分 |
| `MOD-003A` | BACKLOG | ES Module入口与兼容桥 |
| `MOD-003B` | BACKLOG | 基础模块抽离 |
| `MOD-004A` | BACKLOG | 状态、控制器和渲染器 |
| `MOD-004B` | BACKLOG | 服务器安全和生命周期保护 |
| `MOD-005` | BACKLOG | 人工知识源和旧版解读 |
| `MOD-006A` | BACKLOG | 删除兼容桥、旧全局和旧大型文件 |
| `MOD-006B` | BACKLOG | 正式生成与artifact manifest |
| `MOD-006C` | BACKLOG | PWA资源类型、等级和状态 |
| `MOD-006D` | BACKLOG | Phase M full验证 |
| `TQ-001`–`TQ-004` | BLOCKED/BACKLOG | 等待Phase M，随后Schema、词典、评测协议和黄金样本 |
| `TQ-005A/B` | BACKLOG | 最小消费者契约和可消费性验证 |
| `TQ-101`–`TQ-107` | PARENT-PENDING | 78张牌资料父任务 |
| `QP-001`–`QP-004` | BACKLOG/PARENT-PENDING | 问题Schema、问题库和适配 |
| `PO-001`–`PO-003` | BACKLOG | 牌位和Observation |
| `MR-001`–`MR-005` | BACKLOG | 关系引擎 |
| `CL-001`–`CL-005` | BACKLOG | Claim、评分、冲突和结构化校验 |
| `TX-001`–`TX-003` | BACKLOG | 模板和渲染后校验 |
| `AU-001`–`AU-003C` | BACKLOG/PARENT-PENDING | 随机、历史、迁移和审计 |
| `EV-001`–`EV-004`、`EV-000B` | BACKLOG/PARENT-PENDING | 评测资产、门禁和最终盲测 |
| `ERR-001A`–`ERR-001D` | PARENT-PENDING | 错误恢复父任务及叶子任务 |
| `AX-001`、`AX-002` | BACKLOG | 无障碍 |
| `UI-001`、`UI-002` | BACKLOG | 新引擎与历史界面 |
| `PLAT-001`、`PERF-001`、`PWA-002` | BACKLOG | PWA和资源预算 |
| `REL-001`–`REL-005` | PARENT-PENDING | 发布稳定化 |

## 7. 本轮文档验证记录

本轮只修改开发文档，没有修改运行代码。

已完成：

- 建立唯一执行契约和文档权威顺序。
- 定义已知技术债的WARN/FAIL和单调收紧规则。
- 将模块迁移改为ES Module入口、兼容桥、逐步接线和最终清理。
- 将黄金样本消费拆为 `TQ-005A/B`，消除跨阶段隐式依赖。
- 使MR任务顺序与运行时优先级一致。
- 增加渲染前结构化校验和渲染后文本校验。
- 定义最终盲测集受控保管和哈希证明。
- 增加artifact指纹和三类历史承诺。
- 将错误恢复拆为四个叶子任务。
- 区分应用壳、默认牌组和其他牌组的离线状态。
- 保持唯一 `NEXT = MOD-001`。

未执行运行测试：本轮为纯文档一致性与执行契约更新，不创建CWapi TASK。
