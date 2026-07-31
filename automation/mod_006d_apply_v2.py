#!/usr/bin/env python3
"""Compile and execute MOD-006D after repairing nested source delimiters."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL = ROOT / "automation" / "mod_006d_apply.py"
source = ORIGINAL.read_text(encoding="utf-8")

opening = "BROWSER_HARNESS = r'''"
closing = "\n'''\n\nPHASE_GATE = r'''"
if source.count(opening) != 1 or source.count(closing) != 1:
    raise RuntimeError("MOD-006D browser harness delimiter anchors changed")
source = source.replace(opening, 'BROWSER_HARNESS = r"""', 1)
source = source.replace(closing, '\n"""\n\nPHASE_GATE = r\'\'\'', 1)

browser_docstring = '"""Launch the real application in installed desktop browsers without third-party packages."""'
if source.count(browser_docstring) != 1:
    raise RuntimeError("MOD-006D browser harness docstring anchor changed")
source = source.replace(
    browser_docstring,
    "# Launch the real application in installed desktop browsers without third-party packages.",
    1,
)

old_imports = '''from dataclasses import dataclass
from typing import ClassVar

from src.server.http import AppRequestHandler
from src.server.lifecycle import AppServer
from src.server.session import SessionGuard

ROOT = pathlib.Path(__file__).resolve().parents[1]
'''
new_imports = '''from dataclasses import dataclass
from typing import ClassVar
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from src.server.http import AppRequestHandler
from src.server.lifecycle import AppServer
from src.server.session import SessionGuard
'''
if source.count(old_imports) != 1:
    raise RuntimeError("MOD-006D browser harness import anchor changed")
source = source.replace(old_imports, new_imports, 1)

namespace = {
    "__name__": "mod_006d_compiled",
    "__file__": str(ORIGINAL),
}
exec(compile(source, str(ORIGINAL), "exec"), namespace)
namespace["main"]()
