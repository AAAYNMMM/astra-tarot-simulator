#!/usr/bin/env python3
"""Launch the Astra Tarot simulator in the default browser."""

from __future__ import annotations

import argparse
import functools
import http.server
import pathlib
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
import webbrowser


APP_DIR = pathlib.Path(__file__).resolve().parent
DEFAULT_PORT = 57321
AUTO_CLOSE_GRACE_SECONDS = 3.0
CLIENT_STALE_SECONDS = 90.0


class AppRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Serve only the local application directory with modest security headers."""

    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".webmanifest": "application/manifest+json",
        ".svg": "image/svg+xml",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
    }

    def end_headers(self) -> None:
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        self.send_header(
            "Permissions-Policy",
            "camera=(), microphone=(), geolocation=(), payment=()",
        )
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def do_GET(self) -> None:
        parsed = urllib.parse.urlsplit(self.path)
        if parsed.path == "/__astra/events":
            client_id = urllib.parse.parse_qs(parsed.query).get("client", [""])[0][:128]
            if not client_id:
                self.send_error(http.HTTPStatus.BAD_REQUEST, "Missing lifecycle client")
                return
            self._serve_lifecycle_stream(client_id)
            return
        super().do_GET()

    def _serve_lifecycle_stream(self, client_id: str) -> None:
        server = self.server
        server.register_client(client_id)
        self.send_response(http.HTTPStatus.OK)
        self.send_header("Content-Type", "text/event-stream; charset=utf-8")
        self.send_header("Connection", "keep-alive")
        self.end_headers()
        try:
            self.wfile.write(b"event: ready\ndata: connected\n\n")
            self.wfile.flush()
            while not server.wait_for_lifecycle_stop(1.0):
                self.wfile.write(b": keep-alive\n\n")
                self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass
        finally:
            self.close_connection = True
            server.unregister_client(client_id)

    def do_POST(self) -> None:
        parsed = urllib.parse.urlsplit(self.path)
        if parsed.path not in {"/__astra/open", "/__astra/close"}:
            self.send_error(http.HTTPStatus.NOT_FOUND)
            return
        client_id = urllib.parse.parse_qs(parsed.query).get("client", [""])[0][:128]
        if not client_id:
            self.send_error(http.HTTPStatus.BAD_REQUEST, "Missing lifecycle client")
            return

        server = self.server
        if parsed.path.endswith("/open"):
            server.register_client(client_id)
        else:
            server.unregister_client(client_id)
        self.send_response(http.HTTPStatus.NO_CONTENT)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def log_message(self, format_string: str, *args: object) -> None:
        # Keep the launcher quiet during normal asset requests.
        try:
            status = int(args[1])
        except (IndexError, TypeError, ValueError):
            status = 500
        if status >= 400:
            super().log_message(format_string, *args)


class AppServer(http.server.ThreadingHTTPServer):
    daemon_threads = True
    # On Windows, SO_REUSEADDR can let a second process steal the same port.
    # Keeping it disabled makes duplicate launches reliably detect the first app.
    allow_reuse_address = False

    def __init__(self, *args: object, **kwargs: object) -> None:
        super().__init__(*args, **kwargs)
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
        thread = threading.Thread(
            target=self._monitor_lifecycle,
            name="astra-lifecycle",
            daemon=True,
        )
        thread.start()
        return thread

    def _monitor_lifecycle(self) -> None:
        while not self._monitor_stop.wait(0.25):
            with self._lifecycle_lock:
                now = time.monotonic()
                stale_clients = [
                    client_id
                    for client_id, last_seen in self._active_clients.items()
                    if now - last_seen >= CLIENT_STALE_SECONDS
                ]
                for client_id in stale_clients:
                    self._active_clients.pop(client_id, None)
                if self._ever_connected and not self._active_clients and self._empty_since is None:
                    self._empty_since = now
                should_stop = (
                    self._ever_connected
                    and not self._active_clients
                    and self._empty_since is not None
                    and now - self._empty_since >= AUTO_CLOSE_GRACE_SECONDS
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


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="启动星纱塔罗本地 GUI。按 Ctrl+C 可关闭服务。"
    )
    parser.add_argument("--host", default="127.0.0.1", help="监听地址，默认仅本机")
    parser.add_argument(
        "--port",
        default=DEFAULT_PORT,
        type=int,
        help=f"监听端口；默认 {DEFAULT_PORT}，0 表示自动选择空闲端口",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="仅启动服务，不自动打开浏览器",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    handler = functools.partial(AppRequestHandler, directory=str(APP_DIR))
    try:
        server = AppServer((args.host, args.port), handler)
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
        print(
            f"固定端口 {args.port} 暂不可用（{error}），"
            "将临时选择空闲端口；本次浏览器记录会使用独立空间。"
        )
        server = AppServer((args.host, 0), handler)
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


if __name__ == "__main__":
    raise SystemExit(main())
