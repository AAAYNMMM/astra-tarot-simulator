#!/usr/bin/env python3
"""Apply MOD-004B server boundaries, lifecycle session protection, and strict CSP."""

from __future__ import annotations

import json
import re
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.replace("\r\n", "\n"), encoding="utf-8", newline="\n")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def replace_method(source: str, name: str, replacement: str) -> str:
    pattern = re.compile(
        rf"(?ms)^    def {re.escape(name)}\(self\).*?(?=^    def |^if __name__ ==)",
    )
    matches = pattern.findall(source)
    if len(matches) != 1:
        raise RuntimeError(f"test method {name}: expected one match, found {len(matches)}")
    return pattern.sub(textwrap.dedent(replacement).strip("\n") + "\n\n", source, count=1)


def accent_values() -> list[str]:
    values = {
        value.lower()
        for value in re.findall(r'accent:\s*"(#[0-9a-fA-F]{6})"', read("data.js"))
    }
    values.add("#d8bb7a")
    return sorted(values)


def accent_module(values: list[str]) -> str:
    pairs = ",\n".join(f'  "{value}": "accent-{index}"' for index, value in enumerate(values))
    return f'''const TOKENS = Object.freeze({{\n{pairs}\n}});\n\nexport const DEFAULT_ACCENT_TOKEN = TOKENS["#d8bb7a"] || "accent-0";\n\nexport function accentToken(value) {{\n  const normalized = String(value ?? "").toLowerCase();\n  return TOKENS[normalized] || DEFAULT_ACCENT_TOKEN;\n}}\n\nexport const ACCENT_VALUES = Object.freeze({{ ...TOKENS }});\n'''


def accent_css(values: list[str]) -> str:
    blocks = []
    for index, value in enumerate(values):
        blocks.append(
            f'''[data-accent-token="accent-{index}"] {{\n  --astra-accent: {value};\n  --category-accent: {value};\n  --active-accent: {value};\n  --history-accent: {value};\n  --card-accent: {value};\n  --mini-accent: {value};\n  --keyword-accent: {value};\n  --guidance-accent: {value};\n  --summary-accent: {value};\n}}'''
        )
    blocks.append(
        '''.reading-meta [data-accent-token] { color: var(--astra-accent); }
.shuffle-card-0 { --i: 0; }
.shuffle-card-1 { --i: 1; }
.shuffle-card-2 { --i: 2; }
.shuffle-card-3 { --i: 3; }
.shuffle-card-4 { --i: 4; }
.shuffle-card-5 { --i: 5; }
.shuffle-card-6 { --i: 6; }
.shuffle-progress > i {
  width: 100%;
  transform: scaleX(0);
  transform-origin: left center;
}'''
    )
    return "\n\n".join(blocks) + "\n"


SECURITY_PY = r'''
from __future__ import annotations

import ipaddress
import pathlib
import posixpath
import urllib.parse

CSP_POLICY = (
    "default-src 'self'; "
    "script-src 'self'; "
    "style-src 'self'; "
    "style-src-attr 'none'; "
    "img-src 'self' data:; "
    "connect-src 'self'; "
    "worker-src 'self'; "
    "manifest-src 'self'; "
    "font-src 'self'; "
    "object-src 'none'; "
    "base-uri 'none'; "
    "frame-ancestors 'none'; "
    "form-action 'none'"
)

ROOT_FILES = frozenset({"index.html", "sw.js", "icon.svg", "manifest.webmanifest"})
ALLOWED_PREFIXES = ("assets/", "src/")
ALLOWED_SUFFIXES = frozenset({
    ".html", ".js", ".mjs", ".css", ".json", ".webmanifest",
    ".svg", ".jpg", ".jpeg", ".png", ".webp",
})


def host_name(host_header: str | None) -> str | None:
    if not host_header:
        return None
    try:
        return urllib.parse.urlsplit(f"//{host_header}").hostname
    except ValueError:
        return None


def is_loopback_host(host_header: str | None) -> bool:
    host = host_name(host_header)
    if not host:
        return False
    if host.lower() == "localhost":
        return True
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


def expected_origin(host_header: str) -> str:
    return f"http://{host_header}"


def resolve_static_path(root: pathlib.Path, raw_path: str) -> pathlib.Path | None:
    try:
        decoded = urllib.parse.unquote(raw_path, errors="strict")
    except (UnicodeDecodeError, ValueError):
        return None
    if "\x00" in decoded or "\\" in decoded or ":" in decoded:
        return None
    path = decoded.split("?", 1)[0].split("#", 1)[0]
    normalized = posixpath.normpath("/" + path.lstrip("/"))
    if normalized in {"/", "/."}:
        relative = "index.html"
    else:
        relative = normalized.lstrip("/")
    parts = pathlib.PurePosixPath(relative).parts
    if not parts or any(part in {"", ".", ".."} or part.startswith(".") for part in parts):
        return None
    allowed = relative in ROOT_FILES or relative.startswith(ALLOWED_PREFIXES)
    if not allowed or pathlib.PurePosixPath(relative).suffix.lower() not in ALLOWED_SUFFIXES:
        return None
    candidate = (root / pathlib.PurePosixPath(relative)).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError:
        return None
    return candidate if candidate.is_file() else None
'''

SESSION_PY = r'''
from __future__ import annotations

import hmac
import http.cookies
import secrets

COOKIE_NAME = "astra_session"
COOKIE_PATH = "/__astra/"


class SessionGuard:
    def __init__(self, token: str | None = None) -> None:
        self.token = token or secrets.token_urlsafe(32)
        if len(self.token.encode("utf-8")) < 32:
            raise ValueError("session token must contain at least 256 bits of material")

    def cookie_header(self) -> str:
        return (
            f"{COOKIE_NAME}={self.token}; Path={COOKIE_PATH}; "
            "HttpOnly; SameSite=Strict; Max-Age=86400"
        )

    def accepts(self, cookie_header: str | None) -> bool:
        if not cookie_header:
            return False
        jar = http.cookies.SimpleCookie()
        try:
            jar.load(cookie_header)
        except http.cookies.CookieError:
            return False
        morsel = jar.get(COOKIE_NAME)
        return bool(morsel and hmac.compare_digest(morsel.value, self.token))
'''

LIFECYCLE_PY = r'''
from __future__ import annotations

import http.server
import threading
import time

DEFAULT_AUTO_CLOSE_GRACE_SECONDS = 3.0
CLIENT_STALE_SECONDS = 90.0


class AppServer(http.server.ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = False

    def __init__(self, *args: object, session_guard: object, **kwargs: object) -> None:
        super().__init__(*args, **kwargs)
        self.session_guard = session_guard
        self.auto_close_grace_seconds = DEFAULT_AUTO_CLOSE_GRACE_SECONDS
        self._lifecycle_lock = threading.Lock()
        self._active_clients: dict[str, float] = {}
        self._ever_connected = False
        self._empty_since: float | None = None
        self._monitor_stop = threading.Event()
        self._shutdown_started = False

    def register_client(self, client_id: str) -> None:
        with self._lifecycle_lock:
            self._active_clients[client_id] = time.monotonic()
            self._ever_connected = True
            self._empty_since = None

    def unregister_client(self, client_id: str) -> None:
        with self._lifecycle_lock:
            self._active_clients.pop(client_id, None)
            if self._ever_connected and not self._active_clients:
                self._empty_since = time.monotonic()

    def start_lifecycle_monitor(self) -> threading.Thread:
        thread = threading.Thread(target=self._monitor_lifecycle, name="astra-lifecycle", daemon=True)
        thread.start()
        return thread

    def _monitor_lifecycle(self) -> None:
        while not self._monitor_stop.wait(0.25):
            should_stop = False
            with self._lifecycle_lock:
                now = time.monotonic()
                stale = [client for client, seen in self._active_clients.items() if now - seen >= CLIENT_STALE_SECONDS]
                for client in stale:
                    self._active_clients.pop(client, None)
                if self._ever_connected and not self._active_clients and self._empty_since is None:
                    self._empty_since = now
                should_stop = (
                    self._ever_connected
                    and not self._active_clients
                    and self._empty_since is not None
                    and now - self._empty_since >= self.auto_close_grace_seconds
                    and not self._shutdown_started
                )
                if should_stop:
                    self._shutdown_started = True
            if should_stop:
                print("\n页面已关闭，正在停止星纱塔罗……")
                self.shutdown()
                return

    def stop_lifecycle_monitor(self) -> None:
        self._monitor_stop.set()

    def wait_for_lifecycle_stop(self, timeout: float) -> bool:
        return self._monitor_stop.wait(timeout)
'''

HTTP_PY = r'''
from __future__ import annotations

import http
import http.server
import pathlib
import urllib.parse

from .security import CSP_POLICY, expected_origin, is_loopback_host, resolve_static_path


class AppRequestHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".webmanifest": "application/manifest+json",
        ".svg": "image/svg+xml",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
    }

    def __init__(self, *args: object, directory: str | None = None, **kwargs: object) -> None:
        self._issue_session_cookie = False
        super().__init__(*args, directory=directory, **kwargs)

    @property
    def app_root(self) -> pathlib.Path:
        return pathlib.Path(self.directory or ".").resolve()

    def end_headers(self) -> None:
        self.send_header("Content-Security-Policy", CSP_POLICY)
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()")
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Cache-Control", "no-cache")
        if self._issue_session_cookie:
            self.send_header("Set-Cookie", self.server.session_guard.cookie_header())
        super().end_headers()

    def translate_path(self, path: str) -> str:
        resolved = resolve_static_path(self.app_root, urllib.parse.urlsplit(path).path)
        return str(resolved or (self.app_root / ".astra-denied"))

    def do_GET(self) -> None:
        parsed = urllib.parse.urlsplit(self.path)
        if parsed.path == "/__astra/events":
            self._serve_lifecycle_stream(parsed)
            return
        if not is_loopback_host(self.headers.get("Host")):
            self.send_error(http.HTTPStatus.FORBIDDEN, "Local host required")
            return
        resolved = resolve_static_path(self.app_root, parsed.path)
        if resolved is None:
            self.send_error(http.HTTPStatus.NOT_FOUND)
            return
        self._issue_session_cookie = resolved.name == "index.html"
        super().do_GET()

    def _client_id(self, parsed: urllib.parse.SplitResult) -> str | None:
        value = urllib.parse.parse_qs(parsed.query).get("client", [""])[0]
        if not value or len(value) > 128 or not all(char.isalnum() or char in "-_" for char in value):
            return None
        return value

    def _authorized(self, *, require_origin: bool) -> bool:
        host = self.headers.get("Host")
        if not is_loopback_host(host):
            return False
        if not self.server.session_guard.accepts(self.headers.get("Cookie")):
            return False
        fetch_site = self.headers.get("Sec-Fetch-Site")
        if fetch_site not in {None, "same-origin", "none"}:
            return False
        if require_origin and self.headers.get("Origin") != expected_origin(host):
            return False
        return True

    def _serve_lifecycle_stream(self, parsed: urllib.parse.SplitResult) -> None:
        client_id = self._client_id(parsed)
        if not client_id:
            self.send_error(http.HTTPStatus.BAD_REQUEST, "Missing lifecycle client")
            return
        if not self._authorized(require_origin=False):
            self.send_error(http.HTTPStatus.FORBIDDEN)
            return
        self.server.register_client(client_id)
        self.send_response(http.HTTPStatus.OK)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Connection", "keep-alive")
        self.end_headers()
        try:
            self.wfile.write(b"event: ready\ndata: connected\n\n")
            self.wfile.flush()
            while not self.server.wait_for_lifecycle_stop(1.0):
                self.wfile.write(b": keep-alive\n\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass
        finally:
            self.close_connection = True
            self.server.unregister_client(client_id)

    def do_POST(self) -> None:
        parsed = urllib.parse.urlsplit(self.path)
        if parsed.path not in {"/__astra/open", "/__astra/close"}:
            self.send_error(http.HTTPStatus.NOT_FOUND)
            return
        client_id = self._client_id(parsed)
        if not client_id:
            self.send_error(http.HTTPStatus.BAD_REQUEST, "Missing lifecycle client")
            return
        if not self._authorized(require_origin=True):
            self.send_error(http.HTTPStatus.FORBIDDEN)
            return
        if parsed.path.endswith("/open"):
            self.server.register_client(client_id)
        else:
            self.server.unregister_client(client_id)
        self.send_response(http.HTTPStatus.NO_CONTENT)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def log_message(self, format_string: str, *args: object) -> None:
        try:
            status = int(args[1])
        except (IndexError, TypeError, ValueError):
            status = 500
        if status >= 400:
            super().log_message(format_string, *args)
'''

APP_PY = r'''
from __future__ import annotations

import argparse
import functools
import ipaddress
import pathlib
import threading
import urllib.error
import urllib.request
import webbrowser

from .http import AppRequestHandler
from .lifecycle import AppServer
from .session import SessionGuard

APP_DIR = pathlib.Path(__file__).resolve().parents[2]
DEFAULT_PORT = 57321


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="启动星纱塔罗本地 GUI。按 Ctrl+C 可关闭服务。")
    parser.add_argument("--host", default="127.0.0.1", help="监听地址，默认仅本机")
    parser.add_argument("--port", default=DEFAULT_PORT, type=int, help=f"监听端口；默认 {DEFAULT_PORT}，0 表示自动选择空闲端口")
    parser.add_argument("--no-browser", action="store_true", help="仅启动服务，不自动打开浏览器")
    return parser.parse_args()


def _is_loopback_bind(host: str) -> bool:
    if host.lower() == "localhost":
        return True
    try:
        return ipaddress.ip_address(host).is_loopback
    except ValueError:
        return False


def build_server(host: str, port: int) -> AppServer:
    handler = functools.partial(AppRequestHandler, directory=str(APP_DIR))
    return AppServer((host, port), handler, session_guard=SessionGuard())


def main() -> int:
    args = parse_args()
    if not _is_loopback_bind(args.host):
        print("警告：当前监听地址不是本机回环地址；生命周期接口仍只接受回环Host。")
    try:
        server = build_server(args.host, args.port)
    except OSError as error:
        if args.port == 0:
            raise
        existing_url = f"http://127.0.0.1:{args.port}/"
        try:
            with urllib.request.urlopen(existing_url, timeout=0.7) as response:
                existing_page = response.read(2048).decode("utf-8", errors="ignore")
            if "星纱塔罗" in existing_page:
                print(f"星纱塔罗已经在运行：{existing_url}")
                if not args.no_browser:
                    webbrowser.open(existing_url)
                return 0
        except (OSError, urllib.error.URLError):
            pass
        print(f"固定端口 {args.port} 暂不可用（{error}），将临时选择空闲端口。")
        server = build_server(args.host, 0)
    actual_host, actual_port = server.server_address[:2]
    display_host = "127.0.0.1" if actual_host in {"0.0.0.0", "::"} else actual_host
    url = f"http://{display_host}:{actual_port}/"
    print("星纱塔罗已启动")
    print(f"访问地址：{url}")
    print("关闭最后一个应用页面后，本地服务与启动窗口会自动退出。")
    lifecycle_thread = server.start_lifecycle_monitor()
    if not args.no_browser:
        threading.Timer(0.45, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever(poll_interval=0.3)
    except KeyboardInterrupt:
        print("\n正在关闭星纱塔罗……")
    finally:
        server.stop_lifecycle_monitor()
        server.server_close()
        lifecycle_thread.join(timeout=1)
    return 0
'''

RUN_PY = r'''#!/usr/bin/env python3
"""Launch the Astra Tarot simulator in the default browser."""

from src.server.app import APP_DIR, DEFAULT_PORT, build_server, main, parse_args
from src.server.http import AppRequestHandler
from src.server.lifecycle import AppServer
from src.server.session import SessionGuard

__all__ = [
    "APP_DIR", "DEFAULT_PORT", "AppRequestHandler", "AppServer",
    "SessionGuard", "build_server", "parse_args", "main",
]

if __name__ == "__main__":
    raise SystemExit(main())
'''

ANIMATION_JS = r'''
import { createElement, replaceChildren } from "../safe-dom.js";

export function createReadingAnimation({ windowRef, documentRef, reducedMotion, state, dom, cardBackPath }) {
  function delay(milliseconds) {
    const duration = reducedMotion.matches ? Math.min(milliseconds, 35) : milliseconds;
    return new Promise((resolve) => windowRef.setTimeout(resolve, duration));
  }

  async function runShuffleAnimation() {
    dom.shuffleScene.hidden = false;
    const backPath = cardBackPath(state.reading?.deckStyle);
    const cards = Array.from({ length: 7 }, (_, index) => {
      const span = createElement(documentRef, "span", { className: `shuffle-card shuffle-card-${index}` });
      span.append(createElement(documentRef, "img", { attributes: { src: backPath, alt: "" } }));
      return span;
    });
    replaceChildren(dom.shuffleDeck, cards);
    const phases = [
      { at: 0, text: "正在净化牌面能量" },
      { at: 34, text: "正在回应你的问题" },
      { at: 68, text: "正在寻找回应问题的牌" },
      { at: 92, text: "牌阵即将显现" },
    ];
    const totalDuration = reducedMotion.matches ? 90 : 2350;
    const progressAnimation = dom.shuffleProgress.animate?.(
      [{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }],
      { duration: totalDuration, easing: "linear", fill: "forwards" },
    );
    const startedAt = windowRef.performance.now();
    let lastPhase = -1;
    await new Promise((resolve) => {
      const tick = (now) => {
        const percentage = Math.min(100, ((now - startedAt) / totalDuration) * 100);
        let phaseIndex = 0;
        for (let index = phases.length - 1; index >= 0; index -= 1) {
          if (percentage >= phases[index].at) { phaseIndex = index; break; }
        }
        if (phaseIndex !== lastPhase) {
          lastPhase = phaseIndex;
          dom.shufflePhase.textContent = phases[phaseIndex].text;
        }
        if (percentage < 100) windowRef.requestAnimationFrame(tick); else resolve();
      };
      windowRef.requestAnimationFrame(tick);
    });
    await delay(180);
    progressAnimation?.cancel();
    dom.shuffleScene.hidden = true;
  }

  return Object.freeze({ delay, runShuffleAnimation });
}
'''

SERVER_TEST = r'''
from __future__ import annotations

import pathlib
import unittest

from src.server.security import CSP_POLICY, is_loopback_host, resolve_static_path
from src.server.session import COOKIE_NAME, SessionGuard

ROOT = pathlib.Path(__file__).resolve().parents[1]


class ServerSecurityTests(unittest.TestCase):
    def test_static_whitelist_and_traversal_defense(self) -> None:
        self.assertEqual(resolve_static_path(ROOT, "/").name, "index.html")
        self.assertTrue(resolve_static_path(ROOT, "/src/app/bootstrap.js").is_file())
        self.assertTrue(resolve_static_path(ROOT, "/assets/rws/major-0.jpg").is_file())
        for path in (
            "/docs/PROGRESS.md", "/tests/test_app_contract.py", "/run.py",
            "/package.json", "/../run.py", "/%2e%2e/run.py", "/src/../run.py",
            "/src%5c..%5crun.py", "/.git/config", "/C:/Windows/win.ini",
        ):
            with self.subTest(path=path):
                self.assertIsNone(resolve_static_path(ROOT, path))

    def test_session_cookie_is_restricted_and_constant_time_checked(self) -> None:
        guard = SessionGuard("x" * 43)
        header = guard.cookie_header()
        self.assertIn(f"{COOKIE_NAME}=", header)
        self.assertIn("HttpOnly", header)
        self.assertIn("SameSite=Strict", header)
        self.assertIn("Path=/__astra/", header)
        self.assertTrue(guard.accepts(f"other=1; {COOKIE_NAME}={'x' * 43}"))
        self.assertFalse(guard.accepts(f"{COOKIE_NAME}=wrong"))

    def test_csp_and_loopback_contract(self) -> None:
        self.assertNotIn("unsafe-inline", CSP_POLICY)
        self.assertIn("style-src-attr 'none'", CSP_POLICY)
        self.assertIn("object-src 'none'", CSP_POLICY)
        self.assertTrue(is_loopback_host("127.0.0.1:57321"))
        self.assertTrue(is_loopback_host("localhost:57321"))
        self.assertTrue(is_loopback_host("[::1]:57321"))
        self.assertFalse(is_loopback_host("192.168.1.5:57321"))
'''


def transform_app(source: str) -> str:
    source = replace_once(
        source,
        "config: { DECK_STYLES, LEGACY_DECK_IDS },",
        "config: { DECK_STYLES, LEGACY_DECK_IDS, accentToken },",
        "accent token runtime binding",
    )
    replacements = {
        "dom.metaCategory.style.color = category.accent;": "dom.metaCategory.dataset.accentToken = accentToken(category.accent);",
        'style="--card-accent: ${card.accent}"': 'data-accent-token="${accentToken(card.accent)}"',
        'style="--mini-accent: ${card.accent}"': 'data-accent-token="${accentToken(card.accent)}"',
        'style="--keyword-accent: ${card.accent}"': 'data-accent-token="${accentToken(card.accent)}"',
        'style="--guidance-accent: ${card.accent}"': 'data-accent-token="${accentToken(card.accent)}"',
        'style="--summary-accent: ${category.accent}"': 'data-accent-token="${accentToken(category.accent)}"',
    }
    for old, new in replacements.items():
        source = replace_once(source, old, new, f"app CSP replacement {old}")
    return source


def transform_setup(source: str) -> str:
    source = source.replace(
        'import { createElement, replaceChildren, safeColor, safeIdentifier, setText } from "../safe-dom.js";',
        'import { accentToken } from "../../config/accent-tokens.js";\nimport { createElement, replaceChildren, safeIdentifier, setText } from "../safe-dom.js";',
    )
    source = replace_once(source, '      button.style.setProperty("--category-accent", safeColor(category.accent));', '      button.dataset.accentToken = accentToken(category.accent);', "category accent dataset")
    source = replace_once(source, '    const accent = safeColor(category.accent);\n    dom.questionPickerButton.style.setProperty("--active-accent", accent);\n    dom.questionList.style.setProperty("--active-accent", accent);', '    const accent = accentToken(category.accent);\n    dom.questionPickerButton.dataset.accentToken = accent;\n    dom.questionList.dataset.accentToken = accent;', "question accent dataset")
    return source


def transform_history(source: str) -> str:
    source = source.replace(
        'import { createElement, replaceChildren, safeColor, setText } from "../safe-dom.js";',
        'import { accentToken } from "../../config/accent-tokens.js";\nimport { createElement, replaceChildren, safeColor, setText } from "../safe-dom.js";',
    )
    return replace_once(source, '      article.style.setProperty("--history-accent", view.accent);', '      article.dataset.accentToken = accentToken(view.accent);', "history accent dataset")


def transform_runtime(source: str) -> str:
    source = 'import { accentToken } from "../config/accent-tokens.js";\n' + source
    return replace_once(source, "config: Object.freeze({ DECK_STYLES, LEGACY_DECK_IDS }),", "config: Object.freeze({ DECK_STYLES, LEGACY_DECK_IDS, accentToken }),", "runtime accent export")


def transform_lifecycle_client(source: str) -> str:
    source = source.replace("new EventSourceCtor(endpoint);", "new EventSourceCtor(endpoint, { withCredentials: true });")
    source = source.replace('      keepalive: true,\n', '      keepalive: true,\n      credentials: "same-origin",\n')
    return source


def transform_css_index(source: str) -> str:
    if '@import url("./accent-tokens.css");' in source:
        return source
    return source.rstrip() + '\n@import url("./accent-tokens.css");\n'


def transform_module_contract(source: str, app_lines: int) -> str:
    source = source.replace("astra-tarot-v9", "astra-tarot-v10")
    source = replace_once(source, '["app.js", 921, "MOD-006A"]', f'["app.js", {app_lines}, "MOD-006A"]', "MOD-004B app baseline")
    source = replace_once(source, '  "src/config/decks.js",\n', '  "src/config/decks.js",\n  "src/config/accent-tokens.js",\n', "required accent module")
    source = replace_once(source, '  "src/styles/responsive.css"\n]);', '  "src/styles/responsive.css",\n  "src/styles/accent-tokens.css"\n]);', "accent CSS import")
    source = replace_once(source, 'const reconstructedCss = cssImports.map((relativePath) => read(relativePath)).join("");', 'const reconstructedCss = cssImports.filter((relativePath) => !relativePath.endsWith("accent-tokens.css")).map((relativePath) => read(relativePath)).join("");', "original CSS reconstruction")
    sw_anchor = '  "src/config/decks.js",\n'
    source = replace_once(source, sw_anchor, sw_anchor + '  "src/config/accent-tokens.js",\n', "SW accent module assertion")
    source = replace_once(source, '  "src/styles/index.css",\n  ...cssImports,', '  "src/styles/index.css",\n  ...cssImports,', "preserve SW CSS assertion")
    source = source.replace("MOD-004A module contract passed:", "MOD-004B module contract passed:")
    return source


def transform_python_tests(source: str) -> str:
    source = source.replace("import http.server\n", "import http.cookiejar\nimport http.server\n")
    source = source.replace('    "src/styles/responsive.css",\n)', '    "src/styles/responsive.css",\n    "src/styles/accent-tokens.css",\n)')
    launcher_test = '''
    def test_launcher_stops_after_last_page_closes(self) -> None:
        handler = functools.partial(launcher.AppRequestHandler, directory=str(ROOT))
        server = launcher.AppServer(("127.0.0.1", 0), handler, session_guard=launcher.SessionGuard())
        server.auto_close_grace_seconds = 0.15
        serving_thread = threading.Thread(target=server.serve_forever, daemon=True)
        serving_thread.start()
        monitor_thread = server.start_lifecycle_monitor()
        try:
            port = server.server_address[1]
            origin = f"http://127.0.0.1:{port}"
            jar = http.cookiejar.CookieJar()
            opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
            with opener.open(f"{origin}/index.html", timeout=2) as response:
                self.assertEqual(response.status, 200)
                self.assertNotIn("unsafe-inline", response.headers["Content-Security-Policy"])
                self.assertIn("HttpOnly", response.headers["Set-Cookie"])
            for action in ("open", "close"):
                request = urllib.request.Request(
                    f"{origin}/__astra/{action}?client=test-page",
                    method="POST",
                    headers={"Origin": origin, "Sec-Fetch-Site": "same-origin"},
                )
                with opener.open(request, timeout=2) as response:
                    self.assertEqual(response.status, 204)
            serving_thread.join(timeout=2)
            self.assertFalse(serving_thread.is_alive())
        finally:
            server.stop_lifecycle_monitor()
            if serving_thread.is_alive():
                server.shutdown()
            server.server_close()
            serving_thread.join(timeout=2)
            monitor_thread.join(timeout=1)
'''
    source = replace_method(source, "test_launcher_stops_after_last_page_closes", launcher_test)
    lifecycle_test = '''
    def test_page_lifecycle_stream_is_wired_end_to_end(self) -> None:
        app_source = (ROOT / "app.js").read_text(encoding="utf-8")
        lifecycle_source = (ROOT / "src/platform/lifecycle-client.js").read_text(encoding="utf-8")
        entropy_source = (ROOT / "src/platform/entropy.js").read_text(encoding="utf-8")
        handler_source = (ROOT / "src/server/http.py").read_text(encoding="utf-8")
        session_source = (ROOT / "src/server/session.py").read_text(encoding="utf-8")
        security_source = (ROOT / "src/server/security.py").read_text(encoding="utf-8")
        worker_source = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn("registerLocalLifecycle", app_source)
        self.assertIn("withCredentials: true", lifecycle_source)
        self.assertIn('credentials: "same-origin"', lifecycle_source)
        self.assertNotIn("Math.random", lifecycle_source)
        self.assertNotIn("Math.random", entropy_source)
        self.assertIn("/__astra/events", handler_source)
        self.assertIn("HttpOnly", session_source)
        self.assertIn("SameSite=Strict", session_source)
        self.assertNotIn("unsafe-inline", security_source)
        self.assertIn('startsWith("/__astra/")', worker_source)
'''
    source = replace_method(source, "test_page_lifecycle_stream_is_wired_end_to_end", lifecycle_test)
    marker = "    def test_four_complete_local_tarot_decks_are_bundled(self) -> None:\n"
    security_integration = '''    def test_mod_004b_server_denies_internal_files_and_requires_session(self) -> None:
        handler = functools.partial(launcher.AppRequestHandler, directory=str(ROOT))
        server = launcher.AppServer(("127.0.0.1", 0), handler, session_guard=launcher.SessionGuard())
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            origin = f"http://127.0.0.1:{server.server_address[1]}"
            for path in ("/docs/PROGRESS.md", "/tests/test_app_contract.py", "/%2e%2e/run.py"):
                with self.assertRaises(urllib.error.HTTPError) as error:
                    urllib.request.urlopen(f"{origin}{path}", timeout=2)
                self.assertIn(error.exception.code, {403, 404})
            request = urllib.request.Request(
                f"{origin}/__astra/open?client=unauthorized",
                method="POST",
                headers={"Origin": origin, "Sec-Fetch-Site": "same-origin"},
            )
            with self.assertRaises(urllib.error.HTTPError) as error:
                urllib.request.urlopen(request, timeout=2)
            self.assertEqual(error.exception.code, 403)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)

'''
    return replace_once(source, marker, security_integration + marker, "MOD-004B integration test")


def update_docs() -> None:
    progress = read("docs/PROGRESS.md")
    progress = re.sub(r"\| 当前进行中任务 \|.*?\|", "| 当前进行中任务 | `MOD-004B` 服务器边界、生命周期保护与强制CSP |", progress, count=1)
    progress += "\n- `MOD-004A`：`DONE`，产物提交 `72b55c0e8b83f44b61b966eb39a849bf613b5436`，CWapi `01KYG9PHM4AB2` COMPLETED。\n- `MOD-004B`：`IN_PROGRESS`。\n"
    write("docs/PROGRESS.md", progress)
    module_map = read("docs/MODULE_MAP.md") + "\n\n## MOD-004B安全边界\n\n本地服务仅公开应用壳、`assets/` 与 `src/` 运行资源；生命周期接口使用HttpOnly SameSite会话Cookie、回环Host与Origin校验。CSP不包含 `unsafe-inline`，运行时颜色通过有限accent token和外部CSS表达。\n"
    write("docs/MODULE_MAP.md", module_map)
    src_readme = read("src/README.md") + "\n\n## Python本地服务\n\n`src/server/` 负责静态白名单、会话、生命周期与安全响应头；根 `run.py` 只保留CLI兼容导出和启动入口。\n"
    write("src/README.md", src_readme)


def main() -> None:
    values = accent_values()
    write("src/config/accent-tokens.js", accent_module(values))
    write("src/styles/accent-tokens.css", accent_css(values))
    write("src/__init__.py", '"""Astra Tarot runtime package."""\n')
    write("src/server/__init__.py", '"""Local server boundaries for Astra Tarot."""\n')
    write("src/server/security.py", textwrap.dedent(SECURITY_PY).lstrip())
    write("src/server/session.py", textwrap.dedent(SESSION_PY).lstrip())
    write("src/server/lifecycle.py", textwrap.dedent(LIFECYCLE_PY).lstrip())
    write("src/server/http.py", textwrap.dedent(HTTP_PY).lstrip())
    write("src/server/app.py", textwrap.dedent(APP_PY).lstrip())
    write("run.py", textwrap.dedent(RUN_PY).lstrip())
    write("src/ui/animations/reading.js", textwrap.dedent(ANIMATION_JS).lstrip())
    write("tests/server_security_test.py", textwrap.dedent(SERVER_TEST).lstrip())

    app = transform_app(read("app.js"))
    write("app.js", app)
    write("src/ui/renderers/setup.js", transform_setup(read("src/ui/renderers/setup.js")))
    write("src/ui/renderers/history.js", transform_history(read("src/ui/renderers/history.js")))
    write("src/app/legacy-runtime.js", transform_runtime(read("src/app/legacy-runtime.js")))
    write("src/platform/lifecycle-client.js", transform_lifecycle_client(read("src/platform/lifecycle-client.js")))
    write("src/styles/index.css", transform_css_index(read("src/styles/index.css")))

    sw = re.sub(r'const CACHE_NAME = "astra-tarot-v\d+";', 'const CACHE_NAME = "astra-tarot-v10";', read("sw.js"), count=1)
    sw = replace_once(sw, '  "./src/config/decks.js",\n', '  "./src/config/decks.js",\n  "./src/config/accent-tokens.js",\n', "SW accent module")
    sw = replace_once(sw, '  "./src/styles/responsive.css",\n', '  "./src/styles/responsive.css",\n  "./src/styles/accent-tokens.css",\n', "SW accent CSS")
    write("sw.js", sw)

    baseline = json.loads(read("automation/quality-baseline.json"))
    baseline["task"] = "MOD-004B"
    app_debt = next(item for item in baseline["knownDebt"] if item["path"] == "app.js")
    app_debt["baselineLines"] = len(app.splitlines())
    write("automation/quality-baseline.json", json.dumps(baseline, ensure_ascii=False, indent=2) + "\n")

    write("tests/module_contract_test.mjs", transform_module_contract(read("tests/module_contract_test.mjs"), len(app.splitlines())))
    write("tests/test_app_contract.py", transform_python_tests(read("tests/test_app_contract.py")))
    update_docs()
    print(f"mod_004b_applied app_lines={len(app.splitlines())} accents={len(values)} csp=strict")


if __name__ == "__main__":
    main()
