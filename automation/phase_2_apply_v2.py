#!/usr/bin/env python3
"""Run the Phase 2 migration with the hyphenated effect key quoted."""
from __future__ import annotations

from pathlib import Path

SCRIPT = Path(__file__).with_name("phase_2_apply.py")
source = SCRIPT.read_text(encoding="utf-8")
old = "},self-trust:{agency:1},skill:{"
new = '},"self-trust":{agency:1},skill:{'
if source.count(old) != 1:
    raise RuntimeError(f"Phase 2 self-trust patch anchor changed: {source.count(old)}")
source = source.replace(old, new, 1)
namespace = {"__name__": "__main__", "__file__": str(SCRIPT)}
exec(compile(source, str(SCRIPT), "exec"), namespace)
