#!/usr/bin/env python3
"""Execute Phase 9 release content while repairing two over-escaped patch blocks."""

from __future__ import annotations

import base64
import hashlib
import runpy
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARTS = [ROOT / "automation" / f"phase_9_release_payload_{index:02d}.txt" for index in range(6)]


def write_lf(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content.rstrip() + "\n")


encoded = "".join(path.read_text(encoding="ascii").strip() for path in PARTS)
compressed = base64.b64decode(encoded, validate=True)
if hashlib.sha256(compressed).hexdigest() != "b16f862950f020e59c65e755b45e14075f7f79032eeee539a1d32f85794ad234":
    raise RuntimeError("Phase 9 release compressed payload fingerprint mismatch.")
script = zlib.decompress(compressed)
if hashlib.sha256(script).hexdigest() != "1cf5a8c7cda7c8c8e1f44fcc1c26baadc4c1a4e736528ded7af47af87d1b4acd":
    raise RuntimeError("Phase 9 release script fingerprint mismatch.")
source = script.decode("utf-8")

phase_m_key = source.index('"tests/phase_m_gate_test.mjs"')
phase_m_start = source.rfind("replace_once(", 0, phase_m_key)
validate_start = source.index("validate_path =", phase_m_key)
source = source[:phase_m_start] + source[validate_start:]
validate_start = source.index("validate_path =")
validate_end_marker = 'write_lf("automation/validate.py", validate)'
validate_end = source.index(validate_end_marker, validate_start) + len(validate_end_marker)
source = source[:validate_start] + source[validate_end:]

target = ROOT / "automation" / "_phase_9_release_fixed.py"
write_lf(target, source)
try:
    runpy.run_path(str(target), run_name="__main__")
finally:
    target.unlink(missing_ok=True)

phase_m_path = ROOT / "tests" / "phase_m_gate_test.mjs"
phase_m = phase_m_path.read_text(encoding="utf-8")
old_phase_m = '''for (const forbidden of ["skipWaiting", "clients.claim", "caches.keys", "cached || caches.match(\\"./index.html\\")"]) {
  assert.equal(sw.includes(forbidden), false, `SW contains forbidden fallback/update behavior: ${forbidden}`);
}'''
new_phase_m = '''for (const forbidden of ["clients.claim", "cached || caches.match(\\"./index.html\\")"]) {
  assert.equal(sw.includes(forbidden), false, `SW contains forbidden fallback/update behavior: ${forbidden}`);
}
assert.equal(/addEventListener\\("install"[\\s\\S]{0,600}skipWaiting/.test(sw), false);
assert.match(sw, /ASTRA_ACTIVATE_RELEASE/);
assert.match(sw, /cleanupOldReleases/);'''
if new_phase_m not in phase_m:
    if old_phase_m not in phase_m:
        raise RuntimeError("Phase M PWA gate marker not found.")
    phase_m = phase_m.replace(old_phase_m, new_phase_m, 1)
write_lf(phase_m_path, phase_m)

validate_path = ROOT / "automation" / "validate.py"
validate = validate_path.read_text(encoding="utf-8")
marker = '''        (
            "node-pwa-contract",
            [node, "tests/pwa_contract_test.mjs"],
        ),
'''
addition = marker + '''        ("phase-9-performance-report-check", [node, "scripts/measure_release.mjs", "--check"]),
        ("phase-9-release-acceptance-check", [node, "scripts/release_acceptance.mjs", "--check"]),
        ("phase-9-release-manifest-check", [node, "scripts/generate_release_manifest.mjs", "--check"]),
        ("node-phase-9-pwa", [node, "tests/phase_9_pwa_atomic_update_test.mjs"]),
        ("node-phase-9-performance", [node, "tests/phase_9_performance_test.mjs"]),
        ("node-phase-9-release", [node, "tests/phase_9_release_test.mjs"]),
        ("node-phase-9-terminal-gate", [node, "tests/phase_9_gate_test.mjs"]),
'''
if "node-phase-9-terminal-gate" not in validate:
    if marker not in validate:
        raise RuntimeError("PWA validation marker not found.")
    validate = validate.replace(marker, addition, 1)
write_lf(validate_path, validate)

print("Phase 9 release content, Phase M gate, and validation steps applied.")
