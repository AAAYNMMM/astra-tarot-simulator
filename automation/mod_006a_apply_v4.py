#!/usr/bin/env python3
"""Apply MOD-006A and patch the existing UI contract after generation."""

from __future__ import annotations

import importlib.util
import re
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL = ROOT / "automation" / "mod_006a_apply.py"

spec = importlib.util.spec_from_file_location("mod_006a_original", ORIGINAL)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot load MOD-006A migration")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def build_application(source: str) -> str:
    source = module.replace_once(source, "\nrenderCardInsight(index) {", "\n  function renderCardInsight(index) {", "repair renderCardInsight declaration")
    source = module.replace_once(source, "\ning() {", "\n  async function completeReading() {", "repair completeReading declaration")
    prefix = '(() => {\n  "use strict";\n\n'
    suffix = '\n})();'
    if not source.startswith(prefix) or not source.rstrip().endswith(suffix):
        raise RuntimeError("unexpected legacy app wrapper")
    source = source[len(prefix):]
    source = source[:source.rfind(suffix)]
    marker = 'const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");'
    marker_index = source.find(marker)
    if marker_index < 0:
        raise RuntimeError("legacy app runtime header not found")
    body = source[marker_index:]
    body = module.remove_functions(body, ["formatDate", "openDialog", "closeDialog", "confirmAction", "resolveConfirmation"])
    pattern = re.compile(r'(?m)^(\s*)const \{ renderHistory, toggleHistoryDetail, deleteHistoryRecord \} = createHistoryRenderer\(\{')
    match = pattern.search(body)
    if not match:
        raise RuntimeError("history renderer wiring not found")
    indent = match.group(1)
    setup = f'{indent}const {{ openDialog, closeDialog, confirmAction, resolveConfirmation }} = createDialogController({{ dom, state }});\n\n'
    body = body[:match.start()] + setup + body[match.start():]
    body, count = re.subn(
        r'(?m)^(\s*)initialize\(\);\s*$',
        lambda item: f'{item.group(1)}initialize();\n{item.group(1)}return Object.freeze({{ started: true }});',
        body,
        count=1,
    )
    if count != 1:
        raise RuntimeError("application initialize call not found")
    wrapped = '''export function startApplication({ windowRef = globalThis.window, documentRef = globalThis.document } = {}) {
  if (!windowRef || !documentRef) {
    return Object.freeze({ started: false, reason: "browser-globals-unavailable" });
  }
  const window = windowRef;
  const document = documentRef;
'''
    wrapped += textwrap.indent(body.strip() + "\n", "  ")
    wrapped += "}\n"
    return textwrap.dedent(module.IMPORTS).lstrip() + "\n" + wrapped


original_main = module.main
module.build_application = build_application


def main() -> None:
    original_main()
    path = ROOT / "tests" / "ui_contract_test.mjs"
    source = path.read_text(encoding="utf-8")
    old = 'const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");'
    new = 'const appSource = fs.readFileSync(path.join(root, "src/app/application.js"), "utf8");'
    if source.count(old) != 1:
        raise RuntimeError("UI contract app source anchor not found")
    path.write_text(source.replace(old, new), encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
