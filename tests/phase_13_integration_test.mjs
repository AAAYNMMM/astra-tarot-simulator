import assert from "node:assert/strict";

import { TarotData } from "../src/knowledge/legacy/index.js";
import { createReadingFactory } from "../src/app/controllers/reading-controller.js";
import { serializeReadingForWorker } from "../src/app/controllers/engine-synthesis.js";
import { createReadingRandomContextFactory } from "../src/core/random/production-random.js";
import { executeDecisiveReading } from "../src/engine/decisive/reading.js";
import { AssessmentError } from "../src/engine/assessment/assessment-signal.js";
import { createEvaluationSetupRenderer } from "../src/ui/renderers/evaluation-setup.js";

const randomFactory = createReadingRandomContextFactory();
const timeline = TarotData.spreads.find((spread) => spread.id === "timeline");
const single = TarotData.spreads.find((spread) => spread.id === "single");
const categoryFor = (questionId) => TarotData.categories.find((category) => category.questions.some((item) => item.id === questionId));
const questionFor = (questionId) => categoryFor(questionId).questions.find((item) => item.id === questionId);

function readingFor({ questionId, seed, selection, spread = timeline }) {
  const category = categoryFor(questionId);
  const question = questionFor(questionId);
  const createReading = createReadingFactory({
    deck: TarotData.deck,
    selectors: {
      currentCategory: () => category,
      currentQuestion: () => question,
      currentSpread: () => spread,
      currentDeckStyle: () => "rws",
    },
    createRandomContext: () => randomFactory({ rootSeed: seed }),
    now: () => new Date("2026-08-01T00:00:00.000Z"),
  });
  return createReading({ evaluationSelection: selection });
}

function errorCode(action) {
  return action().then(
    () => { throw new Error("Expected AssessmentError."); },
    (error) => {
      assert.equal(error instanceof AssessmentError, true, error?.message);
      return error.code;
    },
  );
}

const loveSelections = [
  { outputContract: "alignment-grade", expectationId: "develop-relationship", criterionId: null, comparisonOptions: [] },
  { outputContract: "alignment-grade", expectationId: "end-relationship", criterionId: null, comparisonOptions: [] },
];
const loveReadings = loveSelections.map((selection) => readingFor({ questionId: "love-future", seed: "phase-13-same-root", selection }));
assert.deepEqual(
  loveReadings[0].draws.map((draw) => [draw.card.id, draw.reversed]),
  loveReadings[1].draws.map((draw) => [draw.card.id, draw.reversed]),
);
const loveResults = await Promise.all(loveReadings.map((reading) => executeDecisiveReading(serializeReadingForWorker(reading))));
assert.ok(loveResults.every((result) => result.protocolVersion === "2.0.0"));
assert.deepEqual(loveResults[0].engineResult, loveResults[1].engineResult);
assert.deepEqual(loveResults.map((result) => result.assessment.selection.expectationId), ["develop-relationship", "end-relationship"]);

const comparisonBase = {
  outputContract: "comparison-support",
  expectationId: null,
  comparisonOptions: [{ id: "a", label: "继续当前路径" }, { id: "b", label: "先做替代实验" }],
};
const comparisonReadings = ["stability", "growth"].map((criterionId) => readingFor({
  questionId: "decision-option",
  seed: "phase-13-comparison-root",
  selection: { ...comparisonBase, criterionId },
}));
assert.deepEqual(
  comparisonReadings[0].draws.map((draw) => [draw.card.id, draw.reversed]),
  comparisonReadings[1].draws.map((draw) => [draw.card.id, draw.reversed]),
);
const comparisonResults = await Promise.all(comparisonReadings.map((reading) => executeDecisiveReading(serializeReadingForWorker(reading))));
assert.deepEqual(comparisonResults[0].engineResult, comparisonResults[1].engineResult);
assert.deepEqual(comparisonResults.map((result) => result.assessment.selection.criterionId), ["stability", "growth"]);
assert.deepEqual(comparisonResults.map((result) => result.assessment.comparison[0].evaluation.criterionFocus.id), ["stability", "growth"]);
assert.notDeepEqual(
  comparisonResults[0].assessment.comparison[0].evaluation.criterionFocus,
  comparisonResults[1].assessment.comparison[0].evaluation.criterionFocus,
  "the selected criterion must change assessment focus without changing engine evidence",
);

const lovePayload = serializeReadingForWorker(loveReadings[0]);
assert.equal(await errorCode(() => executeDecisiveReading({ ...lovePayload, expectationId: null })), "ASSESSMENT_EXPECTATION_REQUIRED");
const singleReading = readingFor({ questionId: "love-future", seed: "phase-13-single", spread: single, selection: loveSelections[0] });
assert.equal(await errorCode(() => executeDecisiveReading(serializeReadingForWorker(singleReading))), "ASSESSMENT_SPREAD_INELIGIBLE");
const missingCriterion = serializeReadingForWorker(comparisonReadings[0]);
missingCriterion.criterionId = null;
assert.equal(await errorCode(() => executeDecisiveReading(missingCriterion)), "ASSESSMENT_CRITERION_REQUIRED");

for (const assessment of [loveResults[0].assessment, loveResults[1].assessment, comparisonResults[0].assessment]) {
  const presentation = assessment.presentation;
  assert.equal("cardEvidence" in presentation, false);
  assert.doesNotMatch(JSON.stringify(presentation), /圣杯|宝剑|权杖|星币|愚者|恋人|命运之轮/u);
}
const observeReading = readingFor({
  questionId: "love-future",
  seed: "phase-13-observe",
  selection: { ...loveSelections[0], expectationId: "observe-only" },
});
const observeResult = await executeDecisiveReading(serializeReadingForWorker(observeReading));
assert.equal(observeResult.assessment.presentation.grade, null);
assert.equal(comparisonResults[0].assessment.presentation.grade, null);

class FakeNode {
  constructor(tag = "div") { this.tagName = tag; this.children = []; this.dataset = {}; this.disabled = false; this.hidden = false; this.value = ""; this.maxLength = 0; this.textContent = ""; this.className = ""; this.attributes = {}; }
  setAttribute(name, value) { this.attributes[name] = value; }
  append(...items) { this.children.push(...items); }
  replaceChildren(...items) { this.children = items; }
  querySelectorAll(selector) {
    const result = [];
    const visit = (node) => { for (const child of node.children) { if (selector === "button, input" && ["button", "input"].includes(child.tagName)) result.push(child); visit(child); } };
    visit(this);
    return result;
  }
}
const documentRef = { createElement: (tag) => new FakeNode(tag) };
const setupState = { expectationId: null, criterionId: null, comparisonOptionA: "", comparisonOptionB: "" };
const dom = {
  evaluationSetupSection: new FakeNode(), evaluationSetupHeading: new FakeNode(), evaluationSetupHint: new FakeNode(),
  evaluationValidationMessage: new FakeNode(), startReading: new FakeNode("button"), expectationList: new FakeNode(),
  criterionList: new FakeNode(), comparisonPathFields: new FakeNode(), comparisonOptionA: new FakeNode("input"), comparisonOptionB: new FakeNode("input"),
};
const alignmentPolicy = { outputContract: "alignment-grade", expectations: [{ id: "go", label: "推进", resultMode: "alignment-grade" }], criteria: [] };
const setup = createEvaluationSetupRenderer({ documentRef, state: setupState, dom, currentPolicy: () => alignmentPolicy });
setup.renderEvaluationSetup();
assert.equal(dom.startReading.disabled, true);
setupState.expectationId = "go";
setup.renderEvaluationSetup();
assert.equal(dom.startReading.disabled, false);
setup.setLocked(true);
assert.equal(dom.startReading.disabled, true);
assert.ok(dom.expectationList.querySelectorAll("button, input").every((item) => item.disabled));

const comparisonState = { expectationId: null, criterionId: null, comparisonOptionA: "same", comparisonOptionB: "same" };
const comparisonDom = { ...dom, expectationList: new FakeNode(), criterionList: new FakeNode(), comparisonPathFields: new FakeNode(), comparisonOptionA: new FakeNode("input"), comparisonOptionB: new FakeNode("input"), startReading: new FakeNode("button") };
comparisonDom.comparisonPathFields.append(comparisonDom.comparisonOptionA, comparisonDom.comparisonOptionB);
const renderer = createEvaluationSetupRenderer({ documentRef, state: comparisonState, dom: comparisonDom, currentPolicy: () => ({ outputContract: "comparison-support", expectations: [], criteria: [{ id: "stability", label: "稳定" }] }) });
renderer.renderEvaluationSetup();
assert.equal(comparisonDom.startReading.disabled, true);
comparisonState.criterionId = "stability";
comparisonState.comparisonOptionB = "different";
renderer.renderEvaluationSetup();
assert.equal(comparisonDom.startReading.disabled, false);
renderer.setLocked(true);
assert.ok(comparisonDom.criterionList.querySelectorAll("button, input").every((item) => item.disabled));
assert.equal(comparisonDom.comparisonOptionA.disabled, true);
assert.equal(comparisonDom.comparisonOptionB.disabled, true);

console.log("Phase 13 integration passed: invariant evidence, protocol gates, presentation boundaries, and locked evaluation setup.");
