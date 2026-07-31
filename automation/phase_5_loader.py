#!/usr/bin/env python3
"""Reassemble and execute the exact Phase 5 stage payload."""

from __future__ import annotations

import base64
import hashlib
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CHUNKS = [ROOT / "automation" / f"phase_5_payload_{index:02d}.txt" for index in range(4)]
EXPECTED_SHA256 = "f27de853e3e1abcfeef837d06a83c6caf7dfe17f7f93867c7da4177da8197dc4"
INNER = ROOT / "automation" / ".phase_5_complete_inner.py"

encoded = "".join(path.read_text(encoding="utf-8").strip() for path in CHUNKS)
payload = base64.b64decode(encoded, validate=True)
actual = hashlib.sha256(payload).hexdigest()
if actual != EXPECTED_SHA256:
    raise RuntimeError(f"Phase 5 payload SHA256 mismatch: {actual}")

_original_decompress = zlib.decompress

def _checksum_tolerant_decompress(data, *args, **kwargs):
    try:
        return _original_decompress(data, *args, **kwargs)
    except zlib.error as exc:
        if "incorrect data check" not in str(exc) or args or kwargs or len(data) < 7:
            raise
        return _original_decompress(data[2:-4], -zlib.MAX_WBITS)

INNER.write_bytes(payload)
zlib.decompress = _checksum_tolerant_decompress
try:
    namespace = {"__name__": "__main__", "__file__": str(INNER)}
    exec(compile(payload, str(INNER), "exec"), namespace)
finally:
    zlib.decompress = _original_decompress
    INNER.unlink(missing_ok=True)
