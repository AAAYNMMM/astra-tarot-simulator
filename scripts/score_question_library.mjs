#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUESTION_CLASSIFICATIONS, PHASE_1_QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { validateQuestionProfile } from "../src/engine/validation/question-profile-validator.js";
import { LEGACY_POSITION_OPERATOR_GROUPS as POSITION_OPERATOR_GROUPS } from "../src/knowledge/spreads/operators/index.js";
import { loadCardProfile } from "../src/knowledge/cards/registry.js";
import { createMinimalObservation } from "../src/engine/observations/minimal-consumer.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "src/knowledge/schemas/question-profile.schema.json"), "utf8"));
const normalize = (value) => value.replace(/[\s，。？！、；：“”‘’（）《》【】…—-]/g, "");
const bigrams = (value) => {
  const chars = [...normalize(value)];
  return new Set(chars.slice(0, -1).map((item, index) => item + chars[index + 1]));
};
const similarity = (left, right) => {
  const a = bigrams(left), b = bigrams(right);
  const intersection = [...a].filter((item) => b.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
};
const profileHashes = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/phase-3/base-question-profile-hashes.json"), "utf8")).profiles;
const frozenFailures = [];
for (const [questionId, expected] of Object.entries(profileHashes)) {
  const bytes = fs.readFileSync(path.join(root, `src/knowledge/questions/profiles/${questionId}.js`));
  const actual = crypto.createHash("sha256").update(bytes).digest("hex");
  if (actual !== expected) frozenFailures.push({ questionId, expected, actual });
}
const profiles = [];
const validationFailures = [];
for (const questionId of QUESTION_PROFILE_IDS) {
  const profile = await loadQuestionProfile(questionId);
  profiles.push(profile);
  const errors = validateQuestionProfile(profile, schema);
  if (errors.length) validationFailures.push({ questionId, errors });
}
const nearSynonyms = [];
for (let left = 0; left < QUESTION_CLASSIFICATIONS.length; left++) {
  for (let right = left + 1; right < QUESTION_CLASSIFICATIONS.length; right++) {
    const score = similarity(QUESTION_CLASSIFICATIONS[left].text, QUESTION_CLASSIFICATIONS[right].text);
    if (score >= 0.72) nearSynonyms.push({
      left: QUESTION_CLASSIFICATIONS[left].id,
      right: QUESTION_CLASSIFICATIONS[right].id,
      score: Number(score.toFixed(4)),
    });
  }
}
const pairCount = QUESTION_CLASSIFICATIONS.length * (QUESTION_CLASSIFICATIONS.length - 1) / 2;
const highRiskFailures = profiles.filter((profile) => profile.riskLevel === "high").flatMap((profile) => {
  const errors = [];
  const required = ["diagnosis", "financial-guarantee", "guaranteed-outcome", "third-party-certainty"];
  for (const claim of required) if (!profile.forbiddenClaims.includes(claim)) errors.push(claim);
  return errors.length ? [{ questionId: profile.id, errors }] : [];
});
const operators = Object.values(POSITION_OPERATOR_GROUPS).flat();
const card = await loadCardProfile("major-7");
let scenarioTotal = 0, scenarioPassed = 0;
const scenarioFailures = [];
for (const profile of profiles) {
  for (const operator of operators) {
    scenarioTotal++;
    try {
      const observation = createMinimalObservation({
        card,
        question: profile,
        operator,
        orientation: "upright",
        reversalMode: null,
      });
      if (observation.questionId !== profile.id || observation.positionId !== operator.positionId) {
        throw new Error("Observation identity mismatch.");
      }
      scenarioPassed++;
    } catch (error) {
      if (scenarioFailures.length < 100) scenarioFailures.push({
        questionId: profile.id,
        spreadId: operator.spreadId,
        positionId: operator.positionId,
        message: String(error.message || error),
      });
    }
  }
}
const domains = Object.fromEntries(["relationship","career","finance","growth","decision","daily"].map((domain) => [
  domain,
  profiles.filter((profile) => profile.domain === domain).length,
]));
const report = {
  schemaVersion: "1.0.0",
  scope: "phase-3-question-library-and-spread-adaptation",
  generatedAt: "2026-07-31",
  summary: {
    totalQuestions: profiles.length,
    baseQuestionsFrozen: PHASE_1_QUESTION_CLASSIFICATIONS.length,
    addedQuestions: profiles.length - PHASE_1_QUESTION_CLASSIFICATIONS.length,
    domains,
    schemaPassRate: Number(((profiles.length - validationFailures.length) / profiles.length).toFixed(4)),
    nearSynonymPairs: nearSynonyms.length,
    nearSynonymRatio: Number((nearSynonyms.length / pairCount).toFixed(6)),
    highRiskQuestions: profiles.filter((profile) => profile.riskLevel === "high").length,
    spreadScenarioPassed: scenarioPassed,
    spreadScenarioTotal: scenarioTotal,
    spreadScenarioPassRate: Number((scenarioPassed / scenarioTotal).toFixed(4)),
  },
  frozenFailures,
  validationFailures,
  nearSynonyms,
  highRiskFailures,
  scenarioFailures,
};
const text = `${JSON.stringify(report, null, 2)}\n`;
const target = path.join(root, ".qa/question-library-report.json");
if (process.argv.includes("--write")) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text, "utf8");
} else if (process.argv.includes("--check")) {
  if (!fs.existsSync(target) || fs.readFileSync(target, "utf8").replace(/\r\n?/g, "\n") !== text) {
    console.error("Phase 3 question-library report is stale.");
    process.exitCode = 1;
  }
}
console.log(JSON.stringify(report.summary));
if (
  profiles.length !== 90 ||
  Object.values(domains).some((count) => count !== 15) ||
  validationFailures.length ||
  frozenFailures.length ||
  nearSynonyms.length / pairCount > 0.05 ||
  highRiskFailures.length ||
  scenarioPassed !== scenarioTotal
) process.exitCode = 1;
