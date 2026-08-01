#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

import { createDeterministicStreams } from "../src/core/random/deterministic-streams.js";
import { executeReadingEngine } from "../src/engine/runtime/reading-engine.js";
import { CARD_PROFILE_IDS } from "../src/knowledge/cards/registry.js";
import { SPREADS } from "../src/knowledge/spreads/definitions.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const outputPath = path.join(root, ".qa/release/performance-report.json");
const precacheSource = fs.readFileSync(path.join(root, "src/generated/precache-manifest.js"), "utf8");
const manifestMatch = precacheSource.match(/value: Object\.freeze\((\{.*\})\),\n    writable:/s);
if (!manifestMatch) throw new Error("Unable to parse generated precache manifest.");
const precache = JSON.parse(manifestMatch[1]);

function fileBytes(relative) {
  const normalized = relative.replace(/^\.\//, "");
  if (relative === "./") return fs.statSync(path.join(root, "index.html")).size;
  return fs.statSync(path.join(root, normalized)).size;
}

function totalBytes(paths) {
  return [...new Set(paths)].reduce((sum, item) => sum + fileBytes(item), 0);
}

const celtic = SPREADS.find((entry) => entry.id === "celtic");
const draws = celtic.positions.map((position, index) => ({
  cardId: CARD_PROFILE_IDS[(index * 7 + 3) % CARD_PROFILE_IDS.length],
  positionId: position.id,
  orientation: index % 3 === 0 ? "reversed" : "upright",
}));

await executeReadingEngine({
  questionId: "career-change",
  spreadId: "celtic",
  draws,
  renderingStream: createDeterministicStreams("phase-9-warmup").streams.rendering,
});

const timings = [];
let sampleResult = null;
for (let index = 0; index < 30; index += 1) {
  const started = performance.now();
  sampleResult = await executeReadingEngine({
    questionId: "career-change",
    spreadId: "celtic",
    draws,
    renderingStream: createDeterministicStreams(`phase-9-${index}`).streams.rendering,
  });
  timings.push(performance.now() - started);
}
timings.sort((a, b) => a - b);
const percentile = (ratio) => timings[Math.min(timings.length - 1, Math.floor(timings.length * ratio))];

const deckBytes = Object.fromEntries(
  Object.entries(precache.optionalDecks).map(([deckId, files]) => [deckId, totalBytes(files)]),
);
const budgets = {
  shellBytes: 2_500_000,
  knowledgeBytes: 8_000_000,
  defaultDeckBytes: 45_000_000,
  optionalDeckBytes: 70_000_000,
  engineP95Ms: 250,
  readingRecordBytes: 524_288,
  diagnosticsBytes: 262_144,
  targetHistoryRecords: 1000,
};
const measurements = {
  shellBytes: totalBytes(precache.required.shell),
  knowledgeBytes: totalBytes(precache.required.knowledge),
  deckBytes,
  engineMedianMs: Number(percentile(0.5).toFixed(3)),
  engineP95Ms: Number(percentile(0.95).toFixed(3)),
  readingRecordBytes: Buffer.byteLength(JSON.stringify(sampleResult), "utf8"),
  diagnosticsBytes: 128 * 1024,
  targetHistoryRecords: 1000,
};
const checks = {
  shell: measurements.shellBytes <= budgets.shellBytes,
  knowledge: measurements.knowledgeBytes <= budgets.knowledgeBytes,
  defaultDeck: measurements.deckBytes.rws <= budgets.defaultDeckBytes,
  optionalDecks: Object.entries(measurements.deckBytes)
    .filter(([deckId]) => deckId !== "rws")
    .every(([, value]) => value <= budgets.optionalDeckBytes),
  engine: measurements.engineP95Ms <= budgets.engineP95Ms,
  readingRecord: measurements.readingRecordBytes <= budgets.readingRecordBytes,
  diagnostics: measurements.diagnosticsBytes <= budgets.diagnosticsBytes,
  targetHistory: measurements.targetHistoryRecords >= budgets.targetHistoryRecords,
};
const report = {
  schemaVersion: "1.0.0",
  reportId: "phase-9-performance-v1",
  environment: {
    runtime: process.version,
    platform: process.platform,
    architecture: process.arch,
    cases: 30,
    spread: "celtic",
  },
  budgets,
  measurements,
  checks,
  status: Object.values(checks).every(Boolean) ? "PASS" : "FAIL",
};

const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (check) {
  let committed = null;
  try {
    committed = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  } catch {
    committed = null;
  }
  const stableMeasurements = (measurements = {}) => Object.fromEntries(
    Object.entries(measurements).filter(([key]) => !key.endsWith("Ms")),
  );
  const stable = Boolean(
    committed
      && committed.schemaVersion === report.schemaVersion
      && committed.release === report.release
      && JSON.stringify(committed.budgets) === JSON.stringify(report.budgets)
      && JSON.stringify(stableMeasurements(committed.measurements))
        === JSON.stringify(stableMeasurements(report.measurements))
      && committed.status === "PASS"
      && report.status === "PASS"
      && Object.values(committed.checks || {}).every(Boolean)
      && Object.values(report.checks || {}).every(Boolean)
  );
  if (!stable) {
    console.error("Phase 9 performance report is missing or stale.");
    process.exit(1);
  }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized, "utf8");
}
if (report.status !== "PASS") process.exitCode = 1;
console.log(JSON.stringify({ summary: { status: report.status, ...measurements } }));
