#!/usr/bin/env python3
"""Run the final MOD-006A migration and remove the replaced legacy files."""

from __future__ import annotations

import runpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
runpy.run_path(str(ROOT / "automation" / "mod_006a_apply_v5.py"), run_name="__main__")
for relative_path in ("app.js", "data.js", "src/app/legacy-runtime.js"):
    target = ROOT / relative_path
    if not target.is_file():
        raise RuntimeError(f"expected legacy file before removal: {relative_path}")
    target.unlink()
print("mod_006a_finalized removed=app.js,data.js,src/app/legacy-runtime.js")
