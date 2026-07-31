import { createEventBinder } from "./events.js";
import { createReadingFactory } from "./controllers/reading-controller.js";
import { createSelectionSelectors } from "./selectors/current-selection.js";
import { createReadingState, resetReadingState } from "./state/reading-state.js";
import { accentToken } from "../config/accent-tokens.js";
import { DECK_STYLES, LEGACY_DECK_IDS, resolveDeckStyle } from "../config/decks.js";
import { escapeHtml } from "../core/html.js";
import { createRuntimeServices } from "./runtime-services.js";
import { categoryLens, cardStructureNote, orientationNote, reflectionPrompt } from "../engine/legacy/card-reading.js";
import { createSynthesis } from "../engine/legacy/synthesis.js";
import { TarotData } from "../knowledge/legacy/index.js";
import { assertKnowledgeCatalog } from "../generated/knowledge-registry.js";
import { cardBackPath, cardImagePath } from "../platform/assets.js";
import { createReadingAnimation } from "../ui/animations/reading.js";
import { createDialogController, formatDate } from "../ui/components/dialogs.js";
import { createToast } from "../ui/components/toast.js";
import { installImageFallbacks } from "../ui/image-fallback.js";
import { bindDom } from "../ui/dom.js";
import { createHistoryRenderer } from "../ui/renderers/history.js";
import { createSetupRenderer } from "../ui/renderers/setup.js";

export function startApplication({ windowRef = globalThis.window, documentRef = globalThis.document } = {}) {
  if (!windowRef || !documentRef) {
    return Object.freeze({ started: false, reason: "browser-globals-unavailable" });
  }
  const window = windowRef;
  const document = documentRef;
  assertKnowledgeCatalog(TarotData);
  const { deck, categories, spreads } = TarotData;
  const {
    randomUnit, secureShuffle, registerServiceWorker, registerLocalLifecycle,
    loadSettings, saveSettings, loadHistory,
    writeHistory: writeHistoryToStorage, readingRecord, offlineStatus,
  } = createRuntimeServices(window);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const storedSettings = loadSettings();
  const storedDeckStyle = LEGACY_DECK_IDS[storedSettings.deckStyle] || storedSettings.deckStyle;
  const initialDeckStyle = DECK_STYLES.some((style) => style.id === storedDeckStyle)
    ? storedDeckStyle
    : "rws";

  installImageFallbacks(document);
  const dom = bindDom(document);
    const emptyInsightMarkup = dom.insightContent.innerHTML;
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
  function writeHistory(records) {
    const saved = writeHistoryToStorage(records);
    if (!saved) showToast("浏览器阻止了本地存储，本次记录未保存", "!");
    return saved;
  }

    function resetReadingView() {
      resetReadingState(state);

      setSetupLocked(false);
      setJourneyStep(1);
      dom.readingKicker.textContent = "THE VEIL IS QUIET";
      dom.readingTitle.textContent = "等待你的问题";
      dom.readingMeta.hidden = true;
      dom.idleState.hidden = false;
      dom.shuffleScene.hidden = true;
      dom.cardTable.hidden = true;
      dom.cardTable.innerHTML = "";
      delete dom.cardTable.dataset.spreadId;
      delete dom.readingPanel.dataset.spreadId;
      dom.stageGuidance.hidden = true;
      dom.statusText.textContent = "牌面正在静候你的选择";
      dom.insightTabs.hidden = true;
      dom.insightContent.innerHTML = emptyInsightMarkup;
      dom.newReadingButton.hidden = true;
      dom.revealAllButton.hidden = true;
    }

    async function startReading() {
      if (state.phase !== "setup") return;
      state.reading = createReading();
      state.phase = "shuffling";
      state.revealed = new Set();
      state.selectedIndex = null;
      state.completing = false;
      setSetupLocked(true);
      setJourneyStep(2);

      const { category, question, spread } = state.reading;
      dom.readingKicker.textContent = "YOUR QUESTION";
      dom.readingTitle.textContent = question.text;
      dom.readingMeta.hidden = false;
      dom.metaCategory.textContent = category.name;
      dom.metaCategory.dataset.accentToken = accentToken(category.accent);
      dom.metaSpread.textContent = spread.name;
      dom.readingPanel.dataset.spreadId = spread.id;
      dom.idleState.hidden = true;
      dom.cardTable.hidden = true;
      dom.cardTable.innerHTML = "";
      delete dom.cardTable.dataset.spreadId;
      dom.stageGuidance.hidden = true;
      dom.newReadingButton.hidden = true;
      dom.revealAllButton.hidden = true;
      dom.insightTabs.hidden = true;
      dom.insightContent.innerHTML = `
        <div class="insight-empty">
          <div class="empty-symbol" aria-hidden="true"><span>✦</span><i></i></div>
          <h3>正在为你洗牌</h3>
          <p>让呼吸慢下来，在心中轻轻重复你的问题，不必努力预想答案。</p>
        </div>
      `;
      dom.statusText.textContent = "正在洗牌，请保持片刻专注";

      await runShuffleAnimation();
      await dealCards();
    }

    function cardMarkup(draw) {
      const { card, reversed, position, index } = draw;
      const deckStyle = resolveDeckStyle(state.reading?.deckStyle || currentDeckStyle());
      return `
        <article class="drawn-card deck-style-${deckStyle.id}" data-card-index="${index}" data-accent-token="${accentToken(card.accent)}">
          <button
            class="card-hitbox"
            type="button"
            data-card-index="${index}"
            aria-label="翻开第 ${index + 1} 张牌：${position.name}"
            disabled
          >
            <span class="tarot-card">
              <span class="card-face card-back">
                <img class="card-back-art" src="${cardBackPath(deckStyle)}" alt="" />
              </span>
              <span class="card-face card-front ${reversed ? "is-reversed" : ""}">
                ${reversed ? '<span class="orientation-ribbon">逆位</span>' : ""}
                <span class="front-rotatable card-art-wrap">
                  <img class="tarot-face-art" src="${cardImagePath(card.id, deckStyle)}" alt="" />
                </span>
              </span>
            </span>
          </button>
          <div class="position-tag" title="${escapeHtml(position.prompt)}">
            <b>${String(index + 1).padStart(2, "0")}</b>
            <span>${escapeHtml(position.name)}</span>
          </div>
        </article>
      `;
    }

    async function dealCards() {
      if (!state.reading) return;
      state.phase = "dealing";
      const { draws } = state.reading;
      dom.cardTable.dataset.count = String(draws.length);
      dom.cardTable.dataset.spreadId = state.reading.spread.id;
      dom.cardTable.innerHTML = draws.map(cardMarkup).join("");
      dom.cardTable.hidden = false;

      const cardElements = [...dom.cardTable.querySelectorAll(".drawn-card")];
      const stageRect = dom.readingStage.getBoundingClientRect();
      for (const [index, cardElement] of cardElements.entries()) {
        cardElement.classList.add("is-dealt");
        const cardRect = cardElement.getBoundingClientRect();
        const originX = stageRect.left + stageRect.width / 2 - (cardRect.left + cardRect.width / 2);
        const originY = stageRect.top + stageRect.height * 0.75 - (cardRect.top + cardRect.height / 2);
        if (!reducedMotion.matches && cardElement.animate) {
          cardElement.animate(
            [
              {
                opacity: 0,
                transform: `translate(${originX}px, ${originY}px) scale(0.34) rotate(${(index - draws.length / 2) * 9}deg)`,
              },
              { opacity: 1, offset: 0.72 },
              { opacity: 1, transform: "translate(0, 0) scale(1) rotate(0deg)" },
            ],
            {
              duration: 620,
              easing: "cubic-bezier(0.18, 0.78, 0.2, 1)",
              fill: "both",
            },
          );
        }
        await delay(240);
      }

      dom.cardTable.querySelectorAll(".card-hitbox").forEach((button) => {
        button.disabled = false;
      });
      state.phase = "revealing";
      dom.stageGuidance.hidden = false;
      dom.guidanceText.textContent =
        draws.length === 1 ? "点击牌背，翻开属于你的讯息" : "依次点击牌背，翻开属于你的讯息";
      dom.statusText.textContent = `牌阵已完成 · 0 / ${draws.length} 张已翻开`;
      dom.newReadingButton.hidden = false;
      dom.revealAllButton.hidden = draws.length === 1;
      dom.insightContent.innerHTML = `
        <div class="insight-empty">
          <div class="empty-symbol" aria-hidden="true"><span>☽</span><i></i></div>
          <h3>牌阵已经落定</h3>
          <p>按你的直觉选择第一张要翻开的牌。翻牌顺序不会改变牌义，只会改变你看见故事的方式。</p>
        </div>
      `;
    }

    async function revealCard(index, { select = true } = {}) {
      if (!state.reading || !["revealing", "complete"].includes(state.phase)) return;
      if (state.revealed.has(index)) {
        selectCard(index);
        return;
      }
      if (state.phase === "complete") return;

      const draw = state.reading.draws[index];
      const element = dom.cardTable.querySelector(`[data-card-index="${index}"].drawn-card`);
      const button = element?.querySelector(".card-hitbox");
      if (!element || !button) return;

      state.revealed.add(index);
      element.classList.add("is-flipped");
      button.setAttribute(
        "aria-label",
        `${draw.position.name}：${draw.card.name}，${draw.reversed ? "逆位" : "正位"}。点击查看解读`,
      );
      const total = state.reading.draws.length;
      dom.statusText.textContent = `正在显现牌意 · ${state.revealed.size} / ${total} 张已翻开`;
      dom.guidanceText.textContent =
        state.revealed.size === total ? "所有牌面已显现，正在汇总解读" : "继续翻牌，完整的故事正在形成";

      await delay(460);
      if (select) selectCard(index);
      await delay(310);

      if (
        state.revealed.size === total &&
        state.phase === "revealing" &&
        !state.completing
      ) {
        await completeReading();
      }
    }

    async function revealAllCards() {
      if (!state.reading || state.phase !== "revealing") return;
      dom.revealAllButton.disabled = true;
      const remaining = state.reading.draws
        .map((_, index) => index)
        .filter((index) => !state.revealed.has(index));
      for (const index of remaining) {
        await revealCard(index, { select: true });
        await delay(140);
      }
      dom.revealAllButton.disabled = false;
    }

    function selectCard(index) {
      if (!state.reading || !state.revealed.has(index)) return;
      state.selectedIndex = index;
      state.activeTab = "card";
      dom.cardTable.querySelectorAll(".drawn-card").forEach((cardElement) => {
        cardElement.classList.toggle(
          "is-selected",
          Number(cardElement.dataset.cardIndex) === index,
        );
      });
      updateInsightTabs();
      renderCardInsight(index);
    }
    function renderCardInsight(index) {
      if (!state.reading) return;
      const draw = state.reading.draws[index];
      const { card, reversed, position } = draw;
      const deckStyle = resolveDeckStyle(state.reading.deckStyle || currentDeckStyle());
      const orientation = reversed ? "逆位" : "正位";
      const meaning = reversed ? card.reversed : card.upright;
      const keywordMarkup = card.keywords
        .map((keyword) => `<span>${escapeHtml(keyword)}</span>`)
        .join("");

      dom.insightContent.innerHTML = `
        <article class="card-reading">
          <header class="selected-card-heading">
            <div class="mini-card deck-style-${deckStyle.id} ${reversed ? "is-reversed" : ""}" data-accent-token="${accentToken(card.accent)}">
              <img src="${cardImagePath(card.id, deckStyle)}" alt="" />
            </div>
            <div class="selected-card-copy">
              <span class="position-overline">${String(index + 1).padStart(2, "0")} · ${escapeHtml(position.name)}</span>
              <h3>${escapeHtml(card.name)}</h3>
              <p>${escapeHtml(card.en)}</p>
              <span class="orientation-badge ${reversed ? "is-reversed" : ""}">
                ${reversed ? "↧" : "↥"} ${orientation} · ${escapeHtml(card.element)}元素
              </span>
            </div>
          </header>

          <div class="keyword-row" data-accent-token="${accentToken(card.accent)}">
            ${keywordMarkup}
          </div>

          <section class="reading-block">
            <div class="reading-block-label">这张牌的核心牌义</div>
            <p>${escapeHtml(meaning)}</p>
          </section>

          <section class="reading-block">
            <div class="reading-block-label">牌型与正逆位</div>
            <div class="interpretation-note">
              <p>${escapeHtml(cardStructureNote(card))}</p>
              <p>${escapeHtml(orientationNote(draw))}</p>
            </div>
          </section>

          <section class="reading-block">
            <div class="reading-block-label">${escapeHtml(position.name)} · 牌位落点</div>
            <div class="position-context">
              <strong>它与你的问题如何连结</strong>
              <p>${escapeHtml(categoryLens(draw, state.reading))}</p>
            </div>
          </section>

          <section class="reading-block">
            <div class="reading-block-label">给自己的追问</div>
            <div class="reflection-question">
              <span aria-hidden="true">?</span>
              <p>${escapeHtml(reflectionPrompt(draw, state.reading))}</p>
            </div>
          </section>

          <section class="reading-block">
            <div class="reading-block-label">落地建议</div>
            <div class="action-guidance" data-accent-token="${accentToken(card.accent)}">
              <strong>可以尝试的一步</strong>
              <p>${escapeHtml(card.advice)}</p>
            </div>
          </section>
        </article>
      `;
      requestAnimationFrame(() => {
        dom.insightContent.scrollTop = 0;
      });
    }
    async function completeReading() {
      if (!state.reading || state.completing) return;
      state.completing = true;
      state.reading.synthesis = createSynthesis(state.reading);
      state.phase = "complete";
      setJourneyStep(3);
      dom.stageGuidance.hidden = false;
      dom.guidanceText.textContent = "牌阵已经完整显现，综合讯息已生成";
      dom.statusText.textContent = "解读完成 · 综合讯息与行动建议已生成";
      dom.revealAllButton.hidden = true;
      dom.insightTabs.hidden = false;
      state.activeTab = "summary";
      updateInsightTabs();
      renderSummary();
      persistCurrentReading();
      await delay(120);
      state.completing = false;
    }

    function updateInsightTabs() {
      if (!state.reading || state.revealed.size === 0) {
        dom.insightTabs.hidden = true;
        return;
      }
      dom.insightTabs.hidden = false;
      dom.insightTabs.querySelectorAll("button").forEach((button) => {
        const active = button.dataset.tab === state.activeTab;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-selected", String(active));
      });
    }

    function renderSummary() {
      if (!state.reading?.synthesis) return;
      const { reading } = state;
      const { synthesis, category, draws } = reading;
      const observations = synthesis.observations
        .map((observation) => `<li>${escapeHtml(observation)}</li>`)
        .join("");
      const actions = synthesis.actions
        .map((action) => `<li>${escapeHtml(action)}</li>`)
        .join("");
      const connections = synthesis.connections
        .map((connection) => `<li>${escapeHtml(connection)}</li>`)
        .join("");

      dom.insightContent.innerHTML = `
        <article class="summary-reading" data-accent-token="${accentToken(category.accent)}">
          <header class="summary-hero">
            <span class="summary-overline">SYNTHESIS · 综合讯息</span>
            <h3>${escapeHtml(synthesis.headline)}</h3>
            <p>${escapeHtml(synthesis.overview)}</p>
          </header>

          <div class="energy-metrics">
            <div class="energy-metric">
              <strong>${synthesis.uprightCount}</strong>
              <span>正位能量</span>
            </div>
            <div class="energy-metric">
              <strong>${synthesis.reversedCount}</strong>
              <span>逆位课题</span>
            </div>
            <div class="energy-metric">
              <strong>${synthesis.element}</strong>
              <span>主导元素</span>
            </div>
          </div>

          <section class="summary-story">
            <div class="reading-block-label">牌阵故事 · ${escapeHtml(reading.spread.name)}</div>
            <p>${escapeHtml(synthesis.narrative)}</p>
          </section>

          ${
            draws.length > 1
              ? `
                <section class="reading-block">
                  <div class="reading-block-label">牌与牌之间如何对话</div>
                  <ul class="summary-list connection-list">${connections}</ul>
                </section>
              `
              : ""
          }

          <section class="reading-block">
            <div class="reading-block-label">你可以留意</div>
            <ul class="summary-list">${observations}</ul>
          </section>

          <section class="reading-block">
            <div class="reading-block-label">接下来的三步</div>
            <ul class="summary-list">${actions}</ul>
          </section>
        </article>
      `;
      requestAnimationFrame(() => {
        dom.insightContent.scrollTop = 0;
      });
    }

    function persistCurrentReading() {
      if (!state.reading?.synthesis) return;
      const records = loadHistory();
      const record = readingRecord(state.reading);
      const existingIndex = records.findIndex((item) => item.id === record.id);
      if (existingIndex >= 0) {
        records[existingIndex] = record;
      } else {
        records.unshift(record);
      }
      writeHistory(records);
    }
  const { openDialog, closeDialog, confirmAction, resolveConfirmation } = createDialogController({ dom, state });

  const { renderHistory, toggleHistoryDetail, deleteHistoryRecord } = createHistoryRenderer({
      documentRef: document,
      dom,
      loadHistory,
      writeHistory,
      showToast,
      formatDate,
    });
  async function requestNewReading() {
      if (state.phase === "setup") {
        dom.startReading.focus();
        return;
      }
      if (state.phase !== "complete") {
        const confirmed = await confirmAction(
          "放下当前牌阵？",
          "尚未完成的翻牌不会进入占卜记录。你可以取消并继续当前占卜。",
          "重新开始",
        );
        if (!confirmed) return;
      }
      resetReadingView();
      dom.startReading.focus();
    }

    function onCategoryClick(event) {
      const button = event.target.closest("[data-category-id]");
      if (!button || state.phase !== "setup") return;
      state.categoryId = button.dataset.categoryId;
      const category = currentCategory();
      state.questionId = category.questions[0].id;
      renderCategories();
      renderQuestions();
    }

    function onQuestionClick(event) {
      const button = event.target.closest("[data-question-id]");
      if (!button || state.phase !== "setup") return;
      state.questionId = button.dataset.questionId;
      renderQuestions();
      closeDialog(dom.questionDialog);
      dom.questionPickerButton.focus();
    }

    function onSpreadClick(event) {
      const button = event.target.closest("[data-spread-id]");
      if (!button || state.phase !== "setup") return;
      state.spreadId = button.dataset.spreadId;
      renderSpreads();
    }

    function onDeckStyleClick(event) {
      const button = event.target.closest("[data-deck-style-id]");
      if (!button || state.phase !== "setup") return;
      state.deckStyleId = button.dataset.deckStyleId;
      saveSettings({ deckStyle: state.deckStyleId });
      renderDeckStyles();
      void offlineStatus.cacheDeck(state.deckStyleId);
      showToast(`已切换为${currentDeckStyle().name}牌面`, "✦");
    }

    const bindEvents = createEventBinder({
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

    function initialize() {
      if (deck.length !== 78) {
        console.warn(`塔罗牌数据数量异常：预期 78，实际 ${deck.length}`);
      }
      renderCategories();
      renderQuestions();
      renderSpreads();
      renderDeckStyles();
      bindEvents();
      resetReadingView();
      void registerServiceWorker().then(() => offlineStatus.start({ selectedDeckId: initialDeckStyle }));
      registerLocalLifecycle();
    }

    initialize();

    return Object.freeze({ started: true });
}
