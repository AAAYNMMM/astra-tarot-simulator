#!/usr/bin/env python3
"""Apply MOD-006B with compact canonical generated JavaScript payloads."""

from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL = ROOT / "automation" / "mod_006b_apply.py"

spec = importlib.util.spec_from_file_location("mod_006b_original", ORIGINAL)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot load MOD-006B migration")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

old = '  return JSON.stringify(value, null, 2);'
new = '  return JSON.stringify(value);'
if module.GENERATOR.count(old) != 1:
    raise RuntimeError("generated JavaScript serializer anchor changed")
module.GENERATOR = module.GENERATOR.replace(old, new, 1)
module.main()
