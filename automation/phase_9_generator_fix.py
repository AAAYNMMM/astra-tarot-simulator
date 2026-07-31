#!/usr/bin/env python3
"""Map the PWA scope root to index.html for transport hashing."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "scripts" / "generate_artifacts.mjs"
content = path.read_text(encoding="utf-8")
old = '    const relativePath = relativeUrl.replace(/^\\.\\//, "");'
new = '    const relativePath = relativeUrl === "./" ? "index.html" : relativeUrl.replace(/^\\.\\//, "");'
if new not in content:
    if old not in content:
        raise RuntimeError("Transport hash path marker not found.")
    content = content.replace(old, new, 1)
with path.open("w", encoding="utf-8", newline="\n") as handle:
    handle.write(content.rstrip() + "\n")
print("Phase 9 transport hashing maps the scope root to index.html.")
