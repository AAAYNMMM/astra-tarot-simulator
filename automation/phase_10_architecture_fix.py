#!/usr/bin/env python3
"""Keep the Phase 10 Worker and renderer inside the frozen dependency graph."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write_lf(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content.rstrip() + "\n")


insight_path = ROOT / "src" / "ui" / "renderers" / "insight.js"
insight = insight_path.read_text(encoding="utf-8")
asset_import = 'import { cardImagePath } from "../../platform/assets.js";\n'
if asset_import not in insight:
    raise RuntimeError("Insight renderer platform import marker not found.")
insight = insight.replace(asset_import, "", 1)
old_signature = '''export function createInsightRenderer({
  dom,
  state,
  currentDeckStyle,
} = {}) {'''
new_signature = '''export function createInsightRenderer({
  dom,
  state,
  currentDeckStyle,
  cardImagePath,
} = {}) {
  if (typeof cardImagePath !== "function") {
    throw new TypeError("Card image path resolver is required.");
  }'''
if old_signature not in insight:
    raise RuntimeError("Insight renderer dependency-injection marker not found.")
insight = insight.replace(old_signature, new_signature, 1)
write_lf(insight_path, insight)

application_path = ROOT / "src" / "app" / "application.js"
application = application_path.read_text(encoding="utf-8")
old_renderer = '''    const { renderCardInsight, renderSummary } = createInsightRenderer({
      dom,
      state,
      currentDeckStyle,
    });'''
new_renderer = '''    const { renderCardInsight, renderSummary } = createInsightRenderer({
      dom,
      state,
      currentDeckStyle,
      cardImagePath,
    });'''
if old_renderer not in application:
    raise RuntimeError("Application insight-renderer construction marker not found.")
application = application.replace(old_renderer, new_renderer, 1)
write_lf(application_path, application)

old_worker = ROOT / "src" / "workers" / "reading-engine.worker.js"
new_worker = ROOT / "src" / "app" / "reading-engine.worker.js"
if not old_worker.exists():
    raise RuntimeError("Generated reading Worker entry was not found.")
worker = old_worker.read_text(encoding="utf-8")
worker = worker.replace(
    'import { executeDecisiveReading } from "../engine/decisive/reading.js";',
    'import { executeDecisiveReading } from "../engine/decisive/reading.js";',
    1,
)
write_lf(new_worker, worker)
old_worker.unlink()
try:
    old_worker.parent.rmdir()
except OSError:
    pass

client_path = ROOT / "src" / "app" / "engine-worker-client.js"
client = client_path.read_text(encoding="utf-8")
old_url = 'workerUrl = new URL("../workers/reading-engine.worker.js", import.meta.url),'
new_url = 'workerUrl = new URL("./reading-engine.worker.js", import.meta.url),'
if old_url not in client:
    raise RuntimeError("Reading Worker URL marker not found.")
client = client.replace(old_url, new_url, 1)
write_lf(client_path, client)

unused_status_css = ROOT / "src" / "styles" / "platform-status.css"
unused_status_css.unlink(missing_ok=True)

print("Phase 10 renderer injection and app-layer Worker boundaries repaired.")
