#!/usr/bin/env python3
"""Execute TQ-001 after tightening the stable card reference pattern."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL = ROOT / "automation" / "tq_001_apply.py"
source = ORIGINAL.read_text(encoding="utf-8")
old = '"stableCardRef": string_schema(max_length=168, pattern=rf"{card_id[1:-1]}#{semantic_id[1:-1]}"),'
new = '"stableCardRef": string_schema(max_length=168, pattern=rf"^{card_id[1:-1]}#{semantic_id[1:-1]}$"),'
if source.count(old) != 1:
    raise RuntimeError("TQ-001 stableCardRef anchor changed")
source = source.replace(old, new, 1)
namespace = {"__name__": "tq_001_compiled", "__file__": str(ORIGINAL)}
exec(compile(source, str(ORIGINAL), "exec"), namespace)
namespace["main"]()
