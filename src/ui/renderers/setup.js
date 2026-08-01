import { createElement, replaceChildren, safeIdentifier, setText } from "../safe-dom.js";

export const QUESTION_MIN_LENGTH = 2;
export const QUESTION_MAX_LENGTH = 200;

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f-\u009f]/u;

export function normalizeQuestionInput(input) {
  const source = typeof input === "string" ? input : "";
  const normalized = source.normalize("NFKC").trim().replace(/\s+/gu, " ");
  const length = [...normalized].length;
  let error = "";
  if (CONTROL_CHARACTERS.test(source)) error = "问题不能包含控制字符。";
  else if (length < QUESTION_MIN_LENGTH) error = `请至少输入 ${QUESTION_MIN_LENGTH} 个字符。`;
  else if (length > QUESTION_MAX_LENGTH) error = `问题不能超过 ${QUESTION_MAX_LENGTH} 个字符。`;
  return Object.freeze({ value: normalized, length, valid: error === "", error });
}

function selectedClass(base, selected) {
  return selected ? `${base} is-selected` : base;
}

export function createSetupRenderer({
  documentRef,
  spreads,
  deckStyles,
  state,
  dom,
  selectors,
  cardImagePath,
  cardBackPath,
  onQuestionValidityChange = () => {},
}) {
  const { currentDeckStyle } = selectors;
  let locked = false;

  function renderQuestionInput() {
    const result = normalizeQuestionInput(state.questionText);
    if (dom.questionInput.value !== state.questionText) dom.questionInput.value = state.questionText;
    dom.questionInput.disabled = locked;
    dom.questionInput.setAttribute("aria-invalid", String(!result.valid));
    setText(dom.questionValidationMessage, result.error);
    setText(dom.questionCharacterCount, `${result.length} / ${QUESTION_MAX_LENGTH}`);
    dom.startReading.disabled = locked || !result.valid;
    onQuestionValidityChange(result.valid, result);
    return result;
  }

  function renderDeckStyles() {
    const nodes = deckStyles.map((style) => {
      const id = safeIdentifier(style.id);
      const button = createElement(documentRef, "button", {
        className: selectedClass(`deck-style-option deck-style-${id}`, style.id === state.deckStyleId),
        attributes: {
          type: "button",
          "aria-pressed": String(style.id === state.deckStyleId),
          "aria-label": `选择${style.name}牌面`,
          disabled: locked ? true : null,
        },
      });
      button.dataset.deckStyleId = id;
      const preview = createElement(documentRef, "span", { className: "deck-style-preview", attributes: { "aria-hidden": "true" } });
      preview.append(
        createElement(documentRef, "img", { className: "deck-style-face", attributes: { src: cardImagePath(style.previewCard, style), alt: "" } }),
        createElement(documentRef, "img", { className: "deck-style-back", attributes: { src: cardBackPath(style), alt: "" } }),
      );
      const copy = createElement(documentRef, "span", { className: "deck-style-copy" });
      copy.append(createElement(documentRef, "strong", { text: style.name }), createElement(documentRef, "small", { text: style.description }));
      button.append(preview, copy, createElement(documentRef, "span", { className: "deck-style-check", text: "✓", attributes: { "aria-hidden": "true" } }));
      return button;
    });
    replaceChildren(dom.deckStyleList, nodes);
    documentRef.documentElement.dataset.deckStyle = safeIdentifier(state.deckStyleId, "rws");
    dom.readingPanel.dataset.deckStyle = safeIdentifier(state.deckStyleId, "rws");
    dom.idleDeckImage.src = cardBackPath();
    dom.idleDeckImage.alt = `${currentDeckStyle().name}牌背`;
  }

  function renderSpreads() {
    const nodes = spreads.map((spread) => {
      const selected = spread.id === state.spreadId;
      const button = createElement(documentRef, "button", {
        className: selectedClass("spread-option", selected),
        attributes: {
          type: "button",
          "aria-pressed": String(selected),
          "aria-disabled": "false",
          disabled: locked ? true : null,
        },
      });
      button.dataset.spreadId = safeIdentifier(spread.id);
      const glyph = createElement(documentRef, "span", { className: "spread-glyph", attributes: { "aria-hidden": "true" } });
      glyph.dataset.cards = String(spread.positions.length);
      for (let index = 0; index < spread.positions.length; index += 1) glyph.append(createElement(documentRef, "i", { attributes: { "aria-hidden": "true" } }));
      const copy = createElement(documentRef, "span", { className: "spread-copy" });
      copy.append(createElement(documentRef, "strong", { text: spread.name }), createElement(documentRef, "small", { text: spread.description }));
      button.append(glyph, copy, createElement(documentRef, "span", { className: "spread-count", text: spread.short }));
      return button;
    });
    replaceChildren(dom.spreadList, nodes);
  }

  function setSetupLocked(nextLocked) {
    locked = Boolean(nextLocked);
    const panel = dom.questionInput.closest(".setup-panel");
    panel?.classList.toggle("is-locked", locked);
    panel?.setAttribute("aria-busy", String(locked));
    for (const container of [dom.spreadList, dom.deckStyleList]) {
      container.querySelectorAll("button").forEach((button) => { button.disabled = locked; });
    }
    renderQuestionInput();
  }

  function setJourneyStep(activeStep) {
    documentRef.querySelectorAll(".journey-step").forEach((step) => {
      const stepNumber = Number(step.dataset.step);
      step.classList.toggle("is-active", stepNumber === activeStep);
      step.classList.toggle("is-complete", stepNumber < activeStep);
      setText(step.querySelector("span"), stepNumber < activeStep ? "✓" : String(stepNumber));
    });
  }

  // Transitional aliases keep the old application import shape intact during integration.
  const renderCategories = () => {};
  const renderQuestions = renderQuestionInput;
  return Object.freeze({ renderQuestionInput, renderCategories, renderQuestions, renderDeckStyles, renderSpreads, setSetupLocked, setJourneyStep });
}
