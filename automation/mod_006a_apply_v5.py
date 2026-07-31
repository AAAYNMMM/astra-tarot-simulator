#!/usr/bin/env python3
"""Apply MOD-006A with direct-ESM browser service adapters."""

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


RUNTIME_SERVICES_JS = r'''
import { createBusinessRandom } from "../core/random/business-random.js";
import { createLifecycleClient } from "../platform/lifecycle-client.js";
import { registerServiceWorker as registerPwaServiceWorker } from "../platform/pwa-client.js";
import { createLegacyHistoryStore } from "../storage/legacy-history.js";
import { createLegacyReadingRecord } from "../storage/legacy-record.js";
import { createSettingsStore } from "../storage/settings.js";

function safeLocalStorage(windowRef) {
  try {
    return windowRef?.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createRuntimeServices(windowRef = globalThis.window) {
  if (!windowRef) throw new Error("Runtime services require a browser window.");
  const storageRef = safeLocalStorage(windowRef);
  const settings = createSettingsStore(storageRef);
  const history = createLegacyHistoryStore(storageRef);
  const businessRandom = createBusinessRandom({
    cryptoRef: windowRef.crypto,
    fallbackRandom: windowRef.Math?.random?.bind(windowRef.Math) ?? Math.random,
  });
  const lifecycle = createLifecycleClient({ windowRef });

  return Object.freeze({
    randomUnit: businessRandom.randomUnit,
    secureShuffle: businessRandom.secureShuffle,
    registerServiceWorker: () =>
      registerPwaServiceWorker({
        navigatorRef: windowRef.navigator,
        locationRef: windowRef.location,
      }),
    registerLocalLifecycle: lifecycle.register,
    loadSettings: settings.load,
    saveSettings: settings.save,
    loadHistory: history.load,
    writeHistory: history.write,
    readingRecord: createLegacyReadingRecord,
  });
}
'''


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
        'import { DECK_STYLES, LEGACY_DECK_IDS } from "../config/decks.js";',
        'import { DECK_STYLES, LEGACY_DECK_IDS, resolveDeckStyle } from "../config/decks.js";',
        "deck resolver import",
    )
    application = replace_once(
        application,
        'import { randomUnit, secureShuffle } from "../core/random/business-random.js";\n',
        'import { createRuntimeServices } from "./runtime-services.js";\n',
        "runtime services import",
    )
    application = replace_once(
        application,
        'import { cardBackPath, cardImagePath, resolveDeckStyle } from "../platform/assets.js";',
        'import { cardBackPath, cardImagePath } from "../platform/assets.js";',
        "asset imports",
    )
    for legacy_import, label in (
        ('import { registerLocalLifecycle } from "../platform/lifecycle-client.js";\n', "lifecycle import"),
        ('import { registerServiceWorker } from "../platform/pwa-client.js";\n', "PWA import"),
        ('import { loadHistory, writeHistory as writeHistoryToStorage } from "../storage/legacy-history.js";\n', "history import"),
        ('import { readingRecord } from "../storage/legacy-record.js";\n', "record import"),
        ('import { loadSettings, saveSettings } from "../storage/settings.js";\n', "settings import"),
    ):
        application = replace_once(application, legacy_import, "", label)

    application = replace_once(
        application,
        "  const document = documentRef;\n",
        "  const document = documentRef;\n"
        "  const {\n"
        "    randomUnit, secureShuffle, registerServiceWorker, registerLocalLifecycle,\n"
        "    loadSettings, saveSettings, loadHistory,\n"
        "    writeHistory: writeHistoryToStorage, readingRecord,\n"
        "  } = createRuntimeServices(window);\n",
        "runtime service wiring",
    )
    return application


def patch_generated_files() -> None:
    v4.module.write("src/app/runtime-services.js", RUNTIME_SERVICES_JS.lstrip())

    sw_path = ROOT / "sw.js"
    sw = sw_path.read_text(encoding="utf-8")
    sw = replace_once(
        sw,
        '  "./src/app/application.js",\n',
        '  "./src/app/application.js",\n  "./src/app/runtime-services.js",\n',
        "SW runtime services",
    )
    sw_path.write_text(sw, encoding="utf-8", newline="\n")

    module_path = ROOT / "tests" / "module_contract_test.mjs"
    module_source = module_path.read_text(encoding="utf-8")
    module_source = replace_once(
        module_source,
        '  "package.json", "src/README.md", "src/app/bootstrap.js", "src/app/application.js",\n',
        '  "package.json", "src/README.md", "src/app/bootstrap.js", "src/app/application.js",\n  "src/app/runtime-services.js",\n',
        "module required runtime services",
    )
    module_source = replace_once(
        module_source,
        '  "src/app/bootstrap.js", "src/app/application.js", "src/ui/components/dialogs.js",\n',
        '  "src/app/bootstrap.js", "src/app/application.js", "src/app/runtime-services.js",\n  "src/ui/components/dialogs.js",\n',
        "module SW runtime services",
    )
    module_path.write_text(module_source, encoding="utf-8", newline="\n")

    python_path = ROOT / "tests" / "test_app_contract.py"
    python_source = python_path.read_text(encoding="utf-8")
    python_source = replace_once(
        python_source,
        '            "src/app/bootstrap.js", "src/app/application.js", "src/ui/components/dialogs.js",\n',
        '            "src/app/bootstrap.js", "src/app/application.js", "src/app/runtime-services.js",\n            "src/ui/components/dialogs.js",\n',
        "Python required runtime services",
    )
    python_path.write_text(python_source, encoding="utf-8", newline="\n")

    module_map = ROOT / "docs" / "MODULE_MAP.md"
    text = module_map.read_text(encoding="utf-8")
    text += "\n`src/app/runtime-services.js` 负责把浏览器随机、生命周期、PWA与旧本地存储工厂适配为应用组合层使用的稳定接口。\n"
    module_map.write_text(text, encoding="utf-8", newline="\n")


v4.module.build_application = build_application
v4.main()
patch_generated_files()
