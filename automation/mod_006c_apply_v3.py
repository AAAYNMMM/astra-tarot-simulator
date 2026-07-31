#!/usr/bin/env python3
"""Apply MOD-006C with the intentional image-fallback CSS baseline recorded."""

from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREVIOUS = ROOT / "automation" / "mod_006c_apply_v2.py"

spec = importlib.util.spec_from_file_location("mod_006c_v2", PREVIOUS)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot load MOD-006C v2 migration")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

path = ROOT / "tests" / "module_contract_test.mjs"
source = path.read_text(encoding="utf-8")
old = "087ab37e367357fbb1ea4532f0f0d9a81973e2dadd163a6d7c104cfbc6c466db"
new = "ccc3f69d84fc95a20ddd6a119f87cf48343d5dff508088a1b45f57ff7c8f62d3"
if source.count(old) != 1:
    raise RuntimeError("CSS baseline anchor changed")
path.write_text(source.replace(old, new, 1), encoding="utf-8", newline="\n")
