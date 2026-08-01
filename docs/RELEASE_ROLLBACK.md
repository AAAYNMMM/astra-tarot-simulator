# 星纱塔罗 2.1.0 回滚手册

## 适用范围

本手册用于已经下载新版本、但激活后出现壳版本、制品版本或离线缓存不一致时的受控回滚。回滚目标只能是 Service Worker 元数据中记录的上一份完整健康 release，不能回滚到半下载、校验失败或未通过激活门禁的缓存。

## 自动保护

- 新 release 先写入 `astra-stage-<releaseId>-<kind>` 暂存缓存。
- 所有必需文件通过状态码、内容类型和 SHA-256 校验后，才提升为稳定缓存。
- 切换前收集所有标签页状态；占卜、待保存或迁移中的标签页会阻止自动激活。
- 当前 release 激活后仍保留上一份完整健康 release。
- 旧缓存只在没有受控页面占用、且超过保留窗口时清理。

## 用户侧回滚

1. 保留当前页面，不要清除站点数据。
2. 打开应用的“离线与版本状态”区域，确认当前版本和页面状态。
3. 在检测到混合版本或启动异常时，选择重新加载；若问题持续，使用受控回滚入口恢复上一完整版本。
4. 回滚后重新打开应用，确认版本状态显示上一 release，历史记录仍可读取。
5. 导出重要历史，再报告当前 release ID、上一 release ID 和脱敏诊断码。

## 维护者验证

执行：

```powershell
python automation/validate.py --scope full
```

并确认：

- `.qa/release/release-acceptance.json` 状态为 `PASS`；
- `.qa/release/performance-report.json` 全部预算通过；
- `.qa/release/release-2.1.0.json` 状态为 `RELEASED`，且上一完整release为2.0.0；
- `tests/phase_9_pwa_atomic_update_test.mjs`、`tests/phase_9_release_test.mjs` 和终态门禁通过；
- Git 工作区干净，最终提交与 CWapi exact-commit RESULT 一致。

## 禁止操作

- 不得通过无条件 `skipWaiting()` 强制覆盖正在使用的标签页。
- 不得删除当前与上一完整健康 release 后再尝试回滚。
- 不得把迁移中的历史降级写回旧 Schema。
- 不得使用清除全部浏览器数据作为常规回滚步骤。
