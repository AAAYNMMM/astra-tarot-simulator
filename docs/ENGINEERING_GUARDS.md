# 工程护栏与本地验证方案

## 1. 目的

本文档定义模块化、资料升级、历史迁移和发布过程中必须同步建设的工程护栏。目标是防止重构破坏、知识漂移、历史丢失、缓存遗漏和本地服务暴露内部文件。

本项目不使用 GitHub Actions。需要真实运行环境的测试、构建、浏览器回归和验收统一复用 `AAAYNMMM/CWapi` 本地 Runner。

## 2. CWapi 本地验证

### 2.1 锁定规则

- 不创建、恢复、启用或依赖 `.github/workflows/`。
- 代码、数据、存储、缓存、启动器或发布变更必须绑定完整40位commit SHA。
- 没有当前commit对应的终态CWapi RESULT，不得宣称本地验证通过。
- GitHub可合并、无冲突或代码审查通过不能替代本地结果。
- 纯文档变更可以不跑完整回归，但必须完成交叉一致性检查。

### 2.2 统一入口分阶段建立

`MOD-001` 建立：

```text
automation/
├── validate.py
└── README.md
```

`automation/validate.py --scope baseline` 至少执行：

1. Python基础测试。
2. Node smoke test。
3. 模块行数检查。
4. 依赖方向检查。
5. 机器可读摘要。
6. 可靠退出码。

后续扩展：

- `MOD-002`：CSS路径和规模检查。
- `MOD-003`：基础模块、随机、设置和生命周期测试。
- `MOD-004`：控制器、渲染器和服务访问边界。
- `MOD-005`：知识目录、注册表和旧结果兼容。
- `MOD-006B`：生成文件和缓存清单一致性。
- `MOD-006C`：PWA资源类型和离线缓存。
- `MOD-006D`：`--scope full`、浏览器回归和Phase M收口。

最终结构：

```text
automation/
├── validate.py
├── browser_smoke.py
└── README.md
```

验证脚本不得修改源码，不得依赖人工交互，不得把大型日志或浏览器产物提交仓库。

### 2.3 CWapi建议序列

```text
git_rev_parse
git_status
repository_automation: automation/validate.py --scope targeted
repository_automation: automation/validate.py --scope full
collect_hashes
git_status
```

实际scope按任务阶段选择。每个RESULT必须准确说明执行范围，不能用baseline结果冒充full回归。

## 3. 当前活动任务现场

`PROGRESS.md` 必须记录：

- 叶子任务ID和状态。
- 规范来源。
- 分支与完整commit。
- CWapi task_id和RESULT状态。
- 已完成与剩余验收项。
- 修改文件。
- 阻塞原因。
- 下一具体动作。

聊天历史不是可靠恢复点。

## 4. 本地服务器访问边界

目标规则：

- 只允许应用入口、`src/`、`assets/`、manifest、图标和必要PWA文件。
- 拒绝 `.git/`、`.github/`、`docs/`、`tests/`、`scripts/`、`automation/`、`.qa/`、隐藏文件和临时文件。
- 默认监听 `127.0.0.1`。
- 非本机监听时显示安全警告。
- 生命周期接口执行同源检查和启动时随机令牌验证。
- 增加适合原生ES Modules的Content Security Policy。
- 文件访问白名单、路径穿越和生命周期接口必须有测试。

不要求构建产物目录，优先通过请求处理器白名单保持 `python run.py` 直接运行。

## 5. 可测试随机接口

生产继续使用高质量系统随机源，但核心逻辑通过依赖注入接收：

```js
createReading({
  deck,
  spread,
  randomSource,
});
```

要求：

- 测试可注入固定源或固定种子。
- 问题和牌义加载不得影响牌序或正逆位。
- Phase M只建立接口边界，不改变当前随机分布。
- 可复现种子和确定性洗牌在 `AU-001` 完成。

## 6. 静态知识单一来源

人工主来源：

- 单张 `CardSemanticProfile`
- 单题 `QuestionProfile`
- 固定牌阵与关系图
- 词典
- 模板

脚本生成：

- 轻量卡牌目录
- 卡牌动态注册表
- 轻量问题目录
- 问题动态注册表
- knowledge完整性清单
- PWA预缓存清单

生成文件必须：

- 位于 `src/generated/` 或明确generated路径。
- 文件头记录脚本和命令。
- 提交仓库。
- 可稳定重建。
- 由验证脚本检查是否过期。
- 不得人工直接修改。

## 7. 单牌资料治理

每张牌记录：

- 主要传统。
- 参考资料ID和章节。
- 项目现代化解释范围。
- 审查状态和日期。
- 稳定语义单元ID。
- 近义牌边界。
- 常见误读和禁止推断。

建立：

```text
docs/references/
├── bibliography.md
├── interpretation-policy.md
└── source-conflict-policy.md
```

禁止把来源不明网络牌义直接作为正式资料。

反例测试至少拒绝：

- 无依据具体事件。
- 必然成功或失败。
- 强制人物指认。
- 精确日期。
- 医疗、法律和投资确定性判断。
- 单关键词机械解释。

## 8. 历史备份与容量

完整历史系统必须支持：

- 全部和单条JSON导出。
- 带Schema和版本。
- 导入前大小、结构、版本、数量和冲突验证。
- 导入预览。
- 完整导出与仅显示结果导出。
- 导入失败不破坏现有数据。

容量规则：

- 不静默 `slice` 删除记录。
- 初始建议上限500条完整记录，最终以真实大小测量。
- 接近配额时提示。
- 支持筛选和批量删除。
- 自动清理必须经用户明确授权。

## 9. Doctor与浏览器回归

### 9.1 Doctor

最终提供：

```text
python scripts/doctor.py
```

至少检查：

- Python和启动器条件。
- 必要入口文件。
- 四套牌面和牌背。
- 卡牌、问题目录、资料和注册表。
- 业务ID和语义引用。
- 四牌阵及牌位未变。
- 动态导入路径。
- 生成文件和缓存清单。
- 模块规模和依赖。
- 历史Schema和迁移版本。
- LICENSE和第三方声明。

输出 `PASS / WARN / FAIL`，失败使用非零退出码。

### 9.2 浏览器回归

覆盖：

- 启动和准备页。
- 主题、问题、牌阵和牌面选择。
- 洗牌、发牌、单张和全部翻牌。
- 结果生成。
- 历史写入、读取和删除。
- 刷新与生命周期关闭。
- 离线重新打开。
- 动态加载牌义和问题资料。
- IndexedDB不可用降级。

浏览器回归由CWapi本地执行。

## 10. 许可证

发布前建立：

```text
LICENSE
THIRD_PARTY_NOTICES.md
```

分别说明源代码、原创内容、公共领域牌面和其他第三方资源。

## 11. 任务映射

| 护栏 | 落地任务 |
|---|---|
| baseline验证入口 | `MOD-001` |
| CSS与模块验证扩展 | `MOD-002` 至 `MOD-005` |
| 生成清单 | `MOD-005`、`MOD-006B` |
| PWA资源类型正确性 | `MOD-006C` |
| full验证和Phase M收口 | `MOD-006D` |
| 服务白名单与生命周期保护 | `MOD-004` |
| 随机依赖注入 | `MOD-003`，复现种子在 `AU-001` |
| 来源和解释政策 | `TQ-002` |
| 评测协议 | `EV-000A` |
| 反例和跨牌审查 | `TQ-004`、`TQ-107` |
| 历史、备份和容量 | `AU-002`、`AU-003A–C` |
| Doctor | `EV-004` |
| 浏览器完整回归 | `REL-001` |
| LICENSE与第三方声明 | `REL-003` |

## 12. 明确不做

当前不增加GitHub Actions、图数据库、后端SQLite、账号、云同步、插件、自定义牌阵、自由文本问题或强制npm构建链。