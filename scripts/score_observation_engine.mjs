import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CARD_PROFILE_IDS, loadCardProfile } from "../src/knowledge/cards/registry.js";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { LEGACY_POSITION_OPERATOR_GROUPS as POSITION_OPERATOR_GROUPS } from "../src/knowledge/spreads/operators/index.js";
import { LEGACY_SPREAD_GRAPHS_V1 as SPREAD_GRAPHS, validateSpreadGraph } from "../src/engine/observations/spread-graphs.js";
import { createObservation } from "../src/engine/observations/observation-engine.js";
import { validateObservation } from "../src/engine/validation/observation-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(root, ".qa/observation-engine-report.json");
const mode = process.argv.includes("--write") ? "write" : "check";
const schema = JSON.parse(fs.readFileSync(path.join(root, "src/knowledge/schemas/observation.schema.json"), "utf8"));
const cards = await Promise.all(CARD_PROFILE_IDS.map(loadCardProfile));
const questions = await Promise.all(QUESTION_PROFILE_IDS.map(loadQuestionProfile));
const operators = Object.values(POSITION_OPERATOR_GROUPS).flat();

function stableHash(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function reversedMode(card, key) {
  return card.reversal.supportedModes[stableHash(key) % card.reversal.supportedModes.length];
}

let schemaPassed = 0;
let deterministicPassed = 0;
let semanticReferencePassed = 0;
let directMatchScenarios = 0;
let positionMediatedScenarios = 0;
let questionPositionScenarios = 0;
let cardPositionScenarios = 0;
const validationFailures = [];
const graphFailures = [];
const differentiationFailures = [];
const reversalModes = new Set();

for (const graph of Object.values(SPREAD_GRAPHS)) {
  graphFailures.push(...validateSpreadGraph(graph, "1.0.0"));
}

function execute(card, question, operator, orientation, modeKey) {
  const reversalMode = orientation === "reversed" ? reversedMode(card, modeKey) : null;
  if (reversalMode) reversalModes.add(reversalMode);
  const input = { card, question, operator, orientation, reversalMode };
  const first = createObservation(input);
  const second = createObservation(input);
  const errors = validateObservation(first, { card, question, operator, schema });
  if (!errors.length) schemaPassed += 1;
  else validationFailures.push({ key: modeKey, errors });
  if (JSON.stringify(first) === JSON.stringify(second)) deterministicPassed += 1;
  if (first.semanticUnitRef.startsWith(`${card.id}#`) && first.sourceRefs.length) semanticReferencePassed += 1;
  if (first.dimensionMatchMode === "direct") directMatchScenarios += 1;
  else if (first.dimensionMatchMode === "position-mediated") positionMediatedScenarios += 1;
  return first;
}

for (const question of questions) {
  for (const operator of operators) {
    const card = cards[stableHash(`${question.id}:${operator.spreadId}:${operator.positionId}`) % cards.length];
    execute(card, question, operator, "upright", `qp:u:${question.id}:${operator.positionId}`);
    execute(card, question, operator, "reversed", `qp:r:${question.id}:${operator.positionId}`);
    questionPositionScenarios += 2;
  }
}

for (const card of cards) {
  for (const operator of operators) {
    const question = questions[stableHash(`${card.id}:${operator.spreadId}:${operator.positionId}`) % questions.length];
    execute(card, question, operator, "upright", `cp:u:${card.id}:${operator.positionId}`);
    execute(card, question, operator, "reversed", `cp:r:${card.id}:${operator.positionId}`);
    cardPositionScenarios += 2;
  }
}

let differentiationPassed = 0;
let differentiationTotal = 0;
for (const card of cards) {
  for (const spreadId of ["timeline", "cross", "celtic"]) {
    const spreadOperators = POSITION_OPERATOR_GROUPS[spreadId];
    const question = questions[stableHash(`${card.id}:${spreadId}:difference`) % questions.length];
    const left = createObservation({ card, question, operator: spreadOperators[0], orientation: "upright", reversalMode: null });
    const right = createObservation({ card, question, operator: spreadOperators.at(-1), orientation: "upright", reversalMode: null });
    const differs = (
      left.semanticUnitRef !== right.semanticUnitRef
      || left.selectedFacet !== right.selectedFacet
      || JSON.stringify(left.matchedDimensions) !== JSON.stringify(right.matchedDimensions)
    );
    differentiationTotal += 1;
    if (differs) differentiationPassed += 1;
    else differentiationFailures.push({ cardId: card.id, spreadId, left: left.semanticUnitRef, right: right.semanticUnitRef });
  }
}

const totalScenarios = questionPositionScenarios + cardPositionScenarios;
const report = {
  schemaVersion: "1.0.0",
  scope: "phase-4-fixed-graphs-and-observation-engine",
  generatedAt: "2026-07-31",
  summary: {
    totalCards: cards.length,
    totalQuestions: questions.length,
    totalPositions: operators.length,
    graphCount: Object.keys(SPREAD_GRAPHS).length,
    graphNodes: Object.values(SPREAD_GRAPHS).flatMap((graph) => graph.nodes).length,
    graphEdges: Object.values(SPREAD_GRAPHS).flatMap((graph) => graph.edges).length,
    questionPositionScenarios,
    cardPositionScenarios,
    totalScenarios,
    directMatchScenarios,
    positionMediatedScenarios,
    schemaPassRate: schemaPassed / totalScenarios,
    deterministicPassRate: deterministicPassed / totalScenarios,
    semanticReferencePassRate: semanticReferencePassed / totalScenarios,
    positionDifferentiationPassed: differentiationPassed,
    positionDifferentiationTotal: differentiationTotal,
    positionDifferentiationPassRate: differentiationPassed / differentiationTotal,
    reversalModeCoverage: [...reversalModes].sort(),
  },
  graphFailures,
  validationFailures,
  differentiationFailures,
};
const encoded = `${JSON.stringify(report, null, 2)}\n`;
if (mode === "write") {
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, encoded);
} else {
  assert.equal(fs.readFileSync(reportPath, "utf8").replace(/\r\n?/g, "\n"), encoded);
}
assert.deepEqual(graphFailures, []);
assert.deepEqual(validationFailures, []);
assert.deepEqual(differentiationFailures, []);
assert.equal(directMatchScenarios + positionMediatedScenarios, totalScenarios);
assert.ok(directMatchScenarios > 0);
assert.ok(positionMediatedScenarios > 0);
assert.equal(report.summary.schemaPassRate, 1);
assert.equal(report.summary.deterministicPassRate, 1);
assert.equal(report.summary.semanticReferencePassRate, 1);
assert.equal(report.summary.positionDifferentiationPassRate, 1);
console.log(JSON.stringify(report.summary));
