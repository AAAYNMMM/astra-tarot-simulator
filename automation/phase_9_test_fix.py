#!/usr/bin/env python3
"""Normalize over-escaped PWA assertions in legacy gates."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
skip_waiting_assertion = r'assert.equal(/addEventListener\("install"[\s\S]{0,600}skipWaiting/.test(sw), false);'
cache_keys_assertion = r'assert.match(sw, /caches\.keys/);'
changed = []
for relative in ["tests/module_contract_test.mjs", "tests/phase_m_gate_test.mjs"]:
    path = ROOT / relative
    lines = path.read_text(encoding="utf-8").splitlines()
    next_lines = []
    skip_replaced = False
    cache_replaced = False
    for line in lines:
        if "addEventListener" in line and "skipWaiting" in line and "assert.equal" in line:
            next_lines.append(skip_waiting_assertion)
            skip_replaced = True
        elif "assert.match" in line and "caches" in line and "keys" in line:
            next_lines.append(cache_keys_assertion)
            cache_replaced = True
        else:
            next_lines.append(line)
    if not skip_replaced:
        raise RuntimeError(f"skipWaiting static assertion not found in {relative}.")
    if relative.endswith("module_contract_test.mjs") and not cache_replaced:
        raise RuntimeError("caches.keys static assertion not found in module contract.")
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write("\n".join(next_lines).rstrip() + "\n")
    changed.append(relative)
print("Phase 9 legacy PWA assertions normalized: " + ", ".join(changed))
