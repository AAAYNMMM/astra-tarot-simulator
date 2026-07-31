#!/usr/bin/env python3
"""Repair Phase 8 structured-history view fidelity and bind retry metadata."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
renderer_path = ROOT / "src" / "ui" / "renderers" / "history.js"
renderer = renderer_path.read_text(encoding="utf-8")
old = '''    ? {
        conclusionType: String(record.structured.conclusionType || ""),'''
new = '''    ? {
        schemaVersion: String(record.structured.schemaVersion || "1.0.0"),
        status: String(record.structured.status || "available"),
        conclusionType: String(record.structured.conclusionType || ""),'''
if new not in renderer:
    if old not in renderer:
        raise RuntimeError("Structured history mapping marker not found.")
    renderer = renderer.replace(old, new, 1)
with renderer_path.open("w", encoding="utf-8", newline="\n") as handle:
    handle.write(renderer.rstrip() + "\n")

progress_path = ROOT / "docs" / "PROGRESS.md"
progress = progress_path.read_text(encoding="utf-8")
old_task = "01KYWJ8G4M9T6R2C7V5P0N3XQA"
new_task = "01KYWK4P7R8M2N6C9V1H5Q0ZAD"
if old_task in progress:
    progress = progress.replace(old_task, new_task, 1)
elif new_task not in progress:
    raise RuntimeError("Phase 8 implementation task metadata was not found.")
with progress_path.open("w", encoding="utf-8", newline="\n") as handle:
    handle.write(progress.rstrip() + "\n")

print("Phase 8 structured history view and retry metadata repaired.")
