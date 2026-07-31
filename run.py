#!/usr/bin/env python3
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
