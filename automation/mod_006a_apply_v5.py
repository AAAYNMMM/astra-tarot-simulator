#!/usr/bin/env python3
"""Apply MOD-006A with the final malformed legacy declaration repaired."""

from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREVIOUS = ROOT / "automation" / "mod_006a_apply_v4.py"

spec = importlib.util.spec_from_file_location("mod_006a_v4", PREVIOUS)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot load MOD-006A v4 migration")
v4 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v4)
previous_build = v4.build_application


def build_application(source: str) -> str:
    application = previous_build(source)
    old = "ction requestNewReading() {"
    new = "async function requestNewReading() {"
    old_count = application.count(old)
    new_count = application.count(new)
    if old_count == 1 and new_count == 0:
        return application.replace(old, new, 1)
    if old_count == 0 and new_count == 1:
        return application
    raise RuntimeError(
        f"requestNewReading repair state invalid: old={old_count} new={new_count}"
    )


v4.module.build_application = build_application
v4.main()
