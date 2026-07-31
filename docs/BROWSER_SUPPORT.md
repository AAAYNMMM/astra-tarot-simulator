# 浏览器支持矩阵

> Phase M冻结基线。最终发布矩阵仍由 `REL-001` 冻结。

| 平台/浏览器 | 当前状态 | Phase M验证方式 |
|---|---|---|
| Windows 10/11 + Chrome Stable | `SUPPORTED` | 本机无依赖headless浏览器harness；安装时必须通过 |
| Windows 10/11 + Edge Stable | `SUPPORTED` | 本机无依赖headless浏览器harness；安装时必须通过 |
| Windows 10/11 + Brave Stable | `SUPPORTED` | 本机无依赖headless浏览器harness；安装时必须通过 |
| Windows 10/11 + Firefox Stable | `SUPPORTED-WITH-DEGRADATION` | 安装时执行同源页面、CSP、DOM与历史harness；安装/PWA体验不作Chromium级承诺 |
| Chromium PWA | `SUPPORTED-WITH-DEGRADATION` | Service Worker、manifest、三层离线状态和缓存分类自动契约通过；完整安装体验留给 `PLAT-001`/`REL-001` |
| 移动端 | `NOT-TESTED` | 当前版本不宣称移动端支持 |

## 自动harness边界

`tests/browser_harness.py` 启动临时回环服务器和独立浏览器profile，不修改生产静态白名单。它至少要求一款Chromium浏览器存在，并对所有检测到的Chrome、Edge、Brave和Firefox逐一验证：

- 原生ESM应用启动并写入 `astraBoot=ready`；
- 六类主题、四牌阵和四牌组完成真实DOM渲染；
- 严格CSP不含 `unsafe-inline` / `unsafe-eval`；
- 旧历史键可读取；恶意HTML只显示为文本，不创建图片、事件属性或脚本执行；
- 测试结果通过仅存在于harness服务器的 `/__astra/test-result` 回传。
