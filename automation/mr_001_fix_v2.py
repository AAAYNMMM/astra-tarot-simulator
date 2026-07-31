#!/usr/bin/env python3
"""Apply the MR-001 phase transition fix without empty-string idempotency traps."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TASK_ID = "01KYG9PH5M03"

gate_path = ROOT / "tests/phase_4_gate_test.mjs"
gate = gate_path.read_text(encoding="utf-8")
obsolete = 'assert.match(progress, /唯一下一任务 \\| `MR-001`/);\n'
if obsolete in gate:
    gate_path.write_text(gate.replace(obsolete, "", 1), encoding="utf-8", newline="\n")
elif "唯一下一任务" in gate and "MR-001" in gate:
    raise RuntimeError("Phase 4 NEXT assertion changed shape; refusing an ambiguous edit.")

progress_path = ROOT / "docs/PROGRESS.md"
progress = progress_path.read_text(encoding="utf-8")
for old_task_id in ("01KYG9PH5M01", "01KYG9PH5M02"):
    progress = progress.replace(f"`{old_task_id}`", f"`{TASK_ID}`")
progress_path.write_text(progress, encoding="utf-8", newline="\n")

print(json.dumps({
    "task": "MR-001",
    "fix": "remove obsolete Phase 4 NEXT assertion explicitly",
    "cwapiTaskId": TASK_ID,
}, ensure_ascii=False))
