#!/usr/bin/env python3
"""Fix MR-001 phase transition validation and terminal evidence."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TASK_ID = "01KYG9PH5M02"


def replace_once(relative: str, old: str, new: str) -> None:
    path = ROOT / relative
    content = path.read_text(encoding="utf-8")
    if new in content:
        return
    if old not in content:
        raise RuntimeError(f"Missing patch marker in {relative}: {old!r}")
    path.write_text(content.replace(old, new, 1), encoding="utf-8", newline="\n")


replace_once(
    "tests/phase_4_gate_test.mjs",
    'assert.match(progress, /唯一下一任务 \\| `MR-001`/);\n',
    "",
)
replace_once(
    "docs/PROGRESS.md",
    "`01KYG9PH5M01`",
    f"`{TASK_ID}`",
)

print(json.dumps({
    "task": "MR-001",
    "fix": "decouple Phase 4 terminal gate from future NEXT pointer",
    "cwapiTaskId": TASK_ID,
}, ensure_ascii=False))
