#!/usr/bin/env python3
"""Normalize the no-unconditional-skipWaiting static assertion in legacy gates."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
replacement = r'assert.equal(/addEventListener\("install"[\s\S]{0,600}skipWaiting/.test(sw), false);'
changed = []
for relative in ["tests/module_contract_test.mjs", "tests/phase_m_gate_test.mjs"]:
    path = ROOT / relative
    lines = path.read_text(encoding="utf-8").splitlines()
    next_lines = []
    replaced = False
    for line in lines:
        if "addEventListener" in line and "skipWaiting" in line and "assert.equal" in line:
            next_lines.append(replacement)
            replaced = True
        else:
            next_lines.append(line)
    if not replaced:
        raise RuntimeError(f"skipWaiting static assertion not found in {relative}.")
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write("\n".join(next_lines).rstrip() + "\n")
    changed.append(relative)
print("Phase 9 legacy skipWaiting assertions normalized: " + ", ".join(changed))
