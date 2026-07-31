import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createDeterministicStreams } from "../src/core/random/deterministic-streams.js";
import { CARD_PROFILE_IDS } from "../src/knowledge/cards/registry.js";
import { QUESTION_PROFILE_IDS } from "../src/knowledge/questions/registry.js";
import { SPREADS } from "../src/knowledge/spreads/definitions.js";
import { runEvaluationSuite } from "../src/engine/evaluation/evaluation-runner.js";
import { executeReadingEngine } from "../src/engine/runtime/reading-engine.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const check = process.argv.includes("--check");
const reportPath = path.join(root, ".qa/evaluation/phase-8-evaluation-report.json");
const reviewPath = path.join(root, ".qa/evaluation/human-review-packet.json");
const corpus = JSON.parse(fs.readFileSync(path.join(root, ".qa/evaluation/multi-card-corpus.json"), "utf8"));

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

function hash(value) {
  return crypto.createHash("sha256").update(serialize(value), "utf8").digest("hex");
}

function cardIdsFor(spread, offset) {
  return spread.positions.map((_, index) => CARD_PROFILE_IDS[(offset + index * 7) % CARD_PROFILE_IDS.length]);
}

const singleCases = CARD_PROFILE_IDS.flatMap((cardId, cardIndex) => (
  ["upright", "reversed"].map((orientation, orientationIndex) => ({
    id: `single-${cardId}-${orientation}`,
    group: "single-card",
    questionId: QUESTION_PROFILE_IDS[(cardIndex * 3 + orientationIndex) % QUESTION_PROFILE_IDS.length],
    spreadId: "single",
    cardIds: [cardId],
    orientations: [orientation],
  }))
));

const questionCases = QUESTION_PROFILE_IDS.flatMap((questionId, questionIndex) => (
  SPREADS.map((spread, spreadIndex) => ({
    id: `fit-${questionId}-${spread.id}`,
    group: "question-fit",
    questionId,
    spreadId: spread.id,
    cardIds: cardIdsFor(spread, questionIndex + spreadIndex * 11),
    orientations: spread.positions.map((_, index) => (
      (questionIndex + spreadIndex + index) % 3 === 0 ? "reversed" : "upright"
    )),
  }))
));

const singleCard = await runEvaluationSuite(singleCases, { suiteId: "EV-001-single-card" });
const questionFit = await runEvaluationSuite(questionCases, { suiteId: "EV-002-question-fit" });
const multiCard = await runEvaluationSuite(corpus, { suiteId: "EV-003-multi-card" });

const reviewCases = corpus.slice(0, 18);
const reviewOutputs = [];
for (const item of reviewCases) {
  const spread = SPREADS.find((entry) => entry.id === item.spreadId);
  const result = await executeReadingEngine({
    questionId: item.questionId,
    spreadId: item.spreadId,
    draws: spread.positions.map((position, index) => ({
      cardId: item.cardIds[index],
      positionId: position.id,
      orientation: item.orientations[index],
    })),
    renderingStream: createDeterministicStreams(`review:${item.id}`).streams.rendering,
  });
  reviewOutputs.push({
    reviewId: `review-${String(reviewOutputs.length + 1).padStart(2, "0")}`,
    sourceLabel: "candidate-A",
    questionId: item.questionId,
    spreadId: item.spreadId,
    cardIds: [...item.cardIds],
    orientations: [...item.orientations],
    output: result.rendered.plainText,
    provenance: {
      claimId: result.claim.id,
      evidenceCount: result.claim.evidenceRefs.length,
      conflictCount: result.claim.conflicts.length,
    },
  });
}
const reviewPacket = {
  schemaVersion: "1.0.0",
  datasetId: "phase-8-human-review-v1",
  sourceIdentityHidden: true,
  caseCount: reviewOutputs.length,
  rubric: [
    "card-semantic-accuracy",
    "question-fit",
    "position-responsibility",
    "multi-card-integration",
    "evidence-and-conditions",
    "safety-and-boundaries",
    "clarity",
  ],
  disagreementThreshold: 1.5,
  outputs: reviewOutputs,
};
const coreScores = {
  singleCard: singleCard.averageScore,
  questionFit: questionFit.averageScore,
  multiCard: multiCard.averageScore,
};
const report = {
  schemaVersion: "1.0.0",
  reportId: "phase-8-evaluation-v1",
  suites: { singleCard, questionFit, multiCard },
  coreScores,
  thresholds: {
    eachCoreAverage: 9,
    eachCoreMinimum: 9,
    passRate: 0.95,
  },
  humanReview: {
    datasetId: reviewPacket.datasetId,
    caseCount: reviewPacket.caseCount,
    contentHash: hash(reviewPacket),
    status: "ready-for-independent-review",
  },
  summary: {
    totalCases: singleCard.caseCount + questionFit.caseCount + multiCard.caseCount,
    allCoreScoresAtLeastNine: Object.values(coreScores).every((value) => value >= 9),
    allSuitesPassed: [singleCard, questionFit, multiCard].every((suite) => suite.passed),
    status: [singleCard, questionFit, multiCard].every((suite) => suite.passed) ? "PASS" : "FAIL",
  },
};

const expected = [
  [reportPath, serialize(report)],
  [reviewPath, serialize(reviewPacket)],
];
if (check) {
  for (const [target, content] of expected) {
    if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== content) {
      console.error(`Phase 8 evaluation artifact is stale: ${path.relative(root, target)}`);
      process.exit(1);
    }
  }
} else {
  for (const [target, content] of expected) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content, "utf8");
  }
}
console.log(JSON.stringify({ summary: report.summary }));
