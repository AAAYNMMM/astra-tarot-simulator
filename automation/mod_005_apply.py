#!/usr/bin/env python3
"""Apply MOD-005 human knowledge sources and legacy interpretation adapters."""

from __future__ import annotations

import json
import re
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


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


def scan_statement(source: str, start: int) -> tuple[int, int]:
    index = start
    state = "code"
    quote = ""
    stack: list[str] = []
    pairs = {"(": ")", "[": "]", "{": "}"}
    while index < len(source):
        char = source[index]
        nxt = source[index + 1] if index + 1 < len(source) else ""
        if state == "code":
            if char in ("'", '"', "`"):
                state = "string"
                quote = char
            elif char == "/" and nxt == "/":
                state = "line-comment"
                index += 1
            elif char == "/" and nxt == "*":
                state = "block-comment"
                index += 1
            elif char in pairs:
                stack.append(pairs[char])
            elif stack and char == stack[-1]:
                stack.pop()
            elif char == ";" and not stack:
                end = index + 1
                while end < len(source) and source[end] in " \t\r\n":
                    end += 1
                return start, end
        elif state == "string":
            if char == "\\":
                index += 1
            elif char == quote:
                state = "code"
        elif state == "line-comment":
            if char == "\n":
                state = "code"
        elif state == "block-comment":
            if char == "*" and nxt == "/":
                state = "code"
                index += 1
        index += 1
    raise RuntimeError("unterminated JavaScript statement")


def const_statement(source: str, name: str) -> str:
    match = re.search(rf"(?m)^\s*const\s+{re.escape(name)}\s*=", source)
    if not match:
        raise RuntimeError(f"const {name} not found")
    start, end = scan_statement(source, match.start())
    return textwrap.dedent(source[start:end]).strip() + "\n"


def function_span(source: str, name: str) -> tuple[int, int]:
    match = re.search(rf"(?m)^\s*(?:async\s+)?function\s+{re.escape(name)}\s*\(", source)
    if not match:
        raise RuntimeError(f"function {name} not found")
    brace = source.find("{", match.end())
    if brace < 0:
        raise RuntimeError(f"opening brace missing for {name}")
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
                state = "line-comment"
                index += 1
            elif char == "/" and nxt == "*":
                state = "block-comment"
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
        elif state == "line-comment":
            if char == "\n":
                state = "code"
        elif state == "block-comment":
            if char == "*" and nxt == "/":
                state = "code"
                index += 1
        index += 1
    raise RuntimeError(f"unterminated function {name}")


def extract_functions(source: str, names: list[str]) -> str:
    spans = sorted((function_span(source, name) for name in names), key=lambda item: item[0])
    return "\n\n".join(textwrap.dedent(source[start:end]).strip() for start, end in spans) + "\n"


def remove_functions(source: str, names: list[str]) -> str:
    spans = sorted((function_span(source, name) for name in names), reverse=True)
    for start, end in spans:
        source = source[:start] + source[end:]
    return source


def export_const(statement: str, name: str) -> str:
    return replace_once(statement, f"const {name} =", f"export const {name} =", f"export {name}")


CARD_FUNCTIONS = ["categoryLens", "cardStructureNote", "orientationNote", "reflectionPrompt"]
SYNTHESIS_FUNCTIONS = [
    "dominantElement",
    "drawTheme",
    "drawAt",
    "synthesisAnchor",
    "createSpreadNarrative",
    "createConnections",
    "createActionSteps",
    "createSynthesis",
    "elementMeaning",
    "categoryFallbackAction",
]

KNOWLEDGE_TEST = r'''
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { TarotData, LEGACY_KNOWLEDGE_METADATA } from "../src/knowledge/legacy/index.js";
import {
  categoryLens,
  cardStructureNote,
  orientationNote,
  reflectionPrompt,
} from "../src/engine/legacy/card-reading.js";
import { createSynthesis } from "../src/engine/legacy/synthesis.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const snapshotSource = fs.readFileSync(path.join(root, "data.js"), "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(snapshotSource, sandbox, { filename: "data.js" });
const snapshot = sandbox.window.TarotData;

assert.equal(JSON.stringify(TarotData), JSON.stringify(snapshot), "ESM knowledge must exactly match legacy data snapshot");
assert.equal(TarotData.deck.length, 78);
assert.equal(TarotData.categories.reduce((sum, category) => sum + category.questions.length, 0), 42);
assert.deepEqual(TarotData.spreads.map((spread) => spread.positions.length), [1, 3, 5, 10]);
assert.equal(LEGACY_KNOWLEDGE_METADATA.transitional, true);
assert.equal(LEGACY_KNOWLEDGE_METADATA.sourceKind, "human-authored");
assert.equal(LEGACY_KNOWLEDGE_METADATA.cardCount, 78);
assert.equal(LEGACY_KNOWLEDGE_METADATA.questionCount, 42);
assert.equal(LEGACY_KNOWLEDGE_METADATA.spreadCount, 4);

const reading = {
  category: TarotData.categories[0],
  spread: TarotData.spreads[0],
  draws: [{ card: TarotData.deck[0], reversed: false, position: TarotData.spreads[0].positions[0] }],
};
assert.match(categoryLens(reading.draws[0], reading), /核心讯息/);
assert.match(cardStructureNote(reading.draws[0].card), /大阿卡纳/);
assert.match(orientationNote(reading.draws[0]), /正位/);
assert.match(reflectionPrompt(reading.draws[0], reading), /真正需要/);
const synthesis = createSynthesis(reading);
assert.equal(typeof synthesis.headline, "string");
assert.equal(synthesis.actions.length, 3);

const runtimeSource = fs.readFileSync(path.join(root, "src/app/legacy-runtime.js"), "utf8");
assert.match(runtimeSource, /from "\.\.\/knowledge\/legacy\/index\.js"/);
assert.equal(runtimeSource.includes("../../data.js"), false, "runtime still loads root data.js");
assert.deepEqual([...((await import("../src/app/legacy-runtime.js")).LEGACY_SCRIPT_PATHS)], ["../../app.js"]);

const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
for (const name of [
  "categoryLens", "cardStructureNote", "orientationNote", "reflectionPrompt",
  "dominantElement", "createSpreadNarrative", "createConnections", "createActionSteps",
  "createSynthesis", "elementMeaning", "categoryFallbackAction",
]) {
  assert.equal(appSource.includes(`function ${name}(`), false, `${name} still lives in app.js`);
}
for (const relative of [
  "src/knowledge/legacy/cards/major.js",
  "src/knowledge/legacy/cards/minor.js",
  "src/knowledge/legacy/questions.js",
  "src/knowledge/spreads/definitions.js",
  "src/knowledge/legacy/build.js",
  "src/knowledge/legacy/index.js",
]) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  assert.equal(source.includes("window."), false, `${relative} must be importable without browser globals`);
  assert.ok(source.split(/\r?\n/).length <= 601, `${relative} exceeds manual JavaScript limit`);
}
console.log("MOD-005 knowledge contract passed: 78 cards, 42 questions, four spreads, and legacy interpretation remain byte-equivalent at the data level.");
'''


def build_knowledge(data_source: str) -> None:
    major = export_const(const_statement(data_source, "MAJOR_ARCANA"), "MAJOR_ARCANA")
    ranks = export_const(const_statement(data_source, "RANK_META"), "RANK_META")
    suits = export_const(const_statement(data_source, "SUITS"), "SUITS")
    categories = export_const(const_statement(data_source, "CATEGORIES"), "CATEGORIES")
    spreads = export_const(const_statement(data_source, "SPREADS"), "SPREADS")
    major_cards = export_const(const_statement(data_source, "majorCards"), "majorCards")
    minor_cards = export_const(const_statement(data_source, "minorCards"), "minorCards")

    write("src/knowledge/legacy/cards/major.js", major)
    write("src/knowledge/legacy/cards/minor.js", ranks + "\n" + suits)
    write("src/knowledge/legacy/questions.js", categories)
    write("src/knowledge/spreads/definitions.js", spreads)
    build_source = (
        'import { MAJOR_ARCANA } from "./cards/major.js";\n'
        'import { RANK_META, SUITS } from "./cards/minor.js";\n\n'
        + major_cards
        + "\n"
        + minor_cards
    )
    write("src/knowledge/legacy/build.js", build_source)
    metadata = '''export const LEGACY_KNOWLEDGE_METADATA = Object.freeze({
  schemaVersion: 1,
  sourceKind: "human-authored",
  transitional: true,
  removalTask: "MOD-006A",
  cardCount: 78,
  questionCount: 42,
  spreadCount: 4,
});
'''
    write("src/knowledge/legacy/metadata.js", metadata)
    index_source = '''import { majorCards, minorCards } from "./build.js";
import { CATEGORIES } from "./questions.js";
import { SUITS } from "./cards/minor.js";
import { SPREADS } from "../spreads/definitions.js";
import { LEGACY_KNOWLEDGE_METADATA } from "./metadata.js";

const deck = Object.freeze([...majorCards, ...minorCards]);
const categories = Object.freeze(CATEGORIES);
const spreads = Object.freeze(SPREADS);
const suits = Object.freeze(SUITS);

if (deck.length !== LEGACY_KNOWLEDGE_METADATA.cardCount) throw new Error("Legacy card catalog count mismatch.");
if (categories.reduce((sum, category) => sum + category.questions.length, 0) !== LEGACY_KNOWLEDGE_METADATA.questionCount) throw new Error("Legacy question catalog count mismatch.");
if (spreads.length !== LEGACY_KNOWLEDGE_METADATA.spreadCount) throw new Error("Legacy spread catalog count mismatch.");

export const TarotData = Object.freeze({ deck, categories, spreads, suits });
export { LEGACY_KNOWLEDGE_METADATA };
'''
    write("src/knowledge/legacy/index.js", index_source)


def build_engine(app_source: str) -> str:
    card_source = extract_functions(app_source, CARD_FUNCTIONS)
    card_source += "\nexport { categoryLens, cardStructureNote, orientationNote, reflectionPrompt };\n"
    synthesis_source = extract_functions(app_source, SYNTHESIS_FUNCTIONS)
    synthesis_source += "\nexport { createSynthesis };\n"
    write("src/engine/legacy/card-reading.js", card_source)
    write("src/engine/legacy/synthesis.js", synthesis_source)
    return remove_functions(app_source, CARD_FUNCTIONS + SYNTHESIS_FUNCTIONS)


def update_runtime(source: str) -> str:
    imports = (
        'import { categoryLens, cardStructureNote, orientationNote, reflectionPrompt } from "../engine/legacy/card-reading.js";\n'
        'import { createSynthesis } from "../engine/legacy/synthesis.js";\n'
        'import { TarotData } from "../knowledge/legacy/index.js";\n'
    )
    source = imports + source
    source = replace_once(
        source,
        'export const LEGACY_SCRIPT_PATHS = Object.freeze(["../../data.js", "../../app.js"]);',
        'export const LEGACY_SCRIPT_PATHS = Object.freeze(["../../app.js"]);',
        "legacy script list",
    )
    source = replace_once(
        source,
        '    ui: Object.freeze({\n      bindDom,\n      createSetupRenderer,\n      createReadingAnimation,\n      createToast,\n      createHistoryRenderer,\n    }),\n',
        '    ui: Object.freeze({\n      bindDom,\n      createSetupRenderer,\n      createReadingAnimation,\n      createToast,\n      createHistoryRenderer,\n    }),\n    engine: Object.freeze({\n      categoryLens,\n      cardStructureNote,\n      orientationNote,\n      reflectionPrompt,\n      createSynthesis,\n    }),\n',
        "engine runtime bindings",
    )
    old_loader = '''  windowRef[LEGACY_RUNTIME_GLOBAL_NAME] = createLegacyRuntimeBindings(windowRef);
  await loadClassicScript(documentRef, LEGACY_SCRIPT_PATHS[0], baseUrl);
  if (!windowRef[LEGACY_GLOBAL_NAME]) {
    throw new Error("data.js did not initialize window.TarotData.");
  }
  await loadClassicScript(documentRef, LEGACY_SCRIPT_PATHS[1], baseUrl);
  return windowRef[LEGACY_GLOBAL_NAME];'''
    new_loader = '''  windowRef[LEGACY_RUNTIME_GLOBAL_NAME] = createLegacyRuntimeBindings(windowRef);
  windowRef[LEGACY_GLOBAL_NAME] = TarotData;
  await loadClassicScript(documentRef, LEGACY_SCRIPT_PATHS[0], baseUrl);
  return TarotData;'''
    return replace_once(source, old_loader, new_loader, "runtime ESM knowledge loader")


def update_app(source: str) -> str:
    old = '''const {
  app: { createReadingState, resetReadingState, createSelectionSelectors, createReadingFactory, createEventBinder },
  ui: { bindDom, createSetupRenderer, createReadingAnimation, createToast, createHistoryRenderer },
} = runtime;'''
    new = '''const {
  app: { createReadingState, resetReadingState, createSelectionSelectors, createReadingFactory, createEventBinder },
  ui: { bindDom, createSetupRenderer, createReadingAnimation, createToast, createHistoryRenderer },
  engine: { categoryLens, cardStructureNote, orientationNote, reflectionPrompt, createSynthesis },
} = runtime;'''
    return replace_once(source, old, new, "app engine bindings")


def update_validate(source: str) -> str:
    anchor = '''        (
            "node-module-contract",
            [node, "tests/module_contract_test.mjs"],
        ),
'''
    addition = '''        (
            "node-knowledge-contract",
            [node, "tests/knowledge_contract_test.mjs"],
        ),
'''
    return replace_once(source, anchor, addition + anchor, "knowledge validation step")


def update_package(source: str) -> str:
    metadata = json.loads(source)
    metadata.setdefault("scripts", {})["test:knowledge"] = "node tests/knowledge_contract_test.mjs"
    return json.dumps(metadata, ensure_ascii=False, indent=2) + "\n"


def update_sw(source: str) -> str:
    source = re.sub(r'const CACHE_NAME = "astra-tarot-v\d+";', 'const CACHE_NAME = "astra-tarot-v11";', source, count=1)
    source = source.replace('  "./data.js",\n', "")
    anchor = '  "./src/storage/legacy-record.js",\n'
    resources = [
        "src/engine/legacy/card-reading.js",
        "src/engine/legacy/synthesis.js",
        "src/knowledge/legacy/cards/major.js",
        "src/knowledge/legacy/cards/minor.js",
        "src/knowledge/legacy/questions.js",
        "src/knowledge/spreads/definitions.js",
        "src/knowledge/legacy/build.js",
        "src/knowledge/legacy/metadata.js",
        "src/knowledge/legacy/index.js",
    ]
    return replace_once(source, anchor, anchor + "".join(f'  "./{path}",\n' for path in resources), "SW knowledge resources")


def update_module_contract(source: str, app_lines: int) -> str:
    source = source.replace("astra-tarot-v10", "astra-tarot-v11")
    source = replace_once(source, '["app.js", 921, "MOD-006A"]', f'["app.js", {app_lines}, "MOD-006A"]', "app debt baseline")
    source = replace_once(source, '["../../data.js", "../../app.js"]', '["../../app.js"]', "runtime script expectation")
    source = replace_once(source, 'assert.match(legacyRuntimeSource, /data\\.js/);\n', 'assert.equal(legacyRuntimeSource.includes("../../data.js"), false);\nassert.match(legacyRuntimeSource, /knowledge\\/legacy\\/index\\.js/);\n', "runtime knowledge assertion")
    required_anchor = '  "src/storage/legacy-record.js",\n'
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
    source = replace_once(source, required_anchor, required_anchor + "".join(f'  "{path}",\n' for path in paths), "required knowledge files")
    sw_anchor = '  "src/storage/legacy-record.js",\n'
    source = replace_once(source, sw_anchor, sw_anchor + "".join(f'  "{path}",\n' for path in paths[:-1]), "SW knowledge assertions")
    source = replace_once(source, '  "data.js",\n  "app.js",', '  "app.js",', "remove data SW assertion")
    return source.replace("MOD-004B module contract passed:", "MOD-005 module contract passed:")


def update_python_tests(source: str) -> str:
    marker = "    def test_four_complete_local_tarot_decks_are_bundled(self) -> None:\n"
    test = '''    def test_mod_005_uses_esm_knowledge_and_legacy_engine_adapters(self) -> None:
        runtime_source = (ROOT / "src/app/legacy-runtime.js").read_text(encoding="utf-8")
        app_source = (ROOT / "app.js").read_text(encoding="utf-8")
        worker_source = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn('../knowledge/legacy/index.js', runtime_source)
        self.assertNotIn('../../data.js', runtime_source)
        self.assertNotIn('"./data.js"', worker_source)
        for relative_path in (
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
        ):
            self.assertTrue((ROOT / relative_path).is_file(), relative_path)
        self.assertNotIn("function createSynthesis(", app_source)
        self.assertNotIn("function categoryLens(", app_source)

'''
    return replace_once(source, marker, test + marker, "Python MOD-005 test")


def update_docs() -> None:
    progress = read("docs/PROGRESS.md")
    progress = re.sub(r"\| 当前进行中任务 \|.*?\|", "| 当前进行中任务 | `MOD-005` 人工知识源与旧版解读 |", progress, count=1)
    progress += "\n- `MOD-004B`：`DONE`，产物提交 `e1b2c8e73ad9c4e40cb5264aade7f60fe86618a9`，测试发现修复 `b31c2af465eb68466929d1c40938c409b60937d8`。\n- `MOD-005`：`IN_PROGRESS`。\n"
    write("docs/PROGRESS.md", progress)
    module_map = read("docs/MODULE_MAP.md") + "\n\n## MOD-005知识与旧引擎边界\n\n78张牌、42个问题和4个牌阵的人工源迁入 `src/knowledge/legacy/` 与 `src/knowledge/spreads/`；根 `data.js` 仅作为临时兼容快照，不再由页面或Service Worker加载。旧单牌解释和综合推理迁入 `src/engine/legacy/`，页面结果与公开ID保持不变。\n"
    write("docs/MODULE_MAP.md", module_map)
    src_readme = read("src/README.md") + "\n\n## MOD-005人工知识源\n\n`src/knowledge/legacy/` 是Phase M期间的人工主来源，`metadata.js` 明确标记其过渡性质；`src/engine/legacy/` 保留旧解读兼容算法，均可在Node中直接导入。\n"
    write("src/README.md", src_readme)
    automation = read("automation/README.md")
    automation = automation.replace("5. `node tests/module_contract_test.mjs`", "5. `node tests/knowledge_contract_test.mjs`\n6. `node tests/module_contract_test.mjs`")
    write("automation/README.md", automation)


def main() -> None:
    data_source = read("data.js")
    app_source = read("app.js")
    build_knowledge(data_source)
    app_source = build_engine(app_source)
    app_source = update_app(app_source)
    write("app.js", app_source)
    write("src/app/legacy-runtime.js", update_runtime(read("src/app/legacy-runtime.js")))
    write("tests/knowledge_contract_test.mjs", textwrap.dedent(KNOWLEDGE_TEST).lstrip())
    write("automation/validate.py", update_validate(read("automation/validate.py")))
    write("package.json", update_package(read("package.json")))
    write("sw.js", update_sw(read("sw.js")))

    baseline = json.loads(read("automation/quality-baseline.json"))
    baseline["task"] = "MOD-005"
    app_debt = next(item for item in baseline["knownDebt"] if item["path"] == "app.js")
    app_debt["baselineLines"] = len(app_source.splitlines())
    write("automation/quality-baseline.json", json.dumps(baseline, ensure_ascii=False, indent=2) + "\n")
    write("tests/module_contract_test.mjs", update_module_contract(read("tests/module_contract_test.mjs"), len(app_source.splitlines())))
    write("tests/test_app_contract.py", update_python_tests(read("tests/test_app_contract.py")))
    update_docs()
    print(f"mod_005_applied app_lines={len(app_source.splitlines())} cards=78 questions=42 spreads=4 cache=astra-tarot-v11")


if __name__ == "__main__":
    main()
