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
