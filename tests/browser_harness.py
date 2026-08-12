#!/usr/bin/env python3
# Launch the real application in installed desktop browsers without third-party packages.

from __future__ import annotations

import functools
import json
import os
import pathlib
import shutil
import socket
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
const waitFor = async (predicate, timeout = 8000) => {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (predicate()) return true;
    await sleep(25);
  }
  return false;
};
const deadline = Date.now() + 12000;
while (!['ready', 'failed'].includes(document.documentElement.dataset.astraBoot || '') && Date.now() < deadline) {
  await sleep(50);
}
record('boot-ready', document.documentElement.dataset.astraBoot === 'ready', document.documentElement.dataset.astraBoot);
record('spread-count', document.querySelectorAll('[data-spread-id]').length === 4, document.querySelectorAll('[data-spread-id]').length);
record('deck-count', document.querySelectorAll('[data-deck-style-id]').length === 4, document.querySelectorAll('[data-deck-style-id]').length);
const questionInput = document.querySelector('#questionInput');
const startButton = document.querySelector('#startReading');
record('free-question-textarea', questionInput?.tagName === 'TEXTAREA');
record('question-required', Boolean(startButton?.disabled));
record('all-spreads-enabled', [...document.querySelectorAll('[data-spread-id]')]
  .every((button) => !button.disabled && button.getAttribute('aria-disabled') === 'false'));
record('retired-setup-absent', !document.querySelector([
  '[data-category-id]', '[data-question-id]', '[data-expectation-id]', '[data-criterion-id]',
  '#comparisonOptionA', '#comparisonOptionB', '#timeframeInput',
].join(',')));
record('no-inline-style', document.querySelectorAll('[style]').length === 0, document.querySelectorAll('[style]').length);

const cspResponse = await fetch(location.href, { cache: 'no-store' });
const csp = cspResponse.headers.get('content-security-policy') || '';
record('csp-self-only', csp.includes("script-src 'self'") && csp.includes("style-src-attr 'none'"));
record('csp-no-unsafe', !csp.includes("'unsafe-inline'") && !csp.includes("'unsafe-eval'"));
const iconResponses = await Promise.all([
  '/icon-192.png', '/icon-512.png', '/icon-maskable-192.png', '/icon-maskable-512.png',
].map(async (path) => {
  const response = await fetch(path, { cache: 'no-store' });
  return { path, ok: response.ok, type: response.headers.get('content-type') || '' };
}));
record('manifest-icons-http', iconResponses.every((item) => item.ok && item.type.startsWith('image/png')), JSON.stringify(iconResponses));

const historyButton = document.querySelector('#historyButton');
historyButton?.click();
await sleep(80);
const historyList = document.querySelector('#historyList');
const malicious = '<img src=x onerror="globalThis.__astraInjected=true">';
record('legacy-history-visible', historyList?.textContent?.includes(malicious));
record('legacy-history-no-image', !historyList?.querySelector('img'));
record('legacy-history-no-handler', !historyList?.querySelector('[onerror]'));
record('no-script-execution', globalThis.__astraInjected !== true);
document.querySelector('#historyDialog [data-close-dialog]')?.click();
await sleep(50);

const flowTimings = {};
for (const [spreadId, count] of [['single', 1], ['timeline', 3], ['cross', 5], ['celtic', 10]]) {
  const question = `浏览器隔离标记-${spreadId}-自由问题`;
  questionInput.value = question;
  questionInput.dispatchEvent(new Event('input', { bubbles: true }));
  record(`${spreadId}-question-valid`, !startButton.disabled, document.querySelector('#questionValidationMessage')?.textContent || '');
  document.querySelector(`[data-spread-id="${spreadId}"]`)?.click();
  const started = performance.now();
  startButton?.click();
  await sleep(50);
  if (document.querySelector('#confirmDialog')?.open) {
    document.querySelector('#confirmAccept')?.click();
  }
  const dealt = await waitFor(() => (
    document.querySelectorAll('#cardTable .drawn-card').length === count
    && [...document.querySelectorAll('#cardTable .card-hitbox')].every((button) => !button.disabled)
  ));
  const dealtMs = performance.now() - started;
  record(`${spreadId}-dealt`, dealt, document.querySelectorAll('#cardTable .drawn-card').length);
  record(`${spreadId}-start-to-dealt-budget`, dealt && dealtMs <= 2000, dealtMs.toFixed(1));
  record(`${spreadId}-question-title-only`, document.querySelector('#readingTitle')?.textContent === question);
  const revealStarted = performance.now();
  const revealAllButton = document.querySelector('#revealAllButton');
  if (count === 1) {
    document.querySelector('#cardTable .card-hitbox')?.click();
  } else {
    record(
      `${spreadId}-reveal-all-ready`,
      Boolean(revealAllButton) && !revealAllButton.hidden && !revealAllButton.disabled,
      `hidden=${revealAllButton?.hidden};disabled=${revealAllButton?.disabled}`,
    );
    revealAllButton?.click();
  }
  const completed = await waitFor(() => (
    Boolean(document.querySelector('.structural-summary[data-schema-version="3.0.0"]'))
    || Boolean(document.querySelector('.recovery-panel'))
  ), 10000);
  const revealMs = performance.now() - revealStarted;
  const summary = document.querySelector('.structural-summary[data-schema-version="3.0.0"]');
  record(`${spreadId}-completed`, completed && Boolean(summary) && !document.querySelector('.recovery-panel'));
  record(`${spreadId}-reveal-to-summary-budget`, Boolean(summary) && revealMs <= 2500, revealMs.toFixed(1));
  const grade = summary?.querySelector('.assessment-grade strong')?.textContent?.trim() || '';
  record(`${spreadId}-summary-contract`, (
    /^(?:SSS|SS|S|A|B|C|D|E)$/.test(grade)
    && summary?.querySelectorAll('.structural-factor-bands .factor-band').length === 8
    && summary?.querySelectorAll('.assessment-factor-grid').length === 1
    && summary?.querySelectorAll('.card-evidence-item').length === 0
  ), grade);
  record(`${spreadId}-question-isolated-from-summary`, !summary?.textContent?.includes(question));
  record(`${spreadId}-isolation-notice`, summary?.textContent?.includes(
    '问题仅用于记录，不参与抽牌、解牌或评分。请根据自己的问题理解牌面提示。'
  ));
  document.querySelector('#cardInsightTab')?.click();
  const detailReady = await waitFor(() => Boolean(document.querySelector('.card-reading')));
  const cardDetail = document.querySelector('.card-reading');
  record(`${spreadId}-card-detail-contract`, detailReady && [
    '当前牌面基础含义', '所在位置的含义', '在整副牌中的作用', '关键关联牌',
  ].every((label) => cardDetail?.textContent?.includes(label)));
  record(`${spreadId}-card-detail-notice`, cardDetail?.textContent?.includes(
    '问题仅用于记录，不参与抽牌、解牌或评分。请根据自己的问题理解牌面提示。'
  ));
  flowTimings[spreadId] = { dealtMs: Number(dealtMs.toFixed(1)), revealMs: Number(revealMs.toFixed(1)) };
  if (spreadId !== 'celtic') {
    if (count > 1) await sleep(1000);
    document.querySelector('#newReadingButton')?.click();
    await waitFor(() => !questionInput.disabled && startButton.disabled);
    const resetRevealAllButton = document.querySelector('#revealAllButton');
    record(
      `${spreadId}-reveal-all-reset`,
      Boolean(resetRevealAllButton) && !resetRevealAllButton.disabled,
      `disabled=${resetRevealAllButton?.disabled}`,
    );
  }
}

document.querySelector('#historyButton')?.click();
await waitFor(() => document.querySelectorAll('#historyList [data-history-id]').length >= 5);
const newestHistory = document.querySelector('#historyList [data-history-id]');
newestHistory?.querySelector('[data-history-action="view"]')?.click();
record('history-v3-grade', newestHistory?.textContent?.includes('综合顺势等级'));
record('history-v3-isolation-notice', newestHistory?.textContent?.includes(
  '问题仅用于记录，不参与抽牌、解牌或评分。请根据自己的问题理解牌面提示。'
));
record('history-hides-raw-code', ![...historyList?.querySelectorAll('.history-summary') || []]
  .some((item) => /conditional|分数\s*0\./.test(item.textContent || '')));

let offlineReady = false;
let offlineCacheDetail = {};
if ('serviceWorker' in navigator && 'caches' in globalThis) {
  try {
    let registration = await Promise.race([
      navigator.serviceWorker.ready,
      sleep(20000).then(() => null),
    ]);
    const requiredOfflinePaths = [
      '/index.html', '/src/app/bootstrap.js',
      '/icon-192.png', '/icon-512.png',
      '/icon-maskable-192.png', '/icon-maskable-512.png',
    ];
    const stableDeadline = Date.now() + 20000;
    let cacheNames = [];
    while (Date.now() < stableDeadline) {
      registration = registration || await navigator.serviceWorker.getRegistration();
      cacheNames = await caches.keys();
      const hasStableGroups = ['knowledge', 'shell', 'startup'].every((kind) => (
        cacheNames.some((name) => name.startsWith('astra-release-') && name.endsWith(`-${kind}`))
      ));
      const hasStaging = cacheNames.some((name) => name.startsWith('astra-stage-'));
      if (registration?.active?.state === 'activated' && hasStableGroups && !hasStaging) break;
      await sleep(50);
    }
    const cached = Object.fromEntries(await Promise.all(requiredOfflinePaths.map(async (path) => [
      path,
      Boolean(await caches.match(path)),
    ])));
    const hasStableGroups = ['knowledge', 'shell', 'startup'].every((kind) => (
      cacheNames.some((name) => name.startsWith('astra-release-') && name.endsWith(`-${kind}`))
    ));
    const hasStaging = cacheNames.some((name) => name.startsWith('astra-stage-'));
    offlineReady = registration?.active?.state === 'activated'
      && hasStableGroups
      && !hasStaging
      && Object.values(cached).every(Boolean);
    offlineCacheDetail = { workerState: registration?.active?.state || '', cacheNames, cached };
  } catch (error) {
    offlineCacheDetail = { error: String(error) };
  }
}
record('offline-reopen-cache-ready', offlineReady, JSON.stringify(offlineCacheDetail));

const result = {
  browser: new URL(location.href).searchParams.get('browser') || 'unknown',
  userAgent: navigator.userAgent,
  flowTimings,
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
        parsed = urllib.parse.urlsplit(self.path)
        path = parsed.path
        if path == "/offline-reopen-probe" or "offline-reopen-probe" in self.headers.get("Referer", ""):
            self.close_connection = True
            try:
                self.connection.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            self.connection.close()
            return
        if path == "/__astra/test-setup.js":
            self._send_bytes(SETUP_JS.encode("utf-8"), "text/javascript; charset=utf-8")
            return
        if path == "/__astra/test-harness.js":
            self._send_bytes(HARNESS_JS.encode("utf-8"), "text/javascript; charset=utf-8")
            return
        if path in {"/", "/index.html"} and "browser" in urllib.parse.parse_qs(parsed.query):
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


def verify_offline_reopen(
    target: BrowserTarget,
    profile: pathlib.Path,
    base_url: str,
    *,
    required: bool,
) -> dict[str, object]:
    if not required:
        return {"name": "offline-reopen-navigation", "passed": True, "detail": "covered-by-primary-browser"}
    if target.engine != "chromium":
        return {"name": "offline-reopen-navigation", "passed": True, "detail": "not-required"}
    url = urllib.parse.urljoin(base_url, "offline-reopen-probe")
    offline_command = [
        str(target.executable),
        "--headless=new",
        "--disable-gpu",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-sync",
        "--no-first-run",
        "--no-default-browser-check",
        "--proxy-server=http://127.0.0.1:9",
        "--proxy-bypass-list=<-loopback>",
        "--virtual-time-budget=8000",
        "--dump-dom",
        f"--user-data-dir={profile}",
        url,
    ]
    try:
        completed = subprocess.run(
            offline_command,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            check=False,
            timeout=25,
        )
        dom = completed.stdout.decode("utf-8", errors="replace")
        passed = 'data-astra-boot="ready"' in dom and "星纱塔罗" in dom
        detail = f"returncode={completed.returncode};domBytes={len(completed.stdout)}"
    except subprocess.TimeoutExpired as error:
        output = error.stdout or b""
        dom = output.decode("utf-8", errors="replace") if isinstance(output, bytes) else str(output)
        passed = 'data-astra-boot="ready"' in dom and "星纱塔罗" in dom
        detail = f"timeout;domBytes={len(output)}"
    return {"name": "offline-reopen-navigation", "passed": passed, "detail": detail}


def stop_profile_processes(profile: pathlib.Path) -> None:
    if os.name != "nt":
        return
    temp_root = pathlib.Path(tempfile.gettempdir()).resolve()
    resolved = profile.resolve()
    if resolved.parent != temp_root or not resolved.name.startswith("astra-"):
        return
    powershell = shutil.which("powershell") or shutil.which("pwsh")
    if not powershell:
        return
    environment = {**os.environ, "ASTRA_TEST_PROFILE": str(resolved)}
    script = """
$profilePath = [System.IO.Path]::GetFullPath($env:ASTRA_TEST_PROFILE)
Get-CimInstance Win32_Process |
  Where-Object {
    $_.CommandLine -and
    $_.CommandLine.IndexOf($profilePath, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
  } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
"""
    subprocess.run(
        [powershell, "-NoProfile", "-NonInteractive", "-Command", script],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
        env=environment,
        timeout=15,
    )


def stop_all_astra_browser_processes() -> None:
    if os.name != "nt":
        return
    powershell = shutil.which("powershell") or shutil.which("pwsh")
    if not powershell:
        return
    temp_root = pathlib.Path(tempfile.gettempdir()).resolve()
    environment = {**os.environ, "ASTRA_TEST_TEMP_ROOT": str(temp_root)}
    script = """
$profilePrefix = [System.IO.Path]::Combine(
  [System.IO.Path]::GetFullPath($env:ASTRA_TEST_TEMP_ROOT),
  'astra-'
)
$browserNames = @('chrome.exe', 'msedge.exe', 'brave.exe', 'firefox.exe')
Get-CimInstance Win32_Process |
  Where-Object {
    $browserNames -contains $_.Name -and
    $_.CommandLine -and
    $_.CommandLine.IndexOf($profilePrefix, [System.StringComparison]::OrdinalIgnoreCase) -ge 0
  } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
"""
    subprocess.run(
        [powershell, "-NoProfile", "-NonInteractive", "-Command", script],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
        env=environment,
        timeout=15,
    )


def stop_process_tree(process: subprocess.Popen[bytes], profile: pathlib.Path) -> None:
    if os.name == "nt" and process.poll() is None:
        subprocess.run(
            ["taskkill", "/PID", str(process.pid), "/T", "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    elif os.name != "nt" and process.poll() is None:
        process.terminate()
    try:
        process.wait(timeout=8)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)
    stop_profile_processes(profile)


def remove_profile(profile: pathlib.Path) -> str | None:
    temp_root = pathlib.Path(tempfile.gettempdir()).resolve()
    resolved = profile.resolve()
    if resolved.parent != temp_root or not resolved.name.startswith("astra-"):
        return f"refused unsafe profile cleanup: {resolved}"
    for attempt in range(32):
        try:
            shutil.rmtree(resolved)
            return None
        except FileNotFoundError:
            return None
        except (PermissionError, OSError) as error:
            if attempt == 31:
                return f"profile cleanup deferred: {type(error).__name__}: {error}"
            time.sleep(0.25)


def cleanup_stale_profiles(max_age_seconds: int = 86400) -> None:
    temp_root = pathlib.Path(tempfile.gettempdir()).resolve()
    cutoff = time.time() - max_age_seconds
    for profile in temp_root.glob("astra-*-*"):
        try:
            resolved = profile.resolve()
            if (
                resolved.parent == temp_root
                and resolved.name.startswith("astra-")
                and resolved.is_dir()
                and resolved.stat().st_mtime < cutoff
            ):
                stop_profile_processes(resolved)
                remove_profile(resolved)
        except OSError:
            continue


def run_browser(target: BrowserTarget, base_url: str, *, verify_offline: bool) -> dict[str, object]:
    HarnessHandler.result_event.clear()
    HarnessHandler.result_payload = None
    profile = pathlib.Path(tempfile.mkdtemp(prefix=f"astra-{target.name}-"))
    url = f"{base_url}?browser={urllib.parse.quote(target.name)}"
    process = subprocess.Popen(
        command(target, profile, url),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    result: dict[str, object]
    try:
        if not HarnessHandler.result_event.wait(60):
            result = {"browser": target.name, "engine": target.engine, "passed": False, "error": "timeout"}
        else:
            payload = HarnessHandler.result_payload or {}
            result = {"engine": target.engine, **payload}
    finally:
        stop_process_tree(process, profile)
    if bool(result.get("passed")):
        time.sleep(0.5)
        offline_check = verify_offline_reopen(target, profile, base_url, required=verify_offline)
        checks = result.get("checks")
        if isinstance(checks, list):
            checks.append(offline_check)
        result["passed"] = bool(offline_check.get("passed"))
    stop_profile_processes(profile)
    cleanup_warning = remove_profile(profile)
    if cleanup_warning:
        result["cleanupWarning"] = cleanup_warning
    return result


def main() -> int:
    stop_all_astra_browser_processes()
    cleanup_stale_profiles(max_age_seconds=60)
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
        primary_offline_target = next(target for target in targets if target.engine == "chromium")
        results = [
            run_browser(
                target,
                f"http://127.0.0.1:{port}/",
                verify_offline=target == primary_offline_target,
            )
            for target in targets
        ]
    finally:
        server.shutdown()
        server.server_close()
        thread.join(timeout=3)
    passed = bool(results) and all(bool(result.get("passed")) for result in results)
    print(json.dumps({"passed": passed, "results": results}, ensure_ascii=False, sort_keys=True))
    return 0 if passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
