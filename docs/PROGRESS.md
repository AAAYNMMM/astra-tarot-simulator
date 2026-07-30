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
| 规划状态 | 已冻结且执行审查已收敛；不得继续用非阻断性规划推迟开发 |

## 2. 当前活动任务

当前没有活动任务。开始 `MOD-001` 时填写：

| 字段 | 当前值 |
|---|---|
| 任务ID |  |
| 状态 |  |
| 规范来源 |  |
| 工作分支 |  |
| 当前完整commit |  |
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

- 核对主要文件、函数职责和依赖关系。
- 为 `app.js`、`styles.css`、`data.js` 建立唯一迁移映射。
- 确认 `src/` 结构和现有kebab-case业务ID。
- 区分静态知识、状态、用户数据、人工源、临时生成物和正式生成文件。
- 建立模块规模、依赖方向和循环依赖检查。
- 建立已知技术债基线和单调收紧规则。
- 记录自动测试、关键交互、旧历史、浏览器、DOM写入、CSP、Service Worker、Node模块格式和随机调用基线。
- 建立最小CWapi统一验证入口。

### 产物

- `docs/MODULE_MAP.md`
- `scripts/check_module_size.py`
- `scripts/check_import_boundaries.py`
- `tests/module_contract_test.mjs`
- `automation/validate.py`
- `automation/README.md`
- `automation/quality-baseline.json`
- 最小 `src/` 骨架或职责说明
- 旧历史字段和迁移输入基线
- 当前浏览器与操作系统人工基线
- DOM/CSP、PWA缓存、Node格式和随机边界清单

### 已知技术债

| 文件 | 当前行数 | 本任务结果 | 最迟清除 |
|---|---:|---|---|
| `app.js` | 1528 | WARN，不得增长 | `MOD-006A` |
| `styles.css` | 4918 | WARN，不得增长 | `MOD-002` |
| `data.js` | 637 | WARN，不得增长 | `MOD-006A` |

旧债增长、新人工超限、未登记越界和已清除债务重现必须FAIL；Phase M full时清零。

### baseline验证入口

```text
python automation/validate.py --scope baseline
```

至少执行：

```text
python -m unittest discover -s tests -v
node tests/smoke_test.js
node tests/module_contract_test.mjs
```

并执行模块规模、技术债、依赖边界、机器可读摘要和可靠退出码。

### 人工与平台基线

记录：

- 实际操作系统和浏览器版本；
- 准备、问题、牌阵和牌面选择；
- 洗牌、发牌、翻牌、结果和历史；
- 刷新、关闭和生命周期；
- 当前离线重新打开能力；
- APP-SHELL/DEFAULT-DECK/SELECTED-DECKS当前实际状态；
- 所有HTML/style动态写入点和潜在不可信来源；
- 当前Service Worker资源、缓存、skipWaiting、clients.claim和回退行为；
- 当前CommonJS/ESM脚本；
- 业务随机与平台随机调用点；
- 已知降级和未测试环境。

环境状态只允许SUPPORTED、SUPPORTED-WITH-DEGRADATION、NOT-TESTED、NOT-SUPPORTED。

### 禁止范围

- 不改变四种牌阵或牌位。
- 不改变公开ID。
- 不改写牌义、抽牌概率或问题库。
- 不实现新规则引擎或IndexedDB迁移。
- 不拆分当前大型业务文件。
- 不提前建立ESM兼容桥、CSP或新Service Worker实现。
- 不引入npm依赖或构建链。
- 不创建GitHub Actions。
- 不新增非阻断性规划文档。

### 验收

1. 三个大型文件按技术债规则报告WARN。
2. 旧债增长、新债和未登记越界返回FAIL。
3. 每个旧职责有唯一目标模块和迁移任务。
4. 依赖方向和循环依赖可检查。
5. 数据生命周期、人工源和生成职责已记录。
6. Python与Node基线结果已记录。
7. 关键交互、离线和生命周期人工基线已记录。
8. localStorage设置与历史结构已记录。
9. DOM/CSP、Service Worker、Node格式和随机边界清单完整。
10. 当前环境正确标记。
11. baseline可由CWapi对固定commit执行。
12. 没有运行行为变化。
13. 当前commit取得匹配RESULT。
14. 唯一NEXT更新为 `MOD-002`。

## 4. 当前代码与平台基线

| 项目 | 当前状态 | 后续任务 |
|---|---|---|
| `app.js` | 1528行，IIFE和window.TarotData | MOD-003A至MOD-006A |
| `styles.css` | 4918行 | MOD-002 |
| `data.js` | 637行 | MOD-005、MOD-006A/B |
| `run.py` | 服务仓库根目录，生命周期无会话Cookie | MOD-004B |
| ES Module入口 | 尚未建立 | MOD-003A |
| Node测试 | smoke_test.js使用CommonJS | MOD-003A转换ESM |
| DOM写入 | 多处innerHTML和动态style | MOD-004A |
| CSP | 尚未强制 | MOD-004B |
| 业务随机 | 安全随机优先，存在Math.random降级 | MOD-003B、AU-001A/B |
| 平台随机 | lifecycle client ID可降级Math.random | MOD-003B/004B |
| localStorage历史 | 最多20条并静默slice | AU-002、AU-003 |
| IndexedDB | 尚未使用 | AU-002 |
| Service Worker | cache.addAll四套牌、统一回退、立即skip/claim | MOD-006C、PLAT-001 |
| Artifact | 尚无规范哈希和manifest | MOD-006B |
| PWA状态 | 未区分壳与完整离线 | MOD-006C |
| 浏览器自动化 | 尚无仓库harness | MOD-006D逐步建立 |
| 盲测保管 | 尚未建立 | EV-000A |
| GitHub Actions | 不使用 | CWapi本地验证 |

## 5. 阶段进度

| 阶段 | 状态 | 说明 |
|---|---|---|
| Phase 0 | DONE | 决策、唯一执行契约和实时现场已建立 |
| Phase M | NEXT | 当前唯一任务MOD-001 |
| Phase 1 | BLOCKED | 等待MOD-006D；随后冻结Card/QP/PO契约和消费验证 |
| Phase 2 | PARENT-PENDING | 等待TQ-005B |
| Phase 3 | PARENT-PENDING | 问题库和适配 |
| Phase 4 | BACKLOG | 结构图和Observation |
| Phase 5 | BACKLOG | MR-001至MR-005 |
| Phase 6 | BACKLOG | CL-001至CL-005、AU-001A、TX-001至TX-003 |
| Phase 7 | PARENT-PENDING | AU-001B、历史、迁移和审计 |
| Phase 8 | PARENT-PENDING | 评测、恢复、无障碍和UI |
| Phase 9 | PARENT-PENDING | PWA、性能、兼容、最终回归和发布 |

## 6. 任务状态摘要

- DONE：`DOC-001`–`DOC-010`
- NEXT：`MOD-001`
- Phase M BACKLOG：`MOD-002`、`MOD-003A/B`、`MOD-004A/B`、`MOD-005`、`MOD-006A–D`
- Phase 1 BLOCKED/BACKLOG：`TQ-001`–`TQ-005B`、`EV-000A`、`QP-001/002`、`PO-001`
- Phase 2 PARENT-PENDING：`TQ-101`–`TQ-107`
- 后续任务：以 `EXECUTION_CONTRACTS.md` 为唯一任务图

## 7. DOC-010验证记录

本轮只修改开发文档，没有修改运行代码。

已完成：

- 建立唯一执行契约和文档权威顺序。
- 定义技术债WARN/FAIL和单调收紧。
- 改为ESM入口、兼容桥、渐进接线和最终清理。
- 冻结Card、Question和Position契约后再批量资料。
- 调整MR顺序并加入结构化/渲染后双层校验。
- 将确定性随机原语放在模板前，生产随机集成纳入最终盲测前置。
- 定义盲测受控保管。
- 建立规范哈希、无自引用manifest图和本次消费指纹。
- 拆分错误恢复。
- 定义Node ESM、CSP、DOM安全、浏览器harness和生命周期Cookie。
- 定义经典SW、分类型缓存、三种离线状态、多标签原子更新和回滚。
- 保持唯一NEXT为MOD-001。

未执行运行测试：本轮为纯文档审查与一致性修复，不创建CWapi TASK。
