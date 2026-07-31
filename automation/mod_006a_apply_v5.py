#!/usr/bin/env python3
"""Apply MOD-006A with final declaration and storage-factory wiring repairs."""

from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PREVIOUS = ROOT / "automation" / "mod_006a_apply_v4.py"

spec = importlib.util.spec_from_file_location("mod_006a_v4", PREVIOUS)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot load MOD-006A v4 migration")
v4 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v4)
previous_build = v4.build_application


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return source.replace(old, new, 1)


def build_application(source: str) -> str:
    application = previous_build(source)

    old_declaration = "ction requestNewReading() {"
    new_declaration = "async function requestNewReading() {"
    old_count = application.count(old_declaration)
    new_count = application.count(new_declaration)
    if old_count == 1 and new_count == 0:
        application = application.replace(old_declaration, new_declaration, 1)
    elif not (old_count == 0 and new_count == 1):
        raise RuntimeError(
            f"requestNewReading repair state invalid: old={old_count} new={new_count}"
        )

    application = replace_once(
        application,
        'import { loadHistory, writeHistory as writeHistoryToStorage } from "../storage/legacy-history.js";',
        'import { createLegacyHistoryStore } from "../storage/legacy-history.js";',
        "history store import",
    )
    application = replace_once(
        application,
        'import { loadSettings, saveSettings } from "../storage/settings.js";',
        'import { createSettingsStore } from "../storage/settings.js";',
        "settings store import",
    )
    application = replace_once(
        application,
        "  const document = documentRef;\n",
        "  const document = documentRef;\n"
        "  const historyStore = createLegacyHistoryStore(window.localStorage);\n"
        "  const loadHistory = historyStore.load;\n"
        "  const writeHistoryToStorage = historyStore.write;\n"
        "  const settingsStore = createSettingsStore(window.localStorage);\n"
        "  const loadSettings = settingsStore.load;\n"
        "  const saveSettings = settingsStore.save;\n",
        "storage store wiring",
    )
    return application


v4.module.build_application = build_application
v4.main()
