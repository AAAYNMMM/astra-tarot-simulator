# 项目开发进度

> 本文件是继续任务的唯一实时状态入口；任务定义以 `EXECUTION_CONTRACTS.md` 为准。

## 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase 11：长篇因果解读与渲染性能 |
| 当前进行中任务 | 无 |
| 最近完成任务 | Phase 11终态：长篇因果解读、去重门禁、Worker预热和惰性渲染 |
| 唯一下一任务 | `无（2.2长篇解读终态）` |
| 阻塞项 | 无 |
| 工作分支 | `phase-11-longform-performance` |
| Phase M状态 | `PARENT-DONE` |
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
| 最后更新时间 | 2026-08-01 |

## Phase 11完成记录

- 综合解读改为“最终判断、局势总解、关键牌位详解、成立/失败/转折条件、可选时间与表现形式”。
- 删除问题复述、位置播报式走势句和正文中的重复牌名。
- 建立形成原因、当前状态、核心矛盾、推动力、阻力、行动转折和结果落点的结构化论证。
- 单牌、时间线、五牌十字和凯尔特十字分别执行长篇内容量门禁。
- 任意两段文本相似度达到0.72即失败，机械前缀和模糊词直接失败。
- 牌位标题保留牌名和正逆位，正文只解释该牌在本问题中的实际作用。
- 成立、失败与转折条件按关系、事业、财务、成长、选择和日常领域生成。
- 多牌牌阵在结果证据充分时显示出现渠道、发展速度、演变顺序和兑现信号。
- 推理 Worker 在应用初始化后后台预热78张牌与90题资料，同一页面只创建一个 Worker。
- 单牌和综合视图按需渲染并缓存DOM节点，使用DocumentFragment一次提交。
- 长篇屏外内容使用content-visibility和containment降低布局与绘制开销。
- 阶段实现CWapi任务：`01KYZP4NF6YERQ0K0X1VN94AC8`。
- 最终full复验CWapi任务：`01KYZERP8S0T831Y35SYRT02MG`；最终commit以终态RESULT和远端分支核验为准。

## 冻结不变量

- 运行时纯规则、离线、固定问题和四牌阵。
- 确定性表示同一输入在固定规则下产生唯一结果，不宣称对现实未来具有客观必然性。
- 长篇内容不得依靠问题复述、牌名重复、位置播报或同义句凑字。
- Worker失败不在UI主线程静默重跑完整引擎。
- UI主线程只负责交互、动画和一次性DOM提交。
- 最终盲测正文不进入仓库或日志。
- `automation/validate.py --scope full` 是完整回归入口。
