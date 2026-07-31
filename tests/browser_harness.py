#!/usr/bin/env python3
# Launch the real application in installed desktop browsers without third-party packages.

from __future__ import annotations

import functools
import json
import os
import pathlib
import shutil
import subprocess
import tempfile
import threading
import time
import urllib.parse
from dataclasses import dataclass
from typing import ClassVar
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.server.http import AppRequestHandler
from src.server.lifecycle import AppServer
from src.server.session import SessionGuard

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


def stop_process_tree(process: subprocess.Popen[bytes]) -> None:
    if process.poll() is not None:
        return
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(process.pid), "/T", "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    else:
        process.terminate()
    try:
        process.wait(timeout=8)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)


def remove_profile(profile: pathlib.Path) -> None:
    for attempt in range(20):
        try:
            shutil.rmtree(profile)
            return
        except FileNotFoundError:
            return
        except PermissionError:
            if attempt == 19:
                raise
            time.sleep(0.25)


def run_browser(target: BrowserTarget, base_url: str) -> dict[str, object]:
    HarnessHandler.result_event.clear()
    HarnessHandler.result_payload = None
    profile = pathlib.Path(tempfile.mkdtemp(prefix=f"astra-{target.name}-"))
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
        stop_process_tree(process)
        remove_profile(profile)


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
