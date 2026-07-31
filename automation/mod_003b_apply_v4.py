#!/usr/bin/env python3
"""Run MOD-003B with repaired migration scopes and Python method indentation."""

from __future__ import annotations

from pathlib import Path


SCRIPT = Path(__file__).with_name("mod_003b_apply.py")
source = SCRIPT.read_text(encoding="utf-8")

replacements = [
    (
        """    marker = dedent('''        (\n            \"node-module-contract\",\n            [node, \"tests/module_contract_test.mjs\"],\n        ),\n''')\n    insertion = dedent('''        (\n            \"node-foundation-contract\",\n            [node, \"tests/foundation_contract_test.mjs\"],\n        ),\n        (\n            \"node-module-contract\",\n            [node, \"tests/module_contract_test.mjs\"],\n        ),\n''')\n    validate = replace_once(validate, marker, insertion, \"validation foundation step\")\n""",
        """    marker = '''        (\n            \"node-module-contract\",\n            [node, \"tests/module_contract_test.mjs\"],\n        ),\n'''\n    insertion = '''        (\n            \"node-foundation-contract\",\n            [node, \"tests/foundation_contract_test.mjs\"],\n        ),\n        (\n            \"node-module-contract\",\n            [node, \"tests/module_contract_test.mjs\"],\n        ),\n'''\n    validate = replace_once(validate, marker, insertion, \"validation foundation step\")\n""",
        "validation marker",
    ),
    (
        """    module_test = replace_once(\n        module_test,\n        '  \"src/app/legacy-runtime.js\",\\n',\n        '  \"src/app/legacy-runtime.js\",\\n'\n        + '  \"tests/foundation_contract_test.mjs\",\\n'\n        + \"\".join(f'  \"{path}\",\\n' for path in module_paths),\n        \"module required files\",\n    )\n""",
        """    module_test = replace_once(\n        module_test,\n        '  \"src/app/bootstrap.js\",\\n  \"src/app/legacy-runtime.js\",\\n];\\n',\n        '  \"src/app/bootstrap.js\",\\n  \"src/app/legacy-runtime.js\",\\n'\n        + '  \"tests/foundation_contract_test.mjs\",\\n'\n        + \"\".join(f'  \"{path}\",\\n' for path in module_paths)\n        + '];\\n',\n        \"module required files\",\n    )\n""",
        "required files scope",
    ),
    (
        '    python_test = regex_once(python_test, deck_method_pattern, deck_method, "python deck method")\n',
        '    deck_method = "\\n".join(f"    {line}" if line else line for line in deck_method.splitlines())\n'
        '    python_test = regex_once(python_test, deck_method_pattern, deck_method, "python deck method")\n',
        "deck method indentation",
    ),
    (
        '    python_test = regex_once(python_test, lifecycle_pattern, lifecycle_method, "python lifecycle method")\n',
        '    lifecycle_method = "\\n".join(f"    {line}" if line else line for line in lifecycle_method.splitlines())\n'
        '    python_test = regex_once(python_test, lifecycle_pattern, lifecycle_method, "python lifecycle method")\n',
        "lifecycle method indentation",
    ),
]

for old, new, label in replacements:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one source match, found {count}")
    source = source.replace(old, new, 1)

namespace = {"__name__": "__main__", "__file__": str(SCRIPT)}
exec(compile(source, str(SCRIPT), "exec"), namespace)
