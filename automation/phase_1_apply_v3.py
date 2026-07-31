#!/usr/bin/env python3
"""Run the Phase 1 migration with literal regex replacements and idempotent versions."""

from __future__ import annotations

from pathlib import Path

SCRIPT = Path(__file__).with_name("phase_1_apply.py")
source = SCRIPT.read_text(encoding="utf-8")
replacements = {
    "        new_registry,\n        generator,": "        lambda _match: new_registry,\n        generator,",
    "        module_replacement,\n        generator,": "        lambda _match: module_replacement,\n        generator,",
    '''    version = read("src/config/version.js")
    version += \'\'\'export const CARD_SCHEMA_VERSION = "1.0.0";
export const VOCABULARY_VERSION = "1.0.0";
export const QUESTION_SCHEMA_VERSION = "1.0.0";
export const POSITION_SCHEMA_VERSION = "1.0.0";
export const EVALUATION_PROTOCOL_VERSION = "1.0.0";
\'\'\'
    write("src/config/version.js", version)
''': '''    version = read("src/config/version.js")
    for name in (
        "CARD_SCHEMA_VERSION", "VOCABULARY_VERSION", "QUESTION_SCHEMA_VERSION",
        "POSITION_SCHEMA_VERSION", "EVALUATION_PROTOCOL_VERSION",
    ):
        declaration = f'export const {name} = "1.0.0";\\n'
        if declaration not in version:
            version += declaration
    write("src/config/version.js", version)
''',
}
for old, new in replacements.items():
    if source.count(old) != 1:
        raise RuntimeError(f"Phase 1 migration patch anchor changed: {old[:80]!r}")
    source = source.replace(old, new, 1)

namespace = {"__name__": "__main__", "__file__": str(SCRIPT)}
exec(compile(source, str(SCRIPT), "exec"), namespace)
