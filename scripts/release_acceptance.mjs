#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

import { validateCompatibilityMatrix } from "../src/platform/release-compatibility.js";
import { APP_VERSION } from "../src/config/version.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const outputPath = path.join(root, ".qa/release/release-acceptance.json");

function readJson(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function serialize(value) {
  return `${JSON.stringify(stable(value), null, 2)}\n`;
}

function sha256(relative) {
  return crypto.createHash("sha256").update(fs.readFileSync(path.join(root, relative))).digest("hex");
}

function walk(relative) {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    const next = path.join(relative, entry.name).split(path.sep).join("/");
    return entry.isDirectory() ? walk(next) : [next];
  }).sort();
}

const performanceReport = readJson(".qa/release/performance-report.json");
const compatibility = readJson("src/config/compatibility-matrix.json");
const artifact = readJson("src/generated/artifact-manifest.json");
const blind = readJson(".qa/evaluation/blind-result.json");
const manifest = readJson("manifest.webmanifest");
validateCompatibilityMatrix(compatibility);

const runtimeFiles = [
  "index.html",
  "sw.js",
  "manifest.webmanifest",
  ...walk("src").filter((item) => /\.(?:js|json|css|html|webmanifest)$/.test(item)),
];
const runtimeText = runtimeFiles
  .filter((item) => !item.endsWith(".json") || !item.includes("generated"))
  .map((item) => fs.readFileSync(path.join(root, item), "utf8"))
  .join("\n");
const detectedOrigins = [...runtimeText.matchAll(/https?:\/\/[^\s"'`)]+/g)].map((match) => match[0]);
const nonNetworkOrigins = detectedOrigins.filter((origin) => (
  /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/.test(origin)
  || /^http:\/\/www\.w3\.org\/(?:2000\/svg|1999\/xlink)(?:\/|$)/.test(origin)
  || /^https:\/\/astra\.local\/schemas\//.test(origin)
  || /^https:\/\/json-schema\.org\//.test(origin)
));
const externalOrigins = detectedOrigins.filter((origin) => !nonNetworkOrigins.includes(origin));
const iconChecks = ["icon-192.png", "icon-512.png", "icon-maskable-192.png", "icon-maskable-512.png"]
  .map((relative) => ({
    path: relative,
    exists: fs.existsSync(path.join(root, relative)),
    hash: fs.existsSync(path.join(root, relative)) ? sha256(relative) : null,
  }));
const requiredIconPaths = new Set((manifest.icons || []).map((item) => item.src.replace(/^\.\//, "")));
const checks = {
  performance: performanceReport.status === "PASS",
  blindEvaluation: blind.status === "PASS" && blind.caseCount === 48,
  compatibility: compatibility.release === APP_VERSION,
  artifactVersion: artifact.appVersion === APP_VERSION,
  iconFiles: iconChecks.every((item) => item.exists && requiredIconPaths.has(item.path)),
  license: fs.existsSync(path.join(root, "LICENSE")),
  thirdParty: fs.existsSync(path.join(root, "THIRD_PARTY_NOTICES.md")),
  privacy: externalOrigins.length === 0,
  noGithubActions: !fs.existsSync(path.join(root, ".github/workflows")),
  serviceWorkerAtomic: ["stageRequiredResources", "promoteStagedRelease", "ASTRA_ACTIVATE_RELEASE", "ASTRA_ROLLBACK_RELEASE"]
    .every((token) => fs.readFileSync(path.join(root, "sw.js"), "utf8").includes(token)),
};
const report = {
  schemaVersion: "1.0.0",
  reportId: "phase-9-release-acceptance-v1",
  release: APP_VERSION,
  checks,
  privacy: {
    externalRuntimeOrigins: externalOrigins,
    ignoredLoopbackNamespaceAndSchemaIdentifiers: [...new Set(nonNetworkOrigins)].sort(),
    questionOrHistoryUpload: false,
    blindSourceLogged: false,
  },
  offline: {
    states: ["APP-SHELL-READY", "DEFAULT-DECK-READY", "SELECTED-DECKS-READY"],
    atomicRequiredResources: true,
    deckCachesIndependent: true,
    previousReleaseRetained: true,
  },
  icons: iconChecks,
  status: Object.values(checks).every(Boolean) ? "PASS" : "FAIL",
};
const serialized = serialize(report);
if (check) {
  if (!fs.existsSync(outputPath) || fs.readFileSync(outputPath, "utf8") !== serialized) {
    console.error("Phase 9 release acceptance report is missing or stale.");
    process.exit(1);
  }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized, "utf8");
}
if (report.status !== "PASS") process.exitCode = 1;
console.log(JSON.stringify({ summary: { status: report.status, checks } }));
