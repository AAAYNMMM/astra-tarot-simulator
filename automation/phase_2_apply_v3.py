#!/usr/bin/env python3
"""Run Phase 2 with card-identity text and stage-independent Phase 1 gate."""
from __future__ import annotations

from pathlib import Path

SCRIPT = Path(__file__).with_name("phase_2_apply.py")
source = SCRIPT.read_text(encoding="utf-8")
old = "},self-trust:{agency:1},skill:{"
new = '},"self-trust":{agency:1},skill:{'
if source.count(old) != 1:
    raise RuntimeError(f"Phase 2 self-trust patch anchor changed: {source.count(old)}")
source = source.replace(old, new, 1)
namespace = {"__name__": "__main__", "__file__": str(SCRIPT)}
exec(compile(source, str(SCRIPT), "exec"), namespace)

root = SCRIPT.parents[1]
factory_path = root / "src" / "knowledge" / "cards" / "create-complete-profile.js"
factory = factory_path.read_text(encoding="utf-8")
old_factory = 'text(card,role).map((value,i)=>semanticUnit(`${role}.${["primary","secondary","tertiary"][i]}`,value,'
new_factory = 'text(card,role).map((value,i)=>semanticUnit(`${role}.${["primary","secondary","tertiary"][i]}`,`${card.name}：${value}`,'
if factory.count(old_factory) != 1:
    raise RuntimeError(f"Phase 2 facet identity anchor changed: {factory.count(old_factory)}")
factory_path.write_text(factory.replace(old_factory, new_factory, 1), encoding="utf-8", newline="\n")

phase1_path = root / "tests" / "phase_1_gate_test.mjs"
phase1 = phase1_path.read_text(encoding="utf-8")
old_gate = 'assert.match(progress, /唯一下一任务 \\| `TQ-101A`/);\n'
new_gate = 'assert.match(progress, /Phase 1状态 \\| `PARENT-DONE`/);\n'
if phase1.count(old_gate) != 1:
    raise RuntimeError(f"Phase 1 stage-independent gate anchor changed: {phase1.count(old_gate)}")
phase1_path.write_text(phase1.replace(old_gate, new_gate, 1), encoding="utf-8", newline="\n")
print("phase_2_identity_and_gate_hardened")
