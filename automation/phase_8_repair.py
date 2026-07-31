#!/usr/bin/env python3
"""Repair Phase 8 view fidelity and historical gates, preserving completed custody."""

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

phase1_path = ROOT / "scripts" / "generate_phase_1_reports.mjs"
phase1 = phase1_path.read_text(encoding="utf-8")
old_phase1 = '''const blind = {
  schemaVersion: "1.0.0",
  status: "not-created",
  caseCount: 0,
  contentHash: null,
  custody: "CWapi-controlled external storage",
  repositoryContainsCaseContent: false,
  invalidatedBy: [
    "card-profile", "question-profile", "position-operator", "engine-rule",
    "weight", "template", "adapter",
  ],
};'''
new_phase1 = '''const initialBlindManifest = {
  schemaVersion: "1.0.0",
  status: "not-created",
  caseCount: 0,
  contentHash: null,
  custody: "CWapi-controlled external storage",
  repositoryContainsCaseContent: false,
  invalidatedBy: [
    "card-profile", "question-profile", "position-operator", "engine-rule",
    "weight", "template", "adapter",
  ],
};
const blindPath = path.join(root, ".qa/evaluation/blind-manifest.json");
let blind = initialBlindManifest;
if (fs.existsSync(blindPath)) {
  const currentBlind = JSON.parse(fs.readFileSync(blindPath, "utf8"));
  if (currentBlind.status === "completed") blind = currentBlind;
}'''
if new_phase1 not in phase1:
    if old_phase1 not in phase1:
        raise RuntimeError("Phase 1 blind manifest generator marker not found.")
    phase1 = phase1.replace(old_phase1, new_phase1, 1)
write_lf(phase1_path, phase1)

progress_path = ROOT / "docs" / "PROGRESS.md"
progress = progress_path.read_text(encoding="utf-8")
old_task = "01KYWJ8G4M9T6R2C7V5P0N3XQA"
new_task = "01KYWN5T8C2M7R4H9V1Q6P0ZAD"
if old_task in progress:
    progress = progress.replace(old_task, new_task, 1)
elif new_task not in progress:
    raise RuntimeError("Phase 8 implementation task metadata was not found.")
write_lf(progress_path, progress)

print("Phase 8 view fidelity, custody lifecycle, CSS freeze, Phase 1 preservation, and retry metadata repaired.")
