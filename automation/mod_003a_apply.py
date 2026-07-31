#!/usr/bin/env python3
"""Apply the deterministic MOD-003A native ESM entry migration."""

from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def write_text(relative_path: str, text: str) -> None:
    path = ROOT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")


def create_package_json() -> None:
    data = {
        "name": "astra-tarot-simulator",
        "private": True,
        "type": "module",
        "scripts": {
            "test:smoke": "node tests/smoke_test.js",
            "test:contracts": "node tests/module_contract_test.mjs",
        },
    }
    write_text("package.json", json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def create_runtime_modules() -> None:
    write_text(
        "src/app/legacy-runtime.js",
        '''export const LEGACY_GLOBAL_NAME = "TarotData";
export const LEGACY_SCRIPT_PATHS = Object.freeze(["../../data.js", "../../app.js"]);

let runtimePromise = null;

function loadClassicScript(documentRef, relativePath, baseUrl) {
  return new Promise((resolve, reject) => {
    const script = documentRef.createElement("script");
    script.src = new URL(relativePath, baseUrl).href;
    script.async = false;
    script.dataset.astraLegacyScript = relativePath;
    script.addEventListener("load", () => resolve(script), { once: true });
    script.addEventListener(
      "error",
      () => {
        script.remove();
        reject(new Error(`Failed to load legacy runtime script: ${relativePath}`));
      },
      { once: true },
    );
    documentRef.head.append(script);
  });
}

async function loadLegacyRuntime({ documentRef, windowRef, baseUrl }) {
  if (!documentRef?.head || !windowRef) {
    throw new Error("Legacy runtime requires a browser document and window.");
  }

  await loadClassicScript(documentRef, LEGACY_SCRIPT_PATHS[0], baseUrl);
  if (!windowRef[LEGACY_GLOBAL_NAME]) {
    throw new Error("data.js did not initialize window.TarotData.");
  }
  await loadClassicScript(documentRef, LEGACY_SCRIPT_PATHS[1], baseUrl);
  return windowRef[LEGACY_GLOBAL_NAME];
}

export function startLegacyRuntime({
  documentRef = globalThis.document,
  windowRef = globalThis.window,
  baseUrl = import.meta.url,
} = {}) {
  if (!runtimePromise) {
    runtimePromise = loadLegacyRuntime({ documentRef, windowRef, baseUrl }).catch((error) => {
      runtimePromise = null;
      throw error;
    });
  }
  return runtimePromise;
}
''',
    )
    write_text(
        "src/app/bootstrap.js",
        '''import { startLegacyRuntime } from "./legacy-runtime.js";

export async function bootstrapBrowser(globalScope = globalThis) {
  const documentRef = globalScope.document;
  const windowRef = globalScope.window;
  if (!documentRef || !windowRef) {
    return Object.freeze({ started: false, reason: "browser-globals-unavailable" });
  }
  await startLegacyRuntime({ documentRef, windowRef });
  return Object.freeze({ started: true });
}

function reportBootFailure(error) {
  console.error("星纱塔罗启动失败", error);
  document.documentElement.dataset.astraBoot = "failed";
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  void bootstrapBrowser().catch(reportBootFailure);
}
''',
    )


def update_index() -> None:
    path = ROOT / "index.html"
    text = path.read_text(encoding="utf-8")
    text = replace_once(
        text,
        '    <script src="data.js"></script>\n    <script src="app.js"></script>',
        '    <script type="module" src="src/app/bootstrap.js"></script>',
        "native module entry",
    )
    write_text("index.html", text)


def update_service_worker() -> None:
    path = ROOT / "sw.js"
    text = path.read_text(encoding="utf-8")
    text = replace_once(
        text,
        'const CACHE_NAME = "astra-tarot-v6";',
        'const CACHE_NAME = "astra-tarot-v7";',
        "cache version",
    )
    text = replace_once(
        text,
        '  "./data.js",\n  "./app.js",',
        '  "./src/app/bootstrap.js",\n  "./src/app/legacy-runtime.js",\n  "./data.js",\n  "./app.js",',
        "ESM resources",
    )
    write_text("sw.js", text)


def convert_smoke_test() -> None:
    write_text(
        "tests/smoke_test.js",
        '''import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, "..");
const source = fs.readFileSync(path.join(root, "data.js"), "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "data.js" });

const data = sandbox.window.TarotData;
if (!data) throw new Error("TarotData was not initialized");
if (data.deck.length !== 78) {
  throw new Error(`Expected 78 cards, received ${data.deck.length}`);
}
if (new Set(data.deck.map((card) => card.id)).size !== 78) {
  throw new Error("Card IDs must be unique");
}
if (data.deck.filter((card) => card.arcana === "major").length !== 22) {
  throw new Error("Expected 22 major arcana cards");
}
if (data.deck.filter((card) => card.arcana === "minor").length !== 56) {
  throw new Error("Expected 56 minor arcana cards");
}
if (data.categories.length !== 6) {
  throw new Error("Expected six question categories");
}
if (data.categories.some((category) => category.questions.length !== 7)) {
  throw new Error("Expected seven preset questions in every category");
}
if (data.categories.reduce((sum, category) => sum + category.questions.length, 0) !== 42) {
  throw new Error("Expected 42 preset questions");
}
if (data.spreads.length !== 4) {
  throw new Error("Expected four spreads");
}
const spreadCounts = data.spreads.map((spread) => spread.positions.length).join(",");
if (spreadCounts !== "1,3,5,10") {
  throw new Error(`Expected distinct mainstream spread sizes 1,3,5,10; received ${spreadCounts}`);
}
const cross = data.spreads.find((spread) => spread.id === "cross");
if (!cross || cross.positions.map((position) => position.id).join(",") !== "core,root,trend,influence,action") {
  throw new Error("Expected a five-card cross with coherent spatial positions");
}
const celtic = data.spreads.find((spread) => spread.id === "celtic");
if (
  !celtic ||
  celtic.positions.map((position) => position.id).join(",") !==
    "present,challenge,past,future,above,below,advice,external,hopes,outcome"
) {
  throw new Error("Expected a classic ten-position Celtic Cross");
}
for (const card of data.deck) {
  for (const field of ["name", "en", "upright", "reversed", "advice"]) {
    if (!card[field]) throw new Error(`${card.id} is missing ${field}`);
  }
}

console.log("Tarot data smoke test passed: ESM runner, 78 cards, 42 questions, and 1/3/5/10-card mainstream spreads.");
''',
    )


def update_module_contract() -> None:
    path = ROOT / "tests/module_contract_test.mjs"
    text = path.read_text(encoding="utf-8")
    text = replace_once(
        text,
        'import { fileURLToPath } from "node:url";',
        'import { fileURLToPath, pathToFileURL } from "node:url";',
        "URL imports",
    )
    text = replace_once(
        text,
        '  "src/README.md",\n];',
        '  "src/README.md",\n  "package.json",\n  "src/app/bootstrap.js",\n  "src/app/legacy-runtime.js",\n];',
        "MOD-003A required files",
    )
    anchor = '''for (const relativePath of requiredFiles) {
  assert.equal(exists(relativePath), true, `Missing MOD-001 deliverable: ${relativePath}`);
}

'''
    module_checks = '''const packageMetadata = JSON.parse(read("package.json"));
assert.equal(packageMetadata.private, true, "package.json must remain private");
assert.equal(packageMetadata.type, "module", "Node .js files must use native ESM");
assert.equal("dependencies" in packageMetadata, false, "MOD-003A may not add runtime dependencies");
assert.equal("devDependencies" in packageMetadata, false, "MOD-003A may not add development dependencies");
assert.equal(packageMetadata.scripts["test:smoke"], "node tests/smoke_test.js");
assert.equal(packageMetadata.scripts["test:contracts"], "node tests/module_contract_test.mjs");

const runtimeModule = await import(
  pathToFileURL(path.join(root, "src/app/legacy-runtime.js")).href
);
assert.deepEqual([...runtimeModule.LEGACY_SCRIPT_PATHS], ["../../data.js", "../../app.js"]);
assert.equal(runtimeModule.LEGACY_GLOBAL_NAME, "TarotData");
assert.equal(typeof runtimeModule.startLegacyRuntime, "function");
const bootstrapModule = await import(
  pathToFileURL(path.join(root, "src/app/bootstrap.js")).href
);
assert.equal(typeof bootstrapModule.bootstrapBrowser, "function");
const nodeBootstrap = await bootstrapModule.bootstrapBrowser({});
assert.deepEqual(nodeBootstrap, {
  started: false,
  reason: "browser-globals-unavailable",
});

const smokeSource = read("tests/smoke_test.js");
assert.match(smokeSource, /import fs from "node:fs";/, "smoke_test.js must use ESM imports");
assert.equal(smokeSource.includes("require("), false, "smoke_test.js still uses CommonJS require");

'''
    text = replace_once(text, anchor, anchor + module_checks, "module metadata checks")
    text = replace_once(
        text,
        'assert.match(appSource, /window\\.TarotData/, "Legacy data bridge changed before MOD-003A");',
        'assert.match(appSource, /window\\.TarotData/, "Legacy app must remain behind the MOD-003A bridge until MOD-006A");',
        "legacy app message",
    )
    old_index = '''const indexSource = read("index.html");
const dataScriptIndex = indexSource.indexOf('<script src="data.js"></script>');
const appScriptIndex = indexSource.indexOf('<script src="app.js"></script>');
assert.ok(dataScriptIndex >= 0, "index.html must still load data.js during MOD-001");
assert.ok(appScriptIndex > dataScriptIndex, "index.html must still load app.js after data.js");
'''
    new_index = '''const indexSource = read("index.html");
assert.ok(
  indexSource.includes('<script type="module" src="src/app/bootstrap.js"></script>'),
  "index.html must use the native ESM bootstrap",
);
assert.equal(indexSource.includes('<script src="data.js"></script>'), false);
assert.equal(indexSource.includes('<script src="app.js"></script>'), false);
const bootstrapSource = read("src/app/bootstrap.js");
assert.match(bootstrapSource, /from "\\.\\/legacy-runtime\\.js"/);
assert.match(bootstrapSource, /bootstrapBrowser/);
const legacyRuntimeSource = read("src/app/legacy-runtime.js");
assert.match(legacyRuntimeSource, /LEGACY_SCRIPT_PATHS/);
assert.match(legacyRuntimeSource, /data\\.js/);
assert.match(legacyRuntimeSource, /app\\.js/);
'''
    text = replace_once(text, old_index, new_index, "index module contract")
    text = replace_once(
        text,
        'assert.match(serviceWorkerSource, /astra-tarot-v6/, "MOD-002 must bump the cache version");',
        'assert.match(serviceWorkerSource, /astra-tarot-v7/, "MOD-003A must bump the cache version");',
        "SW cache version",
    )
    text = replace_once(
        text,
        'for (const relativePath of ["src/styles/index.css", ...cssImports]) {\n',
        'for (const relativePath of [\n  "src/styles/index.css",\n  ...cssImports,\n  "src/app/bootstrap.js",\n  "src/app/legacy-runtime.js",\n  "data.js",\n  "app.js",\n]) {\n',
        "SW resource loop",
    )
    text = replace_once(
        text,
        '  "MOD-002 module contract passed: CSS cascade, public IDs, legacy storage, PWA resources, and debt baseline are preserved.",',
        '  "MOD-003A module contract passed: native ESM entry, controlled legacy bridge, Node format, CSS cascade, and PWA resources are preserved.",',
        "completion message",
    )
    write_text("tests/module_contract_test.mjs", text)


def update_python_contract() -> None:
    path = ROOT / "tests/test_app_contract.py"
    text = path.read_text(encoding="utf-8")
    text = replace_once(
        text,
        '            "icon.svg",\n        }',
        '            "icon.svg",\n            "package.json",\n        }',
        "required package metadata",
    )
    text = replace_once(
        text,
        '        self.assertFalse((ROOT / "styles.css").exists())\n',
        '        self.assertFalse((ROOT / "styles.css").exists())\n'
        '        self.assertTrue((ROOT / "src/app/bootstrap.js").is_file())\n'
        '        self.assertTrue((ROOT / "src/app/legacy-runtime.js").is_file())\n',
        "required ESM modules",
    )
    text = replace_once(
        text,
        '        self.assertIn(\'src="data.js"\', html)\n'
        '        self.assertIn(\'src="app.js"\', html)\n',
        '        self.assertIn(\'type="module" src="src/app/bootstrap.js"\', html)\n'
        '        self.assertNotIn(\'<script src="data.js"></script>\', html)\n'
        '        self.assertNotIn(\'<script src="app.js"></script>\', html)\n',
        "HTML module entry",
    )
    text = replace_once(
        text,
        '        for filename in ("index.html", "data.js", "app.js"):\n',
        '        for filename in (\n'
        '            "index.html",\n'
        '            "data.js",\n'
        '            "app.js",\n'
        '            "src/app/bootstrap.js",\n'
        '            "src/app/legacy-runtime.js",\n'
        '        ):\n',
        "static module assets",
    )
    write_text("tests/test_app_contract.py", text)


def update_baseline() -> None:
    path = ROOT / "automation/quality-baseline.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data["task"] = "MOD-003A"
    write_text(
        "automation/quality-baseline.json",
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
    )


def update_docs() -> None:
    automation_path = ROOT / "automation/README.md"
    automation_text = automation_path.read_text(encoding="utf-8")
    automation_text = replace_once(
        automation_text,
        "Phase M 的 `MOD-001` 与 `MOD-002` 当前实现：",
        "Phase M 的 `MOD-001`、`MOD-002` 与 `MOD-003A` 当前实现：",
        "automation scope",
    )
    automation_text = replace_once(
        automation_text,
        "Node 缺失属于验证失败，不得静默跳过。",
        "Node 缺失属于验证失败，不得静默跳过。`package.json` 仅声明 `private: true` 与 `type: module`，不需要 `npm install`；`tests/smoke_test.js` 和运行源码均使用原生 ESM。",
        "Node module format",
    )
    write_text("automation/README.md", automation_text)

    module_map_path = ROOT / "docs/MODULE_MAP.md"
    module_map = module_map_path.read_text(encoding="utf-8")
    module_map = replace_once(
        module_map,
        "# MOD-001 模块、数据与平台基线",
        "# Phase M 模块、数据与平台基线",
        "module map title",
    )
    module_map = replace_once(
        module_map,
        "**状态：MOD-001 基线**",
        "**状态：MOD-003A ESM入口已接线**",
        "module map status",
    )
    old_tree = '''```text
index.html
├── styles.css
├── data.js  → window.TarotData
└── app.js   → 读取 window.TarotData
```'''
    new_tree = '''```text
index.html
├── src/styles/index.css
└── src/app/bootstrap.js  → native ES Module
    └── src/app/legacy-runtime.js  → controlled compatibility bridge
        ├── data.js  → window.TarotData
        └── app.js   → 读取 window.TarotData
```'''
    module_map = replace_once(module_map, old_tree, new_tree, "current entry tree")
    module_map = replace_once(
        module_map,
        '| `app.js` | 1528 |',
        '| `app.js` | 1526 |',
        "app line count",
    )
    module_map = replace_once(
        module_map,
        '| `styles.css` | 4918 | 令牌、布局、组件、牌桌、牌阵、动画、弹窗、历史和响应式 | 已登记技术债，WARN，不得增长 |',
        '| `src/styles/` | 9个活动文件，最大714行 | 固定入口与八个连续规则模块 | `MOD-002` 已完成，全部低于硬上限 |',
        "CSS baseline row",
    )
    module_map = replace_once(
        module_map,
        '| `data.js` | 637 |',
        '| `data.js` | 635 |',
        "data line count",
    )
    if "## 11. MOD-003A 当前运行入口" not in module_map:
        module_map += '''

---

## 11. MOD-003A 当前运行入口

- `package.json` 只声明私有仓库和原生 ESM 格式，不含任何依赖。
- `index.html` 只加载 `src/app/bootstrap.js` 模块入口。
- `src/app/legacy-runtime.js` 是旧 `data.js` 与 `app.js` 的唯一页面加载桥，顺序固定为数据后应用。
- 两个新模块均可在 Node 中导入而不于顶层访问 DOM；浏览器启动只在检测到 `window` 与 `document` 后发生。
- `tests/smoke_test.js` 已转换为 ESM，原命令 `node tests/smoke_test.js` 保持可用。
- Service Worker 临时清单缓存模块入口、兼容桥及两个旧脚本。
- 兼容桥与 `window.TarotData` 的删除任务仍为 `MOD-006A`。
'''
    write_text("docs/MODULE_MAP.md", module_map)

    src_path = ROOT / "src/README.md"
    src_text = src_path.read_text(encoding="utf-8")
    src_text = replace_once(
        src_text,
        "`MOD-001` 只建立职责边界，不把现有运行入口切换到这里。真实 ES Module 接线从 `MOD-003A` 开始。",
        "`MOD-003A` 已建立真实 ES Module 页面入口；旧业务代码暂时只通过受控兼容桥运行，并将在 `MOD-006A` 删除。",
        "src runtime status",
    )
    if "## 当前活动JavaScript入口" not in src_text:
        src_text += '''

## 当前活动JavaScript入口

```text
src/app/
├── bootstrap.js
└── legacy-runtime.js
```

`bootstrap.js` 是 `index.html` 的唯一脚本入口。`legacy-runtime.js` 顺序加载根目录 `data.js` 和 `app.js`，并验证 `window.TarotData` 已建立。两个模块不引入依赖、不使用裸导入，并可被 Node 安全导入；旧全局和大型文件继续受 `MOD-006A` 删除门禁约束。
'''
    write_text("src/README.md", src_text)


def update_progress() -> None:
    path = ROOT / "docs/PROGRESS.md"
    text = path.read_text(encoding="utf-8")
    text = replace_once(
        text,
        "| 当前进行中任务 | 无 |",
        "| 当前进行中任务 | `MOD-003A` ES Module 入口、Node 模块格式与兼容桥 |",
        "active task",
    )
    text = replace_once(
        text,
        "| 下一任务 | `MOD-003A` ES Module 入口、Node 模块格式与兼容桥 |",
        "| 下一任务 | 无；`MOD-003A` 正在执行 |",
        "next task",
    )
    text = replace_once(
        text,
        "| 工作分支 | `mod-002-split-css` |",
        "| 工作分支 | `mod-003a-esm-entry` |",
        "work branch",
    )
    text = replace_once(
        text,
        "## 7. 下一任务：MOD-003A\n\n**状态：NEXT**",
        "## 7. 当前任务：MOD-003A\n\n**状态：IN_PROGRESS**\n\n起始提交：`fbcb3d0c4b2e99f800bc2adb316870aa1c57e69c`。实现分支：`mod-003a-esm-entry`。",
        "active task section",
    )
    text = replace_once(
        text,
        "- Phase M：`PARENT-IN-PROGRESS`，唯一下一叶子任务 `MOD-003A`",
        "- Phase M：`PARENT-IN-PROGRESS`，当前叶子任务 `MOD-003A`",
        "phase status",
    )
    write_text("docs/PROGRESS.md", text)


def main() -> None:
    create_package_json()
    create_runtime_modules()
    update_index()
    update_service_worker()
    convert_smoke_test()
    update_module_contract()
    update_python_contract()
    update_baseline()
    update_docs()
    update_progress()
    print(
        "mod_003a_applied entry=src/app/bootstrap.js bridge=src/app/legacy-runtime.js "
        "package_type=module cache=astra-tarot-v7"
    )


if __name__ == "__main__":
    main()
