import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createReadingState, resetReadingState } from "../src/app/state/reading-state.js";
import { createSelectionSelectors } from "../src/app/selectors/current-selection.js";
import {
  createSetupRenderer,
  normalizeQuestionInput,
} from "../src/ui/renderers/setup.js";
import { SPREADS } from "../src/knowledge/spreads/definitions.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

assert.deepEqual(normalizeQuestionInput("  ＡＢ\t CD  "), {
  value: "AB CD",
  length: 5,
  valid: false,
  error: "问题不能包含控制字符。",
});
assert.equal(normalizeQuestionInput("  现在   我需要看清什么？ ").value, "现在 我需要看清什么?");
assert.equal(normalizeQuestionInput("问").valid, false);
assert.equal(normalizeQuestionInput("问题").valid, true);
assert.equal(normalizeQuestionInput("😀".repeat(200)).valid, true, "limits count code points, not UTF-16 units");
assert.equal(normalizeQuestionInput("😀".repeat(201)).valid, false);
assert.equal(normalizeQuestionInput(`问题${String.fromCharCode(0x85)}`).valid, false, "C1 controls are rejected");

const state = createReadingState({ categories: [{ id: "ignored" }], initialDeckStyle: "rws" });
assert.equal(state.questionText, "");
for (const retired of ["categoryId", "questionId", "expectationId", "criterionId", "comparisonOptionA", "comparisonOptionB"]) {
  assert.equal(Object.hasOwn(state, retired), false, `${retired} must not remain in reading state`);
}
state.questionText = "下一个问题";
resetReadingState(state);
assert.equal(state.questionText, "");
assert.deepEqual(SPREADS.map(({ id }) => id), ["single", "timeline", "cross", "celtic"]);

class FakeNode {
  constructor(tagName = "div") {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.dataset = {};
    this.attributes = {};
    this.className = "";
    this.disabled = false;
    this.textContent = "";
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === "disabled") this.disabled = true;
  }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.children = children; }
}

const documentRef = {
  createElement: (tagName) => new FakeNode(tagName),
  documentElement: { dataset: {} },
  querySelectorAll: () => [],
};
const dom = { spreadList: new FakeNode(), deckStyleList: new FakeNode() };
const selectors = createSelectionSelectors({ spreads: SPREADS, deckStyles: [{ id: "rws" }], state });
const renderer = createSetupRenderer({
  documentRef,
  spreads: SPREADS,
  deckStyles: [{ id: "rws" }],
  state,
  dom,
  selectors,
  cardImagePath: () => "face.jpg",
  cardBackPath: () => "back.jpg",
});
renderer.renderSpreads();
assert.equal(dom.spreadList.children.length, 4);
assert.deepEqual(dom.spreadList.children.map((button) => button.dataset.spreadId), ["single", "timeline", "cross", "celtic"]);
assert.ok(dom.spreadList.children.every((button) => button.disabled === false));
assert.ok(dom.spreadList.children.every((button) => button.attributes["aria-disabled"] === "false"));

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
for (const removed of ["questionDialog", "categoryGrid", "expectationList", "criterionList", "comparisonOptionA", "comparisonOptionB"]) {
  assert.equal(html.includes(removed), false, `index still contains retired setup control ${removed}`);
}
assert.match(html, /<label for="questionInput">/u);
assert.match(html, /aria-describedby="questionValidationMessage questionCharacterCount"/u);
assert.doesNotMatch(html, /maxlength=/u, "native maxlength counts UTF-16 units and must not override code-point validation");
assert.equal(html.includes("innerHTML"), false);

console.log("Free-question setup passed: normalized history-only input, four enabled spreads, and accessible textarea UI.");
