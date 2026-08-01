#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const outputPath = path.join(root, ".qa/release/release-2.0.0.json");

function hash(relative) {
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

const artifact = JSON.parse(fs.readFileSync(path.join(root, "src/generated/artifact-manifest.json"), "utf8"));
const performance = JSON.parse(fs.readFileSync(path.join(root, ".qa/release/performance-report.json"), "utf8"));
const acceptance = JSON.parse(fs.readFileSync(path.join(root, ".qa/release/release-acceptance.json"), "utf8"));
const precacheSource = fs.readFileSync(path.join(root, "src/generated/precache-manifest.js"), "utf8");
const releaseId = precacheSource.match(/"releaseId":"([^"]+)"/)?.[1];
if (!releaseId) throw new Error("Generated releaseId is missing.");

const report = {
  schemaVersion: "1.0.0",
  release: "2.0.0",
  releaseId,
  status: performance.status === "PASS" && acceptance.status === "PASS" ? "RELEASED" : "BLOCKED",
  artifactManifestHash: hash("src/generated/artifact-manifest.json"),
  precacheManifestHash: hash("src/generated/precache-manifest.js"),
  compatibilityMatrixHash: hash("src/config/compatibility-matrix.json"),
  licenseHash: hash("LICENSE"),
  thirdPartyNoticesHash: hash("THIRD_PARTY_NOTICES.md"),
  reports: {
    performance: stablePerformanceHash(performance),
    acceptance: hash(".qa/release/release-acceptance.json"),
    blindEvaluation: hash(".qa/evaluation/blind-result.json"),
  },
  guarantees: {
    runtimeAI: false,
    fixedQuestions: true,
    fixedSpreads: 4,
    deterministicRules: true,
    localHistory: true,
    blindSourceInRepository: false,
  },
};
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (check) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== serialized) {
    console.error("Release 2.0.0 manifest is missing or stale.");
    process.exit(1);
  }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized, "utf8");
}
if (report.status !== "RELEASED") process.exitCode = 1;
console.log(JSON.stringify({ summary: { status: report.status, releaseId } }));
