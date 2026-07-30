# 工程护栏与本地验证方案

## 1. 文档职责

本文档定义模块化、资料升级、历史迁移和发布过程中必须持续满足的工程护栏。

任务编号、依赖、状态和顺序以 `EXECUTION_CONTRACTS.md` 为准；本文件不维护第二套任务图。

目标是防止重构破坏、技术债永久化、知识与生成目录漂移、随机不可复现、历史丢失、缓存混版、本地服务暴露、盲测泄露和验证证据错配。

## 2. CWapi本地验证

本项目不使用GitHub Actions。真实测试、浏览器回归和验收统一通过 `AAAYNMMM/CWapi` 本地Runner执行仓库内可审计脚本。

### 2.1 锁定规则

- 不创建、恢复、启用或依赖 `.github/workflows/`。
- 代码、数据、存储、缓存、启动器、生成文件或发布变更绑定完整40位commit SHA。
- 没有当前commit的终态RESULT，不得宣称本地验证通过。
- GitHub可合并、无冲突或代码审查通过不能替代本地结果。
- RESULT后受验证产物变化，旧RESULT立即失效。
- 纯文档变更可以不跑完整回归，但必须完成至少两轮交叉一致性检查。

### 2.2 统一入口

```text
automation/
├── validate.py
├── browser_smoke.py
├── quality-baseline.json
└── README.md
```

支持scope：

- `baseline`：当前测试、模块规模、依赖边界和已知技术债。
- `targeted`：当前叶子任务涉及的模块、数据或平台检查。
- `full`：全部自动测试、生成一致性、Doctor、浏览器、PWA和历史回归。

验证脚本不得修改源码，不得依赖人工点击，不得把大型日志、浏览器产物或盲测正文提交仓库。

### 2.3 RESULT证据

每个非纯文档任务至少记录commit、task_id、scope、命令、RESULT、自动测试、人工检查、修改文件、关键哈希和未覆盖环境。

baseline、targeted和full不能互相冒充。

## 3. 已知技术债基线

`automation/quality-baseline.json` 保存重构前已知越界，不是永久豁免。

```json
{
  "path": "app.js",
  "metric": "lines",
  "value": 1528,
  "reason": "pre-modularization monolith",
  "introducedAtCommit": "...",
  "mustBeRemovedBy": "MOD-006A",
  "mayGrow": false
}
```

判定：

- 已登记旧债且未增长：WARN。
- 旧债增长：FAIL。
- 新增人工越界：FAIL。
- 未登记越界：FAIL。
- 已清除债务重新出现：FAIL。
- Phase M full时人工文件越界清单为空。

## 4. Node原生ESM验证

Phase M使用无依赖 `package.json`：

```json
{
  "private": true,
  "type": "module"
}
```

规则：

- 不要求 `npm install`。
- 不增加运行依赖或构建步骤。
- 新测试使用ESM `import`。
- 遗留CommonJS测试在迁移期使用 `.cjs`。
- 测试仍通过 `node tests/...` 直接运行。
- 纯核心、引擎和知识模块不得在模块顶层访问DOM。
- 浏览器专用模块由浏览器harness覆盖。

## 5. 浏览器回归机制

`automation/browser_smoke.py` 使用Python标准库和本机已安装浏览器，不强制Selenium、Playwright或webdriver包。

推荐机制：

1. 启动临时loopback测试服务器和唯一随机端口。
2. 使用临时独立浏览器配置目录，避免用户缓存、扩展和Service Worker污染。
3. 由测试服务器提供仅测试进程可见的同源harness。
4. harness加载实际应用资源，执行点击、键盘、等待和状态断言。
5. harness将结构化JSON结果POST回临时测试服务器。
6. Python脚本等待结果、执行超时、终止自己启动的浏览器并删除临时配置。
7. 生产 `run.py` 永不暴露harness路由。

CSP与交互可以分层验证：

- 自动化服务器可为harness提供受控测试CSP以注入测试控制器。
- 生产服务器CSP通过独立HTTP头测试和实际应用无违规烟雾测试验证。
- 测试不得通过长期放宽生产CSP来方便自动化。

浏览器发现：

- Windows已知Chrome、Edge、Brave和Firefox安装路径可自动探测。
- 每次RESULT记录实际可执行文件、版本和模式。
- 要求某浏览器证据但浏览器不存在时，不得静默跳过；根据任务矩阵返回FAIL或明确 `NOT-TESTED`。
- Android和iOS等本地Runner无法自动覆盖的环境使用独立人工设备证据，不能冒充自动通过。

## 6. 本地服务器访问边界

### 6.1 静态资源

- 只允许应用入口、`src/`、`assets/`、manifest、图标和必要PWA文件。
- 拒绝 `.git/`、`.github/`、`docs/`、`tests/`、`scripts/`、`automation/`、`.qa/`、隐藏和临时文件。
- 拒绝URL编码、双重编码、反斜杠和规范化后的路径穿越。
- 默认监听 `127.0.0.1`。
- 非本机监听显示明确安全警告。

### 6.2 生命周期凭据

优先使用进程启动时生成的高熵会话Cookie：

- 至少256位安全随机。
- `HttpOnly`。
- `SameSite=Strict`。
- `Path=/__astra/`。
- 随进程结束失效。
- 不写入URL、DOM、localStorage、历史或诊断日志。

生命周期POST和EventSource同时验证会话Cookie与Origin。若平台限制迫使采用其他令牌传递方式，必须达到等价保护并记录理由，不能使用 `Math.random()` 或可预测client ID充当凭据。

### 6.3 CSP

最终强制CSP至少包括：

```text
default-src 'self'
script-src 'self'
style-src 'self'
img-src 'self' data:
connect-src 'self'
object-src 'none'
base-uri 'none'
frame-ancestors 'none'
form-action 'none'
```

最终不得依赖脚本或样式 `unsafe-inline`。在强制前先盘点并清理：

- HTML字符串插值。
- 动态style属性和CSSOM内联样式。
- 未验证URL、颜色、ID和类名。
- 持久化或导入数据进入DOM的路径。

CSP先报告、修复全部违规后强制执行。报告模式不能成为永久状态。

## 7. DOM写入安全

- 用户数据、导入数据和历史数据默认使用 `textContent`。
- 属性使用字段白名单和类型验证。
- URL只允许已知相对资源路径。
- 颜色、牌组、业务ID和类名只允许冻结枚举。
- 静态HTML模板中的动态文本必须经过统一转义。
- 不得把导入字段直接放入 `style`、`class`、`src` 或 `innerHTML`。
- 对脚本标签、事件属性、恶意URL、CSS转义和畸形Unicode建立测试。

当前历史中的 `categoryIcon`、`categoryAccent` 等字段未来可能经导入进入页面，必须在导入Schema和渲染两侧验证，不能只相信旧本地数据。

## 8. 确定性与随机契约

### 8.1 业务随机

根种子派生：

```text
rootSeed
├── draw
├── orientation
└── rendering
```

抽牌、正逆位和模板分别只消费对应流。模板新增随机选择不得改变牌序和正逆位。

### 8.2 平台熵

生命周期Cookie、客户端关联ID、安全nonce和临时测试端口使用平台高质量熵：

- 不要求复现。
- 不消费业务随机流。
- 不允许降级为 `Math.random()` 作为安全凭据。

### 8.3 稳定排序

- 评分排序声明稳定次级键。
- 不依赖对象属性遍历和本地化字符串排序。
- 权重、阈值、平局和派生算法版本化。
- `NaN`、`Infinity` 和未定义排序必须失败。

## 9. 静态知识、生成与哈希

人工主来源：卡牌、问题、牌阵图、词典和模板。

正式生成：轻量目录、动态注册表、knowledge清单、artifact manifest和预缓存清单。

要求：

- 生成文件在明确generated路径。
- 文件头记录来源、命令和生成器版本。
- 可稳定重建并提交仓库。
- 人工不得直接修改。
- 过渡目录最终删除。
- 不保留第二套人工目录。
- 人工源或活动资源变化后必须立即重建；陈旧生成文件为FAIL。

### 9.1 规范哈希

- SHA-256。
- 文本UTF-8、LF规范化。
- JSON稳定键序和规范序列化。
- 二进制原始字节。
- 相对路径规范化并排序。
- 生成器版本进入manifest。

完整模块哈希保存在artifact manifest。历史只保存总manifest哈希和本次实际消费指纹。

## 10. Service Worker策略

### 导航

network-first，仅导航失败时回退应用壳页面。

### 版本化shell、代码、样式、知识与manifest

按发布版本cache-first，不能混用新旧artifact。

### 牌组图片

cache-first，按需下载和独立管理。

### 绕过缓存

- `/__astra/` 生命周期请求。
- 非GET请求。
- 跨源请求。
- 测试harness专用端点。

### 写入要求

- 只缓存同源、成功且类型正确的响应。
- 不缓存404、5xx、错误页和不受信任opaque响应。
- 不把HTML写入JS、CSS、图片或知识缓存。
- 写入使用 `event.waitUntil()`。
- 缓存键与artifact版本一致。
- 单个可选牌组失败不破坏应用壳和稳定版本。

## 11. Schema、词典与资料治理

结构Schema负责字段、ID、引用格式、类型和数值范围。词典负责语义成员资格、同义词、跨词典引用和来源政策。质量门禁统一运行Schema、词典、来源、重复率、反例、跨牌边界和人工评分。

每张牌记录传统、来源、现代化范围、审查状态、稳定语义ID、近义牌边界、误读和禁止推断。禁止把来源不明网络牌义直接作为正式资料。

## 12. 盲测保管

- 开发集可以提交仓库。
- 最终盲测集不提交本项目仓库。
- 盲测集保存在CWapi受控目录或独立位置。
- 仓库只保存Schema、数量、政策和内容哈希。
- 日志不输出正文。
- 保留备用盲测集。
- 输入适配器、生产随机、规则、资料、词典、权重或模板变化后旧结果失效。

## 13. 历史、备份与容量

完整历史支持Schema、版本、消费指纹、导入预览、冲突验证、完整或显示结果导出。失败不破坏现有数据。

- 不静默删除记录。
- 接近配额时提示。
- 自动清理需用户授权。
- 导入限制大小、数量、深度和字段类型。
- 历史保存本次消费哈希，不复制全部78张模块哈希。

明确同产物确定性、历史可审计和有旧产物支持时的跨版本重算三类承诺。

## 14. 错误与诊断安全

统一错误包含错误码、严重级别、上下文白名单、用户消息、恢复动作和本地cause。

- 诊断默认不包含问题正文、完整解读和历史正文。
- 日志有数量、时间和容量上限。
- 导入文本安全转义。
- 资料加载失败不得重抽。
- 历史保存失败不得阻断当前解读。

## 15. Doctor与最终回归

Doctor检查环境、入口、牌面、目录、注册表、业务ID、语义引用、牌阵、动态导入、生成文件、artifact、缓存、技术债、历史版本、许可证和第三方声明。

浏览器回归覆盖启动、选择、洗牌、发牌、翻牌、结果、历史、刷新、关闭、应用壳离线、默认牌组完整离线、动态模块、IndexedDB降级、CSP、DOM注入、PWA更新和回滚。

输出 `PASS / WARN / FAIL`，失败使用非零退出码。

## 16. 许可证与明确不做

发布前建立 `LICENSE` 和 `THIRD_PARTY_NOTICES.md`。

当前不增加GitHub Actions、图数据库、后端SQLite、账号、云同步、插件、自定义牌阵、自由文本问题或强制npm构建链。

具体任务顺序见 `EXECUTION_CONTRACTS.md`。
