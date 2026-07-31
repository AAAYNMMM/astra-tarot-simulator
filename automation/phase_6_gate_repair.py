#!/usr/bin/env python3
"""Repair the historical Phase 5 gate and bind Phase 6 progress to this retry."""

from pathlib import Path

root = Path(__file__).resolve().parents[1]
gate_path = root / "tests" / "phase_5_gate_test.mjs"
gate = gate_path.read_text(encoding="utf-8")
obsolete = 'assert.match(progress, /唯一下一任务 \\| `CL-001`/);\n'
if obsolete in gate:
    gate = gate.replace(obsolete, "", 1)
elif "唯一下一任务" in gate:
    raise RuntimeError("Phase 5 gate contains an unexpected cross-phase NEXT assertion.")
with gate_path.open("w", encoding="utf-8", newline="\n") as handle:
    handle.write(gate)

progress_path = root / "docs" / "PROGRESS.md"
progress = progress_path.read_text(encoding="utf-8")
old_task = "01KYWE82GS4FC0MG416SWKAARN"
new_task = "01KYWF9QW0K0WMHN723BNRKTKK"
if old_task in progress:
    progress = progress.replace(old_task, new_task, 1)
elif new_task not in progress:
    raise RuntimeError("Phase 6 implementation task metadata was not found.")
with progress_path.open("w", encoding="utf-8", newline="\n") as handle:
    handle.write(progress)

print("Historical gate repaired and Phase 6 retry metadata bound.")
