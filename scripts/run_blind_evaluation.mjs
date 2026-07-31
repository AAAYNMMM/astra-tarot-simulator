import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runEvaluationSuite } from "../src/engine/evaluation/evaluation-runner.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
const inputPath = argument("--input");
const outputPath = argument("--output");
if (!inputPath || !outputPath) {
  console.error("Usage: node scripts/run_blind_evaluation.mjs --input <external-json> --output <aggregate-json>");
  process.exit(2);
}

const manifest = JSON.parse(fs.readFileSync(path.join(root, ".qa/evaluation/blind-manifest.json"), "utf8"));
const bytes = fs.readFileSync(inputPath);
const contentHash = crypto.createHash("sha256").update(bytes).digest("hex");
if (contentHash !== manifest.contentHash) throw new Error("Blind dataset hash does not match custody manifest.");
const cases = JSON.parse(bytes.toString("utf8"));
if (!Array.isArray(cases) || cases.length !== manifest.caseCount) {
  throw new Error("Blind dataset count does not match custody manifest.");
}
const ids = new Set();
for (const item of cases) {
  if (!item || item.group !== "blind" || !/^blind-[a-z0-9-]+$/.test(item.id)) {
    throw new Error("Blind dataset contains an invalid case envelope.");
  }
  if (ids.has(item.id)) throw new Error("Blind dataset contains duplicate ids.");
  ids.add(item.id);
}
const suite = await runEvaluationSuite(cases, { suiteId: "EV-000B-final-blind" });
const result = {
  schemaVersion: "1.0.0",
  datasetHash: contentHash,
  caseCount: suite.caseCount,
  averageScore: suite.averageScore,
  minimumScore: suite.minimumScore,
  passRate: suite.passRate,
  metricRates: suite.metricRates,
  sourceContentLogged: false,
  status: suite.passed ? "PASS" : "FAIL",
};
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ summary: {
  caseCount: result.caseCount,
  averageScore: result.averageScore,
  minimumScore: result.minimumScore,
  passRate: result.passRate,
  status: result.status,
  datasetHash: result.datasetHash,
} }));
if (!suite.passed) process.exit(1);
