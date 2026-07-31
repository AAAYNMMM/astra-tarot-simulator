#!/usr/bin/env python3
"""Apply MOD-005 with context-scoped module-contract updates."""

from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL = ROOT / "automation" / "mod_005_apply.py"

spec = importlib.util.spec_from_file_location("mod_005_original", ORIGINAL)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot load MOD-005 migration")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def update_module_contract(source: str, app_lines: int) -> str:
    source = source.replace("astra-tarot-v10", "astra-tarot-v11")
    source = module.replace_once(source, '["app.js", 921, "MOD-006A"]', f'["app.js", {app_lines}, "MOD-006A"]', "app debt baseline")
    source = module.replace_once(source, '["../../data.js", "../../app.js"]', '["../../app.js"]', "runtime script expectation")
    source = module.replace_once(
        source,
        'assert.match(legacyRuntimeSource, /data\\.js/);\n',
        'assert.equal(legacyRuntimeSource.includes("../../data.js"), false);\nassert.match(legacyRuntimeSource, /knowledge\\/legacy\\/index\\.js/);\n',
        "runtime knowledge assertion",
    )
    paths = [
        "src/engine/legacy/card-reading.js",
        "src/engine/legacy/synthesis.js",
        "src/knowledge/legacy/cards/major.js",
        "src/knowledge/legacy/cards/minor.js",
        "src/knowledge/legacy/questions.js",
        "src/knowledge/spreads/definitions.js",
        "src/knowledge/legacy/build.js",
        "src/knowledge/legacy/metadata.js",
        "src/knowledge/legacy/index.js",
        "tests/knowledge_contract_test.mjs",
    ]
    required_anchor = '  "src/storage/legacy-record.js",\n];'
    source = module.replace_once(
        source,
        required_anchor,
        '  "src/storage/legacy-record.js",\n' + "".join(f'  "{path}",\n' for path in paths) + '];',
        "required knowledge files",
    )
    sw_anchor = '  "src/storage/legacy-record.js",\n  "src/app/events.js",'
    source = module.replace_once(
        source,
        sw_anchor,
        '  "src/storage/legacy-record.js",\n' + "".join(f'  "{path}",\n' for path in paths[:-1]) + '  "src/app/events.js",',
        "SW knowledge assertions",
    )
    source = module.replace_once(
        source,
        '  "src/ui/renderers/setup.js",\n  "data.js",\n  "app.js",',
        '  "src/ui/renderers/setup.js",\n  "app.js",',
        "remove data SW assertion",
    )
    return source.replace("MOD-004B module contract passed:", "MOD-005 module contract passed:")


module.update_module_contract = update_module_contract
module.main()
