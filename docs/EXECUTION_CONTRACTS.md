# 项目执行契约

**状态：锁定**

本文档是任务编号、依赖、状态、验证证据和发布顺序的唯一执行来源。其他文档若与本文冲突，以本文为准。

## 1. 文档权威

1. `DECISIONS.md`
2. `EXECUTION_CONTRACTS.md`
3. `PROGRESS.md`
4. 领域规范
5. `ROADMAP.md`
6. `README.md`

聊天记录不能覆盖仓库中的决策、执行契约和任务现场。

## 2. 任务状态

### 叶子任务

状态：`BACKLOG`、`NEXT`、`IN_PROGRESS`、`BLOCKED`、`DONE`。

每个叶子任务具备唯一ID、已满足依赖、有限范围、输入/输出/不变量、自动和人工验收、兼容或回滚方式、可审计commit和CWapi RESULT。

### 父任务

状态：`PARENT-PENDING`、`PARENT-IN-PROGRESS`、`PARENT-BLOCKED`、`PARENT-DONE`。

父任务不能成为NEXT或直接执行，状态由全部必需叶子任务和父级验收派生。

### 就绪定义

进入NEXT前：依赖完成、规范可定位、边界和不变量明确、测试已定义、兼容方式明确、无两个独立主要风险面、无隐式未冻结契约。

### 完成定义

产物提交、验收完成、人工源与生成文件一致、当前commit有终态RESULT、人工检查记录、锁定边界和兼容未破坏、PROGRESS保存现场和唯一NEXT。

## 3. 验证证据

非纯文档任务保存：完整commit、task_id、scope、命令、修改文件、自动/人工摘要、关键哈希、警告和未覆盖环境。

RESULT后代码、数据、缓存、迁移、资源清单或生成产物变化，旧RESULT立即失效。

纯文档修改至少完成两轮交叉一致性检查。

## 4. 已知技术债基线

`MOD-001` 建立 `automation/quality-baseline.json`。

| 文件 | 当前行数 | baseline | 最迟清除 |
|---|---:|---|---|
| `app.js` | 1528 | WARN，不得增长 | `MOD-006A` |
| `styles.css` | 4918 | WARN，不得增长 | `MOD-002` |
| `data.js` | 637 | WARN，不得增长 | `MOD-006A` |

旧债未增长为WARN；增长、新债、未登记越界和已清除债务重现为FAIL；`MOD-006D`时人工文件超限清零。

## 5. Phase M

每个抽离模块立刻由真实应用使用和回归，不建立未接线展示模块。

### MOD-001：模块边界、数据边界与基线验证

产物：

- `docs/MODULE_MAP.md`
- `scripts/check_module_size.py`
- `scripts/check_import_boundaries.py`
- `tests/module_contract_test.mjs`
- `automation/validate.py`
- `automation/README.md`
- `automation/quality-baseline.json`
- 最小 `src/` 骨架或职责说明
- 旧历史、公开ID、浏览器和人工流程基线

`tests/module_contract_test.mjs` 使用Node原生ESM，无需package.json即可运行。baseline调用：

```text
python automation/validate.py --scope baseline
```

它至少执行：

```text
python -m unittest discover -s tests -v
node tests/smoke_test.js
node tests/module_contract_test.mjs
```

额外盘点：

- HTML和style动态写入点；
- CSP阻断点和不可信数据来源；
- Service Worker请求/缓存/回退策略；
- 所有Node脚本的CommonJS/ESM格式；
- 业务随机和平台随机调用点。

### MOD-002：拆分CSS

依赖 `MOD-001`。活动样式迁入 `src/styles/`，真实页面使用，临时更新SW资源列表，人工CSS≤900行。

### MOD-003A：ESM入口、Node模块格式与兼容桥

依赖 `MOD-001`。

- `index.html` 使用最小模块入口。
- 旧app/data通过受控兼容桥继续运行。
- 提交无依赖 `package.json`：`private: true`、`type: module`。
- 不要求npm install，不增加运行依赖和构建步骤。
- 将现有CommonJS `tests/smoke_test.js` 转换为ESM；若有暂不能迁移的脚本，临时改为 `.cjs` 并登记删除任务。
- `module_contract_test.mjs` 可保留扩展名。
- `node tests/smoke_test.js` 命令继续可用。
- 浏览器专用模块不在Node顶层访问DOM，或由浏览器harness覆盖。
- 行为、生命周期和离线启动保持不变。

### MOD-003B：基础模块与随机边界

依赖 `MOD-003A`。

抽离config/core/platform/storage基础接口、资源路径、HTML转义、设置、生命周期客户端、业务随机注入和平台熵。

生命周期client ID、Cookie、nonce和安全令牌使用Web Crypto或服务器安全随机，不得降级为Math.random，也不得消费业务随机流。

### MOD-004A：状态、控制器、渲染器与DOM安全

依赖 `MOD-003B`。

保持交互等价，并：

- 清理或封装HTML写入点；
- 用户、历史和导入数据默认用textContent或字段白名单；
- URL、颜色、ID和类名使用冻结枚举；
- 动态内联style迁移为外部样式、预定义class或data属性；
- 对恶意历史和导入数据建立DOM注入测试。

### MOD-004B：服务器边界、生命周期保护与强制CSP

依赖 `MOD-003B`、`MOD-004A`。

完成静态白名单、规范化和穿越测试、生命周期Cookie/Origin、非本机警告和CSP。

生命周期优先使用至少256位安全随机、HttpOnly、SameSite=Strict、Path=/__astra/的进程会话Cookie，不写URL、DOM、localStorage或日志。POST验证Cookie与Origin；EventSource GET验证Cookie、Host和Sec-Fetch-Site，不强制要求浏览器可能不发送的Origin头。

CSP先报告再强制，最终不得依赖脚本或样式unsafe-inline。目标至少：

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

### MOD-005：人工知识源与旧版解读

依赖 `MOD-004A`。

迁移78张牌、42问题、4牌阵人工源；定义轻量元数据；保留旧版适配器；过渡目录明确；临时加载器支持旧data.js删除后运行；结果和公开ID不变。

### MOD-006A：删除兼容桥、旧全局和旧大型文件

依赖 `MOD-002`、`MOD-004A`、`MOD-004B`、`MOD-005`。删除已验证替代的兼容桥、旧全局和大型文件，不在此任务第一次接线。

### MOD-006B：正式生成、规范哈希与manifest

依赖 `MOD-006A`。

生成轻量目录、动态注册表、knowledge清单、artifact manifest和预缓存清单。

哈希：SHA-256；文本UTF-8/LF；JSON稳定键序；二进制原始字节；相对路径规范化排序；生成器版本入manifest；`.gitattributes`固定人工文本换行。

哈希依赖图无自引用：

```text
人工源和运行资源
→ 目录/注册表/knowledge清单
→ artifact manifest
→ precache manifest
→ CWapi RESULT绑定最终commit和两个manifest哈希
```

artifact不含自身哈希、最终commit或precache哈希；precache不含自身哈希。

完整全部模块哈希留在artifact manifest；ReadingRecord只保存总manifest哈希和本次消费指纹。

预缓存清单格式锁定为经典SW可加载的生成脚本：

```text
src/generated/precache-manifest.js
```

它只向service worker作用域暴露冻结的releaseId、artifactManifestHash、required资源组和optional牌组，不使用ESM export，也不得污染页面window。

正式生成器建立后，人工源、引擎入口、词典、模板或活动资源变化必须立即重建生成产物；陈旧产物为FAIL。

### MOD-006C：经典Service Worker策略与离线状态

依赖 `MOD-006B`。

SW继续使用经典脚本，通过 `importScripts("./src/generated/precache-manifest.js")` 加载生成清单。注册使用：

```js
navigator.serviceWorker.register("./sw.js", {
  updateViaCache: "none",
});
```

releaseId使用应用版本和artifactManifestHash前缀，不使用最终commit或自引用哈希。

请求分类：

1. 导航：network-first，失败只回退应用壳页面。
2. 版本化shell/JS/CSS/知识/manifest：按release cache-first。
3. 牌组图片：cache-first，按需填充。
4. `/__astra/`、非GET、跨源和测试harness端点：绕过缓存。

只缓存同源、response.ok、类型正确的响应；不缓存404、5xx、错误页、opaque或不明确重定向；写入使用event.waitUntil；HTML不得进入代码/图片缓存。

状态：APP-SHELL-READY、DEFAULT-DECK-READY、SELECTED-DECKS-READY。DEFAULT-DECK-READY要求默认牌组78张正面和牌背完整校验。图片失败显示可访问占位，不重抽。

本任务移除当前无条件skipWaiting、立即clients.claim和激活即删除全部旧缓存的行为。完整用户更新提示、多标签协调和回滚由PLAT-001完成。

### MOD-006D：Phase M终态验证

依赖 `MOD-006C`。完成full、浏览器、CSP、DOM注入、Node ESM、历史兼容、PWA和模块边界验证，技术债清零。

### 浏览器harness

`automation/browser_smoke.py` 使用标准库启动临时loopback服务器、独立浏览器配置和结构化结果端点。测试服务器可向index副本注入同源 `/__astra/test-harness.js`；生产run.py不提供该资源。harness通过 `/__astra/test-result` 回传JSON，SW绕过 `/__astra/`。

浏览器缺失不得静默跳过。RESULT记录浏览器路径、版本、headless模式和覆盖范围。

## 6. Phase 1：数据、问题和牌位契约

固定顺序：

```text
TQ-001 → TQ-002 → EV-000A → TQ-003 → TQ-004
→ QP-001 → QP-002 → PO-001 → TQ-005A → TQ-005B
```

- TQ-001：Card结构Schema。
- TQ-002：词典、来源和政策。
- EV-000A：评测协议和盲测保管。
- TQ-003：六张黄金初稿。
- TQ-004：质量门禁，黄金样本均≥90。
- QP-001：问题分类和覆盖矩阵。
- QP-002：完整QuestionProfile Schema。
- PO-001：完整Position Operator契约，只验收配置完整合法。
- TQ-005A：从正式契约建立消费者夹具。
- TQ-005B：黄金样本消费验证。

Card、Question或Position契约变化会使TQ-005B失效。

## 7. 问题、牌位和Observation实现

- QP-003：问题库父任务。
- QP-004：四牌阵适配父任务。
- PO-002：固定结构图。
- PO-003：完整Observation Engine，承担不同牌位产生不同合法Observation的最终验收。

## 8. Relation、Claim、随机原语与双层校验

```text
MR-001结构边
→ MR-002问题与牌位职责
→ MR-003语义与逆位关系
→ MR-004辅助关系
→ MR-005测试
→ CL-001..CL-005
→ AU-001A确定性随机原语
→ TX-001..TX-003
```

CL-005在模板前校验证据、问题维度、禁止结论、条件、冲突和分数。TX-003在渲染后检查文本矛盾、禁止措辞、引用丢失、重复和格式。

AU-001A建立版本化根种子派生、draw/orientation/rendering独立流和稳定PRNG，为模板提供rendering流，但不切换当前生产抽牌。

## 9. 最终盲测

最终盲测集不提交仓库；保存在CWapi受控位置；仓库只保存Schema、数量、政策和哈希；日志不输出正文；保留备用盲测集。

输入适配器、生产随机、规则、资料、词典、权重或模板变化会使结果失效。

EV-000B依赖EV-001、EV-002、EV-003C、EV-004和AU-001B。

## 10. 随机、历史和审计

- AU-001B：生产随机集成，依赖AU-001A和TX-003。
- AU-002：ReadingRecord、IndexedDB和本次消费指纹，依赖AU-001B。
- AU-003A：旧localStorage迁移。
- AU-003B：导入导出与冲突。
- AU-003C：容量、配额和降级。

最终commit与manifest哈希对应关系保存在CWapi/发布证据，不写入自引用manifest或每条历史。

## 11. 错误恢复

- ERR-001A：错误对象与脱敏。
- ERR-001B：知识、引擎与PWA恢复。
- ERR-001C：存储、迁移、导入与配额恢复。
- ERR-001D：可复用恢复组件与诊断导出，使用fixture独立测试，不依赖UI-001。

## 12. 评测、UI与发布

EV-004依赖评测资产和AU-001B；EV-000B依赖EV-004和AU-001B。

UI-001依赖最终盲测、ERR-001D和AX-001。若UI适配器改变引擎输入或结构化输出，重新执行受影响评测和盲测。

发布顺序：

```text
PLAT-001 → PERF-001 → PWA-002 → REL-002
→ REL-005 → REL-003 → REL-001 → REL-004
```

REL-001后任何运行代码、数据、缓存、迁移、资源清单或生成产物变化都使结果失效。

## 13. 审查停止条件

最多执行用户指定轮数；连续两轮没有新的阻断级或重大问题时停止。唯一NEXT满足就绪定义，依赖图无循环，验证语义明确。不得为凑轮数新增功能、阶段或非必要文档。

## 14. 当前唯一下一任务

```text
MOD-001：模块边界、数据边界与基线验证
```


## 7. Phase 2首个可执行叶子

### TQ-101A：大阿卡纳第一批

依赖Phase 1 `PARENT-DONE`。按已冻结Card Schema、词典、来源、质量门禁和消费者契约，完成 `major-1`、`major-2`、`major-3`、`major-4`、`major-5` 五张正式资料。不得修改黄金卡、Schema、QuestionProfile或Position Operator；若确需修改，Phase 1消费验证失效并重跑。


## 15. Phase 2：78张牌资料升级

固定顺序：`TQ-101A`至`TQ-101D`（其余大牌）、`TQ-102A/B`（权杖数字牌）、`TQ-103A/B`（圣杯数字牌）、`TQ-104A/B`（宝剑数字牌）、`TQ-105A/B`（星币数字牌）、`TQ-106A/B/C/D`（侍从、骑士、王后、国王）、`TQ-107`（整套交叉审查）。六张Phase 1黄金文件必须保持字节级不变。阶段出口：78张Schema通过率100%，最低分≥90、平均分≥92、场景通过率≥95%，不存在跨牌完全重复语义文本，当前commit取得CWapi full RESULT。

## 16. Phase 3首个可执行叶子

`QP-003A`：关系领域问题扩展。保留现有公开问题，增加7至9个正式问题及QuestionProfile，并通过近义去重、高风险边界和四牌阵可回答性检查。

## 17. Phase 3：问题库与四牌阵适配

固定顺序：`QP-003A`至`QP-003F`分别扩展relationship、career、finance、growth、decision和daily领域；`QP-004A`至`QP-004F`完成六领域的single、timeline、cross和celtic适配；终态统一执行近义去重、高风险边界和跨牌位消费验证。

阶段出口：保留原42题及其Profile字节，问题总数84至96、六领域覆盖均衡，高度近义问题不超过5%，高风险边界完整，四牌阵全部可回答，当前commit取得CWapi full RESULT。

## 18. Phase 4：固定结构图与Observation Engine

固定顺序：

```text
PO-002A single与timeline固定结构图
→ PO-002B cross固定结构图
→ PO-002C celtic固定结构图
→ PO-002D 四牌阵图验证与冻结
→ PO-003A Observation Schema和模型
→ PO-003B 问题维度、牌位职责与语义选择
→ PO-003C 逆位机制、有限评分与稳定排序
→ PO-003D 完整牌阵Observation消费
→ PO-003E 全矩阵报告和终态门禁
```

边界：

- `PO-002`只冻结四牌阵节点、固定结构边和2–4条主线，不生成Relation。
- `PO-003`只生成局部Observation，不生成Claim、最终结论或渲染文本。
- 每个Observation必须保存真实`semanticUnitRef`、来源、问题职责、牌位角色、逆位模式、有限维度和分数分解。
- `createMinimalObservation`保留兼容入口，但不得维护第二套选择算法。
- 同输入必须确定性一致；业务排序不得依赖对象遍历、本地化字符串或随机数。
- Card、Question、Position或固定图变化会使Phase 4报告失效并重跑。

阶段出口：4图19节点21固定边合法；90题×19牌位及78牌×19牌位的正逆位场景Schema、确定性和真实引用通过率100%；同牌不同牌位路径差异通过率100%；当前commit取得CWapi full RESULT。

## 19. Phase 5：Relation Graph

固定顺序：

```text
MR-001固定结构边转Relation候选
→ MR-002问题维度与牌位职责
→ MR-003语义、状态、行动与逆位关系
→ MR-004元素、数字、宫廷与阶段辅助关系
→ MR-005Relation全量测试与终态门禁
```

`MR-001`只把Phase 4冻结的结构边映射为有限候选。每条结构边恰好对应一个候选；single为零；输出按图边顺序确定。候选不得提前确定最终Relation类型、强度或语义成立，也不得建立非结构边或凯尔特十字全量两两组合。

Card、Question、Position、Observation或固定结构图变化会使Phase 5相关验证失效并重跑。

### Phase 5终态要求

- `MR-002`直接消费QuestionProfile的answerDimensions与各牌阵positionResponsibilities，记录职责覆盖、交接和证据优先级，不复制问题契约。
- `MR-003`只在`MR-001`候选集合内，依据Observation与CardSemanticProfile的主题、facet、维度、状态、行动和逆位机制确定有限Relation类型；平局按候选原顺序稳定解决。
- `MR-004`的元素、数字、宫廷、阶段和正逆位信号只能附着于现有结构边，并只允许有限强度修正，不得创建新边。
- `MR-005`覆盖全部90题、四牌阵、正逆位批次、正反例、候选限制、稳定排序和输入重排复现。

阶段出口：Relation数量等于冻结结构边数量；single为零；不对凯尔特十字做全量两两组合；最终类型不越过候选集合；当前commit取得CWapi full RESULT。

### Phase 6终态要求

`CL-001`至`TX-003`必须作为同一阶段连续收口：

- ClaimCandidate只能来自当前Observation与合法Relation，并按冻结节点和边顺序稳定生成。
- 评分限制在0到1；平局顺序稳定；冲突不得静默删除。
- 最终结论只允许使用QuestionProfile的`allowedConclusionTypes`，禁止结论和未覆盖维度必须在模板前拦截。
- `AU-001A`建立版本化根种子派生以及draw、orientation、rendering独立流，不切换生产抽牌。
- 模板只表达已经通过CL-005的结构化Claim。
- 四牌阵输出层级固定；TX-003检查文本矛盾说明、禁止措辞、引用丢失、重复和格式。
- 阶段出口：90题×4牌阵×正逆位均可生成合法Claim与文本；非法Claim不能进入模板；当前commit取得CWapi full RESULT。

### Phase 7终态要求

`AU-001B`至`AU-003C`必须作为同一阶段连续收口：

- 生产抽牌、正逆位和渲染从同一版本化根种子派生独立流；消费任一流不得改变其他流。
- Reading保存根种子、算法、版本、熵来源和派生流信息，相同输入必须可重放。
- ReadingRecord 2.0保存抽牌、结构化证据槽位和本次artifact消费指纹，不写最终Git commit。
- IndexedDB包含readings与meta存储；旧localStorage迁移幂等，失败不删除旧数据或写完成标记。
- 导出包必须带稳定校验和；导入在写入前完成Schema、重复ID、校验和和冲突策略验证。
- 容量与配额达到阈值时给出可执行提醒；IndexedDB或配额失败时保留内存待导出副本，不静默截断或删除记录。
- 阶段出口：生产随机可重放、结构化历史可保存、迁移幂等、导入导出可验证、容量降级无静默丢失；当前commit取得CWapi full RESULT。
