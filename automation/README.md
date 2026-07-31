# 本地验证入口

本目录保存由 CWapi 对固定 commit 执行的仓库验证入口。应用运行本身不依赖这些脚本。

## 当前实现范围

Phase M 的 `MOD-001` 只实现：

```text
python automation/validate.py --scope baseline
```

`baseline` 依次执行：

1. `python -m unittest discover -s tests -v`
2. `node tests/smoke_test.js`
3. `node tests/module_contract_test.mjs`
4. `python scripts/check_module_size.py --mode baseline --format json`
5. `python scripts/check_import_boundaries.py --format json`

脚本不使用 shell 拼接，不修改源码，并设置 `PYTHONDONTWRITEBYTECODE=1`。最终在标准输出中写出：

```text
ASTRA_VALIDATION_SUMMARY={...}
```

该 JSON 包含 scope、环境、步骤、退出码、耗时和警告数量，供 CWapi RESULT 收集。

## 技术债语义

`automation/quality-baseline.json` 是机器可读的临时债务清单。

- 已登记旧文件不超过冻结行数：`WARN`，baseline 可以通过。
- 已登记旧文件增长：`FAIL`。
- 新增未登记超限人工文件：`FAIL`。
- 已解决债务重新出现：`FAIL`。
- `MOD-006D` 的 strict/full 范围不得再有任何人工 JS/CSS 超限。

当前登记：

| 文件 | 冻结行数 | 硬上限 | 最迟清除 |
|---|---:|---:|---|
| `app.js` | 1528 | 600 | `MOD-006A` |
| `styles.css` | 4918 | 900 | `MOD-002` |
| `data.js` | 637 | 600 | `MOD-006A` |

## 单独运行检查

```text
python scripts/check_module_size.py
python scripts/check_module_size.py --mode strict
python scripts/check_import_boundaries.py
node tests/module_contract_test.mjs
```

JSON 输出：

```text
python scripts/check_module_size.py --format json
python scripts/check_import_boundaries.py --format json
```

## 依赖

- Python 标准库。
- Node.js，仅用于开发和验证。
- 不需要 `npm install`。
- 不创建或依赖 GitHub Actions。

Node 缺失属于验证失败，不得静默跳过。

## CWapi证据要求

非纯文档任务必须保存：

- 完整 40 位 commit；
- 新 task_id；
- scope；
- 每步退出码和摘要；
- 警告与未覆盖环境；
- 修改文件和关键哈希；
- 终态 RESULT。

代码、数据、缓存、迁移、资源清单或生成产物变化后，旧 RESULT 立即失效。

## 后续扩展

后续 Phase M 任务只能扩展同一个入口：

- `MOD-002`：CSS 路径、导入和规模。
- `MOD-003A/B`：ESM、Node 格式、配置、随机、设置和生命周期客户端。
- `MOD-004A/B`：控制器、渲染、DOM 注入、服务器边界和 CSP。
- `MOD-005`：人工知识源和旧结果兼容。
- `MOD-006B/C`：生成产物、manifest、Service Worker 和离线状态。
- `MOD-006D`：`--scope full`、浏览器回归和 Phase M 收口。

未实现的 scope 不得用 baseline 冒充。
