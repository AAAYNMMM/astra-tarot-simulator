#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GOLDEN_CARD_IDS, loadGoldenCardProfile } from "../src/knowledge/cards/registry.js";
import { scoreCardProfile } from "../src/engine/validation/card-quality-gate.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "src/knowledge/schemas/card-semantic-profile.schema.json"), "utf8"));
const cards = [];
for (const cardId of GOLDEN_CARD_IDS) cards.push(scoreCardProfile(await loadGoldenCardProfile(cardId), schema));
const report = {
  schemaVersion: "1.0.0",
  scope: "development-quality-gate-not-final-blind-review",
  admissionScore: 90,
  generatedAt: "2026-07-31",
  cards,
  summary: {
    count: cards.length,
    minimum: Math.min(...cards.map((item) => item.score)),
    average: Number((cards.reduce((sum, item) => sum + item.score, 0) / cards.length).toFixed(2)),
    admitted: cards.filter((item) => item.admitted).length,
  },
};
const text = `${JSON.stringify(report, null, 2)}
`;
if (process.argv.includes("--write")) {
  const target = path.join(root, ".qa/golden-card-report.json");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text, "utf8");
} else if (process.argv.includes("--check")) {
  const actual = fs.readFileSync(path.join(root, ".qa/golden-card-report.json"), "utf8").replace(/\r\n?/g, "\n");
  if (actual !== text) {
    console.error("Golden card quality report is stale.");
    process.exitCode = 1;
  }
}
console.log(JSON.stringify(report.summary));
