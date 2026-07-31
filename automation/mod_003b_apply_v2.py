#!/usr/bin/env python3
"""Run the MOD-003B migration after repairing its validation-step marker."""

from __future__ import annotations

from pathlib import Path


SCRIPT = Path(__file__).with_name("mod_003b_apply.py")
source = SCRIPT.read_text(encoding="utf-8")
old = """    marker = dedent('''        (\n            \"node-module-contract\",\n            [node, \"tests/module_contract_test.mjs\"],\n        ),\n''')\n    insertion = dedent('''        (\n            \"node-foundation-contract\",\n            [node, \"tests/foundation_contract_test.mjs\"],\n        ),\n        (\n            \"node-module-contract\",\n            [node, \"tests/module_contract_test.mjs\"],\n        ),\n''')\n    validate = replace_once(validate, marker, insertion, \"validation foundation step\")\n"""
new = """    marker = '''        (\n            \"node-module-contract\",\n            [node, \"tests/module_contract_test.mjs\"],\n        ),\n'''\n    insertion = '''        (\n            \"node-foundation-contract\",\n            [node, \"tests/foundation_contract_test.mjs\"],\n        ),\n        (\n            \"node-module-contract\",\n            [node, \"tests/module_contract_test.mjs\"],\n        ),\n'''\n    validate = replace_once(validate, marker, insertion, \"validation foundation step\")\n"""
if source.count(old) != 1:
    raise RuntimeError(f"Expected one validation marker block, found {source.count(old)}")
source = source.replace(old, new, 1)
namespace = {"__name__": "__main__", "__file__": str(SCRIPT)}
exec(compile(source, str(SCRIPT), "exec"), namespace)
