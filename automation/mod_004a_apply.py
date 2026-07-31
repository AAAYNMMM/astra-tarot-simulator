#!/usr/bin/env python3
"""Apply MOD-004A state, UI, controller, animation, event, and DOM-safety extraction."""

from __future__ import annotations

import json
import re
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.replace("\r\n", "\n"), encoding="utf-8", newline="\n")


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return text.replace(old, new, 1)


def function_span(source: str, name: str) -> tuple[int, int]:
    match = re.search(rf"(?m)^\s*function\s+{re.escape(name)}\s*\(", source)
    if not match:
        match = re.search(rf"(?m)^\s*async\s+function\s+{re.escape(name)}\s*\(", source)
    if not match:
        raise RuntimeError(f"function {name} not found")
    brace = source.find("{", match.end())
    if brace < 0:
        raise RuntimeError(f"function {name} opening brace not found")
    depth = 0
    index = brace
    state = "code"
    quote = ""
    while index < len(source):
        char = source[index]
        nxt = source[index + 1] if index + 1 < len(source) else ""
        if state == "code":
            if char in ("'", '"', "`"):
                state = "string"
                quote = char
            elif char == "/" and nxt == "/":
                state = "line-comment"
                index += 1
            elif char == "/" and nxt == "*":
                state = "block-comment"
                index += 1
            elif char == "{":
                depth += 1
            elif char == "}":
                depth -= 1
                if depth == 0:
                    end = index + 1
                    while end < len(source) and source[end] in " \t":
                        end += 1
                    if end < len(source) and source[end] == "\r":
                        end += 1
                    if end < len(source) and source[end] == "\n":
                        end += 1
                    return match.start(), end
        elif state == "string":
            if char == "\\":
                index += 1
            elif char == quote:
                state = "code"
        elif state == "line-comment":
            if char == "\n":
                state = "code"
        elif state == "block-comment":
            if char == "*" and nxt == "/":
                state = "code"
                index += 1
        index += 1
    raise RuntimeError(f"function {name} closing brace not found")


def remove_functions(source: str, names: list[str]) -> str:
    spans = [function_span(source, name) for name in names]
    for start, end in sorted(spans, reverse=True):
        source = source[:start] + source[end:]
    return source


MODULES: dict[str, str] = {
    "src/app/state/reading-state.js": r'''
export function createReadingState({ categories, initialDeckStyle }) {
  const firstCategory = categories?.[0];
  const firstQuestion = firstCategory?.questions?.[0];
  if (!firstCategory || !firstQuestion) {
    throw new Error("Reading state requires at least one category and question.");
  }
  return {
    categoryId: firstCategory.id,
    questionId: firstQuestion.id,
    spreadId: "timeline",
    deckStyleId: initialDeckStyle,
    phase: "setup",
    reading: null,
    revealed: new Set(),
    selectedIndex: null,
    activeTab: "card",
    completing: false,
    confirmResolver: null,
    installPrompt: null,
  };
}

export function resetReadingState(state) {
  state.phase = "setup";
  state.reading = null;
  state.revealed = new Set();
  state.selectedIndex = null;
  state.activeTab = "card";
  state.completing = false;
}
''',
    "src/app/selectors/current-selection.js": r'''
export function createSelectionSelectors({ categories, spreads, deckStyles, state }) {
  function currentCategory() {
    return categories.find((category) => category.id === state.categoryId) || categories[0];
  }
  function currentQuestion() {
    const category = currentCategory();
    return category.questions.find((question) => question.id === state.questionId) || category.questions[0];
  }
  function currentSpread() {
    return spreads.find((spread) => spread.id === state.spreadId) || spreads[1] || spreads[0];
  }
  function currentDeckStyle() {
    return deckStyles.find((style) => style.id === state.deckStyleId) || deckStyles[0];
  }
  return Object.freeze({ currentCategory, currentQuestion, currentSpread, currentDeckStyle });
}
''',
    "src/ui/dom.js": r'''
const REQUIRED_IDS = Object.freeze([
  "brandHome", "categoryGrid", "categoryTagline", "questionPickerButton",
  "selectedQuestionLabel", "selectedQuestionText", "questionList", "questionDialog",
  "questionDialogHint", "spreadList", "deckStyleList", "startReading", "readingKicker",
  "readingTitle", "readingMeta", "metaCategory", "metaSpread", "readingStage", "idleState",
  "idleDeckImage", "shuffleScene", "shuffleDeck", "shufflePhase", "shuffleProgress",
  "cardTable", "stageGuidance", "guidanceText", "statusText", "insightTabs",
  "insightContent", "newReadingButton", "revealAllButton", "historyButton", "helpButton",
  "historyDialog", "helpDialog", "confirmDialog", "confirmTitle", "confirmMessage",
  "confirmAccept", "historyList", "clearHistoryButton", "toastRegion", "installButton",
]);

export function bindDom(documentRef = globalThis.document) {
  if (!documentRef) throw new Error("DOM bindings require a document.");
  const bindings = {};
  for (const id of REQUIRED_IDS) {
    const element = documentRef.getElementById(id);
    if (!element) throw new Error(`Required DOM element is missing: #${id}`);
    bindings[id] = element;
  }
  const readingPanel = documentRef.querySelector(".reading-panel");
  if (!readingPanel) throw new Error("Required DOM element is missing: .reading-panel");
  bindings.readingPanel = readingPanel;
  return Object.freeze(bindings);
}
''',
    "src/ui/safe-dom.js": r'''
const SAFE_COLOR = /^#[0-9a-fA-F]{6}$/;
const SAFE_IDENTIFIER = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function safeColor(value, fallback = "#d8bb7a") {
  const text = String(value ?? "");
  return SAFE_COLOR.test(text) ? text.toLowerCase() : fallback;
}

export function safeIdentifier(value, fallback = "unknown") {
  const text = String(value ?? "");
  return SAFE_IDENTIFIER.test(text) ? text : fallback;
}

export function setText(element, value) {
  element.textContent = value == null ? "" : String(value);
  return element;
}

export function createElement(documentRef, tagName, options = {}) {
  const element = documentRef.createElement(tagName);
  if (options.className) element.className = options.className;
  if (options.text != null) setText(element, options.text);
  for (const [name, value] of Object.entries(options.attributes || {})) {
    if (value != null) element.setAttribute(name, String(value));
  }
  return element;
}

export function replaceChildren(parent, children) {
  parent.replaceChildren(...children);
}
''',
    "src/app/controllers/reading-controller.js": r'''
export function createReadingFactory({ deck, selectors, secureShuffle, randomUnit, now = () => new Date() }) {
  const { currentCategory, currentQuestion, currentSpread, currentDeckStyle } = selectors;
  return function createReading() {
    const category = currentCategory();
    const question = currentQuestion();
    const spread = currentSpread();
    const selectedCards = secureShuffle(deck).slice(0, spread.positions.length);
    const draws = selectedCards.map((card, index) => ({
      card,
      reversed: randomUnit() < 0.33,
      position: spread.positions[index],
      index,
    }));
    const createdAt = now();
    return {
      id: `reading-${createdAt.getTime()}-${Math.floor(randomUnit() * 100000)}`,
      createdAt: createdAt.toISOString(),
      category,
      question,
      spread,
      deckStyle: currentDeckStyle(),
      draws,
      synthesis: null,
    };
  };
}
''',
    "src/ui/renderers/setup.js": r'''
import { createElement, replaceChildren, safeColor, safeIdentifier, setText } from "../safe-dom.js";

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
}) {
  const { currentCategory, currentQuestion, currentDeckStyle } = selectors;

  function renderCategories() {
    const nodes = categories.map((category) => {
      const button = createElement(documentRef, "button", {
        className: selectedClass("category-option", category.id === state.categoryId),
        attributes: { type: "button", "aria-pressed": category.id === state.categoryId },
      });
      button.dataset.categoryId = safeIdentifier(category.id);
      button.style.setProperty("--category-accent", safeColor(category.accent));
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
    setText(dom.selectedQuestionText, question.text);
    const accent = safeColor(category.accent);
    dom.questionPickerButton.style.setProperty("--active-accent", accent);
    dom.questionList.style.setProperty("--active-accent", accent);
    const nodes = category.questions.map((item) => {
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
        createElement(documentRef, "strong", { text: item.text }),
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
    const nodes = spreads.map((spread) => {
      const button = createElement(documentRef, "button", {
        className: selectedClass("spread-option", spread.id === state.spreadId),
        attributes: { type: "button", "aria-pressed": spread.id === state.spreadId },
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

  function setSetupLocked(locked) {
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
''',
    "src/ui/animations/reading.js": r'''
import { createElement, replaceChildren } from "../safe-dom.js";

export function createReadingAnimation({ windowRef, documentRef, reducedMotion, state, dom, cardBackPath }) {
  function delay(milliseconds) {
    const duration = reducedMotion.matches ? Math.min(milliseconds, 35) : milliseconds;
    return new Promise((resolve) => windowRef.setTimeout(resolve, duration));
  }

  async function runShuffleAnimation() {
    dom.shuffleScene.hidden = false;
    const backPath = cardBackPath(state.reading?.deckStyle);
    const cards = Array.from({ length: 7 }, (_, index) => {
      const span = createElement(documentRef, "span", { className: `shuffle-card shuffle-card-${index}` });
      span.style.setProperty("--i", String(index));
      span.append(createElement(documentRef, "img", { attributes: { src: backPath, alt: "" } }));
      return span;
    });
    replaceChildren(dom.shuffleDeck, cards);
    const phases = [
      { at: 0, text: "正在净化牌面能量" },
      { at: 34, text: "正在回应你的问题" },
      { at: 68, text: "正在寻找回应问题的牌" },
      { at: 92, text: "牌阵即将显现" },
    ];
    const totalDuration = reducedMotion.matches ? 90 : 2350;
    const startedAt = windowRef.performance.now();
    let lastPhase = -1;
    await new Promise((resolve) => {
      const tick = (now) => {
        const percentage = Math.min(100, ((now - startedAt) / totalDuration) * 100);
        dom.shuffleProgress.style.width = `${percentage}%`;
        let phaseIndex = 0;
        for (let index = phases.length - 1; index >= 0; index -= 1) {
          if (percentage >= phases[index].at) { phaseIndex = index; break; }
        }
        if (phaseIndex !== lastPhase) {
          lastPhase = phaseIndex;
          dom.shufflePhase.textContent = phases[phaseIndex].text;
        }
        if (percentage < 100) windowRef.requestAnimationFrame(tick); else resolve();
      };
      windowRef.requestAnimationFrame(tick);
    });
    await delay(180);
    dom.shuffleScene.hidden = true;
    dom.shuffleProgress.style.width = "0";
  }

  return Object.freeze({ delay, runShuffleAnimation });
}
''',
    "src/ui/components/toast.js": r'''
import { createElement } from "../safe-dom.js";

export function createToast({ documentRef, windowRef, dom, reducedMotion }) {
  return function showToast(message, icon = "✦") {
    const toast = createElement(documentRef, "div", { className: "toast" });
    toast.append(
      createElement(documentRef, "span", { text: icon, attributes: { "aria-hidden": "true" } }),
      documentRef.createTextNode(String(message ?? "")),
    );
    dom.toastRegion.appendChild(toast);
    windowRef.setTimeout(() => {
      toast.classList.add("is-leaving");
      windowRef.setTimeout(() => toast.remove(), 260);
    }, reducedMotion.matches ? 900 : 2800);
  };
}
''',
    "src/ui/renderers/history.js": r'''
import { createElement, replaceChildren, safeColor, setText } from "../safe-dom.js";

export function historyRecordView(record, formatDate) {
  return Object.freeze({
    id: String(record?.id ?? ""),
    accent: safeColor(record?.categoryAccent),
    icon: String(record?.categoryIcon || "✦"),
    question: String(record?.question || ""),
    meta: `${String(record?.categoryName || "")} · ${String(record?.spreadName || "")} · ${String(record?.headline || "牌阵已完成")}`,
    createdAt: String(formatDate(record?.createdAt)),
    deckName: String(record?.deckName || "经典韦特"),
    headline: String(record?.headline || "这次牌阵已完成。"),
    cards: Array.isArray(record?.cards) ? record.cards.map((card) => ({
      position: String(card?.position || ""),
      name: String(card?.name || ""),
      orientation: String(card?.orientation || ""),
    })) : [],
  });
}

export function createHistoryRenderer({ documentRef, dom, loadHistory, writeHistory, showToast, formatDate }) {
  function renderHistory() {
    const records = loadHistory();
    dom.clearHistoryButton.hidden = records.length === 0;
    if (records.length === 0) {
      const empty = createElement(documentRef, "div", { className: "history-empty" });
      const content = createElement(documentRef, "div");
      content.append(createElement(documentRef, "span", { text: "☾" }), documentRef.createTextNode("还没有占卜记录"), createElement(documentRef, "br"), documentRef.createTextNode("完成一次牌阵后，它会出现在这里。"));
      empty.append(content);
      replaceChildren(dom.historyList, [empty]);
      return;
    }
    const nodes = records.map((record) => {
      const view = historyRecordView(record, formatDate);
      const article = createElement(documentRef, "article", { className: "history-item" });
      article.dataset.historyId = view.id;
      article.style.setProperty("--history-accent", view.accent);
      article.append(createElement(documentRef, "span", { className: "history-icon", text: view.icon, attributes: { "aria-hidden": "true" } }));
      const summary = createElement(documentRef, "div", { className: "history-summary" });
      summary.append(createElement(documentRef, "strong", { text: view.question }), createElement(documentRef, "small", { text: view.meta }), createElement(documentRef, "time", { text: view.createdAt }));
      article.append(summary);
      const actions = createElement(documentRef, "div", { className: "history-actions" });
      const viewButton = createElement(documentRef, "button", { className: "history-view-button", attributes: { type: "button", title: "展开查看", "aria-label": "展开查看", "aria-expanded": "false" } });
      viewButton.dataset.historyAction = "view";
      viewButton.append(createElement(documentRef, "span", { text: "展开查看" }));
      const deleteButton = createElement(documentRef, "button", { className: "history-delete-button", text: "×", attributes: { type: "button", title: "删除记录", "aria-label": "删除记录" } });
      deleteButton.dataset.historyAction = "delete";
      actions.append(viewButton, deleteButton);
      article.append(actions);
      return article;
    });
    replaceChildren(dom.historyList, nodes);
  }

  function toggleHistoryDetail(item, record) {
    const existing = item.querySelector(".history-expanded");
    const viewButton = item.querySelector('[data-history-action="view"]');
    if (existing) {
      existing.remove();
      viewButton?.setAttribute("aria-expanded", "false");
      viewButton?.setAttribute("aria-label", "展开查看");
      setText(viewButton?.querySelector("span"), "展开查看");
      return;
    }
    const view = historyRecordView(record, formatDate);
    const detail = createElement(documentRef, "div", { className: "history-expanded" });
    detail.append(createElement(documentRef, "small", { text: `牌面：${view.deckName}` }), createElement(documentRef, "p", { text: view.headline }));
    const cards = createElement(documentRef, "div");
    for (const card of view.cards) {
      const row = createElement(documentRef, "span");
      row.append(createElement(documentRef, "b", { text: card.position }), documentRef.createTextNode(`${card.name} · ${card.orientation}`));
      cards.append(row);
    }
    detail.append(cards);
    item.appendChild(detail);
    viewButton?.setAttribute("aria-expanded", "true");
    viewButton?.setAttribute("aria-label", "收起记录");
    setText(viewButton?.querySelector("span"), "收起记录");
  }

  function deleteHistoryRecord(id) {
    writeHistory(loadHistory().filter((record) => record.id !== id));
    renderHistory();
    showToast("该条记录已删除", "×");
  }

  return Object.freeze({ renderHistory, toggleHistoryDetail, deleteHistoryRecord });
}
''',
    "src/app/events.js": r'''
export function createEventBinder({
  windowRef, documentRef, state, dom, callbacks, loadHistory,
}) {
  const {
    onCategoryClick, onQuestionClick, onSpreadClick, onDeckStyleClick,
    openDialog, closeDialog, startReading, revealCard, revealAllCards,
    requestNewReading, updateInsightTabs, renderSummary, renderCardInsight,
    showToast, renderHistory, toggleHistoryDetail, deleteHistoryRecord,
    resolveConfirmation, confirmAction, writeHistory,
  } = callbacks;

  return function bindEvents() {
    dom.categoryGrid.addEventListener("click", onCategoryClick);
    dom.questionList.addEventListener("click", onQuestionClick);
    dom.spreadList.addEventListener("click", onSpreadClick);
    dom.deckStyleList.addEventListener("click", onDeckStyleClick);
    dom.questionPickerButton.addEventListener("click", () => { if (state.phase === "setup") openDialog(dom.questionDialog); });
    dom.startReading.addEventListener("click", startReading);
    dom.cardTable.addEventListener("click", (event) => {
      const button = event.target.closest(".card-hitbox");
      if (button) revealCard(Number(button.dataset.cardIndex));
    });
    dom.revealAllButton.addEventListener("click", revealAllCards);
    dom.newReadingButton.addEventListener("click", requestNewReading);
    dom.insightTabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tab]");
      if (!button || !state.reading) return;
      const tab = button.dataset.tab;
      if (tab === "summary" && !state.reading.synthesis) {
        showToast("翻开全部牌面后会生成综合结论", "☾");
        return;
      }
      state.activeTab = tab;
      updateInsightTabs();
      if (tab === "summary") renderSummary();
      else {
        const index = state.selectedIndex ?? [...state.revealed].sort((a, b) => a - b)[0];
        if (index !== undefined) renderCardInsight(index);
      }
    });
    dom.historyButton.addEventListener("click", () => { renderHistory(); openDialog(dom.historyDialog); });
    dom.helpButton.addEventListener("click", () => openDialog(dom.helpDialog));
    dom.brandHome.addEventListener("click", async (event) => { event.preventDefault(); await requestNewReading(); });
    documentRef.querySelectorAll("[data-close-dialog]").forEach((button) => button.addEventListener("click", () => {
      const dialog = button.closest("dialog");
      if (dialog) closeDialog(dialog);
    }));
    documentRef.querySelectorAll(".app-dialog").forEach((dialog) => dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    }));
    documentRef.querySelectorAll("[data-confirm-cancel]").forEach((button) => button.addEventListener("click", () => resolveConfirmation(false)));
    dom.confirmAccept.addEventListener("click", () => resolveConfirmation(true));
    dom.confirmDialog.addEventListener("cancel", (event) => { event.preventDefault(); resolveConfirmation(false); });
    dom.historyList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-history-action]");
      const item = event.target.closest("[data-history-id]");
      if (!button || !item) return;
      const record = loadHistory().find((entry) => entry.id === item.dataset.historyId);
      if (!record) return;
      if (button.dataset.historyAction === "view") toggleHistoryDetail(item, record);
      if (button.dataset.historyAction === "delete") deleteHistoryRecord(record.id);
    });
    dom.clearHistoryButton.addEventListener("click", async () => {
      const confirmed = await confirmAction("清空全部记录？", "这会删除保存在此浏览器中的所有占卜记录，且无法恢复。", "全部清空");
      if (!confirmed) return;
      writeHistory([]);
      renderHistory();
      showToast("全部占卜记录已清空", "×");
    });
    windowRef.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      state.installPrompt = event;
      dom.installButton.hidden = false;
    });
    dom.installButton.addEventListener("click", async () => {
      if (!state.installPrompt) return;
      state.installPrompt.prompt();
      await state.installPrompt.userChoice;
      state.installPrompt = null;
      dom.installButton.hidden = true;
    });
    windowRef.addEventListener("appinstalled", () => {
      state.installPrompt = null;
      dom.installButton.hidden = true;
      showToast("星纱塔罗已安装到桌面", "✦");
    });
    documentRef.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && state.phase === "setup") {
        event.preventDefault();
        startReading();
      }
      if (event.key.toLowerCase() === "r" && state.phase === "revealing" && !event.ctrlKey && !event.metaKey) {
        const tagName = documentRef.activeElement?.tagName;
        if (!["INPUT", "TEXTAREA", "SELECT"].includes(tagName)) {
          event.preventDefault();
          revealAllCards();
        }
      }
    });
  };
}
''',
}


UI_TEST = r'''
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createReadingState, resetReadingState } from "../src/app/state/reading-state.js";
import { createSelectionSelectors } from "../src/app/selectors/current-selection.js";
import { createReadingFactory } from "../src/app/controllers/reading-controller.js";
import { historyRecordView } from "../src/ui/renderers/history.js";
import { safeColor, safeIdentifier } from "../src/ui/safe-dom.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const categories = [{ id: "daily", questions: [{ id: "daily-focus", text: "今天？" }] }];
const spreads = [{ id: "single", positions: [{ id: "essence", name: "核心" }] }, { id: "timeline", positions: [{ id: "past" }] }];
const deckStyles = [{ id: "rws", name: "经典韦特" }];
const state = createReadingState({ categories, initialDeckStyle: "rws" });
const selectors = createSelectionSelectors({ categories, spreads, deckStyles, state });
assert.equal(selectors.currentCategory().id, "daily");
assert.equal(selectors.currentQuestion().id, "daily-focus");
assert.equal(selectors.currentSpread().id, "timeline");
state.phase = "complete";
state.revealed.add(0);
resetReadingState(state);
assert.equal(state.phase, "setup");
assert.equal(state.revealed.size, 0);

const deck = [{ id: "major-0" }, { id: "major-1" }];
const values = [0.75, 0.1, 0.8];
const createReading = createReadingFactory({
  deck,
  selectors,
  secureShuffle: (items) => [...items],
  randomUnit: () => values.shift() ?? 0.5,
  now: () => new Date("2026-07-31T00:00:00.000Z"),
});
const reading = createReading();
assert.equal(reading.draws.length, 1);
assert.equal(reading.draws[0].reversed, false);
assert.match(reading.id, /^reading-1785456000000-/);

const attack = '<img src=x onerror="globalThis.pwned=true">';
const view = historyRecordView({
  id: `x\" data-owned=\"1`,
  categoryAccent: "red; background:url(javascript:alert(1))",
  categoryIcon: attack,
  question: attack,
  categoryName: attack,
  spreadName: attack,
  headline: attack,
  cards: [{ position: attack, name: attack, orientation: attack }],
}, () => attack);
assert.equal(view.question, attack);
assert.equal(view.accent, "#d8bb7a");
assert.equal(view.cards[0].name, attack);
assert.equal(safeIdentifier("daily-focus"), "daily-focus");
assert.equal(safeIdentifier('x\" onclick=\"1'), "unknown");
assert.equal(safeColor("#AABBCC"), "#aabbcc");

for (const relative of [
  "src/ui/renderers/history.js",
  "src/ui/components/toast.js",
]) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  assert.equal(source.includes("innerHTML"), false, `${relative} must not write untrusted HTML`);
  assert.equal(source.includes("insertAdjacentHTML"), false, `${relative} must not append untrusted HTML`);
}

const appSource = fs.readFileSync(path.join(root, "app.js"), "utf8");
for (const removed of [
  "const state = {",
  "function currentCategory()",
  "function renderCategories()",
  "function runShuffleAnimation()",
  "function showToast(",
  "function renderHistory()",
  "function bindEvents()",
]) {
  assert.equal(appSource.includes(removed), false, `app.js still owns ${removed}`);
}
console.log("MOD-004A UI contract passed: state, selectors, controller, renderers, animation, events, and hostile history boundaries are active.");
'''


def transform_app(source: str) -> str:
    source = replace_once(
        source,
        '} = runtime;\nconst reducedMotion',
        '} = runtime;\nconst {\n  app: { createReadingState, resetReadingState, createSelectionSelectors, createReadingFactory, createEventBinder },\n  ui: { bindDom, createSetupRenderer, createReadingAnimation, createToast, createHistoryRenderer },\n} = runtime;\nconst reducedMotion',
        "runtime UI destructure",
    )
    dom_pattern = re.compile(r"const byId = .*?const emptyInsightMarkup = dom\.insightContent\.innerHTML;", re.S)
    if len(dom_pattern.findall(source)) != 1:
        raise RuntimeError("DOM block match failed")
    source = dom_pattern.sub('const dom = bindDom(document);\n  const emptyInsightMarkup = dom.insightContent.innerHTML;', source, count=1)
    state_pattern = re.compile(r"\s*const state = \{.*?\n\s*\};", re.S)
    if len(state_pattern.findall(source)) != 1:
        raise RuntimeError("state block match failed")
    state_setup = '''
  const state = createReadingState({ categories, initialDeckStyle });
  const selectors = createSelectionSelectors({ categories, spreads, deckStyles: DECK_STYLES, state });
  const { currentCategory, currentQuestion, currentSpread, currentDeckStyle } = selectors;
  const {
    renderCategories,
    renderQuestions,
    renderDeckStyles,
    renderSpreads,
    setSetupLocked,
    setJourneyStep,
  } = createSetupRenderer({
    documentRef: document,
    categories,
    spreads,
    deckStyles: DECK_STYLES,
    state,
    dom,
    selectors,
    cardImagePath,
    cardBackPath,
  });
  const { delay, runShuffleAnimation } = createReadingAnimation({
    windowRef: window,
    documentRef: document,
    reducedMotion,
    state,
    dom,
    cardBackPath,
  });
  const createReading = createReadingFactory({ deck, selectors, secureShuffle, randomUnit });
  const showToast = createToast({ documentRef: document, windowRef: window, dom, reducedMotion });
'''
    source = state_pattern.sub(state_setup.rstrip(), source, count=1)
    source = remove_functions(source, [
        "delay", "currentCategory", "currentQuestion", "currentSpread", "currentDeckStyle",
        "renderCategories", "renderQuestions", "renderDeckStyles", "renderSpreads",
        "setSetupLocked", "setJourneyStep", "createReading", "runShuffleAnimation",
        "showToast", "renderHistory", "toggleHistoryDetail", "deleteHistoryRecord", "bindEvents",
    ])
    source = replace_once(
        source,
        '    state.phase = "setup";\n    state.reading = null;\n    state.revealed = new Set();\n    state.selectedIndex = null;\n    state.activeTab = "card";\n    state.completing = false;',
        '    resetReadingState(state);',
        "reset state delegation",
    )
    history_anchor = "  function openDialog(dialog) {"
    history_setup = '''  const { renderHistory, toggleHistoryDetail, deleteHistoryRecord } = createHistoryRenderer({
    documentRef: document,
    dom,
    loadHistory,
    writeHistory,
    showToast,
    formatDate,
  });

'''
    source = replace_once(source, history_anchor, history_setup + history_anchor, "history renderer setup")
    event_anchor = "  function initialize() {"
    event_setup = '''  const bindEvents = createEventBinder({
    windowRef: window,
    documentRef: document,
    state,
    dom,
    loadHistory,
    callbacks: {
      onCategoryClick,
      onQuestionClick,
      onSpreadClick,
      onDeckStyleClick,
      openDialog,
      closeDialog,
      startReading,
      revealCard,
      revealAllCards,
      requestNewReading,
      updateInsightTabs,
      renderSummary,
      renderCardInsight,
      showToast,
      renderHistory,
      toggleHistoryDetail,
      deleteHistoryRecord,
      resolveConfirmation,
      confirmAction,
      writeHistory,
    },
  });

'''
    source = replace_once(source, event_anchor, event_setup + event_anchor, "event binder setup")
    return source


def update_legacy_runtime(source: str) -> str:
    imports = '''import { createEventBinder } from "./events.js";
import { createReadingFactory } from "./controllers/reading-controller.js";
import { createSelectionSelectors } from "./selectors/current-selection.js";
import { createReadingState, resetReadingState } from "./state/reading-state.js";
import { createReadingAnimation } from "../ui/animations/reading.js";
import { createToast } from "../ui/components/toast.js";
import { bindDom } from "../ui/dom.js";
import { createHistoryRenderer } from "../ui/renderers/history.js";
import { createSetupRenderer } from "../ui/renderers/setup.js";
'''
    source = imports + source
    marker = "  return Object.freeze({\n"
    app_ui = '''  return Object.freeze({
    app: Object.freeze({
      createReadingState,
      resetReadingState,
      createSelectionSelectors,
      createReadingFactory,
      createEventBinder,
    }),
    ui: Object.freeze({
      bindDom,
      createSetupRenderer,
      createReadingAnimation,
      createToast,
      createHistoryRenderer,
    }),
'''
    source = replace_once(source, marker, app_ui, "runtime app/ui bindings")
    return source


def update_validate(source: str) -> str:
    anchor = '''        (
            "node-module-contract",
            [node, "tests/module_contract_test.mjs"],
        ),
'''
    addition = '''        (
            "node-ui-contract",
            [node, "tests/ui_contract_test.mjs"],
        ),
'''
    return replace_once(source, anchor, addition + anchor, "validate UI step")


def update_sw(source: str) -> str:
    source = re.sub(r'const CACHE_NAME = "astra-tarot-v\d+";', 'const CACHE_NAME = "astra-tarot-v9";', source, count=1)
    anchor = '  "./src/app/legacy-runtime.js",\n'
    resources = [
        "src/app/events.js",
        "src/app/controllers/reading-controller.js",
        "src/app/selectors/current-selection.js",
        "src/app/state/reading-state.js",
        "src/ui/animations/reading.js",
        "src/ui/components/toast.js",
        "src/ui/dom.js",
        "src/ui/safe-dom.js",
        "src/ui/renderers/history.js",
        "src/ui/renderers/setup.js",
    ]
    insert = anchor + "".join(f'  "./{path}",\n' for path in resources)
    return replace_once(source, anchor, insert, "SW UI resources")


def update_module_contract(source: str) -> str:
    anchor = '  "src/README.md",\n'
    required = [
        "src/app/events.js",
        "src/app/controllers/reading-controller.js",
        "src/app/selectors/current-selection.js",
        "src/app/state/reading-state.js",
        "src/ui/animations/reading.js",
        "src/ui/components/toast.js",
        "src/ui/dom.js",
        "src/ui/safe-dom.js",
        "src/ui/renderers/history.js",
        "src/ui/renderers/setup.js",
        "tests/ui_contract_test.mjs",
    ]
    source = replace_once(source, anchor, anchor + "".join(f'  "{path}",\n' for path in required), "module contract required files")
    source = re.sub(r"astra-tarot-v\d+", "astra-tarot-v9", source)
    sw_anchor = 'for (const relativePath of ["src/styles/index.css", ...cssImports]) {'
    extra = '''for (const relativePath of [
  "src/app/events.js",
  "src/app/controllers/reading-controller.js",
  "src/app/selectors/current-selection.js",
  "src/app/state/reading-state.js",
  "src/ui/animations/reading.js",
  "src/ui/components/toast.js",
  "src/ui/dom.js",
  "src/ui/safe-dom.js",
  "src/ui/renderers/history.js",
  "src/ui/renderers/setup.js",
]) {
  assert.ok(serviceWorkerSource.includes(`"./${relativePath}"`), `SW missing ${relativePath}`);
}
'''
    source = replace_once(source, sw_anchor, extra + sw_anchor, "module contract SW UI")
    return source


def update_python_contract(source: str) -> str:
    source = replace_once(
        source,
        '            "icon.svg",\n',
        '            "icon.svg",\n            "package.json",\n',
        "python required package",
    )
    marker = "    def test_four_complete_local_tarot_decks_are_bundled(self) -> None:\n"
    test = '''    def test_mod_004a_uses_active_ui_modules_and_safe_history_dom(self) -> None:
        app_source = (ROOT / "app.js").read_text(encoding="utf-8")
        runtime_source = (ROOT / "src/app/legacy-runtime.js").read_text(encoding="utf-8")
        history_source = (ROOT / "src/ui/renderers/history.js").read_text(encoding="utf-8")
        toast_source = (ROOT / "src/ui/components/toast.js").read_text(encoding="utf-8")
        for relative_path in (
            "src/app/events.js",
            "src/app/controllers/reading-controller.js",
            "src/app/selectors/current-selection.js",
            "src/app/state/reading-state.js",
            "src/ui/animations/reading.js",
            "src/ui/components/toast.js",
            "src/ui/dom.js",
            "src/ui/safe-dom.js",
            "src/ui/renderers/history.js",
            "src/ui/renderers/setup.js",
            "tests/ui_contract_test.mjs",
        ):
            self.assertTrue((ROOT / relative_path).is_file(), relative_path)
            self.assertIn(relative_path.split("/")[-1], (ROOT / "sw.js").read_text(encoding="utf-8"))
        self.assertIn("createHistoryRenderer", runtime_source)
        self.assertIn("createEventBinder", runtime_source)
        self.assertNotIn("function renderHistory()", app_source)
        self.assertNotIn("function bindEvents()", app_source)
        self.assertNotIn("innerHTML", history_source)
        self.assertNotIn("innerHTML", toast_source)

'''
    return replace_once(source, marker, test + marker, "python MOD-004A test")


def update_docs() -> None:
    progress = read("docs/PROGRESS.md")
    progress = re.sub(r"\| 当前进行中任务 \|.*?\|", "| 当前进行中任务 | `MOD-004A` 状态、控制器、渲染器与DOM安全 |", progress, count=1)
    progress = re.sub(r"\| 下一任务 \|.*?\|", "| 下一任务 | 无；Phase M连续执行中 |", progress, count=1)
    progress = re.sub(r"\| 工作分支 \|.*?\|", "| 工作分支 | `phase-m-completion` |", progress, count=1)
    progress += "\n\n## Phase M连续执行现场\n\n- `MOD-004A`：`IN_PROGRESS`。\n- 后续叶子任务将按执行契约连续推进，不在每个任务结束后暂停。\n"
    write("docs/PROGRESS.md", progress)

    module_map = read("docs/MODULE_MAP.md")
    module_map += "\n\n## MOD-004A活动边界\n\n页面状态、选择器、读牌创建、设置页渲染、洗牌动画、事件绑定、提示消息和历史记录渲染已迁入 `src/app/` 与 `src/ui/`。历史和提示不再使用 `innerHTML`，恶意持久化字段通过DOM节点与 `textContent` 输出。\n"
    write("docs/MODULE_MAP.md", module_map)

    src_readme = read("src/README.md")
    src_readme += "\n\n## MOD-004A活动模块\n\n`src/app/state`、`selectors`、`controllers`、`events.js` 与 `src/ui/dom.js`、`safe-dom.js`、`renderers`、`animations`、`components` 已由真实页面兼容运行时消费。\n"
    write("src/README.md", src_readme)

    automation = read("automation/README.md")
    automation = automation.replace("4. `node tests/module_contract_test.mjs`", "4. `node tests/ui_contract_test.mjs`\n5. `node tests/module_contract_test.mjs`")
    write("automation/README.md", automation)


def main() -> None:
    for path, content in MODULES.items():
        if (ROOT / path).exists():
            raise RuntimeError(f"refusing to overwrite existing MOD-004A module: {path}")
        write(path, textwrap.dedent(content).lstrip())
    write("tests/ui_contract_test.mjs", textwrap.dedent(UI_TEST).lstrip())

    app = transform_app(read("app.js"))
    write("app.js", app)
    write("src/app/legacy-runtime.js", update_legacy_runtime(read("src/app/legacy-runtime.js")))
    write("automation/validate.py", update_validate(read("automation/validate.py")))
    write("sw.js", update_sw(read("sw.js")))
    write("tests/module_contract_test.mjs", update_module_contract(read("tests/module_contract_test.mjs")))
    write("tests/test_app_contract.py", update_python_contract(read("tests/test_app_contract.py")))

    baseline = json.loads(read("automation/quality-baseline.json"))
    baseline["task"] = "MOD-004A"
    app_debt = next(item for item in baseline["knownDebt"] if item["path"] == "app.js")
    app_debt["baselineLines"] = len(app.splitlines())
    write("automation/quality-baseline.json", json.dumps(baseline, ensure_ascii=False, indent=2) + "\n")
    update_docs()
    print(f"mod_004a_applied app_lines={len(app.splitlines())} modules={len(MODULES)} cache=astra-tarot-v9")


if __name__ == "__main__":
    main()
