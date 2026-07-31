import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GOLDEN_CARD_IDS, loadGoldenCardProfile } from "../src/knowledge/cards/registry.js";
import { QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { POSITION_OPERATOR_GROUPS, getPositionOperator } from "../src/knowledge/spreads/operators/index.js";
import { createMinimalObservation } from "../src/engine/observations/minimal-consumer.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const progress = fs.readFileSync(path.join(root, "docs/PROGRESS.md"), "utf8");
assert.match(progress, /Phase 1状态 \| `PARENT-DONE`/);
assert.match(progress, /Phase 1状态 \| `PARENT-DONE`/);
assert.equal(GOLDEN_CARD_IDS.length, 6);
const quality = readJson(".qa/golden-card-report.json");
assert.equal(quality.summary.admitted, 6);
assert.ok(quality.summary.minimum >= 90);
assert.equal(readJson(".qa/evaluation/blind-manifest.json").repositoryContainsCaseContent, false);
assert.equal(QUESTION_CLASSIFICATIONS.length, 42);
assert.equal(QUESTION_PROFILE_IDS.length, 42);
for (const questionId of QUESTION_PROFILE_IDS) {
  const profile = await loadQuestionProfile(questionId);
  assert.equal(profile.id, questionId);
}
const operators = Object.values(POSITION_OPERATOR_GROUPS).flat();
assert.equal(operators.length, 19);
const fixtures = readJson("tests/fixtures/consumer/cases.json");
assert.equal(fixtures.length, 12);
for (const fixture of fixtures) {
  const observation = createMinimalObservation({
    card: await loadGoldenCardProfile(fixture.cardId),
    question: await loadQuestionProfile(fixture.questionId),
    operator: getPositionOperator(fixture.spreadId, fixture.positionId),
    orientation: fixture.orientation,
    reversalMode: fixture.reversalMode,
  });
  assert.equal(observation.cardId, fixture.cardId);
}
for (const removed of ["automation/phase_1_apply.py", "automation/phase_1_finalize.py"]) {
  assert.equal(fs.existsSync(path.join(root, removed)), false, `${removed} must not remain`);
}
console.log("Phase 1 terminal gate passed: vocabularies, custody, six golden cards, 42 questions, 19 operators, and consumer validation.");
