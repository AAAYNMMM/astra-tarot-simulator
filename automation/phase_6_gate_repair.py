#!/usr/bin/env python3
"""Remove the obsolete cross-phase NEXT assertion from the Phase 5 historical gate."""

from pathlib import Path

root = Path(__file__).resolve().parents[1]
path = root / "tests" / "phase_5_gate_test.mjs"
content = path.read_text(encoding="utf-8")
obsolete = 'assert.match(progress, /唯一下一任务 \\| `CL-001`/);\n'
if obsolete in content:
    content = content.replace(obsolete, "", 1)
elif "唯一下一任务" in content:
    raise RuntimeError("Phase 5 gate contains an unexpected cross-phase NEXT assertion.")
with path.open("w", encoding="utf-8", newline="\n") as handle:
    handle.write(content)
print("Phase 5 historical gate no longer freezes a future NEXT task.")
