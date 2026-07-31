#!/usr/bin/env python3
"""Repair embedded JSON quoting, then execute the Phase 9 runtime automation."""

from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "automation" / "phase_9_runtime.py"
content = path.read_text(encoding="utf-8")
content = content.replace("FILES = json.loads('", "FILES = json.loads(r'", 1)
content = content.replace("PATCHES = json.loads('", "PATCHES = json.loads(r'", 1)
with path.open("w", encoding="utf-8", newline="\n") as handle:
    handle.write(content)
runpy.run_path(str(path), run_name="__main__")
