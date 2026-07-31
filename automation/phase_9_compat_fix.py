#!/usr/bin/env python3
"""Return the documented compatibility mode string from the public helper."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "src" / "platform" / "release-compatibility.js"
content = path.read_text(encoding="utf-8")
old = '''export function historyCompatibility(record, matrix) {
  const version = String(record?.schemaVersion || "1.0.0");
  const policy = matrix?.historySchemas?.[version];
  if (!policy) return Object.freeze({ mode: "read-only", reason: "unknown-schema" });
  return Object.freeze({ mode: policy.mode, reason: policy.reason || null });
}'''
new = '''export function historyCompatibility(record, matrix) {
  const version = String(record?.schemaVersion || "1.0.0");
  const policy = matrix?.historySchemas?.[version];
  return policy?.mode || "read-only";
}'''
if new not in content:
    if old not in content:
        raise RuntimeError("History compatibility API marker not found.")
    content = content.replace(old, new, 1)
with path.open("w", encoding="utf-8", newline="\n") as handle:
    handle.write(content.rstrip() + "\n")
print("Phase 9 history compatibility helper returns its public mode string.")
