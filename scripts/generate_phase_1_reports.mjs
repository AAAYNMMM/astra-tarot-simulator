#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PHASE_1_QUESTION_CLASSIFICATIONS as QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stable = (value) => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
    : value;
const serialize = (value) => `${JSON.stringify(stable(value), null, 2)}\n`;

const rubric = {
  version: "1.0.0",
  total: 100,
  dimensions: {
    traditionalAccuracy: 16,
    semanticCoverage: 18,
    reversalQuality: 14,
    positionCompatibility: 10,
    questionCompatibility: 10,
    relationComputability: 10,
    dimensionConsistency: 6,
    actionability: 6,
    languageDistinctiveness: 5,
    dataIntegrity: 5,
  },
};
const blind = {
  schemaVersion: "1.0.0",
  status: "not-created",
  caseCount: 0,
  contentHash: null,
  custody: "CWapi-controlled external storage",
  repositoryContainsCaseContent: false,
  invalidatedBy: [
    "card-profile", "question-profile", "position-operator", "engine-rule",
    "weight", "template", "adapter",
  ],
};
const countBy = (key) => Object.fromEntries(
  [...new Set(QUESTION_CLASSIFICATIONS.map((item) => item[key]))]
    .sort()
    .map((value) => [value, QUESTION_CLASSIFICATIONS.filter((item) => item[key] === value).length]),
);
const coverage = {
  schemaVersion: "1.0.0",
  totalQuestions: QUESTION_CLASSIFICATIONS.length,
  domains: countBy("domain"),
  intents: countBy("intent"),
  timeframes: countBy("timeframe"),
  highRisk: QUESTION_CLASSIFICATIONS.filter((item) => item.riskLevel === "high").map((item) => item.id),
};
const outputs = new Map([
  [".qa/evaluation/rubric.json", serialize(rubric)],
  [".qa/evaluation/blind-manifest.json", serialize(blind)],
  [".qa/question-coverage.json", serialize(coverage)],
]);
const check = process.argv.includes("--check");
let failed = false;
for (const [relative, expected] of outputs) {
  const absolute = path.join(root, relative);
  if (check) {
    if (!fs.existsSync(absolute)) {
      console.error(`${relative}: missing`);
      failed = true;
    } else if (fs.readFileSync(absolute, "utf8").replace(/\r\n?/g, "\n") !== expected) {
      console.error(`${relative}: stale`);
      failed = true;
    }
  } else {
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, expected, "utf8");
  }
}
console.log(JSON.stringify({
  mode: check ? "check" : "write",
  outputs: outputs.size,
  questions: QUESTION_CLASSIFICATIONS.length,
}));
if (failed) process.exitCode = 1;
