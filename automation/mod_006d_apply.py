#!/usr/bin/env python3
"""Apply MOD-006D Phase M terminal validation and browser harness."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.replace("\r\n", "\n"), encoding="utf-8", newline="\n")


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return source.replace(old, new, 1)


BROWSER_HARNESS = r'''#!/usr/bin/env python3
"""Launch the real application in installed desktop browsers without third-party packages."""

from __future__ import annotations

import functools
import json
import os
import pathlib
import subprocess
import tempfile
import threading
import time
import urllib.parse
from dataclasses import dataclass
from typing import ClassVar

from src.server.http import AppRequestHandler
from src.server.lifecycle import AppServer
from src.server.session import SessionGuard

ROOT = pathlib.Path(__file__).resolve().parents[1]

SETUP_JS = r'''
(() => {
  const payload = '<img src=x onerror="globalThis.__astraInjected=true">';
  localStorage.setItem('astra-tarot-history-v1', JSON.stringify([{
    id: 'legacy-browser-harness',
    createdAt: '2026-07-31T00:00:00.000Z',
    categoryName: '测试主题',
    categoryIcon: '✦',
    categoryAccent: 'red; background:url(javascript:alert(1))',
    spreadName: '单张指引',
    deckName: '经典韦特',
    question: payload,
    headline: payload,
    cards: [{ position: payload, name: payload, orientation: '正位' }],
  }]));
})();
'''

HARNESS_JS = r'''
const checks = [];
const record = (name, passed, detail = '') => checks.push({ name, passed: Boolean(passed), detail: String(detail) });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const deadline = Date.now() + 12000;
while (!['ready', 'failed'].includes(document.documentElement.dataset.astraBoot || '') && Date.now() < deadline) {
  await sleep(50);
}
record('boot-ready', document.documentElement.dataset.astraBoot === 'ready', document.documentElement.dataset.astraBoot);
record('category-count', document.querySelectorAll('[data-category-id]').length === 6, document.querySelectorAll('[data-category-id]').length);
record('spread-count', document.querySelectorAll('[data-spread-id]').length === 4, document.querySelectorAll('[data-spread-id]').length);
record('deck-count', document.querySelectorAll('[data-deck-style-id]').length === 4, document.querySelectorAll('[data-deck-style-id]').length);
record('question-picker', Boolean(document.querySelector('#selectedQuestionText')?.textContent?.trim()));
record('no-inline-style', document.querySelectorAll('[style]').length === 0, document.querySelectorAll('[style]').length);

const cspResponse = await fetch(location.href, { cache: 'no-store' });
const csp = cspResponse.headers.get('content-security-policy') || '';
record('csp-self-only', csp.includes("script-src 'self'") && csp.includes("style-src-attr 'none'"));
record('csp-no-unsafe', !csp.includes("'unsafe-inline'") && !csp.includes("'unsafe-eval'"));

const historyButton = document.querySelector('#historyButton');
historyButton?.click();
await sleep(80);
const historyList = document.querySelector('#historyList');
const malicious = '<img src=x onerror="globalThis.__astraInjected=true">';
record('legacy-history-visible', historyList?.textContent?.includes(malicious));
record('legacy-history-no-image', !historyList?.querySelector('img'));
record('legacy-history-no-handler', !historyList?.querySelector('[onerror]'));
record('no-script-execution', globalThis.__astraInjected !== true);

const result = {
  browser: new URL(location.href).searchParams.get('browser') || 'unknown',
  userAgent: navigator.userAgent,
  checks,
  passed: checks.every((item) => item.passed),
};
await fetch('/__astra/test-result', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(result),
  keepalive: true,
});
document.documentElement.dataset.astraHarness = result.passed ? 'passed' : 'failed';
'''


class HarnessHandler(AppRequestHandler):
    result_event: ClassVar[threading.Event] = threading.Event()
    result_payload: ClassVar[dict[str, object] | None] = None

    def _send_bytes(self, body: bytes, content_type: str) -> None:
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        path = urllib.parse.urlsplit(self.path).path
        if path == "/__astra/test-setup.js":
            self._send_bytes(SETUP_JS.encode("utf-8"), "text/javascript; charset=utf-8")
            return
        if path == "/__astra/test-harness.js":
            self._send_bytes(HARNESS_JS.encode("utf-8"), "text/javascript; charset=utf-8")
            return
        if path in {"/", "/index.html"}:
            html = (ROOT / "index.html").read_text(encoding="utf-8")
            marker = '<script type="module" src="src/app/bootstrap.js"></script>'
            injected = (
                '<script src="/__astra/test-setup.js"></script>\n    '
                + marker
                + '\n    <script type="module" src="/__astra/test-harness.js"></script>'
            )
            if html.count(marker) != 1:
                self.send_error(500, "Browser harness bootstrap marker changed")
                return
            self._issue_session_cookie = True
            self._send_bytes(html.replace(marker, injected, 1).encode("utf-8"), "text/html; charset=utf-8")
            return
        super().do_GET()

    def do_POST(self) -> None:
        if urllib.parse.urlsplit(self.path).path == "/__astra/test-result":
            try:
                length = int(self.headers.get("Content-Length", "0"))
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                if not isinstance(payload, dict):
                    raise ValueError("result must be an object")
                type(self).result_payload = payload
                type(self).result_event.set()
                self.send_response(204)
                self.send_header("Content-Length", "0")
                self.end_headers()
            except (ValueError, json.JSONDecodeError, UnicodeDecodeError):
                self.send_error(400, "Invalid browser harness result")
            return
        super().do_POST()

    def log_message(self, format_string: str, *args: object) -> None:
        return


@dataclass(frozen=True)
class BrowserTarget:
    name: str
    engine: str
    executable: pathlib.Path


def candidates() -> list[BrowserTarget]:
    roots = [
        os.environ.get("PROGRAMFILES"),
        os.environ.get("PROGRAMFILES(X86)"),
        os.environ.get("LOCALAPPDATA"),
    ]
    specs = [
        ("chrome", "chromium", "Google/Chrome/Application/chrome.exe"),
        ("edge", "chromium", "Microsoft/Edge/Application/msedge.exe"),
        ("brave", "chromium", "BraveSoftware/Brave-Browser/Application/brave.exe"),
        ("firefox", "firefox", "Mozilla Firefox/firefox.exe"),
    ]
    found: list[BrowserTarget] = []
    seen: set[str] = set()
    for name, engine, relative in specs:
        for root in roots:
            if not root:
                continue
            executable = pathlib.Path(root) / pathlib.PurePosixPath(relative)
            key = os.path.normcase(str(executable))
            if key in seen or not executable.is_file():
                continue
            seen.add(key)
            found.append(BrowserTarget(name, engine, executable))
            break
    return found


def command(target: BrowserTarget, profile: pathlib.Path, url: str) -> list[str]:
    if target.engine == "firefox":
        return [str(target.executable), "-headless", "-new-instance", "-profile", str(profile), url]
    return [
        str(target.executable),
        "--headless=new",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-sync",
        "--no-first-run",
        "--no-default-browser-check",
        f"--user-data-dir={profile}",
        url,
    ]


def run_browser(target: BrowserTarget, base_url: str) -> dict[str, object]:
    HarnessHandler.result_event.clear()
    HarnessHandler.result_payload = None
    with tempfile.TemporaryDirectory(prefix=f"astra-{target.name}-") as profile_text:
        profile = pathlib.Path(profile_text)
        url = f"{base_url}?browser={urllib.parse.quote(target.name)}"
        process = subprocess.Popen(
            command(target, profile, url),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        try:
            if not HarnessHandler.result_event.wait(25):
                return {"browser": target.name, "engine": target.engine, "passed": False, "error": "timeout"}
            payload = HarnessHandler.result_payload or {}
            return {"engine": target.engine, **payload}
        finally:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)


def main() -> int:
    targets = candidates()
    if not any(target.engine == "chromium" for target in targets):
        print(json.dumps({"passed": False, "error": "No Chromium browser found", "targets": []}, ensure_ascii=False))
        return 1
    handler = functools.partial(HarnessHandler, directory=str(ROOT))
    server = AppServer(("127.0.0.1", 0), handler, session_guard=SessionGuard())
    thread = threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.05}, daemon=True)
    thread.start()
    port = int(server.server_address[1])
    try:
        results = [run_browser(target, f"http://127.0.0.1:{port}/") for target in targets]
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)
    passed = bool(results) and all(bool(result.get("passed")) for result in results)
    print(json.dumps({"passed": passed, "results": results}, ensure_ascii=False, sort_keys=True))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
'''

PHASE_GATE = r'''import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TarotData } from "../src/knowledge/legacy/index.js";
import { historyRecordView } from "../src/ui/renderers/history.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));
for (const removed of ["app.js", "data.js", "styles.css", "src/app/legacy-runtime.js"]) {
  assert.equal(exists(removed), false, `${removed} was reintroduced`);
}
assert.equal(TarotData.deck.length, 78);
assert.equal(TarotData.categories.length, 6);
assert.equal(TarotData.categories.reduce((sum, item) => sum + item.questions.length, 0), 42);
assert.deepEqual(TarotData.spreads.map((item) => item.positions.length), [1, 3, 5, 10]);
const application = read("src/app/application.js");
assert.match(application, /const \{ deck, categories, spreads \} = TarotData;/);
assert.equal(application.includes("window.TarotData"), false);
assert.equal(application.includes("window.AstraRuntime"), false);
const bootstrap = read("src/app/bootstrap.js");
assert.match(bootstrap, /dataset\.astraBoot = "ready"/);
const csp = read("src/server/security.py");
assert.match(csp, /script-src 'self'/);
assert.match(csp, /style-src-attr 'none'/);
assert.equal(csp.includes("unsafe-inline"), false);
assert.equal(csp.includes("unsafe-eval"), false);
const payload = '<img src=x onerror="globalThis.injected=true">';
const view = historyRecordView({
  id: payload,
  question: payload,
  categoryName: payload,
  spreadName: payload,
  headline: payload,
  categoryAccent: "red;background:url(javascript:alert(1))",
  cards: [{ position: payload, name: payload, orientation: payload }],
}, (value) => value);
assert.equal(view.question, payload);
assert.equal(view.headline, payload);
assert.notEqual(view.accent, "red;background:url(javascript:alert(1))");
const historyRenderer = read("src/ui/renderers/history.js");
assert.match(historyRenderer, /createElement/);
assert.equal(historyRenderer.includes("innerHTML"), false);
const sw = read("sw.js");
assert.match(sw, /^importScripts\("\.\/src\/generated\/precache-manifest\.js"\);/);
for (const forbidden of ["skipWaiting", "clients.claim", "caches.keys", "cached || caches.match(\"./index.html\")"]) {
  assert.equal(sw.includes(forbidden), false, `SW contains forbidden fallback/update behavior: ${forbidden}`);
}
for (const state of ["APP-SHELL-READY", "DEFAULT-DECK-READY", "SELECTED-DECKS-READY"]) {
  assert.ok(sw.includes(state), `SW missing ${state}`);
}
const packageMetadata = JSON.parse(read("package.json"));
assert.equal("dependencies" in packageMetadata, false);
assert.equal("devDependencies" in packageMetadata, false);
assert.equal(packageMetadata.scripts["test:full"], "python automation/validate.py --scope full");
console.log("MOD-006D Phase M gate passed: runtime, CSP, safe history DOM, PWA classes, generated artifacts, and public invariants are closed.");
'''

BROWSER_SUPPORT = r'''# 浏览器支持矩阵

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
'''


def update_bootstrap(source: str) -> str:
    return replace_once(
        source,
        "  return startApplication({ documentRef, windowRef });\n",
        "  const result = startApplication({ documentRef, windowRef });\n"
        "  documentRef.documentElement.dataset.astraBoot = result.started ? \"ready\" : \"skipped\";\n"
        "  return result;\n",
        "browser ready marker",
    )


def update_application(source: str) -> str:
    return replace_once(
        source,
        "  assertKnowledgeCatalog(TarotData);\n",
        "  assertKnowledgeCatalog(TarotData);\n  const { deck, categories, spreads } = TarotData;\n",
        "TarotData runtime destructure",
    )


def update_validate(source: str) -> str:
    source = replace_once(
        source,
        'choices=("baseline",),',
        'choices=("baseline", "full"),',
        "full scope parser",
    )
    anchor = '''def main() -> int:
    args = parse_args()
'''
    full_function = '''def full_steps(node: str) -> list[tuple[str, list[str]]]:
    python = sys.executable
    return [
        ("phase-m-terminal-gate", [node, "tests/phase_m_gate_test.mjs"]),
        ("browser-harness", [python, "tests/browser_harness.py"]),
        (
            "module-size-strict",
            [python, "scripts/check_module_size.py", "--mode", "strict", "--format", "json"],
        ),
    ]


'''
    source = replace_once(source, anchor, full_function + anchor, "full steps function")
    return replace_once(
        source,
        "    for name, command in baseline_steps(node):\n",
        "    selected_steps = baseline_steps(node)\n    if args.scope == \"full\":\n        selected_steps.extend(full_steps(node))\n    for name, command in selected_steps:\n",
        "full scope selection",
    )


def update_package(source: str) -> str:
    metadata = json.loads(source)
    scripts = metadata.setdefault("scripts", {})
    scripts["test:phase-m"] = "node tests/phase_m_gate_test.mjs"
    scripts["test:browser"] = "python tests/browser_harness.py"
    scripts["test:full"] = "python automation/validate.py --scope full"
    return json.dumps(metadata, ensure_ascii=False, indent=2) + "\n"


def update_module_contract(source: str) -> str:
    source = replace_once(
        source,
        '  "tests/generated_artifacts_contract_test.mjs",\n',
        '  "tests/generated_artifacts_contract_test.mjs",\n  "tests/browser_harness.py", "tests/phase_m_gate_test.mjs", "docs/BROWSER_SUPPORT.md",\n',
        "terminal gate required files",
    )
    return source.replace("MOD-006C module contract passed:", "MOD-006D module contract passed:")


def write_progress() -> None:
    write("docs/PROGRESS.md", """# 项目开发进度

> 本文件是继续任务的唯一实时状态入口；任务定义以 `EXECUTION_CONTRACTS.md` 为准。

## 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase 1：质量门禁与知识协议 |
| 当前进行中任务 | 无 |
| 最近完成任务 | `MOD-006D` Phase M终态验证 |
| 唯一下一任务 | `TQ-001` 机器可验证JSON Schema |
| 阻塞项 | 无 |
| 工作分支 | `phase-m-completion` |
| Phase M状态 | `PARENT-DONE` |
| Phase 1状态 | `PARENT-PENDING` |
| 最后更新时间 | 2026-07-31 |

## Phase M完成记录

| 任务 | 状态 | 产物/证据 |
|---|---|---|
| `MOD-001`–`MOD-003B` | `DONE` | 基线、CSS、ESM入口与基础模块 |
| `MOD-004A` | `DONE` | `72b55c0e8b83f44b61b966eb39a849bf613b5436` |
| `MOD-004B` | `DONE` | `e1b2c8e73ad9c4e40cb5264aade7f60fe86618a9`；发现修复 `b31c2af465eb68466929d1c40938c409b60937d8` |
| `MOD-005` | `DONE` | `b03ca2602a36c4f96f2f2cf3c54d085db729116f`；固定复验 `01KYG9PHM5B2` |
| `MOD-006A` | `DONE` | `72cd7fa7ba05dab81b0f36a41c17d025002d8e29`；固定复验 `01KYG9PHM6AK2` |
| `MOD-006B` | `DONE` | `a710750d207cf13c6a4c61852356a4aaedc39c15`；永久生成器与规范manifest |
| `MOD-006C` | `DONE` | `b8973a7f1077234a04d115652e05324706dafd07`；分类缓存与离线状态 |
| `MOD-006D` | `DONE` | `full`门禁、真实浏览器harness、CSP/DOM/历史/PWA/模块终态契约 |

## Phase M冻结不变量

- 根 `app.js`、`data.js`、`styles.css` 和旧运行桥保持删除。
- 78张牌、42个固定问题、1/3/5/10牌阵、公开ID、旧历史键和随机分布不变。
- 人工JS/CSS无超限技术债；不引入npm依赖、构建步骤或GitHub Actions。
- 人工源是唯一真相；`src/generated/` 必须由永久生成器重建并通过陈旧检查。
- `automation/validate.py --scope full` 是Phase M之后的完整回归入口。

## 唯一NEXT：TQ-001

创建卡牌、问题和牌阵的结构Schema、失败样例与验证器；仅负责对象结构、必填字段、ID/引用语法、类型、范围、基础枚举和结构性重复/引用检查，不提前实现 `TQ-002` 的语义词表职责。
""")


def main() -> None:
    write("tests/browser_harness.py", BROWSER_HARNESS.lstrip())
    write("tests/phase_m_gate_test.mjs", PHASE_GATE.lstrip())
    write("docs/BROWSER_SUPPORT.md", BROWSER_SUPPORT.lstrip())
    write("src/app/bootstrap.js", update_bootstrap(read("src/app/bootstrap.js")))
    write("src/app/application.js", update_application(read("src/app/application.js")))
    write("automation/validate.py", update_validate(read("automation/validate.py")))
    write("package.json", update_package(read("package.json")))
    write("tests/module_contract_test.mjs", update_module_contract(read("tests/module_contract_test.mjs")))
    write("docs/MODULE_MAP.md", read("docs/MODULE_MAP.md") + "\n\n## MOD-006D终态门禁\n\n`automation/validate.py --scope full` 在baseline之外执行Phase M综合契约、真实浏览器harness和严格规模检查。浏览器harness使用测试专用回环端点，不扩大生产服务器白名单。\n")
    write("automation/README.md", read("automation/README.md") + "\n\nPhase M终态与后续完整回归使用 `python automation/validate.py --scope full`；该scope要求至少一款本机Chromium浏览器，并验证所有检测到的受支持桌面浏览器。\n")
    write_progress()
    print("mod_006d_applied full_scope=enabled browser_harness=real phase_m=PARENT-DONE next=TQ-001")


if __name__ == "__main__":
    main()
