#!/usr/bin/env python3
"""Stabilize history compatibility and mixed-release detection APIs."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "src" / "platform" / "release-compatibility.js"
content = path.read_text(encoding="utf-8")

old_history = '''export function historyCompatibility(record, matrix) {
  const version = String(record?.schemaVersion || "1.0.0");
  const policy = matrix?.historySchemas?.[version];
  if (!policy) return Object.freeze({ mode: "read-only", reason: "unknown-schema" });
  return Object.freeze({ mode: policy.mode, reason: policy.reason || null });
}'''
new_history = '''export function historyCompatibility(record, matrix) {
  const version = String(record?.schemaVersion || "1.0.0");
  const policy = matrix?.historySchemas?.[version];
  return policy?.mode || "read-only";
}'''
if new_history not in content:
    if old_history not in content:
        raise RuntimeError("History compatibility API marker not found.")
    content = content.replace(old_history, new_history, 1)

old_mixed = '''export function detectMixedRelease({ shellReleaseId, artifactReleaseId }) {
  const mixed = Boolean(shellReleaseId && artifactReleaseId && shellReleaseId !== artifactReleaseId);
  return Object.freeze({
    mixed,
    action: mixed ? "reload-or-rollback" : "continue",
  });
}'''
new_mixed = '''export function detectMixedRelease({
  matrix = null,
  appVersion = null,
  artifactManifest = null,
  offlineStatus = null,
  shellReleaseId = null,
  artifactReleaseId = null,
} = {}) {
  const expectedVersion = matrix?.release
    || artifactManifest?.appVersion
    || artifactManifest?.applicationVersion
    || artifactManifest?.version
    || artifactReleaseId
    || null;
  const currentVersion = appVersion || shellReleaseId || null;
  const reportedReleaseId = offlineStatus?.releaseId || artifactReleaseId || null;
  const activeReleaseId = offlineStatus?.activeReleaseId || shellReleaseId || null;
  const versionMismatch = Boolean(currentVersion && expectedVersion && currentVersion !== expectedVersion);
  const cacheMismatch = Boolean(reportedReleaseId && activeReleaseId && reportedReleaseId !== activeReleaseId);
  const mixed = versionMismatch || cacheMismatch;
  return Object.freeze({
    mixed,
    action: mixed ? "reload-or-rollback" : "continue",
    versionMismatch,
    cacheMismatch,
  });
}'''
if new_mixed not in content:
    if old_mixed not in content:
        raise RuntimeError("Mixed release detection marker not found.")
    content = content.replace(old_mixed, new_mixed, 1)

with path.open("w", encoding="utf-8", newline="\n") as handle:
    handle.write(content.rstrip() + "\n")
print("Phase 9 compatibility helpers expose mode strings and detect version/cache mismatches.")
