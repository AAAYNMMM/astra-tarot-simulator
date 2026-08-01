# Phase 9：发布稳定化

## 阶段范围

本阶段连续完成 `PLAT-001`、`PERF-001`、`PWA-002`、`REL-002`、`REL-005`、`REL-003`、`REL-001` 与 `REL-004`。

## 原子更新

- shell、knowledge、artifact 和缓存清单共享同一 `releaseId`。
- 安装阶段只写入临时 stage cache；全部必需资源通过状态、类型与传输字节 SHA-256 校验后才允许进入 waiting。
- waiting worker 不会自行切换；只有页面协调器确认受控标签页为空闲，或用户明确强制更新时才发送激活消息。
- 新 worker 不调用 `clients.claim()`；旧页面在重载前继续由旧 worker 和旧 release cache 服务。
- 当前稳定 release 与上一完整 release 至少保留两代；旧客户端未响应时不清理更旧缓存。
- 回滚只切换服务中的 release cache，不回退或删除已升级历史。

## 离线牌组

- 首次安装只阻塞应用壳与知识，不阻塞四套完整牌面。
- 默认和其他牌组按需缓存，显示进度、空间估算、失败状态与重试。
- 删除牌组缓存不会删除历史、设置、知识或当前占卜。
- 图像缺失继续使用包含牌名、牌位和正逆位的可访问占位。

## 发布门禁

- 性能报告记录 shell、knowledge、四套牌组、凯尔特十字规则计算、单条记录与诊断预算。
- 兼容矩阵只使用 `SUPPORTED`、`SUPPORTED-WITH-DEGRADATION`、`NOT-TESTED`、`NOT-SUPPORTED`。
- 发布验收覆盖离线状态、隐私、许可证、第三方声明、盲测和 artifact 版本。
- `REL-001` 在全部运行代码、数据、缓存、迁移、资源清单与生成产物之后执行。
- 2.0.0 release manifest 固定 artifact、precache、兼容矩阵、许可证、评测和验收哈希。

## CWapi证据

- 阶段实现任务：`01KYXMJ0PH9M7AG00000000009`
- 最终 exact-commit full 复验任务：`01KYXMN0PH9V7AG0000000000A`
- 最终提交以远端 `phase-9-release` 分支和终态 RESULT 为准。
