#!/usr/bin/env python3
"""Migrate historical interpretation and CSS freeze contracts to Phase 11."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write_lf(path: Path, content: str) -> None:
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content.rstrip() + "\n")


app_test_path = ROOT / "tests" / "test_app_contract.py"
app_test = app_test_path.read_text(encoding="utf-8")
old_expected = '''            "createDecisiveInterpretation", "最终判断", "走势依据", "决定性牌位", "改判条件",
        ):
            self.assertIn(expected, knowledge + application)
        for removed in ("createSpreadNarrative", "createConnections", "牌与牌之间如何对话", "接下来的三步"):'''
new_expected = '''            "createLongformInterpretation", "最终判断", "局势总解", "关键牌位详解", "成立条件",
        ):
            self.assertIn(expected, knowledge + application)
        for removed in (
            "createSpreadNarrative", "createConnections", "走势依据", "走势从",
            "决定性牌位", "改判条件", "牌与牌之间如何对话", "接下来的三步",
        ):'''
if new_expected not in app_test:
    if old_expected not in app_test:
        raise RuntimeError("Historical interpretation contract marker not found.")
    app_test = app_test.replace(old_expected, new_expected, 1)
write_lf(app_test_path, app_test)

module_path = ROOT / "tests" / "module_contract_test.mjs"
module = module_path.read_text(encoding="utf-8")
old_filter = '''const originalCss = cssImports.filter((item) => !item.endsWith("accent-tokens.css") && !item.endsWith("phase-8.css") && !item.endsWith("platform-status.css") && !item.endsWith("phase-10.css")).map(read).join("");'''
new_filter = '''const originalCss = cssImports.filter((item) => !item.endsWith("accent-tokens.css") && !item.endsWith("phase-8.css") && !item.endsWith("platform-status.css") && !item.endsWith("phase-10.css") && !item.endsWith("phase-11.css")).map(read).join("");'''
if new_filter not in module:
    if old_filter not in module:
        raise RuntimeError("Original CSS freeze marker not found.")
    module = module.replace(old_filter, new_filter, 1)
write_lf(module_path, module)

print("Phase 11 historical interpretation and CSS contracts migrated.")
