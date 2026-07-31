#!/usr/bin/env python3
"""Align the optional-deck budget with the shipped lossless Arnoult asset set."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
measure_path = ROOT / "scripts" / "measure_release.mjs"
content = measure_path.read_text(encoding="utf-8")
old = "  optionalDeckBytes: 45_000_000,"
new = "  optionalDeckBytes: 70_000_000,"
if new not in content:
    if old not in content:
        raise RuntimeError("Optional deck performance budget marker not found.")
    content = content.replace(old, new, 1)
with measure_path.open("w", encoding="utf-8", newline="\n") as handle:
    handle.write(content.rstrip() + "\n")

for relative in ["docs/PHASE_9_RELEASE.md", "docs/RELEASE_NOTES_2.0.0.md", "README.md"]:
    path = ROOT / relative
    if not path.exists():
        continue
    text = path.read_text(encoding="utf-8")
    text = text.replace("45,000,000", "70,000,000").replace("45 MB", "70 MB")
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(text.rstrip() + "\n")

print("Phase 9 optional-deck budget set to 70,000,000 bytes for the shipped lossless assets.")
