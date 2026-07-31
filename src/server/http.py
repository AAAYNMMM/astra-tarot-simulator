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
