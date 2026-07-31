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
