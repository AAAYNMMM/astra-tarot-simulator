#!/usr/bin/env python3
"""Run MOD-003B after repairing deterministic migration match scopes."""

from __future__ import annotations

from pathlib import Path


SCRIPT = Path(__file__).with_name("mod_003b_apply.py")
source = SCRIPT.read_text(encoding="utf-8")

old_validation = """    marker = dedent('''        (\n            \"node-module-contract\",\n            [node, \"tests/module_contract_test.mjs\"],\n        ),\n''')\n    insertion = dedent('''        (\n            \"node-foundation-contract\",\n            [node, \"tests/foundation_contract_test.mjs\"],\n        ),\n        (\n            \"node-module-contract\",\n            [node, \"tests/module_contract_test.mjs\"],\n        ),\n''')\n    validate = replace_once(validate, marker, insertion, \"validation foundation step\")\n"""
new_validation = """    marker = '''        (\n            \"node-module-contract\",\n            [node, \"tests/module_contract_test.mjs\"],\n        ),\n'''\n    insertion = '''        (\n            \"node-foundation-contract\",\n            [node, \"tests/foundation_contract_test.mjs\"],\n        ),\n        (\n            \"node-module-contract\",\n            [node, \"tests/module_contract_test.mjs\"],\n        ),\n'''\n    validate = replace_once(validate, marker, insertion, \"validation foundation step\")\n"""
if source.count(old_validation) != 1:
    raise RuntimeError(f"Expected one validation marker block, found {source.count(old_validation)}")
source = source.replace(old_validation, new_validation, 1)

old_required = """    module_test = replace_once(\n        module_test,\n        '  \"src/app/legacy-runtime.js\",\\n',\n        '  \"src/app/legacy-runtime.js\",\\n'\n        + '  \"tests/foundation_contract_test.mjs\",\\n'\n        + \"\".join(f'  \"{path}\",\\n' for path in module_paths),\n        \"module required files\",\n    )\n"""
new_required = """    module_test = replace_once(\n        module_test,\n        '  \"src/app/bootstrap.js\",\\n  \"src/app/legacy-runtime.js\",\\n];\\n',\n        '  \"src/app/bootstrap.js\",\\n  \"src/app/legacy-runtime.js\",\\n'\n        + '  \"tests/foundation_contract_test.mjs\",\\n'\n        + \"\".join(f'  \"{path}\",\\n' for path in module_paths)\n        + '];\\n',\n        \"module required files\",\n    )\n"""
if source.count(old_required) != 1:
    raise RuntimeError(f"Expected one required-files migration block, found {source.count(old_required)}")
source = source.replace(old_required, new_required, 1)

namespace = {"__name__": "__main__", "__file__": str(SCRIPT)}
exec(compile(source, str(SCRIPT), "exec"), namespace)
