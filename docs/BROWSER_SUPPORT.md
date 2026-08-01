# 浏览器支持矩阵

状态值只允许：`SUPPORTED`、`SUPPORTED-WITH-DEGRADATION`、`NOT-TESTED`、`NOT-SUPPORTED`。

| 平台 | 浏览器 | 状态 | 说明 |
|---|---|---|---|
| Windows 10/11 | Chrome 128+ | SUPPORTED | 本地启动、IndexedDB、Service Worker、BroadcastChannel 与安装流程纳入发布回归 |
| Windows 10/11 | Edge 128+ | SUPPORTED | Chromium PWA 能力与 Chrome 等价验证 |
| Windows 10/11 | Brave 1.69+ | SUPPORTED | 允许浏览器隐私设置导致的站点存储提示 |
| Windows 10/11 | Firefox 129+ | SUPPORTED-WITH-DEGRADATION | 核心应用与离线缓存可用；不声明 Chromium 风格独立安装体验 |
| Android | Chrome | NOT-TESTED | 保留响应式与触控支持，不将未执行的设备回归写成已支持 |
| iOS | Safari | NOT-TESTED | 保留网页运行能力，不声明后台更新或存储配额行为已验证 |

## 支持边界

- JavaScript、CSS、知识模块和图片失败不得回退 HTML。
- 不支持 Service Worker 时仍可在线或本地服务器运行，但不显示完整离线可用。
- IndexedDB 不可用时保留当前结果和内存待导出副本，不静默删除历史。
- 浏览器清除站点数据会删除本地设置、历史和缓存。
