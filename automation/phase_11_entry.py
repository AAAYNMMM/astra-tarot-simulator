#!/usr/bin/env python3
"""Reassemble and execute the audited Phase 11 implementation payload."""
from pathlib import Path
import base64, hashlib, json, runpy, zlib
ROOT = Path(__file__).resolve().parents[1]
COUNT = 6
COMPRESSED_SHA256 = "72b24fd59cf7d317015dc05d007e66bbb98eb319e91d582c0c8cc0c68668e2ee"
RAW_SHA256 = "2b5a133a79b53c25a3a2fbe3c431175711ed50cb957585ec190c9d193f9c80d8"
encoded = "".join((ROOT / "automation" / f"phase_11_payload_{index:02d}.txt").read_text(encoding="ascii").strip() for index in range(COUNT))
compressed = base64.b64decode(encoded, validate=True)
if hashlib.sha256(compressed).hexdigest() != COMPRESSED_SHA256:
    raise RuntimeError("Phase 11 compressed payload fingerprint mismatch.")
raw = zlib.decompress(compressed)
if hashlib.sha256(raw).hexdigest() != RAW_SHA256:
    raise RuntimeError("Phase 11 raw payload fingerprint mismatch.")
files = json.loads(raw.decode("utf-8"))
for relative, content in files.items():
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content.rstrip() + "\n")
runpy.run_path(str(ROOT / "automation" / "phase_11_engine.py"), run_name="__main__")
runpy.run_path(str(ROOT / "automation" / "phase_11_ui.py"), run_name="__main__")
print("Phase 11 payload applied.")
