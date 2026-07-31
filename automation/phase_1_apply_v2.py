#!/usr/bin/env python3
"""Run the Phase 1 migration with literal regular-expression replacements."""

from __future__ import annotations

from pathlib import Path

SCRIPT = Path(__file__).with_name("phase_1_apply.py")
source = SCRIPT.read_text(encoding="utf-8")
replacements = {
    "        new_registry,\n        generator,": "        lambda _match: new_registry,\n        generator,",
    "        module_replacement,\n        generator,": "        lambda _match: module_replacement,\n        generator,",
}
for old, new in replacements.items():
    if source.count(old) != 1:
        raise RuntimeError(f"Phase 1 migration patch anchor changed: {old!r}")
    source = source.replace(old, new, 1)

namespace = {
    "__name__": "__main__",
    "__file__": str(SCRIPT),
}
exec(compile(source, str(SCRIPT), "exec"), namespace)
