# 2.0 更新与回滚策略

## 正常更新

1. 新 Service Worker 在临时 release cache 中下载 shell 与 knowledge。
2. 每个必需响应必须同源、成功、类型正确，并通过传输字节 SHA-256。
3. 页面收到 waiting 通知后，通过版本化 BroadcastChannel 协议收集标签页状态。
4. 所有受控页面均为空闲时，用户可触发受控激活。
5. 激活后页面重载并进入新 release；旧页面不会混用新模块。

## 阻塞状态

`reading`、`pending-save`、`migration` 和 `unknown` 默认阻止立即切换。无法确认所有标签页时，应完成占卜并关闭旧标签，让浏览器自然切换，而不是强抢控制权。

## 回滚

- Service Worker 保留当前稳定 release 和上一完整 release。
- 回滚切换 shell 与 knowledge 的服务目标，并要求页面重载。
- 已迁移的 ReadingRecord 2.0 不会被降级或删除。
- 旧版本无法理解的新历史只能只读展示，不伪造证据。
- 若上一 release cache 不完整，回滚请求必须失败并保留当前稳定版本。

## 失效条件

最终回归后若修改运行代码、知识数据、缓存策略、迁移、资源清单或生成产物，原 `REL-001` RESULT 立即失效。
