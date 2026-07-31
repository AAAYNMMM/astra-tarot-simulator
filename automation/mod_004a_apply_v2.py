#!/usr/bin/env python3
"""Run MOD-004A migration with the current module-contract layout."""

from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL = ROOT / "automation" / "mod_004a_apply.py"

spec = importlib.util.spec_from_file_location("mod_004a_original", ORIGINAL)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot load MOD-004A migration")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def update_module_contract(source: str) -> str:
    anchor = '  "src/README.md",\n'
    required = [
        "src/app/events.js",
        "src/app/controllers/reading-controller.js",
        "src/app/selectors/current-selection.js",
        "src/app/state/reading-state.js",
        "src/ui/animations/reading.js",
        "src/ui/components/toast.js",
        "src/ui/dom.js",
        "src/ui/safe-dom.js",
        "src/ui/renderers/history.js",
        "src/ui/renderers/setup.js",
        "tests/ui_contract_test.mjs",
    ]
    source = module.replace_once(
        source,
        anchor,
        anchor + "".join(f'  "{path}",\n' for path in required),
        "module contract required files",
    )
    source = source.replace("astra-tarot-v8", "astra-tarot-v9")
    sw_anchor = '  "data.js",\n  "app.js",\n]) {'
    insert = "".join(f'  "{path}",\n' for path in required[:-1])
    source = module.replace_once(
        source,
        sw_anchor,
        insert + sw_anchor,
        "module contract SW UI resources",
    )
    return source


module.update_module_contract = update_module_contract
module.main()
