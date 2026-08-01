#!/usr/bin/env python3
"""Execute the Phase 10 refactor with its embedded JSON treated as a raw literal."""

from __future__ import annotations

import runpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source_path = ROOT / "automation" / "phase_10_refactor.py"
target_path = ROOT / "automation" / ".phase_10_refactor_runtime.py"
source = source_path.read_text(encoding="utf-8")
marker = "FILES = json.loads('"
if marker not in source:
    raise RuntimeError("Phase 10 embedded FILES marker not found.")
fixed = source.replace(marker, "FILES = json.loads(r'", 1)
with target_path.open("w", encoding="utf-8", newline="\n") as handle:
    handle.write(fixed)
try:
    runpy.run_path(str(target_path), run_name="__main__")
finally:
    target_path.unlink(missing_ok=True)
