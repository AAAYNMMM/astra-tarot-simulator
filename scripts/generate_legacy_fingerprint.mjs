#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TarotData } from "../src/knowledge/legacy/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serialized = JSON.stringify(TarotData);
const output = {
  schemaVersion: 1,
  algorithm: "sha256-json-stringify",
  sha256: crypto.createHash("sha256").update(serialized).digest("hex"),
  bytes: Buffer.byteLength(serialized),
  cards: TarotData.deck.length,
  questions: TarotData.categories.reduce((sum, category) => sum + category.questions.length, 0),
  spreads: TarotData.spreads.length,
  sourceCommit: "phase-3-question-expansion",
};
const target = path.join(root, "tests/fixtures/legacy-knowledge-fingerprint.json");
const text = `${JSON.stringify(output, null, 2)}\n`;
if (process.argv.includes("--write")) {
  fs.writeFileSync(target, text, "utf8");
} else if (process.argv.includes("--check")) {
  if (!fs.existsSync(target) || fs.readFileSync(target, "utf8").replace(/\r\n?/g, "\n") !== text) {
    console.error("Legacy knowledge fingerprint is stale.");
    process.exitCode = 1;
  }
}
console.log(JSON.stringify(output));
