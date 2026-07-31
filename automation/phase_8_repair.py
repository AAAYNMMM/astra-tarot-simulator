#!/usr/bin/env python3
"""Repair Phase 8 view fidelity and historical gates, then bind retry metadata."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write_lf(path: Path, content: str) -> None:
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content.rstrip() + "\n")


renderer_path = ROOT / "src" / "ui" / "renderers" / "history.js"
renderer = renderer_path.read_text(encoding="utf-8")
old_renderer = '''    ? {
        conclusionType: String(record.structured.conclusionType || ""),'''
new_renderer = '''    ? {
        schemaVersion: String(record.structured.schemaVersion || "1.0.0"),
        status: String(record.structured.status || "available"),
        conclusionType: String(record.structured.conclusionType || ""),'''
if new_renderer not in renderer:
    if old_renderer not in renderer:
        raise RuntimeError("Structured history mapping marker not found.")
    renderer = renderer.replace(old_renderer, new_renderer, 1)
write_lf(renderer_path, renderer)

evaluation_path = ROOT / "tests" / "evaluation_protocol_test.mjs"
evaluation = evaluation_path.read_text(encoding="utf-8")
old_evaluation = '''assert.equal(blind.caseCount, 0);
assert.equal(blind.contentHash, null);'''
new_evaluation = '''if (blind.status === "pending") {
  assert.equal(blind.caseCount, 0);
  assert.equal(blind.contentHash, null);
} else {
  assert.equal(blind.status, "completed");
  assert.ok(blind.caseCount > 0);
  assert.match(blind.contentHash, /^[a-f0-9]{64}$/);
}'''
if new_evaluation not in evaluation:
    if old_evaluation not in evaluation:
        raise RuntimeError("Evaluation custody lifecycle marker not found.")
    evaluation = evaluation.replace(old_evaluation, new_evaluation, 1)
write_lf(evaluation_path, evaluation)

module_path = ROOT / "tests" / "module_contract_test.mjs"
module = module_path.read_text(encoding="utf-8")
old_module = 'const originalCss = cssImports.filter((item) => !item.endsWith("accent-tokens.css")).map(read).join("");'
new_module = 'const originalCss = cssImports.filter((item) => !item.endsWith("accent-tokens.css") && !item.endsWith("phase-8.css")).map(read).join("");'
if new_module not in module:
    if old_module not in module:
        raise RuntimeError("Frozen original CSS marker not found.")
    module = module.replace(old_module, new_module, 1)
write_lf(module_path, module)

progress_path = ROOT / "docs" / "PROGRESS.md"
progress = progress_path.read_text(encoding="utf-8")
old_task = "01KYWJ8G4M9T6R2C7V5P0N3XQA"
new_task = "01KYWM2R6T9C4H8N1V5Q7P0ZAB"
if old_task in progress:
    progress = progress.replace(old_task, new_task, 1)
elif new_task not in progress:
    raise RuntimeError("Phase 8 implementation task metadata was not found.")
write_lf(progress_path, progress)

print("Phase 8 view fidelity, custody lifecycle, CSS freeze, and retry metadata repaired.")
