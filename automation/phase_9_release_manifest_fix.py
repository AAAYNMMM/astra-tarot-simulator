#!/usr/bin/env python3
"""Stabilize the 2.0.0 release manifest against benchmark timing jitter."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FAILED_FINAL_TASK = "01KYXMN0PH9V7AG0000000000A"
NEW_FINAL_TASK = "01KYXMR0PH9V7AG0000000000B"


def write_lf(path: Path, content: str) -> None:
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content.rstrip() + "\n")


generator_path = ROOT / "scripts" / "generate_release_manifest.mjs"
generator = generator_path.read_text(encoding="utf-8")
old_hash_function = '''function hash(relative) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relative))).digest("hex");
}
'''
new_hash_function = '''function hash(relative) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relative))).digest("hex");
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonical(value[key])]),
  );
}

function stablePerformanceHash(report) {
  const measurements = Object.fromEntries(
    Object.entries(report.measurements || {}).filter(([key]) => !key.endsWith("Ms")),
  );
  const evidence = canonical({
    schemaVersion: report.schemaVersion,
    reportId: report.reportId,
    budgets: report.budgets,
    measurements,
    checks: report.checks,
    status: report.status,
  });
  return crypto.createHash("sha256").update(JSON.stringify(evidence)).digest("hex");
}
'''
if new_hash_function not in generator:
    if old_hash_function not in generator:
        raise RuntimeError("Release manifest hash helper marker not found.")
    generator = generator.replace(old_hash_function, new_hash_function, 1)
old_performance_hash = '    performance: hash(".qa/release/performance-report.json"),'
new_performance_hash = '    performance: stablePerformanceHash(performance),'
if new_performance_hash not in generator:
    if old_performance_hash not in generator:
        raise RuntimeError("Performance report hash marker not found.")
    generator = generator.replace(old_performance_hash, new_performance_hash, 1)
write_lf(generator_path, generator)

for relative in ["docs/PROGRESS.md", "docs/PHASE_9_RELEASE.md"]:
    path = ROOT / relative
    content = path.read_text(encoding="utf-8")
    if FAILED_FINAL_TASK not in content:
        raise RuntimeError(f"Failed final task ID missing from {relative}.")
    content = content.replace(FAILED_FINAL_TASK, NEW_FINAL_TASK)
    write_lf(path, content)

phase_doc_path = ROOT / "docs" / "PHASE_9_RELEASE.md"
phase_doc = phase_doc_path.read_text(encoding="utf-8")
old_sentence = "- 2.0.0 release manifest 固定 artifact、precache、兼容矩阵、许可证、评测和验收哈希。"
new_sentence = "- 2.0.0 release manifest 固定 artifact、precache、兼容矩阵、许可证、评测和验收哈希；性能证据哈希排除非确定性的毫秒采样值。"
if new_sentence not in phase_doc:
    if old_sentence not in phase_doc:
        raise RuntimeError("Release manifest documentation marker not found.")
    phase_doc = phase_doc.replace(old_sentence, new_sentence, 1)
write_lf(phase_doc_path, phase_doc)

print(f"Phase 9 release manifest evidence stabilized; next exact validation task: {NEW_FINAL_TASK}")
