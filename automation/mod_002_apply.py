#!/usr/bin/env python3
"""Apply the deterministic MOD-002 stylesheet split and contract updates."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "styles.css"
SOURCE_SHA256 = "087ab37e367357fbb1ea4532f0f0d9a81973e2dadd163a6d7c104cfbc6c466db"
SOURCE_LINES = 4916
CHUNKS = [
    ("src/styles/foundation.css", 1, 647),
    ("src/styles/setup.css", 648, 1296),
    ("src/styles/cards.css", 1297, 1945),
    ("src/styles/insights.css", 1946, 2585),
    ("src/styles/history.css", 2586, 3209),
    ("src/styles/desktop.css", 3210, 3923),
    ("src/styles/wide.css", 3924, 4552),
    ("src/styles/responsive.css", 4553, 4916),
]


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def write_text(relative_path: str, text: str) -> None:
    path = ROOT / relative_path
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")


def split_stylesheet() -> list[str]:
    source_bytes = SOURCE.read_bytes()
    actual_hash = hashlib.sha256(source_bytes).hexdigest()
    if actual_hash != SOURCE_SHA256:
        raise RuntimeError(
            f"styles.css hash changed: expected {SOURCE_SHA256}, received {actual_hash}"
        )

    lines = source_bytes.splitlines(keepends=True)
    if len(lines) != SOURCE_LINES:
        raise RuntimeError(
            f"styles.css line count changed: expected {SOURCE_LINES}, received {len(lines)}"
        )

    raw_chunks: list[tuple[str, list[bytes]]] = []
    for relative_path, start, end in CHUNKS:
        raw_chunks.append((relative_path, list(lines[start - 1 : end])))

    for index in range(len(raw_chunks) - 1):
        relative_path, chunk_lines = raw_chunks[index]
        next_path, next_lines = raw_chunks[index + 1]
        moved: list[bytes] = []
        while chunk_lines and not chunk_lines[-1].strip(b" \t\r\n"):
            moved.insert(0, chunk_lines.pop())
        raw_chunks[index] = (relative_path, chunk_lines)
        raw_chunks[index + 1] = (next_path, moved + next_lines)

    reconstructed = b"".join(
        line for _, chunk_lines in raw_chunks for line in chunk_lines
    )
    if reconstructed != source_bytes:
        raise RuntimeError("Split CSS does not reconstruct the original stylesheet bytes.")

    paths: list[str] = []
    for relative_path, chunk_lines in raw_chunks:
        if len(chunk_lines) > 900:
            raise RuntimeError(f"{relative_path} exceeds 900 lines: {len(chunk_lines)}")
        path = ROOT / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(b"".join(chunk_lines))
        paths.append(relative_path)

    imports = "\n".join(
        f'@import url("./{Path(relative_path).name}");' for relative_path in paths
    )
    write_text(
        "src/styles/index.css",
        "/* Fixed cascade order for the stylesheet modules. */\n"
        f"{imports}\n",
    )
    SOURCE.unlink()
    return paths


def update_index() -> None:
    path = ROOT / "index.html"
    text = path.read_text(encoding="utf-8")
    text = replace_once(
        text,
        '<link rel="stylesheet" href="styles.css" />',
        '<link rel="stylesheet" href="src/styles/index.css" />',
        "index stylesheet",
    )
    write_text("index.html", text)


def update_service_worker(css_paths: list[str]) -> None:
    path = ROOT / "sw.js"
    text = path.read_text(encoding="utf-8")
    text = replace_once(
        text,
        'const CACHE_NAME = "astra-tarot-v5";',
        'const CACHE_NAME = "astra-tarot-v6";',
        "service worker cache version",
    )
    entries = ['  "./src/styles/index.css",']
    entries.extend(f'  "./{relative_path}",' for relative_path in css_paths)
    text = replace_once(
        text,
        '  "./styles.css",',
        "\n".join(entries),
        "service worker stylesheet resources",
    )
    write_text("sw.js", text)


def update_quality_baseline() -> None:
    path = ROOT / "automation/quality-baseline.json"
    data = json.loads(path.read_text(encoding="utf-8"))
    data["task"] = "MOD-002"
    original = list(data["knownDebt"])
    data["knownDebt"] = [item for item in original if item["path"] != "styles.css"]
    if len(original) - len(data["knownDebt"]) != 1:
        raise RuntimeError("Expected exactly one styles.css debt entry.")
    resolved = list(data.get("resolvedDebt", []))
    resolved.append(
        {
            "path": "styles.css",
            "kind": "css",
            "resolvedByTask": "MOD-002",
            "replacement": "src/styles/index.css",
        }
    )
    data["resolvedDebt"] = sorted(resolved, key=lambda item: item["path"])
    write_text(
        "automation/quality-baseline.json",
        json.dumps(data, ensure_ascii=False, indent=2) + "\n",
    )


def update_size_checker() -> None:
    path = ROOT / "scripts/check_module_size.py"
    text = path.read_text(encoding="utf-8")
    text = replace_once(
        text,
        '    debts = {item["path"]: item for item in baseline["knownDebt"]}\n'
        "    findings: list[Finding] = []\n"
        "    visited: set[str] = set()\n\n"
        "    for relative_name, debt in sorted(debts.items()):\n",
        '    debts = {item["path"]: item for item in baseline["knownDebt"]}\n'
        '    resolved_debts = {item["path"]: item for item in baseline.get("resolvedDebt", [])}\n'
        "    findings: list[Finding] = []\n"
        "    visited: set[str] = set()\n\n"
        "    for relative_name, debt in sorted(resolved_debts.items()):\n"
        "        relative_path = Path(relative_name)\n"
        "        absolute_path = root / relative_path\n"
        "        kind = debt[\"kind\"]\n"
        "        limit = int(limits[kind])\n"
        "        visited.add(relative_path.as_posix())\n"
        "        if absolute_path.exists():\n"
        "            lines = line_count(absolute_path) if absolute_path.is_file() else 0\n"
        "            findings.append(\n"
        "                Finding(\n"
        "                    path=relative_path.as_posix(),\n"
        "                    kind=kind,\n"
        "                    lines=lines,\n"
        "                    limit=limit,\n"
        "                    status=\"FAIL\",\n"
        "                    reason=(\n"
        "                        f\"resolved debt path reintroduced after {debt['resolvedByTask']}; \"\n"
        "                        f\"use {debt['replacement']}\"\n"
        "                    ),\n"
        "                    expires_after_task=debt[\"resolvedByTask\"],\n"
        "                )\n"
        "            )\n"
        "        else:\n"
        "            findings.append(\n"
        "                Finding(\n"
        "                    path=relative_path.as_posix(),\n"
        "                    kind=kind,\n"
        "                    lines=0,\n"
        "                    limit=limit,\n"
        "                    status=\"PASS\",\n"
        "                    reason=f\"resolved debt remains absent; replacement is {debt['replacement']}\",\n"
        "                    expires_after_task=debt[\"resolvedByTask\"],\n"
        "                )\n"
        "            )\n\n"
        "    for relative_name, debt in sorted(debts.items()):\n",
        "resolved debt enforcement",
    )
    write_text("scripts/check_module_size.py", text)


def update_module_contract(css_paths: list[str]) -> None:
    path = ROOT / "tests/module_contract_test.mjs"
    text = path.read_text(encoding="utf-8")
    text = replace_once(
        text,
        'import assert from "node:assert/strict";\n',
        'import assert from "node:assert/strict";\nimport crypto from "node:crypto";\n',
        "crypto import",
    )
    anchor = (
        'assert.ok(appScriptIndex > dataScriptIndex, "index.html must still load app.js after data.js");\n\n'
    )
    expected = json.dumps(css_paths, ensure_ascii=False, indent=2)
    css_contract = f"""assert.ok(
  indexSource.includes('<link rel=\"stylesheet\" href=\"src/styles/index.css\" />'),
  \"index.html must load the MOD-002 stylesheet index\",
);
assert.equal(indexSource.includes('href=\"styles.css\"'), false, \"Legacy styles.css must not be loaded\");
assert.equal(exists(\"styles.css\"), false, \"Legacy styles.css must be removed after MOD-002\");

const styleIndex = read(\"src/styles/index.css\");
const cssImports = [...styleIndex.matchAll(/@import url\\(\"\\.\\/(.+?)\"\\);/g)].map(
  (match) => `src/styles/${{match[1]}}`,
);
assert.deepEqual(cssImports, {expected});
const reconstructedCss = cssImports.map((relativePath) => read(relativePath)).join(\"\");
assert.equal(
  crypto.createHash(\"sha256\").update(reconstructedCss).digest(\"hex\"),
  \"{SOURCE_SHA256}\",
  \"Split CSS modules must reconstruct the exact original stylesheet bytes\",
);
for (const relativePath of cssImports) {{
  const lines = read(relativePath).split(/\\r?\\n/).length;
  assert.ok(lines <= 901, `${{relativePath}} exceeds the 900-line manual CSS limit`);
}}

"""
    text = replace_once(text, anchor, anchor + css_contract, "CSS module contract")
    text = replace_once(
        text,
        'assert.match(serviceWorkerSource, /cache\\.addAll\\(CORE_FILES\\)/, "Current precache baseline changed");\n',
        'assert.match(serviceWorkerSource, /cache\\.addAll\\(CORE_FILES\\)/, "Current precache baseline changed");\n'
        'assert.match(serviceWorkerSource, /astra-tarot-v6/, "MOD-002 must bump the cache version");\n'
        'for (const relativePath of ["src/styles/index.css", ...cssImports]) {\n'
        '  assert.ok(serviceWorkerSource.includes(`"./${relativePath}"`), `SW missing ${relativePath}`);\n'
        '}\n'
        'assert.equal(serviceWorkerSource.includes(\'"./styles.css"\'), false, "SW still caches styles.css");\n',
        "service worker CSS contract",
    )
    text = replace_once(
        text,
        '  [\n'
        '    ["app.js", 1528, "MOD-006A"],\n'
        '    ["styles.css", 4918, "MOD-002"],\n'
        '    ["data.js", 637, "MOD-006A"],\n'
        '  ],\n'
        ');\n',
        '  [\n'
        '    ["app.js", 1528, "MOD-006A"],\n'
        '    ["data.js", 637, "MOD-006A"],\n'
        '  ],\n'
        ');\n'
        'assert.deepEqual(\n'
        '  qualityBaseline.resolvedDebt.map((item) => [item.path, item.resolvedByTask, item.replacement]),\n'
        '  [["styles.css", "MOD-002", "src/styles/index.css"]],\n'
        ');\n',
        "quality baseline contract",
    )
    text = replace_once(
        text,
        '"MOD-001 module contract passed: public IDs, legacy storage, runtime entry, PWA behavior, and debt baseline are recorded.",',
        '"MOD-002 module contract passed: CSS cascade, public IDs, legacy storage, PWA resources, and debt baseline are preserved.",',
        "contract completion message",
    )
    write_text("tests/module_contract_test.mjs", text)


def update_python_contract(css_paths: list[str]) -> None:
    path = ROOT / "tests/test_app_contract.py"
    text = path.read_text(encoding="utf-8")
    text = replace_once(
        text,
        "import pathlib\n",
        "import pathlib\nimport re\n",
        "Python CSS contract import",
    )
    style_files = ["src/styles/index.css", *css_paths]
    style_tuple = "(\n" + "".join(f'    "{item}",\n' for item in style_files) + ")"
    helper = (
        f"STYLE_FILES = {style_tuple}\n\n\n"
        "def read_styles() -> str:\n"
        "    index_source = (ROOT / STYLE_FILES[0]).read_text(encoding=\"utf-8\")\n"
        "    imported_names = re.findall(r'@import url\\(\"\\./(.+?)\"\\);', index_source)\n"
        "    expected_names = [pathlib.PurePosixPath(item).name for item in STYLE_FILES[1:]]\n"
        "    if imported_names != expected_names:\n"
        "        raise AssertionError(f\"Unexpected CSS import order: {imported_names!r}\")\n"
        "    return \"\".join(\n"
        "        (ROOT / relative_path).read_text(encoding=\"utf-8\")\n"
        "        for relative_path in STYLE_FILES[1:]\n"
        "    )\n\n\n"
    )
    text = replace_once(
        text,
        "ROOT = pathlib.Path(__file__).resolve().parents[1]\n\n\n",
        "ROOT = pathlib.Path(__file__).resolve().parents[1]\n"
        + helper,
        "Python CSS helpers",
    )
    text = replace_once(
        text,
        '            "styles.css",\n',
        "",
        "root stylesheet requirement",
    )
    text = replace_once(
        text,
        "        self.assertTrue(required.issubset({path.name for path in ROOT.iterdir()}))\n",
        "        self.assertTrue(required.issubset({path.name for path in ROOT.iterdir()}))\n"
        "        for relative_path in STYLE_FILES:\n"
        "            self.assertTrue((ROOT / relative_path).is_file(), relative_path)\n"
        "        self.assertFalse((ROOT / \"styles.css\").exists())\n",
        "split stylesheet requirement",
    )
    styles_read = '(ROOT / "styles.css").read_text(encoding="utf-8")'
    occurrences = text.count(styles_read)
    if occurrences != 4:
        raise RuntimeError(f"Expected four styles.css reads, found {occurrences}")
    text = text.replace(styles_read, "read_styles()")
    text = replace_once(
        text,
        '        for filename in ("index.html", "styles.css", "data.js", "app.js"):\n'
        '            content = (ROOT / filename).read_text(encoding="utf-8")\n'
        '            self.assertNotIn("https://cdn.", content)\n'
        '            self.assertNotIn("fonts.googleapis.com", content)\n',
        '        for filename in ("index.html", "data.js", "app.js"):\n'
        '            content = (ROOT / filename).read_text(encoding="utf-8")\n'
        '            self.assertNotIn("https://cdn.", content)\n'
        '            self.assertNotIn("fonts.googleapis.com", content)\n'
        '        for relative_path in STYLE_FILES:\n'
        '            content = (ROOT / relative_path).read_text(encoding="utf-8")\n'
        '            self.assertNotIn("https://cdn.", content)\n'
        '            self.assertNotIn("fonts.googleapis.com", content)\n',
        "static asset CSS paths",
    )
    write_text("tests/test_app_contract.py", text)


def update_docs(css_paths: list[str]) -> None:
    automation_path = ROOT / "automation/README.md"
    automation_text = automation_path.read_text(encoding="utf-8")
    automation_text = replace_once(
        automation_text,
        "Phase M 的 `MOD-001` 只实现：",
        "Phase M 的 `MOD-001` 与 `MOD-002` 当前实现：",
        "automation scope",
    )
    automation_text = replace_once(
        automation_text,
        "| `app.js` | 1528 | 600 | `MOD-006A` |\n"
        "| `styles.css` | 4918 | 900 | `MOD-002` |\n"
        "| `data.js` | 637 | 600 | `MOD-006A` |",
        "| `app.js` | 1528 | 600 | `MOD-006A` |\n"
        "| `data.js` | 637 | 600 | `MOD-006A` |\n\n"
        "`styles.css` 已由 `MOD-002` 清除；`src/styles/index.css` 固定导入八个活动样式模块，"
        "每个人工 CSS 文件均不超过 900 行。",
        "automation debt table",
    )
    write_text("automation/README.md", automation_text)

    module_map_path = ROOT / "docs/MODULE_MAP.md"
    module_map = module_map_path.read_text(encoding="utf-8")
    if "## MOD-002 CSS迁移结果" not in module_map:
        module_map += (
            "\n## MOD-002 CSS迁移结果\n\n"
            "`styles.css` 已按原始顶层规则边界拆分，字节级拼接结果与原文件一致。"
            "`index.html` 只加载 `src/styles/index.css`，该入口按固定顺序导入：\n\n"
            + "\n".join(f"- `{relative_path}`" for relative_path in css_paths)
            + "\n\n"
            "Service Worker临时资源列表已同步并提升缓存版本。"
            "根目录旧样式文件不得重新出现；所有人工CSS继续受900行硬上限约束。\n"
        )
    write_text("docs/MODULE_MAP.md", module_map)

    src_path = ROOT / "src/README.md"
    src_text = src_path.read_text(encoding="utf-8")
    if "## 当前活动CSS结构" not in src_text:
        tree_lines = ["src/styles/", "├── index.css"]
        for relative_path in css_paths[:-1]:
            tree_lines.append(f"├── {Path(relative_path).name}")
        tree_lines.append(f"└── {Path(css_paths[-1]).name}")
        src_text += (
            "\n## 当前活动CSS结构\n\n"
            "`MOD-002` 已将根目录单体样式迁入以下真实页面入口：\n\n"
            "```text\n"
            + "\n".join(tree_lines)
            + "\n```\n\n"
            "`index.css` 只固定导入顺序；具体规则保留在八个连续模块中。"
            "后续修改不得重新创建根目录 `styles.css`。\n"
        )
    write_text("src/README.md", src_text)


def main() -> int:
    css_paths = split_stylesheet()
    update_index()
    update_service_worker(css_paths)
    update_quality_baseline()
    update_size_checker()
    update_module_contract(css_paths)
    update_python_contract(css_paths)
    update_docs(css_paths)
    print(
        "CWAPI_REPORT: "
        f"mod_002_split css_files={len(css_paths)} "
        f"source_sha256={SOURCE_SHA256} legacy_styles_removed=true"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
