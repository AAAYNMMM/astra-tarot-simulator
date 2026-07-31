#!/usr/bin/env python3
"""Reassemble the audited Phase 8 payload from bounded connector-safe parts."""

from pathlib import Path
import runpy

ROOT = Path(__file__).resolve().parents[1]
head = [ROOT / "automation" / f"phase_8_payload_{index:02d}.txt" for index in range(6)]
tail = [ROOT / "automation" / f"phase_8_tail_{index:02d}.txt" for index in range(4)]
encoded = "".join(path.read_text(encoding="ascii").strip() for path in [*head, *tail])
with (ROOT / "automation" / "phase_8_payload.txt").open("w", encoding="ascii", newline="\n") as handle:
    handle.write(encoded + "\n")
runpy.run_path(str(ROOT / "automation" / "phase_8_complete.py"), run_name="__main__")
