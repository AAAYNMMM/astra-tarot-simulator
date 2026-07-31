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
