#!/usr/bin/env python3
"""Repair connector-normalized quote characters and verify Phase 10 JavaScript syntax."""

from __future__ import annotations

import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
verdict_path = ROOT / "src" / "engine" / "decisive" / "verdict.js"
content = verdict_path.read_text(encoding="utf-8")
content = content.replace('replace(/\\s+/g, " ”).trim()', 'replace(/\\s+/g, " ").trim()')
content = content.replace('replace(/\\s+/g, " ”)', 'replace(/\\s+/g, " ")')
with verdict_path.open("w", encoding="utf-8", newline="\n") as handle:
    handle.write(content.rstrip() + "\n")

node_files = [
    "src/engine/decisive/verdict.js",
    "src/engine/decisive/reading.js",
    "src/workers/reading-engine.worker.js",
    "src/app/engine-worker-client.js",
    "src/app/controllers/engine-synthesis.js",
    "src/app/controllers/phase-8-runtime.js",
    "src/ui/renderers/insight.js",
    "src/app/platform-runtime.js",
    "src/ui/dom.js",
    "tests/phase_10_decisive_worker_test.mjs",
    "tests/phase_10_gate_test.mjs",
]
for relative in node_files:
    completed = subprocess.run(
        ["node", "--check", relative],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if completed.returncode:
        raise RuntimeError(f"JavaScript syntax failed for {relative}: {completed.stderr}")

print("Phase 10 connector quote repair and JavaScript syntax checks passed.")
