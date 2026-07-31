#!/usr/bin/env python3
"""Apply MOD-004B with context-scoped contract updates."""

from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL = ROOT / "automation" / "mod_004b_apply.py"

spec = importlib.util.spec_from_file_location("mod_004b_original", ORIGINAL)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot load MOD-004B migration")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def transform_module_contract(source: str, app_lines: int) -> str:
    source = source.replace("astra-tarot-v9", "astra-tarot-v10")
    source = module.replace_once(
        source,
        '["app.js", 921, "MOD-006A"]',
        f'["app.js", {app_lines}, "MOD-006A"]',
        "MOD-004B app baseline",
    )
    source = module.replace_once(
        source,
        '  "tests/foundation_contract_test.mjs",\n  "src/config/decks.js",\n',
        '  "tests/foundation_contract_test.mjs",\n  "src/config/decks.js",\n  "src/config/accent-tokens.js",\n',
        "required accent module",
    )
    source = module.replace_once(
        source,
        '  "src/styles/responsive.css"\n]);',
        '  "src/styles/responsive.css",\n  "src/styles/accent-tokens.css"\n]);',
        "accent CSS import",
    )
    source = module.replace_once(
        source,
        'const reconstructedCss = cssImports.map((relativePath) => read(relativePath)).join("");',
        'const reconstructedCss = cssImports.filter((relativePath) => !relativePath.endsWith("accent-tokens.css")).map((relativePath) => read(relativePath)).join("");',
        "original CSS reconstruction",
    )
    source = module.replace_once(
        source,
        '  "src/app/legacy-runtime.js",\n  "src/config/decks.js",\n',
        '  "src/app/legacy-runtime.js",\n  "src/config/decks.js",\n  "src/config/accent-tokens.js",\n',
        "SW accent module assertion",
    )
    return source.replace("MOD-004A module contract passed:", "MOD-004B module contract passed:")


module.transform_module_contract = transform_module_contract
module.main()
