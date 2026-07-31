#!/usr/bin/env python3
"""Reassemble and execute the audited Phase 9 release-content automation."""

from __future__ import annotations

import base64
import hashlib
import runpy
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parts = [
    ROOT / "automation" / f"phase_9_release_payload_{index:02d}.txt"
    for index in range(6)
]
encoded = "".join(path.read_text(encoding="ascii").strip() for path in parts)
compressed = base64.b64decode(encoded, validate=True)
if hashlib.sha256(compressed).hexdigest() != "b16f862950f020e59c65e755b45e14075f7f79032eeee539a1d32f85794ad234":
    raise RuntimeError("Phase 9 release payload fingerprint mismatch.")
script = zlib.decompress(compressed)
if hashlib.sha256(script).hexdigest() != "1cf5a8c7cda7c8c8e1f44fcc1c26baadc4c1a4e736528ded7af47af87d1b4acd":
    raise RuntimeError("Phase 9 release script fingerprint mismatch.")
target = ROOT / "automation" / "_phase_9_release_decoded.py"
target.write_bytes(script)
try:
    runpy.run_path(str(target), run_name="__main__")
finally:
    target.unlink(missing_ok=True)
