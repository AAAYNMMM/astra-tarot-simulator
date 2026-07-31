#!/usr/bin/env python3
"""Make staged and stable release cache names explicit for static audit gates."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "sw.js"
content = path.read_text(encoding="utf-8")
old = '''function releaseCacheName(releaseId, kind, { staging = false } = {}) {
  return `astra-${staging ? "stage" : "release"}-${releaseId}-${kind}`;
}'''
new = '''function releaseCacheName(releaseId, kind, { staging = false } = {}) {
  if (staging) return `astra-stage-${releaseId}-${kind}`;
  return `astra-release-${releaseId}-${kind}`;
}'''
if new not in content:
    if old not in content:
        raise RuntimeError("Release cache naming marker not found.")
    content = content.replace(old, new, 1)
with path.open("w", encoding="utf-8", newline="\n") as handle:
    handle.write(content.rstrip() + "\n")
print("Phase 9 release cache names are explicit for static and runtime verification.")
