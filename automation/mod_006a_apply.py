#!/usr/bin/env python3
"""Apply MOD-006A: remove legacy globals, bridges, and root monoliths."""

from __future__ import annotations

import json
import re
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KNOWLEDGE_SHA256 = "302e2dbe1b0717c8f4e4817b725cea584baa07b3d26461baf420aaca14fcae43"
KNOWLEDGE_BYTES = 65896


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.replace("\r\n", "\n"), encoding="utf-8", newline="\n")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def function_span(source: str, name: str) -> tuple[int, int]:
    match = re.search(rf"(?m)^\s*(?:async\s+)?function\s+{re.escape(name)}\s*\(", source)
    if not match:
        raise RuntimeError(f"function {name} not found")
    brace = source.find("{", match.end())
    depth = 0
    index = brace
    state = "code"
    quote = ""
    while index < len(source):
        char = source[index]
        nxt = source[index + 1] if index + 1 < len(source) else ""
        if state == "code":
            if char in ("'", '"', "`"):
                state = "string"
                quote = char
            elif char == "/" and nxt == "/":
                state = "line"
                index += 1
            elif char == "/" and nxt == "*":
                state = "block"
                index += 1
            elif char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    end = index + 1
                    while end < len(source) and source[end] in " \t\r\n":
                        end += 1
                    return match.start(), end
        elif state == "string":
            if char == "\\":
                index += 1
            elif char == quote:
                state = "code"
        elif state == "line":
            if char == "\n":
                state = "code"
        elif state == "block":
            if char == "*" and nxt == "/":
                state = "code"
                index += 1
        index += 1
    raise RuntimeError(f"unterminated function {name}")


def remove_functions(source: str, names: list[str]) -> str:
    for start, end in sorted((function_span(source, name) for name in names), reverse=True):
        source = source[:start] + source[end:]
    return source


DIALOGS_JS = r'''
export function formatDate(dateValue) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(dateValue));
  } catch {
    return String(dateValue);
  }
}

export function createDialogController({ dom, state }) {
  function openDialog(dialog) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function confirmAction(title, message, acceptLabel = "确认") {
    dom.confirmTitle.textContent = title;
    dom.confirmMessage.textContent = message;
    dom.confirmAccept.textContent = acceptLabel;
    openDialog(dom.confirmDialog);
    return new Promise((resolve) => {
      state.confirmResolver = resolve;
    });
  }

  function resolveConfirmation(value) {
    if (!state.confirmResolver) return;
    const resolver = state.confirmResolver;
    state.confirmResolver = null;
    closeDialog(dom.confirmDialog);
    resolver(value);
  }

  return Object.freeze({ openDialog, closeDialog, confirmAction, resolveConfirmation });
}
'''

IMPORTS = r'''
import { createEventBinder } from "./events.js";
import { createReadingFactory } from "./controllers/reading-controller.js";
import { createSelectionSelectors } from "./selectors/current-selection.js";
import { createReadingState, resetReadingState } from "./state/reading-state.js";
import { accentToken } from "../config/accent-tokens.js";
import { DECK_STYLES, LEGACY_DECK_IDS } from "../config/decks.js";
import { escapeHtml } from "../core/html.js";
import { randomUnit, secureShuffle } from "../core/random/business-random.js";
import { categoryLens, cardStructureNote, orientationNote, reflectionPrompt } from "../engine/legacy/card-reading.js";
import { createSynthesis } from "../engine/legacy/synthesis.js";
import { TarotData } from "../knowledge/legacy/index.js";
import { cardBackPath, cardImagePath, resolveDeckStyle } from "../platform/assets.js";
import { registerLocalLifecycle } from "../platform/lifecycle-client.js";
import { registerServiceWorker } from "../platform/pwa-client.js";
import { loadHistory, writeHistory as writeHistoryToStorage } from "../storage/legacy-history.js";
import { readingRecord } from "../storage/legacy-record.js";
import { loadSettings, saveSettings } from "../storage/settings.js";
import { createReadingAnimation } from "../ui/animations/reading.js";
import { createDialogController, formatDate } from "../ui/components/dialogs.js";
import { createToast } from "../ui/components/toast.js";
import { bindDom } from "../ui/dom.js";
import { createHistoryRenderer } from "../ui/renderers/history.js";
import { createSetupRenderer } from "../ui/renderers/setup.js";
'''

BOOTSTRAP_JS = r'''
import { startApplication } from "./application.js";

export async function bootstrapBrowser(globalScope = globalThis) {
  const documentRef = globalScope.document;
  const windowRef = globalScope.window;
  if (!documentRef || !windowRef) {
    return Object.freeze({ started: false, reason: "browser-globals-unavailable" });
  }
  return startApplication({ documentRef, windowRef });
}

function reportBootFailure(error) {
  console.error("星纱塔罗启动失败", error);
  document.documentElement.dataset.astraBoot = "failed";
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  void bootstrapBrowser().catch(reportBootFailure);
}
'''

SMOKE_JS = r'''
import { TarotData as data } from "../src/knowledge/legacy/index.js";

if (data.deck.length !== 78) throw new Error(`Expected 78 cards, received ${data.deck.length}`);
if (new Set(data.deck.map((card) => card.id)).size !== 78) throw new Error("Card IDs must be unique");
if (data.deck.filter((card) => card.arcana === "major").length !== 22) throw new Error("Expected 22 major arcana cards");
if (data.deck.filter((card) => card.arcana === "minor").length !== 56) throw new Error("Expected 56 minor arcana cards");
if (data.categories.length !== 6) throw new Error("Expected six question categories");
if (data.categories.some((category) => category.questions.length !== 7)) throw new Error("Expected seven preset questions in every category");
if (data.categories.reduce((sum, category) => sum + category.questions.length, 0) !== 42) throw new Error("Expected 42 preset questions");
if (data.spreads.length !== 4) throw new Error("Expected four spreads");
const spreadCounts = data.spreads.map((spread) => spread.positions.length).join(",");
if (spreadCounts !== "1,3,5,10") throw new Error(`Expected spread sizes 1,3,5,10; received ${spreadCounts}`);
for (const card of data.deck) {
  for (const field of ["name", "en", "upright", "reversed", "advice"]) {
    if (!card[field]) throw new Error(`${card.id} is missing ${field}`);
  }
}
console.log("Tarot data smoke test passed: direct ESM knowledge, 78 cards, 42 questions, and 1/3/5/10-card spreads.");
'''

APPLICATION_TEST = r'''
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startApplication } from "../src/app/application.js";
import { bootstrapBrowser } from "../src/app/bootstrap.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
assert.deepEqual(startApplication({}), { started: false, reason: "browser-globals-unavailable" });
assert.deepEqual(await bootstrapBrowser({}), { started: false, reason: "browser-globals-unavailable" });
for (const removed of ["app.js", "data.js", "src/app/legacy-runtime.js"]) {
  assert.equal(fs.existsSync(path.join(root, removed)), false, `${removed} must be removed`);
}
const applicationSource = fs.readFileSync(path.join(root, "src/app/application.js"), "utf8");
const bootstrapSource = fs.readFileSync(path.join(root, "src/app/bootstrap.js"), "utf8");
assert.equal(applicationSource.includes("window.TarotData"), false);
assert.equal(applicationSource.includes("window.AstraRuntime"), false);
assert.equal(bootstrapSource.includes("legacy-runtime"), false);
assert.match(bootstrapSource, /from "\.\/application\.js"/);
assert.ok(applicationSource.split(/\r?\n/).length <= 601, "application.js exceeds manual JavaScript limit");
console.log("MOD-006A application contract passed: direct ESM startup has no legacy globals or root monoliths.");
'''

KNOWLEDGE_TEST = rf'''
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {{ fileURLToPath }} from "node:url";
import {{ TarotData, LEGACY_KNOWLEDGE_METADATA }} from "../src/knowledge/legacy/index.js";
import {{ categoryLens, cardStructureNote, orientationNote, reflectionPrompt }} from "../src/engine/legacy/card-reading.js";
import {{ createSynthesis }} from "../src/engine/legacy/synthesis.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fingerprint = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/legacy-knowledge-fingerprint.json"), "utf8"));
const serialized = JSON.stringify(TarotData);
assert.equal(crypto.createHash("sha256").update(serialized).digest("hex"), fingerprint.sha256);
assert.equal(Buffer.byteLength(serialized), fingerprint.bytes);
assert.equal(TarotData.deck.length, 78);
assert.equal(TarotData.categories.reduce((sum, category) => sum + category.questions.length, 0), 42);
assert.deepEqual(TarotData.spreads.map((spread) => spread.positions.length), [1, 3, 5, 10]);
assert.equal(LEGACY_KNOWLEDGE_METADATA.transitional, true);

const reading = {{
  category: TarotData.categories[0],
  question: TarotData.categories[0].questions[0],
  spread: TarotData.spreads[0],
  draws: [{{ card: TarotData.deck[0], reversed: false, position: TarotData.spreads[0].positions[0] }}],
}};
assert.match(categoryLens(reading.draws[0], reading), /这张牌浓缩了问题最需要被看见的能量/);
assert.match(cardStructureNote(reading.draws[0].card), /大阿卡纳/);
assert.match(orientationNote(reading.draws[0]), /正位/);
assert.match(reflectionPrompt(reading.draws[0], reading), /真正需要/);
assert.equal(createSynthesis(reading).actions.length, 3);
for (const removed of ["app.js", "data.js", "src/app/legacy-runtime.js"]) {{
  assert.equal(fs.existsSync(path.join(root, removed)), false);
}}
console.log("MOD-006A knowledge contract passed: the frozen legacy fingerprint survives removal of root snapshots.");
'''

MODULE_CONTRACT = r'''
import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TarotData as data } from "../src/knowledge/legacy/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const requiredFiles = [
  "automation/validate.py", "automation/quality-baseline.json", "docs/MODULE_MAP.md",
  "package.json", "src/README.md", "src/app/bootstrap.js", "src/app/application.js",
  "src/ui/components/dialogs.js", "src/config/decks.js", "src/config/accent-tokens.js",
  "src/config/legacy-storage.js", "src/core/html.js", "src/core/random/business-random.js",
  "src/platform/assets.js", "src/platform/entropy.js", "src/platform/lifecycle-client.js",
  "src/platform/pwa-client.js", "src/storage/settings.js", "src/storage/legacy-history.js",
  "src/storage/legacy-record.js", "src/engine/legacy/card-reading.js",
  "src/engine/legacy/synthesis.js", "src/knowledge/legacy/index.js",
  "tests/application_contract_test.mjs", "tests/knowledge_contract_test.mjs",
  "tests/fixtures/legacy-knowledge-fingerprint.json",
];
for (const relativePath of requiredFiles) assert.equal(exists(relativePath), true, `Missing ${relativePath}`);
for (const removed of ["app.js", "data.js", "src/app/legacy-runtime.js", "styles.css"]) {
  assert.equal(exists(removed), false, `${removed} was reintroduced`);
}
const packageMetadata = JSON.parse(read("package.json"));
assert.equal(packageMetadata.private, true);
assert.equal(packageMetadata.type, "module");
assert.equal("dependencies" in packageMetadata, false);
assert.equal("devDependencies" in packageMetadata, false);
assert.equal(data.deck.length, 78);
assert.equal(data.categories.reduce((sum, category) => sum + category.questions.length, 0), 42);
assert.deepEqual(data.spreads.map((spread) => spread.positions.length), [1, 3, 5, 10]);
const ids = [
  ...data.deck.map((card) => card.id),
  ...data.categories.flatMap((category) => category.questions.map((question) => question.id)),
  ...data.spreads.map((spread) => spread.id),
];
for (const id of ids) assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const bootstrapSource = read("src/app/bootstrap.js");
const applicationSource = read("src/app/application.js");
assert.match(bootstrapSource, /from "\.\/application\.js"/);
assert.equal(bootstrapSource.includes("legacy-runtime"), false);
assert.equal(applicationSource.includes("window.TarotData"), false);
assert.equal(applicationSource.includes("window.AstraRuntime"), false);
const styleIndex = read("src/styles/index.css");
const cssImports = [...styleIndex.matchAll(/@import url\("\.\/(.+?)"\);/g)].map((match) => `src/styles/${match[1]}`);
const originalCss = cssImports.filter((item) => !item.endsWith("accent-tokens.css")).map(read).join("");
assert.equal(crypto.createHash("sha256").update(originalCss).digest("hex"), "087ab37e367357fbb1ea4532f0f0d9a81973e2dadd163a6d7c104cfbc6c466db");
const sw = read("sw.js");
assert.match(sw, /astra-tarot-v12/);
for (const runtimePath of [
  "src/app/bootstrap.js", "src/app/application.js", "src/ui/components/dialogs.js",
  "src/knowledge/legacy/index.js", "src/engine/legacy/card-reading.js",
  "src/engine/legacy/synthesis.js",
]) assert.ok(sw.includes(`"./${runtimePath}"`), `SW missing ${runtimePath}`);
for (const removed of ["./app.js", "./data.js", "./src/app/legacy-runtime.js"]) assert.equal(sw.includes(`"${removed}"`), false);
const baseline = JSON.parse(read("automation/quality-baseline.json"));
assert.deepEqual(baseline.knownDebt, []);
const resolved = new Map(baseline.resolvedDebt.map((item) => [item.path, item]));
assert.equal(resolved.get("app.js").replacement, "src/app/application.js");
assert.equal(resolved.get("data.js").replacement, "src/knowledge/legacy/index.js");
assert.equal(resolved.get("src/app/legacy-runtime.js").replacement, "src/app/application.js");
console.log("MOD-006A module contract passed: direct ESM runtime, frozen public IDs, zero oversized debt, and no legacy bridge.");
'''

PYTHON_TESTS = r'''
from __future__ import annotations

import functools
import http.cookiejar
import http.server
import pathlib
import threading
import unittest
import urllib.error
import urllib.request

import run as launcher

ROOT = pathlib.Path(__file__).resolve().parents[1]
STYLE_FILES = (
    "src/styles/index.css", "src/styles/foundation.css", "src/styles/setup.css",
    "src/styles/cards.css", "src/styles/insights.css", "src/styles/history.css",
    "src/styles/desktop.css", "src/styles/wide.css", "src/styles/responsive.css",
    "src/styles/accent-tokens.css",
)
APPLICATION_FILES = tuple(sorted(path.relative_to(ROOT).as_posix() for path in (ROOT / "src").rglob("*.js")))
KNOWLEDGE_FILES = tuple(path for path in APPLICATION_FILES if path.startswith("src/knowledge/") or path.startswith("src/engine/legacy/"))


def read_many(paths: tuple[str, ...]) -> str:
    return "\n".join((ROOT / path).read_text(encoding="utf-8") for path in paths)


def read_styles() -> str:
    return "".join((ROOT / path).read_text(encoding="utf-8") for path in STYLE_FILES[1:])


class TarotAppContractTests(unittest.TestCase):
    def test_required_runtime_files_exist_and_legacy_roots_are_gone(self) -> None:
        for relative in (
            "index.html", "run.py", "manifest.webmanifest", "sw.js", "icon.svg",
            "src/app/bootstrap.js", "src/app/application.js", "src/ui/components/dialogs.js",
            "src/knowledge/legacy/index.js", "tests/fixtures/legacy-knowledge-fingerprint.json",
        ):
            self.assertTrue((ROOT / relative).is_file(), relative)
        for removed in ("app.js", "data.js", "styles.css", "src/app/legacy-runtime.js"):
            self.assertFalse((ROOT / removed).exists(), removed)

    def test_html_has_primary_interaction_contract(self) -> None:
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        for element_id in ("categoryGrid", "questionPickerButton", "questionDialog", "questionList", "spreadList", "deckStyleList", "startReading", "cardTable", "insightContent", "historyDialog"):
            self.assertIn(f'id="{element_id}"', html)
        self.assertIn('type="module" src="src/app/bootstrap.js"', html)
        self.assertNotIn('src="app.js"', html)
        self.assertNotIn('src="data.js"', html)

    def test_four_complete_local_tarot_decks_are_bundled(self) -> None:
        ranks = ("ace", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "page", "knight", "queen", "king")
        card_ids = [f"major-{number}" for number in range(22)] + [f"{suit}-{rank}" for suit in ("wands", "cups", "swords", "pentacles") for rank in ranks]
        deck_specs = {
            ROOT / "assets" / "rws": lambda card_id: f"{card_id}.jpg",
            ROOT / "assets" / "decks" / "arnoult": lambda card_id: f"{card_id}.png",
            ROOT / "assets" / "decks" / "swiss-1jj": lambda card_id: f"{card_id}.{'png' if card_id == 'major-5' else 'jpg'}",
            ROOT / "assets" / "decks" / "piedmont": lambda card_id: f"{card_id}.jpg",
        }
        for asset_dir, filename_for in deck_specs.items():
            faces = [asset_dir / filename_for(card_id) for card_id in card_ids]
            self.assertEqual(len(faces), 78)
            self.assertTrue(all(path.is_file() and path.stat().st_size > 4000 for path in faces))
            self.assertTrue(any(path.stat().st_size > 1000 for path in asset_dir.glob("card-back.*")))

    def test_removed_features_stay_removed(self) -> None:
        sources = read_many(APPLICATION_FILES)
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        for symbol in ("SoundEngine", "AudioContext", "soundButton", "copyText", "saveCurrentReading", "reflectionIndex", 'data-history-action="copy"'):
            self.assertNotIn(symbol, sources + html)

    def test_spreads_and_interpretation_contract(self) -> None:
        knowledge = read_many(KNOWLEDGE_FILES)
        styles = read_styles()
        for expected in ('id: "cross"', 'name: "五牌十字"', 'id: "celtic"', 'name: "凯尔特十字"', 'name: "希望与恐惧"', "createSpreadNarrative", "createConnections", "牌与牌之间如何对话", "牌型与正逆位"):
            self.assertIn(expected, knowledge + read_many(APPLICATION_FILES))
        self.assertIn('data-spread-id="celtic"', styles)
        self.assertIn("rotate(90deg)", styles)

    def test_celtic_cross_layout_and_clickability_contract(self) -> None:
        styles = read_styles()
        for expected in ("container-type: size", "min(15cqw, 12.8cqh)", '.card-table[data-spread-id="celtic"] .drawn-card:nth-child(2)', "pointer-events: none", "pointer-events: auto"):
            self.assertIn(expected, styles)

    def test_deck_selection_uses_real_assets_without_color_filters(self) -> None:
        sources = read_many(APPLICATION_FILES)
        styles = read_styles()
        for deck_id, name, directory in (("rws", "经典韦特", "assets/rws"), ("arnoult", "阿尔诺古典", "assets/decks/arnoult"), ("swiss", "瑞士 1JJ", "assets/decks/swiss-1jj"), ("piedmont", "皮埃蒙特", "assets/decks/piedmont")):
            self.assertIn(f'id: "{deck_id}"', sources)
            self.assertIn(f'name: "{name}"', sources)
            self.assertIn(f'assetDirectory: "{directory}"', sources)
        for color_filter in ("sepia(", "hue-rotate(", "grayscale(", "contrast(", "mix-blend-mode"):
            self.assertNotIn(color_filter, styles)

    def test_static_assets_do_not_require_remote_cdn(self) -> None:
        content = (ROOT / "index.html").read_text(encoding="utf-8") + read_many(APPLICATION_FILES) + read_styles()
        self.assertNotIn("https://cdn.", content)
        self.assertNotIn("fonts.googleapis.com", content)

    def test_local_server_serves_application_with_security_headers(self) -> None:
        handler = functools.partial(launcher.AppRequestHandler, directory=str(ROOT))
        server = launcher.AppServer(("127.0.0.1", 0), handler, session_guard=launcher.SessionGuard())
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{server.server_address[1]}/index.html", timeout=2) as response:
                self.assertEqual(response.status, 200)
                self.assertNotIn("unsafe-inline", response.headers["Content-Security-Policy"])
                self.assertIn("HttpOnly", response.headers["Set-Cookie"])
        finally:
            server.shutdown(); server.server_close(); thread.join(timeout=2)

    def test_launcher_stops_after_last_page_closes(self) -> None:
        handler = functools.partial(launcher.AppRequestHandler, directory=str(ROOT))
        server = launcher.AppServer(("127.0.0.1", 0), handler, session_guard=launcher.SessionGuard())
        server.auto_close_grace_seconds = 0.15
        serving = threading.Thread(target=server.serve_forever, daemon=True); serving.start()
        monitor = server.start_lifecycle_monitor()
        try:
            origin = f"http://127.0.0.1:{server.server_address[1]}"
            jar = http.cookiejar.CookieJar(); opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
            opener.open(f"{origin}/index.html", timeout=2).close()
            for action in ("open", "close"):
                request = urllib.request.Request(f"{origin}/__astra/{action}?client=test-page", method="POST", headers={"Origin": origin, "Sec-Fetch-Site": "same-origin"})
                opener.open(request, timeout=2).close()
            serving.join(timeout=2); self.assertFalse(serving.is_alive())
        finally:
            server.stop_lifecycle_monitor()
            if serving.is_alive(): server.shutdown()
            server.server_close(); serving.join(timeout=2); monitor.join(timeout=1)

    def test_server_denies_internal_files_and_unauthorized_lifecycle(self) -> None:
        handler = functools.partial(launcher.AppRequestHandler, directory=str(ROOT))
        server = launcher.AppServer(("127.0.0.1", 0), handler, session_guard=launcher.SessionGuard())
        thread = threading.Thread(target=server.serve_forever, daemon=True); thread.start()
        try:
            origin = f"http://127.0.0.1:{server.server_address[1]}"
            for path in ("/docs/PROGRESS.md", "/tests/test_app_contract.py", "/%2e%2e/run.py"):
                with self.assertRaises(urllib.error.HTTPError): urllib.request.urlopen(f"{origin}{path}", timeout=2)
            request = urllib.request.Request(f"{origin}/__astra/open?client=unauthorized", method="POST", headers={"Origin": origin, "Sec-Fetch-Site": "same-origin"})
            with self.assertRaises(urllib.error.HTTPError) as error: urllib.request.urlopen(request, timeout=2)
            self.assertEqual(error.exception.code, 403)
        finally:
            server.shutdown(); server.server_close(); thread.join(timeout=2)

    def test_mod_006a_runtime_has_no_legacy_globals_or_oversized_sources(self) -> None:
        application = (ROOT / "src/app/application.js").read_text(encoding="utf-8")
        bootstrap = (ROOT / "src/app/bootstrap.js").read_text(encoding="utf-8")
        self.assertNotIn("window.TarotData", application)
        self.assertNotIn("window.AstraRuntime", application)
        self.assertNotIn("legacy-runtime", bootstrap)
        for path in (ROOT / "src").rglob("*.js"):
            self.assertLessEqual(len(path.read_text(encoding="utf-8").splitlines()), 600, str(path))


if __name__ == "__main__":
    unittest.main()
'''


def build_application(source: str) -> str:
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
    body = remove_functions(body, ["formatDate", "openDialog", "closeDialog", "confirmAction", "resolveConfirmation"])
    history_anchor = '  const { renderHistory, toggleHistoryDetail, deleteHistoryRecord } = createHistoryRenderer({'
    dialog_setup = '''  const { openDialog, closeDialog, confirmAction, resolveConfirmation } = createDialogController({ dom, state });\n\n'''
    body = replace_once(body, history_anchor, dialog_setup + history_anchor, "dialog controller wiring")
    body = replace_once(body, '  initialize();', '  initialize();\n  return Object.freeze({ started: true });', "application result")
    wrapped = '''export function startApplication({ windowRef = globalThis.window, documentRef = globalThis.document } = {}) {
  if (!windowRef || !documentRef) {
    return Object.freeze({ started: false, reason: "browser-globals-unavailable" });
  }
  const window = windowRef;
  const document = documentRef;
'''
    wrapped += textwrap.indent(body.strip() + "\n", "  ")
    wrapped += "}\n"
    return textwrap.dedent(IMPORTS).lstrip() + "\n" + wrapped


def update_validate(source: str) -> str:
    anchor = '''        (
            "node-module-contract",
            [node, "tests/module_contract_test.mjs"],
        ),
'''
    addition = '''        (
            "node-application-contract",
            [node, "tests/application_contract_test.mjs"],
        ),
'''
    return replace_once(source, anchor, addition + anchor, "application validation step")


def update_package(source: str) -> str:
    metadata = json.loads(source)
    metadata.setdefault("scripts", {})["test:application"] = "node tests/application_contract_test.mjs"
    return json.dumps(metadata, ensure_ascii=False, indent=2) + "\n"


def update_sw(source: str) -> str:
    source = re.sub(r'const CACHE_NAME = "astra-tarot-v\d+";', 'const CACHE_NAME = "astra-tarot-v12";', source, count=1)
    for line in ('  "./src/app/legacy-runtime.js",\n', '  "./app.js",\n', '  "./data.js",\n'):
        source = source.replace(line, "")
    source = replace_once(source, '  "./src/app/bootstrap.js",\n', '  "./src/app/bootstrap.js",\n  "./src/app/application.js",\n  "./src/ui/components/dialogs.js",\n', "SW direct application resources")
    return source


def update_docs() -> None:
    progress = read("docs/PROGRESS.md")
    progress = re.sub(r"\| 当前进行中任务 \|.*?\|", "| 当前进行中任务 | `MOD-006A` 删除兼容桥、旧全局和旧大型文件 |", progress, count=1)
    progress += "\n- `MOD-005`：`DONE`，产物提交 `b03ca2602a36c4f96f2f2cf3c54d085db729116f`，固定复验 `01KYG9PHM5B2` COMPLETED。\n- `MOD-006A`：`IN_PROGRESS`。\n"
    write("docs/PROGRESS.md", progress)
    write("docs/MODULE_MAP.md", read("docs/MODULE_MAP.md") + "\n\n## MOD-006A直接ESM运行时\n\n根 `app.js`、`data.js` 与 `src/app/legacy-runtime.js` 已删除。`src/app/application.js` 直接导入配置、知识、引擎、存储、平台与UI模块；`bootstrap.js` 不再创建或读取 `window.TarotData`、`window.AstraRuntime`。\n")
    write("src/README.md", read("src/README.md") + "\n\n## MOD-006A入口收口\n\n`src/app/application.js` 是唯一应用组合模块，`src/app/bootstrap.js` 是唯一页面入口；根目录不再存在业务JavaScript单体或旧全局桥。\n")
    automation = read("automation/README.md")
    automation = automation.replace("6. `node tests/module_contract_test.mjs`", "6. `node tests/application_contract_test.mjs`\n7. `node tests/module_contract_test.mjs`")
    write("automation/README.md", automation)


def main() -> None:
    application = build_application(read("app.js"))
    if len(application.splitlines()) > 600:
        raise RuntimeError(f"application.js still exceeds limit: {len(application.splitlines())}")
    write("src/app/application.js", application)
    write("src/ui/components/dialogs.js", textwrap.dedent(DIALOGS_JS).lstrip())
    write("src/app/bootstrap.js", textwrap.dedent(BOOTSTRAP_JS).lstrip())
    write("tests/smoke_test.js", textwrap.dedent(SMOKE_JS).lstrip())
    write("tests/application_contract_test.mjs", textwrap.dedent(APPLICATION_TEST).lstrip())
    write("tests/knowledge_contract_test.mjs", textwrap.dedent(KNOWLEDGE_TEST).lstrip())
    write("tests/module_contract_test.mjs", textwrap.dedent(MODULE_CONTRACT).lstrip())
    write("tests/test_app_contract.py", textwrap.dedent(PYTHON_TESTS).lstrip())
    write("tests/fixtures/legacy-knowledge-fingerprint.json", json.dumps({
        "schemaVersion": 1,
        "algorithm": "sha256-json-stringify",
        "sha256": KNOWLEDGE_SHA256,
        "bytes": KNOWLEDGE_BYTES,
        "cards": 78,
        "questions": 42,
        "spreads": 4,
        "sourceCommit": "b03ca2602a36c4f96f2f2cf3c54d085db729116f",
    }, ensure_ascii=False, indent=2) + "\n")
    write("automation/validate.py", update_validate(read("automation/validate.py")))
    write("package.json", update_package(read("package.json")))
    write("sw.js", update_sw(read("sw.js")))

    baseline = json.loads(read("automation/quality-baseline.json"))
    baseline["task"] = "MOD-006A"
    baseline["knownDebt"] = []
    resolved = {item["path"]: item for item in baseline.get("resolvedDebt", [])}
    resolved["app.js"] = {"path": "app.js", "kind": "javascript", "resolvedByTask": "MOD-006A", "replacement": "src/app/application.js"}
    resolved["data.js"] = {"path": "data.js", "kind": "javascript", "resolvedByTask": "MOD-006A", "replacement": "src/knowledge/legacy/index.js"}
    resolved["src/app/legacy-runtime.js"] = {"path": "src/app/legacy-runtime.js", "kind": "javascript", "resolvedByTask": "MOD-006A", "replacement": "src/app/application.js"}
    baseline["resolvedDebt"] = [resolved[path] for path in sorted(resolved)]
    write("automation/quality-baseline.json", json.dumps(baseline, ensure_ascii=False, indent=2) + "\n")
    update_docs()
    print(f"mod_006a_applied application_lines={len(application.splitlines())} legacy_files=3 debt=0 cache=astra-tarot-v12")


if __name__ == "__main__":
    main()
