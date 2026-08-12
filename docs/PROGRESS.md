# 项目开发进度

> 本文件是继续任务的唯一实时状态入口；任务定义以`EXECUTION_CONTRACTS.md`为准。

## 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase 14：自由问题隔离、统一顺势评分与独立牌阵 V3；维护修复已完成 |
| 当前进行中任务 | 无 |
| 最近完成任务 | `HOTFIX-001`：牌面瞬时加载失败恢复 |
| 唯一下一任务 | `REL-007`：正式版本与 exact-commit 发布验证 |
| 阻塞项 | 无 |
| 工作分支 | `main` |
| 实施基线commit | `525e3efb45fd08a2a0dd63249e5a1a35006b91f3` |
| HOTFIX-001功能验证commit | `b55893d629df669391899f3565e3145993b1e881` |
| Phase 1状态 | `PARENT-DONE` |
| Phase 2状态 | `PARENT-DONE` |
| Phase 3状态 | `PARENT-DONE` |
| Phase 4状态 | `PARENT-DONE` |
| Phase 5状态 | `PARENT-DONE` |
| Phase 6状态 | `PARENT-DONE` |
| Phase 7状态 | `PARENT-DONE` |
| Phase 8状态 | `PARENT-DONE` |
| Phase 9状态 | `PARENT-DONE` |
| Phase 10状态 | `PARENT-DONE` |
| Phase 11状态 | `PARENT-DONE` |
| Phase 12状态 | `PARENT-IN-PROGRESS`（正式发布证据未绑定最终 commit） |
| Phase 13状态 | `HISTORICAL-COMPATIBILITY` |
| Phase 14状态 | `PARENT-IN-PROGRESS`（`V3-001`至`V3-009`与`HOTFIX-001`已完成；`REL-007`按约定后移） |
| 最后更新时间 | 2026-08-12 |

## HOTFIX-001 实施现场

- 状态：`DONE`。
- 规范来源：D-021、D-042、D-052、D-058、`MOD-006C` 与 CWapi exact-commit 验证要求。
- 问题：牌组文件与生成清单完整，但牌面图片的瞬时网络/缓存读取失败会直接触发 UI 占位图；原实现不会重试，因而一次瞬时错误会在当前牌面元素上表现为永久加载失败。
- 修复：Service Worker 在牌面网络请求抛出瞬时异常时使用克隆请求进行一次恢复；UI 图片错误处理第一次失败进入 `retrying` 并重试原始牌面，只有持续失败才进入可访问占位图；成功加载会清理重试状态。
- 范围：未改变抽牌、正逆位、牌义、评分、牌阵和历史格式。
- 源码修复commit：`b34afddcf9109c40df3b115d37a89794f3cc3629`。
- 生成物同步commit：`ec34d5994127d4fabfc8398208d55ed934877557`。
- 发布证据修复与功能验证commit：`b55893d629df669391899f3565e3145993b1e881`；同时更新当前 2.1.0 性能报告并纳入 `release-2.1.0.json`，使干净 exact-commit worktree 不再依赖本地残留 `.qa` 文件。
- 生成物：artifact manifest `6d687c3dc7602185d56e359448ebf4aec286d1811003d9b4e5f4bc94a40ecd98`；precache manifest `3cc76356e354bc95de221a0553fdc7e35e3b30b1b0c36804f2504b6e8f70ddaf`；releaseId `2.1.0-6d687c3dc760`。
- 回归合同：`tests/pwa_contract_test.mjs`覆盖“第一次失败后恢复”和“持续失败后进入可访问占位”，并验证 Service Worker 牌面请求恢复链路。
- CWapi full 验证：任务 `GPT5B8DDCCC2BB28A0A0D27B729E5D58` 绑定 `b55893d629df669391899f3565e3145993b1e881`；90 个验证步骤全部 `PASS`，0 warning，56,160 组真实数据矩阵 `PASS`，browser harness `PASS`，严格模块检查 416/416 `PASS`，工作区验证前后均干净；SUMMARY 为 `READY`、`needs_attention=false`。
- 下一具体动作：恢复 `REL-007` 正式版本与 exact-commit 发布验证，不再扩展本次维护修复范围。

## Phase 14 实施现场

已完成：

- 新建界面只保留自由问题、四牌阵和牌面；问题按 NFKC、空白、控制字符及 2–200 Unicode 字符校验，只进入标题与历史。
- `EngineReadingRequestV3`冻结为问题无关的严格合同；Worker拒绝旧问题字段、期待、标准、时间、比较及未知字段。
- 新 Worker 使用原生`SpreadReadingProfile → SpreadObservation → SpreadRelation → SpreadClaim`静态链路，不加载旧`QuestionProfile`、固定问题或期待策略；问题正文不进入 Observation、Relation、Claim、Assessment、Presentation、随机或诊断。
- 单张牌、时间之流、五牌十字和凯尔特十字拥有独立关系图、阅读工作流、权重与结构综合；凯尔特 V2 第七位为`self`。
- 逆位模式按牌位 facet 和权重确定性选择，写入 Observation、逐牌详情与 V3 历史。
- 四牌阵统一输出八项“综合顺势等级”；单牌三项不适用且最高 S，证据不完整时禁止默认 C。
- 综合页与逐牌详情按 V3 分工，并持续展示问题仅作记录的声明。
- PRNG V1 分布保持不变，rendering 流已接通；未知算法或版本不重放。
- ReadingRecord 3.0.0 与 V1/V2 合并读取，同 ID 结构化记录优先，删除同时覆盖旧投影与结构化记录。

已通过的定向验证：

- `npm run test:v3`：自由问题、四牌阵工作流、100 组问题隔离、端到端输出、随机黄金向量、V2/V3记录和 V1/V2/V3 历史集成全部通过。
- 旧 Phase 1、4、5、6、7、11、13 与应用/UI合同的兼容测试已在开发过程中分批通过；凯尔特 V1 operator/graph 与 V2定义显式分派。
- 基线验证：82/82 `PASS`，0 失败、0 警告。
- `npm run test:full`：90/90 `PASS`，0 失败、0 警告；56,160 组旧真实数据矩阵全部通过，凯尔特 P95 为 5.134ms。
- Chrome 151 与 Edge 149 均完成四牌阵、自由问题隔离、V3历史、CSP/XSS 与离线缓存验证；Chrome 断网重开成功。
- 严格模块尺寸 415/415 通过、0 警告；导入边界无循环或越界。V3 引擎性能报告为 median 3.308ms、P95 4.663ms。
- 生成物已冻结：artifact manifest `1466c12a8e69ff715098afabe08c6f87f681c10ab4f9565aea16cbdcbbb63e6d`，precache manifest `35b3f9971ec9f83b9e8ac002bf2c2a5995138243943b9fcd5d7f54ccafbd02da`。

## Phase 12实施现场

Phase 12 的精简 Schema 4.0.0、按需加载、错误恢复与 2.1.0 历史发布证据继续保留；生产新建流程已经由 Phase 14 的 V3 合同取代。Phase 12 尚未绑定本次最终 commit，不把旧发布报告当作本次正式发布结论。

V3 功能范围没有剩余实施项。后续只剩`REL-007`：由维护者另行确定正式版本号与最终 commit，并在该 exact commit 上执行发布验证；这不属于本次工作区实现完成的替代条件。

## 冻结不变量

- 运行时纯规则、离线；问题只用于记录，四牌阵统一按牌面结构评分。
- 新界面不存在固定问题、问题类型、主题、期待、判断标准、时间范围或双路径入口。
- Worker失败不在UI主线程静默执行完整引擎；失败保留原牌并可恢复。
- V1/V2历史只读兼容，不原地迁移、重评分或重解读。
- 最终盲测正文不进入仓库或日志。
- 现有未跟踪`%SystemDrive%/`目录属于用户数据，不删除、不修改、不纳入提交。
