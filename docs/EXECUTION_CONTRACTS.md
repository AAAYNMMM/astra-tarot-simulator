# 项目执行契约

**状态：锁定**

本文档是任务编号、依赖、状态、验证证据和发布顺序的唯一执行来源。

若其他文档中的旧任务名称、旧依赖或旧阶段顺序与本文冲突，以本文为准，并在后续修改相关文档时清理旧表述。

---

## 1. 文档权威层级

1. `docs/DECISIONS.md`：不可擅自改变的产品与技术决策。
2. `docs/EXECUTION_CONTRACTS.md`：任务编号、依赖、状态、验证和发布顺序。
3. `docs/PROGRESS.md`：当前活动任务、证据和唯一下一任务。
4. 领域规范：模块化、数据、引擎、单牌、工程和最终质量文档。
5. `docs/ROADMAP.md`：阶段导航和任务目录。
6. `README.md`：项目概览。

聊天记录不能覆盖仓库中的锁定决策、执行契约和任务现场。

---

## 2. 任务状态、就绪与完成

### 2.1 叶子任务

状态只允许：`BACKLOG`、`NEXT`、`IN_PROGRESS`、`BLOCKED`、`DONE`。

每个叶子任务必须具备：

- 唯一任务ID；
- 已满足的明确依赖；
- 有限修改范围；
- 输入、输出和不变量；
- 自动与人工验收；
- 兼容、迁移或回滚方式；
- 一个可审计commit；
- 适用的CWapi RESULT。

### 2.2 父任务

状态只允许：`PARENT-PENDING`、`PARENT-IN-PROGRESS`、`PARENT-BLOCKED`、`PARENT-DONE`。

父任务不能成为 `NEXT`，不能直接执行或手工宣布完成。状态由全部必需叶子任务和父级验收派生。

### 2.3 任务就绪定义

叶子任务进入 `NEXT` 前必须满足：

1. 所有依赖已完成。
2. 规范来源可定位。
3. 修改边界和禁止范围明确。
4. 公开ID、存储字段和行为不变量已记录。
5. 自动测试和人工检查项已定义。
6. 兼容、迁移或回滚方式明确。
7. 不包含两个可独立失败的主要风险面。
8. 不依赖尚未冻结的隐式契约。

### 2.4 任务完成定义

任务标记 `DONE` 前必须满足：

1. 产物已提交。
2. 验收项全部完成。
3. 代码、人工源和生成文件一致。
4. 当前commit具有匹配的终态CWapi RESULT，纯文档任务除外。
5. 必要人工基线或抽样已记录。
6. 没有破坏锁定边界、公开ID或存储兼容。
7. `PROGRESS.md` 保存完整现场和唯一下一任务。

---

## 3. 验证证据与失效

每个非纯文档任务保存：

- 完整40位commit SHA；
- CWapi task_id、scope和RESULT；
- 实际执行命令；
- 修改文件；
- 自动测试与人工检查摘要；
- 关键产物哈希；
- 警告和未覆盖环境。

代码、数据、缓存、迁移、资源清单或生成产物在RESULT后变化，旧RESULT立即失效。

纯文档修改可以不创建CWapi TASK，但必须完成至少两轮交叉一致性检查。

---

## 4. 已知技术债基线

`MOD-001` 建立 `automation/quality-baseline.json`。

| 文件 | 当前行数 | baseline处理 | 最迟清除 |
|---|---:|---|---|
| `app.js` | 1528 | WARN，不得增长 | `MOD-006A` |
| `styles.css` | 4918 | WARN，不得增长 | `MOD-002` |
| `data.js` | 637 | WARN，不得增长 | `MOD-006A` |

规则：

- 已登记旧超限且未增长：WARN。
- 旧超限增长：FAIL。
- 新增人工超限：FAIL。
- 未登记越界：FAIL。
- 已清除债务重新出现：FAIL。
- `MOD-006D` 时人工文件超限清单必须为空。

---

## 5. Phase M：渐进式模块迁移

每个抽离模块必须立刻由真实应用使用和回归，不得先建立未接线模块，最后一次性切换。

### MOD-001：模块边界、数据边界与基线验证

产物：

- `docs/MODULE_MAP.md`
- `scripts/check_module_size.py`
- `scripts/check_import_boundaries.py`
- `tests/module_contract_test.js`
- `automation/validate.py`
- `automation/README.md`
- `automation/quality-baseline.json`
- 最小 `src/` 骨架或职责说明
- 旧历史、公开ID、浏览器和人工流程基线

额外基线清单：

- 所有 `innerHTML`、`insertAdjacentHTML`、动态 `style` 属性、`.style.*` 和URL拼接位置；
- 当前CSP阻断点和潜在不可信数据来源；
- 当前Service Worker资源、响应缓存和回退策略；
- 当前Node测试模块格式；
- 业务随机与平台随机调用位置。

baseline在已知技术债存在时可通过，但增长、新债务和未登记越界必须失败。

### MOD-002：拆分CSS

依赖：`MOD-001`。

将活动样式迁入 `src/styles/`。每次拆分后页面真实使用新文件，临时更新Service Worker资源列表，任一人工CSS不得超过900行。

### MOD-003A：ES Module入口、Node ESM与兼容桥

依赖：`MOD-001`。

目标：

- `index.html` 使用最小模块入口；
- 旧 `app.js`、`data.js` 通过受控兼容桥继续运行；
- 新模块可逐步替换旧职责；
- 提交无依赖 `package.json`，至少包含 `"private": true` 和 `"type": "module"`；
- 不要求 `npm install`，不添加运行依赖或构建步骤；
- 新Node测试使用ESM `import`；遗留CommonJS测试临时使用 `.cjs`；
- `node tests/...` 仍可直接运行；
- 浏览器专用模块不在Node顶层访问DOM，或由浏览器测试覆盖；
- 当前行为、生命周期和离线启动保持不变。

### MOD-003B：基础模块与随机边界

依赖：`MOD-003A`。

抽离 `config/`、`core/`、`platform/` 和基础 `storage/` 接口，包括：

- 资源路径和HTML转义；
- 设置与旧localStorage兼容；
- 业务随机依赖注入接口；
- 平台高质量熵接口；
- 生命周期客户端。

业务随机和平台熵必须分离。生命周期client ID、令牌和nonce使用Web Crypto或服务器安全随机，不得降级为 `Math.random()`，也不得消费业务随机流。

### MOD-004A：状态、控制器、渲染器与DOM安全

依赖：`MOD-003B`。

除保持准备、洗牌、发牌、翻牌、结果和历史交互等价外，必须：

- 清理或封装动态HTML写入点；
- 持久化、导入或外部数据使用 `textContent`、属性白名单或审计过的安全构造器；
- 禁止把未验证颜色、URL、ID或文本直接插入HTML和style字符串；
- 将动态内联style和CSS自定义属性迁移为预定义class、data属性或外部样式规则；
- 对恶意历史、导入字段和异常ID建立DOM注入测试；
- 保留静态模板时，明确哪些插值只能来自冻结枚举和已转义文本。

### MOD-004B：服务器访问边界与强制CSP

依赖：`MOD-003B`、`MOD-004A`。

完成：

- 静态白名单；
- URL规范化、编码绕过和路径穿越测试；
- 生命周期随机令牌与Origin检查；
- 非本机监听警告；
- CSP先报告、修复全部阻断后强制执行。

最终CSP不得依赖 `script-src 'unsafe-inline'` 或 `style-src 'unsafe-inline'`。目标至少包括：

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

若浏览器兼容需要调整，必须采用更窄策略并记录理由，不能用全局内联豁免省事。

### MOD-005：人工知识源与旧版解读

依赖：`MOD-004A`。

- 迁移78张牌、42个问题和4种牌阵人工主来源。
- 定义正式生成所需轻量元数据。
- 保留旧版解读适配器。
- 临时目录和注册表明确标记。
- 临时加载器足以在旧 `data.js` 删除后继续运行。
- 当前结果和公开ID不变。

### MOD-006A：删除兼容桥、旧全局和旧大型文件

依赖：`MOD-002`、`MOD-004A`、`MOD-004B`、`MOD-005`。

删除兼容桥、旧全局和已替代的大型文件。不是第一次接线任务。

### MOD-006B：正式生成、规范哈希与artifact manifest

依赖：`MOD-006A`。

正式生成：

- 轻量卡牌与问题目录；
- 卡牌与问题动态注册表；
- knowledge完整性清单；
- PWA预缓存清单；
- artifact manifest与内容哈希。

哈希契约：

- SHA-256；
- 文本使用UTF-8并规范为LF；
- JSON采用稳定键序和规范序列化；
- 二进制按原始字节；
- 路径按规范化相对路径排序；
- 建议通过 `.gitattributes` 固定人工文本LF；
- 生成器版本进入manifest。

完整78张模块哈希保存在artifact manifest。ReadingRecord不得复制整套哈希，只保存总manifest哈希和本次实际消费的卡牌、问题、牌阵图、词典与模板指纹。

正式生成器建立后，任何人工源、引擎入口、词典、模板或活动资源变化都必须重建对应生成产物。陈旧生成文件为FAIL。

### MOD-006C：Service Worker资源策略与离线状态

依赖：`MOD-006B`。

请求分类：

1. 导航：network-first，离线时只回退应用壳页面。
2. 版本化shell、JS、CSS、知识与manifest：按发布版本cache-first，不混用新旧版本。
3. 牌组图片：cache-first并按需填充。
4. `/__astra/` 生命周期请求、非GET和跨源请求：直接绕过缓存。

缓存写入规则：

- 只缓存同源、`response.ok` 且可安全复用的响应；
- 不缓存404、5xx、错误页或不受信任opaque响应；
- 不把HTML错误页写入JS、CSS、图片或知识缓存；
- 动态缓存写入通过 `event.waitUntil()` 绑定事件生命周期；
- 默认不缓存重定向后的不明确资源；
- 缓存键和artifact版本一致。

离线状态：

- `APP-SHELL-READY`
- `DEFAULT-DECK-READY`
- `SELECTED-DECKS-READY`

### MOD-006D：Phase M终态验证

依赖：`MOD-006C`。

完成full验证、浏览器回归、CSP、DOM注入、历史兼容、PWA离线和模块边界验证。人工文件超限清零。

### Phase M临时缓存规则

在正式生成器接管前，每个活动JS/CSS模块必须同步更新临时Service Worker资源列表和离线烟雾测试。

---

## 6. Phase 1：数据、问题和牌位契约基础

固定顺序：

```text
TQ-001 → TQ-002 → EV-000A → TQ-003 → TQ-004
→ QP-001 → QP-002 → PO-001 → TQ-005A → TQ-005B
```

- `TQ-001`：CardSemanticProfile结构Schema。
- `TQ-002`：词典、来源与解释政策。
- `EV-000A`：评测协议和盲测保管。
- `TQ-003`：六张黄金样本初稿。
- `TQ-004`：质量门禁与黄金样本冻结。
- `QP-001`：问题分类和覆盖矩阵。
- `QP-002`：完整QuestionProfile Schema。
- `PO-001`：完整Position Operator契约，只验收配置完整合法。
- `TQ-005A`：从正式Card、Question和Position契约建立消费者夹具与Observation最小接口。
- `TQ-005B`：黄金样本可消费性验证。

任何Card、Question或Position契约变化都会使 `TQ-005B` 结果失效。

---

## 7. 问题、牌位和Observation实现

- `QP-003`：问题库父任务，依赖 `QP-002`。
- `QP-004`：四牌阵问题适配父任务，依赖 `QP-003` 为 `PARENT-DONE` 和 `PO-001`。
- `PO-002`：四牌阵固定结构图，依赖 `PO-001`。
- `PO-003`：完整Observation Engine，依赖 `TQ-107`、`QP-004` 为 `PARENT-DONE` 和 `PO-002`。

`PO-003` 承担“同一牌在不同牌位生成不同合法Observation”的最终行为验收。

---

## 8. Relation、Claim、确定性渲染与双层校验

固定顺序：

```text
MR-001 固定结构边
→ MR-002 问题维度与牌位职责
→ MR-003 主题、状态、行动与逆位语义关系
→ MR-004 辅助关系
→ MR-005 正反例与复现测试
→ CL-001 ClaimCandidate
→ CL-002 证据评分和稳定平局
→ CL-003 冲突消解
→ CL-004 有限结论分类
→ CL-005 结构化Claim校验
→ AU-001A 确定性随机原语
→ TX-001 模板渲染
→ TX-002 四牌阵输出层级
→ TX-003 渲染后文本校验
```

### AU-001A：确定性随机原语

依赖：`MOD-006D`、`CL-005`。

建立版本化根种子派生、draw/orientation/rendering独立流、稳定PRNG接口和测试，为模板提供rendering流，但不切换当前生产抽牌。

### CL-005

模板前校验证据、反证、问题维度、禁止结论、条件、冲突、分数和稳定排序。

### TX-003

渲染后检查文本矛盾、禁止措辞、引用或条件丢失、重复和格式。

---

## 9. 最终盲测保管

- 开发集和普通回归集可以提交仓库。
- 最终盲测集保存在CWapi受控目录或独立保管位置，不提交本项目仓库。
- 仓库只保存Schema、样本数量、生成政策和内容哈希。
- 日志不得输出盲测正文。
- 保留未用于当前版本调参的备用盲测集。
- 引擎输入适配器、生产随机、规则、资料、词典、权重或模板变化会使盲测结果失效。

`EV-000B` 必须发生在 `EV-001`、`EV-002`、`EV-003C`、`EV-004` 和 `AU-001B` 完成之后。

---

## 10. 随机、历史与审计

### AU-001B：生产随机集成

依赖：`AU-001A`、`TX-003`。

将根种子和draw/orientation流接入生产抽牌，保存实际牌序和正逆位。问题、资料和模板不得影响结果。

### AU-002：ReadingRecord、IndexedDB与消费指纹

依赖：`AU-001B`。

ReadingRecord保存：

- 版本和总artifact manifest哈希；
- 本次实际消费的卡牌模块哈希；
- 当前问题、牌阵图、词典和模板bundle哈希；
- 根种子、派生和算法版本；
- Observation、Relation、Claim、双层校验和渲染结果。

完整全部模块哈希保留在artifact manifest，不在每条历史中重复。

### AU-003

- `AU-003A`：旧localStorage幂等迁移。
- `AU-003B`：导入导出和冲突验证。
- `AU-003C`：容量、配额提醒和降级层。

---

## 11. 错误恢复任务

- `ERR-001A`：错误对象、错误码与隐私脱敏，依赖 `MOD-006D`。
- `ERR-001B`：知识模块、引擎与PWA恢复，依赖 `ERR-001A`、`TX-003`、`MOD-006C`。
- `ERR-001C`：存储、迁移、导入与配额恢复，依赖 `ERR-001A`、`AU-003C`。
- `ERR-001D`：可复用恢复组件与诊断导出，依赖 `ERR-001B`、`ERR-001C`，使用fixture独立测试，不依赖 `UI-001`。

`UI-001` 负责把实际新引擎错误流接入已完成恢复组件。

---

## 12. 评测、UI与发布

### 评测

- `EV-001`：单牌测试集与指标。
- `EV-002`：问题贴合测试集与指标。
- `EV-003A`：多牌语料。
- `EV-003B`：自动指标。
- `EV-003C`：人工评审集。
- `EV-004`：质量门禁与Doctor，依赖上述评测资产和 `AU-001B`。
- `EV-000B`：最终盲测，依赖 `EV-004` 和 `AU-001B`。

### UI与无障碍

- `AX-001`：基础无障碍，依赖 `ERR-001A`。
- `UI-001`：接入新版引擎和恢复组件，依赖 `EV-000B`、`ERR-001D`、`AX-001`。
- `UI-002`：历史详情，依赖 `UI-001`、`AU-003C`。
- `AX-002`：动态牌桌无障碍，依赖 `UI-001`。

若UI适配器改变引擎输入或结构化输出，必须重新执行受影响评测和盲测。

### 发布顺序

```text
PLAT-001 → PERF-001 → PWA-002 → REL-002
→ REL-005 → REL-003 → REL-001 → REL-004
```

`REL-001` 后任何运行代码、数据、缓存、迁移、资源清单或生成产物变化都使结果失效。

---

## 13. 审查停止条件

最多执行用户指定轮数，但连续两轮没有新的阻断级或重大问题时停止。唯一 `NEXT` 必须满足就绪定义，依赖图无循环、验证语义明确。不得为凑轮数新增功能、阶段或非必要文档。

---

## 14. 当前唯一下一任务

```text
MOD-001：模块边界、数据边界与基线验证
```

本执行契约不改变产品功能，也不允许再次用规划工作推迟它。
