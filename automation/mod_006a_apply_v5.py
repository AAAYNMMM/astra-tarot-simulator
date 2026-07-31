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
    old = "\n    ction requestNewReading() {"
    new = "\n    async function requestNewReading() {"
    if application.count(old) != 1:
        raise RuntimeError(f"requestNewReading repair anchor count: {application.count(old)}")
    return application.replace(old, new, 1)


v4.module.build_application = build_application
v4.main()
