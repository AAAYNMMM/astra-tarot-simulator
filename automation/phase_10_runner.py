#!/usr/bin/env python3
"""Extract, repair, and execute the Phase 10 refactor payload without escape-layer ambiguity."""

from __future__ import annotations

import json
import re
import runpy
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
source_path = ROOT / "automation" / "phase_10_refactor.py"
target_path = ROOT / "automation" / ".phase_10_refactor_runtime.py"
payload_path = ROOT / "automation" / ".phase_10_files.json"
source = source_path.read_text(encoding="utf-8")
marker = "FILES = json.loads('"
suffix = "')\n\n\ndef write_lf"
if marker not in source or suffix not in source:
    raise RuntimeError("Phase 10 embedded FILES boundaries were not found.")
head, remainder = source.split(marker, 1)
payload_text, tail = remainder.split(suffix, 1)
# JSON accepts only a small fixed set of backslash escapes. JavaScript regular
# expressions inside file contents may contain \s, \d, \b, etc.; preserve those
# as literal backslashes in the JSON transport rather than interpreting them.
repaired_payload = re.sub(r'\\(?!["\\/bfnrtu])', r'\\\\', payload_text)
files = json.loads(repaired_payload)
with payload_path.open("w", encoding="utf-8", newline="\n") as handle:
    json.dump(files, handle, ensure_ascii=False)
    handle.write("\n")
replacement = (
    'FILES = json.loads((ROOT / "automation" / ".phase_10_files.json")'
    '.read_text(encoding="utf-8"))\n\n\ndef write_lf'
)
fixed_source = head + replacement + tail
with target_path.open("w", encoding="utf-8", newline="\n") as handle:
    handle.write(fixed_source)
try:
    runpy.run_path(str(target_path), run_name="__main__")
finally:
    target_path.unlink(missing_ok=True)
    payload_path.unlink(missing_ok=True)
