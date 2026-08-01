from __future__ import annotations

import pathlib
import functools
import threading
import unittest
import urllib.request

from src.server.http import AppRequestHandler
from src.server.lifecycle import AppServer
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

    def test_manifest_icons_are_served_as_png(self) -> None:
        handler = functools.partial(AppRequestHandler, directory=str(ROOT))
        server = AppServer(("127.0.0.1", 0), handler, session_guard=SessionGuard())
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        port = int(server.server_address[1])
        try:
            for name in (
                "icon-192.png",
                "icon-512.png",
                "icon-maskable-192.png",
                "icon-maskable-512.png",
            ):
                with self.subTest(name=name), urllib.request.urlopen(
                    f"http://127.0.0.1:{port}/{name}", timeout=3
                ) as response:
                    self.assertEqual(response.status, 200)
                    self.assertEqual(response.headers.get_content_type(), "image/png")
                    self.assertEqual(response.read(8), b"\x89PNG\r\n\x1a\n")
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=3)
