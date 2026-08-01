import { accentToken } from "../../config/accent-tokens.js";
import { createElement, replaceChildren, safeIdentifier, setText } from "../safe-dom.js";

function selectedClass(base, selected) {
  return selected ? `${base} is-selected` : base;
}

export function createSetupRenderer({
  documentRef,
  categories,
  spreads,
  deckStyles,
  state,
  dom,
  selectors,
  cardImagePath,
  cardBackPath,
  getQuestionEvaluationPolicy = () => null,
}) {
  const { currentCategory, currentQuestion, currentDeckStyle } = selectors;

  function renderCategories() {
    const nodes = categories.map((category) => {
      const button = createElement(documentRef, "button", {
        className: selectedClass("category-option", category.id === state.categoryId),
        attributes: { type: "button", "aria-pressed": category.id === state.categoryId },
      });
      button.dataset.categoryId = safeIdentifier(category.id);
      button.dataset.accentToken = accentToken(category.accent);
      button.append(
        createElement(documentRef, "span", { className: "category-icon", text: category.icon, attributes: { "aria-hidden": "true" } }),
        createElement(documentRef, "span", { className: "category-name", text: category.name }),
      );
      return button;
    });
    replaceChildren(dom.categoryGrid, nodes);
  }

  function renderQuestions() {
    const category = currentCategory();
    const question = currentQuestion();
    setText(dom.categoryTagline, category.tagline);
    setText(dom.questionDialogHint, `${category.name} · 从以下 ${category.questions.length} 个问题中选择一项`);
    setText(dom.selectedQuestionLabel, question.label);
    setText(dom.selectedQuestionText, getQuestionEvaluationPolicy(question.id)?.displayQuestion || question.text);
    const accent = accentToken(category.accent);
    dom.questionPickerButton.dataset.accentToken = accent;
    dom.questionList.dataset.accentToken = accent;
    const nodes = category.questions.map((item) => {
      const policy = getQuestionEvaluationPolicy(item.id);
      const button = createElement(documentRef, "button", {
        className: selectedClass("question-option", item.id === state.questionId),
        attributes: { type: "button", "aria-pressed": item.id === state.questionId },
      });
      button.dataset.questionId = safeIdentifier(item.id);
      button.append(
        createElement(documentRef, "span", { className: "radio-mark", attributes: { "aria-hidden": "true" } }),
      );
      const copy = createElement(documentRef, "span", { className: "question-copy" });
      copy.append(
        createElement(documentRef, "strong", { text: policy?.displayQuestion || item.text }),
        createElement(documentRef, "small", { text: item.label }),
      );
      button.append(copy);
      return button;
    });
    replaceChildren(dom.questionList, nodes);
  }

  function renderDeckStyles() {
    const nodes = deckStyles.map((style) => {
      const id = safeIdentifier(style.id);
      const button = createElement(documentRef, "button", {
        className: selectedClass(`deck-style-option deck-style-${id}`, style.id === state.deckStyleId),
        attributes: {
          type: "button",
          "aria-pressed": style.id === state.deckStyleId,
          "aria-label": `选择${style.name}牌面`,
        },
      });
      button.dataset.deckStyleId = id;
      const preview = createElement(documentRef, "span", { className: "deck-style-preview", attributes: { "aria-hidden": "true" } });
      const face = createElement(documentRef, "img", { className: "deck-style-face", attributes: { src: cardImagePath(style.previewCard, style), alt: "" } });
      const back = createElement(documentRef, "img", { className: "deck-style-back", attributes: { src: cardBackPath(style), alt: "" } });
      preview.append(face, back);
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
    const policy = getQuestionEvaluationPolicy(currentQuestion().id);
    const nodes = spreads.map((spread) => {
      const allowed = !policy || policy.allowedSpreads.includes(spread.id);
      const button = createElement(documentRef, "button", {
        className: selectedClass("spread-option", allowed && spread.id === state.spreadId),
        attributes: {
          type: "button",
          "aria-pressed": allowed && spread.id === state.spreadId,
          disabled: allowed ? null : true,
          "aria-disabled": String(!allowed),
        },
      });
      button.dataset.spreadId = safeIdentifier(spread.id);
      const glyph = createElement(documentRef, "span", { className: "spread-glyph", attributes: { "aria-hidden": "true" } });
      glyph.dataset.cards = String(spread.positions.length);
      for (let index = 0; index < spread.positions.length; index += 1) glyph.append(createElement(documentRef, "i", { attributes: { "aria-hidden": "true" } }));
      const copy = createElement(documentRef, "span", { className: "spread-copy" });
      copy.append(
        createElement(documentRef, "strong", { text: spread.name }),
        createElement(documentRef, "small", { text: allowed ? spread.description : "当前问题不使用这个牌阵" }),
      );
      button.append(glyph, copy, createElement(documentRef, "span", { className: "spread-count", text: spread.short }));
      return button;
    });
    replaceChildren(dom.spreadList, nodes);
  }

  function setSetupLocked(locked) {
    const panel = dom.categoryGrid.closest(".setup-panel");
    panel?.classList.toggle("is-locked", locked);
    panel?.setAttribute("aria-busy", String(locked));
    for (const container of [dom.categoryGrid, dom.questionList, dom.spreadList, dom.deckStyleList]) {
      container.querySelectorAll("button").forEach((button) => { button.disabled = locked; });
    }
    dom.questionPickerButton.disabled = locked;
    dom.startReading.disabled = locked;
  }

  function setJourneyStep(activeStep) {
    documentRef.querySelectorAll(".journey-step").forEach((step) => {
      const stepNumber = Number(step.dataset.step);
      step.classList.toggle("is-active", stepNumber === activeStep);
      step.classList.toggle("is-complete", stepNumber < activeStep);
      setText(step.querySelector("span"), stepNumber < activeStep ? "✓" : String(stepNumber));
    });
  }

  return Object.freeze({ renderCategories, renderQuestions, renderDeckStyles, renderSpreads, setSetupLocked, setJourneyStep });
}
