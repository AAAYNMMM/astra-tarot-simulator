# `src/` 目标职责

`MOD-001` 只建立职责边界，不把现有运行入口切换到这里。真实 ES Module 接线从 `MOD-003A` 开始。

## 目标目录

```text
src/
├── app/
│   ├── bootstrap.js
│   ├── state/
│   ├── selectors/
│   └── controllers/
├── config/
├── core/
│   ├── random/
│   └── validation/
├── engine/
│   └── legacy/
├── generated/
├── knowledge/
│   ├── legacy/
│   ├── cards/
│   ├── questions/
│   ├── spreads/
│   ├── vocabularies/
│   └── templates/
├── platform/
├── storage/
├── styles/
└── ui/
    ├── animations/
    ├── components/
    └── renderers/
```

## 层级职责

| 层 | 可以负责 | 不得负责 |
|---|---|---|
| `config` | 冻结常量、版本、资源配置 | DOM、存储、业务流程 |
| `core` | 无副作用算法、ID、随机接口、校验工具 | DOM、浏览器存储 |
| `knowledge` | 卡牌、问题、牌阵、词典、模板人工源 | UI、状态、存储 |
| `engine` | Observation、Relation、Claim和旧版纯计算适配 | DOM、IndexedDB、`localStorage` |
| `storage` | 设置、历史和迁移接口 | UI渲染、牌义推理 |
| `platform` | 生命周期、PWA、浏览器能力和资源路径 | 牌义和结论 |
| `ui` | DOM、组件、渲染和动画 | 直接访问存储、执行推理 |
| `app` | 状态协调、控制器、启动和依赖组合 | 在控制器内实现底层存储或规则算法 |
| `generated` | 脚本生成的目录、注册表和manifest | 人工直接修改 |

## 依赖方向

允许的主要方向：

```text
app
├── ui
├── engine
├── knowledge
├── storage
├── platform
├── core
├── config
└── generated

ui        → core, config
engine    → knowledge, core, config
knowledge → core, config
storage   → core, config
platform  → core, config
generated → knowledge, config
core      → config
config    → 无
```

同层模块可以互相依赖，但不得形成循环。

硬约束：

- `src/engine/` 不访问 DOM、`localStorage`、IndexedDB 或平台生命周期。
- `src/knowledge/` 不访问 UI、状态或存储。
- 控制器不直接调用底层浏览器存储 API。
- 浏览器专用模块不得在 Node 导入时于顶层访问 DOM，或者必须只由浏览器 harness 覆盖。
- 运行源码不得引入 npm、远程 URL 或裸模块依赖。
- 生成文件只位于明确的 generated 路径，并由脚本稳定重建。

## 文件规模

- 人工 JavaScript：不超过 600 行。
- 人工 CSS：不超过 900 行。
- `src/app/bootstrap.js` 建议不超过 200 行。
- 完整 `CardSemanticProfile`：一张牌一个模块。
- 完整 `QuestionProfile`：一题一个可独立加载模块。

## Phase M迁移原则

- 每个抽离模块必须立即由真实应用使用。
- `MOD-001` 不创建未接线的业务 JavaScript。
- `MOD-003A` 建立模块入口与旧代码兼容桥。
- `MOD-006A` 只删除已经被验证替代的旧入口、全局和大型文件。
- 现有公开 ID、牌阵、抽牌分布、交互和旧历史读取在 Phase M 保持不变。
