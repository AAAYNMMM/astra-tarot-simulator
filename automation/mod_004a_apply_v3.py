#!/usr/bin/env python3
"""Apply MOD-004A with moved UI contracts and the reduced app.js debt baseline."""

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
    source = module.replace_once(
        source,
        sw_anchor,
        "".join(f'  "{path}",\n' for path in required[:-1]) + sw_anchor,
        "module contract SW UI resources",
    )
    source = module.replace_once(
        source,
        '["app.js", 1353, "MOD-006A"]',
        '["app.js", 921, "MOD-006A"]',
        "reduced app debt assertion",
    )
    source = source.replace(
        "MOD-003B module contract passed:",
        "MOD-004A module contract passed:",
    )
    return source


def update_python_contract(source: str) -> str:
    source = module.update_python_contract(source)
    source = module.replace_once(
        source,
        '        self.assertIn(\'<span>展开查看</span>\', app_source)\n',
        '        history_source = (ROOT / "src/ui/renderers/history.js").read_text(encoding="utf-8")\n'
        '        self.assertIn(\'text: "展开查看"\', history_source)\n',
        "moved history toggle assertion",
    )
    source = module.replace_once(
        source,
        '            self.assertIn(relative_path.split("/")[-1], (ROOT / "sw.js").read_text(encoding="utf-8"))\n',
        '            if relative_path.startswith("src/"):\n'
        '                self.assertIn(relative_path, (ROOT / "sw.js").read_text(encoding="utf-8"))\n',
        "runtime-only SW assertion",
    )
    return source


module.update_module_contract = update_module_contract
module.update_python_contract = update_python_contract
module.main()
