(() => {
  "use strict";

const { deck, categories, spreads } = window.TarotData;
const runtime = window.AstraRuntime;
if (!runtime) throw new Error("AstraRuntime bindings were not installed.");
const {
  config: { DECK_STYLES, LEGACY_DECK_IDS },
  core: { escapeHtml, randomUnit, secureShuffle },
  platform: {
    resolveDeckStyle,
    cardImagePath,
    cardBackPath,
    registerServiceWorker,
    registerLocalLifecycle,
  },
  storage: {
    loadSettings,
    saveSettings,
    loadHistory,
    writeHistory: writeHistoryToStorage,
    readingRecord,
  },
} = runtime;
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const storedSettings = loadSettings();
const storedDeckStyle = LEGACY_DECK_IDS[storedSettings.deckStyle] || storedSettings.deckStyle;
const initialDeckStyle = DECK_STYLES.some((style) => style.id === storedDeckStyle)
  ? storedDeckStyle
  : "rws";

const byId = (id) => document.getElementById(id);
  const dom = {
    brandHome: byId("brandHome"),
    categoryGrid: byId("categoryGrid"),
    categoryTagline: byId("categoryTagline"),
    questionPickerButton: byId("questionPickerButton"),
    selectedQuestionLabel: byId("selectedQuestionLabel"),
    selectedQuestionText: byId("selectedQuestionText"),
    questionList: byId("questionList"),
    questionDialog: byId("questionDialog"),
    questionDialogHint: byId("questionDialogHint"),
    spreadList: byId("spreadList"),
    deckStyleList: byId("deckStyleList"),
    startReading: byId("startReading"),
    readingPanel: document.querySelector(".reading-panel"),
    readingKicker: byId("readingKicker"),
    readingTitle: byId("readingTitle"),
    readingMeta: byId("readingMeta"),
    metaCategory: byId("metaCategory"),
    metaSpread: byId("metaSpread"),
    readingStage: byId("readingStage"),
    idleState: byId("idleState"),
    idleDeckImage: byId("idleDeckImage"),
    shuffleScene: byId("shuffleScene"),
    shuffleDeck: byId("shuffleDeck"),
    shufflePhase: byId("shufflePhase"),
    shuffleProgress: byId("shuffleProgress"),
    cardTable: byId("cardTable"),
    stageGuidance: byId("stageGuidance"),
    guidanceText: byId("guidanceText"),
    statusText: byId("statusText"),
    insightTabs: byId("insightTabs"),
    insightContent: byId("insightContent"),
    newReadingButton: byId("newReadingButton"),
    revealAllButton: byId("revealAllButton"),
    historyButton: byId("historyButton"),
    helpButton: byId("helpButton"),
    historyDialog: byId("historyDialog"),
    helpDialog: byId("helpDialog"),
    confirmDialog: byId("confirmDialog"),
    confirmTitle: byId("confirmTitle"),
    confirmMessage: byId("confirmMessage"),
    confirmAccept: byId("confirmAccept"),
    historyList: byId("historyList"),
    clearHistoryButton: byId("clearHistoryButton"),
    toastRegion: byId("toastRegion"),
    installButton: byId("installButton"),
  };

  const emptyInsightMarkup = dom.insightContent.innerHTML;

  const state = {
    categoryId: categories[0].id,
    questionId: categories[0].questions[0].id,
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
function writeHistory(records) {
  const saved = writeHistoryToStorage(records);
  if (!saved) showToast("浏览器阻止了本地存储，本次记录未保存", "!");
  return saved;
}

function delay(milliseconds) {
    const duration = reducedMotion.matches ? Math.min(milliseconds, 35) : milliseconds;
    return new Promise((resolve) => window.setTimeout(resolve, duration));
  }

  function currentCategory() {
    return categories.find((category) => category.id === state.categoryId) || categories[0];
  }

  function currentQuestion() {
    const category = currentCategory();
    return category.questions.find((question) => question.id === state.questionId) || category.questions[0];
  }

  function currentSpread() {
    return spreads.find((spread) => spread.id === state.spreadId) || spreads[1];
  }

  function currentDeckStyle() {
    return DECK_STYLES.find((style) => style.id === state.deckStyleId) || DECK_STYLES[0];
  }

  function renderCategories() {
    dom.categoryGrid.innerHTML = categories
      .map(
        (category) => `
          <button
            class="category-option ${category.id === state.categoryId ? "is-selected" : ""}"
            type="button"
            data-category-id="${category.id}"
            style="--category-accent: ${category.accent}"
            aria-pressed="${category.id === state.categoryId}"
          >
            <span class="category-icon" aria-hidden="true">${category.icon}</span>
            <span class="category-name">${category.name}</span>
          </button>
        `,
      )
      .join("");
  }

  function renderQuestions() {
    const category = currentCategory();
    const question = currentQuestion();
    dom.categoryTagline.textContent = category.tagline;
    dom.questionDialogHint.textContent = `${category.name} · 从以下 ${category.questions.length} 个问题中选择一项`;
    dom.selectedQuestionLabel.textContent = question.label;
    dom.selectedQuestionText.textContent = question.text;
    dom.questionPickerButton.style.setProperty("--active-accent", category.accent);
    dom.questionList.style.setProperty("--active-accent", category.accent);
    dom.questionList.innerHTML = category.questions
      .map(
        (question) => `
          <button
            class="question-option ${question.id === state.questionId ? "is-selected" : ""}"
            type="button"
            data-question-id="${question.id}"
            aria-pressed="${question.id === state.questionId}"
          >
            <span class="radio-mark" aria-hidden="true"></span>
            <span class="question-copy">
              <strong>${escapeHtml(question.text)}</strong>
              <small>${question.label}</small>
            </span>
          </button>
        `,
      )
      .join("");
  }

  function renderDeckStyles() {
    dom.deckStyleList.innerHTML = DECK_STYLES.map(
      (style) => `
        <button
          class="deck-style-option deck-style-${style.id} ${style.id === state.deckStyleId ? "is-selected" : ""}"
          type="button"
          data-deck-style-id="${style.id}"
          aria-pressed="${style.id === state.deckStyleId}"
          aria-label="选择${style.name}牌面"
        >
          <span class="deck-style-preview" aria-hidden="true">
            <img class="deck-style-face" src="${cardImagePath(style.previewCard, style)}" alt="" />
            <img class="deck-style-back" src="${cardBackPath(style)}" alt="" />
          </span>
          <span class="deck-style-copy">
            <strong>${style.name}</strong>
            <small>${style.description}</small>
          </span>
          <span class="deck-style-check" aria-hidden="true">✓</span>
        </button>
      `,
    ).join("");
    document.documentElement.dataset.deckStyle = state.deckStyleId;
    dom.readingPanel.dataset.deckStyle = state.deckStyleId;
    dom.idleDeckImage.src = cardBackPath();
    dom.idleDeckImage.alt = `${currentDeckStyle().name}牌背`;
  }

  function renderSpreads() {
    dom.spreadList.innerHTML = spreads
      .map((spread) => {
        const glyphs = Array.from(
          { length: spread.positions.length },
          () => "<i aria-hidden=\"true\"></i>",
        ).join("");
        return `
          <button
            class="spread-option ${spread.id === state.spreadId ? "is-selected" : ""}"
            type="button"
            data-spread-id="${spread.id}"
            aria-pressed="${spread.id === state.spreadId}"
          >
            <span class="spread-glyph" data-cards="${spread.positions.length}" aria-hidden="true">
              ${glyphs}
            </span>
            <span class="spread-copy">
              <strong>${spread.name}</strong>
              <small>${spread.description}</small>
            </span>
            <span class="spread-count">${spread.short}</span>
          </button>
        `;
      })
      .join("");
  }

  function setSetupLocked(locked) {
    dom.categoryGrid.querySelectorAll("button").forEach((button) => {
      button.disabled = locked;
    });
    dom.questionList.querySelectorAll("button").forEach((button) => {
      button.disabled = locked;
    });
    dom.spreadList.querySelectorAll("button").forEach((button) => {
      button.disabled = locked;
    });
    dom.deckStyleList.querySelectorAll("button").forEach((button) => {
      button.disabled = locked;
    });
    dom.questionPickerButton.disabled = locked;
    dom.startReading.disabled = locked;
  }

  function setJourneyStep(activeStep) {
    document.querySelectorAll(".journey-step").forEach((step) => {
      const stepNumber = Number(step.dataset.step);
      step.classList.toggle("is-active", stepNumber === activeStep);
      step.classList.toggle("is-complete", stepNumber < activeStep);
      const badge = step.querySelector("span");
      badge.textContent = stepNumber < activeStep ? "✓" : String(stepNumber);
    });
  }

  function resetReadingView() {
    state.phase = "setup";
    state.reading = null;
    state.revealed = new Set();
    state.selectedIndex = null;
    state.activeTab = "card";
    state.completing = false;

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

  function createReading() {
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

    return {
      id: `reading-${Date.now()}-${Math.floor(randomUnit() * 100000)}`,
      createdAt: new Date().toISOString(),
      category,
      question,
      spread,
      deckStyle: currentDeckStyle(),
      draws,
      synthesis: null,
    };
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
    dom.metaCategory.style.color = category.accent;
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

  async function runShuffleAnimation() {
    dom.shuffleScene.hidden = false;
    const backPath = cardBackPath(state.reading?.deckStyle);
    dom.shuffleDeck.innerHTML = Array.from(
      { length: 7 },
      (_, index) =>
        `<span class="shuffle-card" style="--i: ${index}"><img src="${backPath}" alt="" /></span>`,
    ).join("");

    const phases = [
      { at: 0, text: "正在净化牌面能量" },
      { at: 34, text: "正在回应你的问题" },
      { at: 68, text: "正在寻找回应问题的牌" },
      { at: 92, text: "牌阵即将显现" },
    ];
    const totalDuration = reducedMotion.matches ? 90 : 2350;
    const startedAt = performance.now();
    let lastPhase = -1;

    await new Promise((resolve) => {
      const tick = (now) => {
        const elapsed = now - startedAt;
        const percentage = Math.min(100, (elapsed / totalDuration) * 100);
        dom.shuffleProgress.style.width = `${percentage}%`;
        let phaseIndex = 0;
        for (let index = phases.length - 1; index >= 0; index -= 1) {
          if (percentage >= phases[index].at) {
            phaseIndex = index;
            break;
          }
        }
        if (phaseIndex !== lastPhase) {
          lastPhase = phaseIndex;
          dom.shufflePhase.textContent = phases[phaseIndex].text;
        }
        if (percentage < 100) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });

    await delay(180);
    dom.shuffleScene.hidden = true;
    dom.shuffleProgress.style.width = "0";
  }

  function cardMarkup(draw) {
    const { card, reversed, position, index } = draw;
    const deckStyle = resolveDeckStyle(state.reading?.deckStyle || currentDeckStyle());
    return `
      <article class="drawn-card deck-style-${deckStyle.id}" data-card-index="${index}" style="--card-accent: ${card.accent}">
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

  function categoryLens(draw, reading) {
    const { card, position } = draw;
    const keywordPair = card.keywords.slice(0, 2).join("与");
    const lensByCategory = {
      love: `放在感情关系中，“${keywordPair}”提醒你观察双方的回应是否真实、边界是否平衡，以及感受能否被坦诚表达。`,
      career: `放在事业或学业中，“${keywordPair}”指向当前能力、方向和协作方式。重点是把抽象判断转化为可验证的下一步。`,
      wealth: `放在资源议题中，“${keywordPair}”要求同时评估机会与代价。任何决定都应回到现金流、时间成本和长期稳定。`,
      growth: `放在自我成长中，“${keywordPair}”映照的是你正在形成的新认知。改变会从一个被诚实看见的旧模式开始。`,
      decision: `放在选择议题中，“${keywordPair}”提供的是判断维度，而非替你决定。请把它与事实、风险和长期价值一起衡量。`,
      daily: `作为今日提示，“${keywordPair}”更适合被落实成一个小而清楚的行动，而不是预测所有细节。`,
    };
    return `${position.prompt} ${lensByCategory[reading.category.id]}`;
  }

  function cardStructureNote(card) {
    if (card.arcana === "major") {
      return `${card.name}属于大阿卡纳，通常会把眼前事件拉回更深的价值、身份或阶段课题；它的分量不等于吉凶，而是提醒你认真看待这次转折。`;
    }
    return `${card.name}属于${card.suitName}，以“${card.suitTheme}”为背景。它更可能通过具体沟通、选择与日常行动显现，而不是遥远且不可改变的命运。`;
  }

  function orientationNote(draw) {
    if (draw.reversed) {
      return "这张牌在此处为逆位，优先理解为能量受阻、向内、过度使用或正在调整；它不是正位牌义的简单反面，也不等于必然的坏结果。";
    }
    return "这张牌在此处为正位，表示相关能量较容易被意识到并向外展开；仍需结合牌位与现实信息判断如何表达，而不是把它当成绝对保证。";
  }

  function reflectionPrompt(draw, reading) {
    const keyword = draw.card.keywords[0];
    const prompts = {
      love: `在“${draw.position.name}”里，当“${keyword}”出现时，我真正需要表达、确认或守住的是什么？`,
      career: `关于“${draw.position.name}”所指的“${keyword}”，我能用哪一个可验证的成果判断自己是否走在正确方向？`,
      wealth: `面对“${keyword}”，有哪些真实数字、时间成本或风险边界还没有被我核对？`,
      growth: `“${keyword}”让我看见了哪一种重复模式？我愿意从哪个最小环节开始改变？`,
      decision: `哪一项事实能够帮助我区分“${keyword}”带来的真实信号与一时的期待或恐惧？`,
      daily: `今天怎样用一个二十分钟内能完成的小行动，回应“${keyword}”这项提示？`,
    };
    return prompts[reading.category.id] || `我可以怎样在现实中验证“${keyword}”带来的提醒？`;
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
          <div class="mini-card deck-style-${deckStyle.id} ${reversed ? "is-reversed" : ""}" style="--mini-accent: ${card.accent}">
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

        <div class="keyword-row" style="--keyword-accent: ${card.accent}">
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
          <div class="action-guidance" style="--guidance-accent: ${card.accent}">
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

  function dominantElement(draws) {
    const counts = draws.reduce((result, draw) => {
      result[draw.card.element] = (result[draw.card.element] || 0) + 1;
      return result;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ["灵", 0];
  }

  function drawTheme(draw) {
    const keywords = draw.card.keywords.slice(0, 2).join("、");
    const motion = draw.reversed ? "正在受阻、内收或等待校正" : "较容易被看见并向外展开";
    return `${draw.card.name}${draw.reversed ? "逆位" : "正位"}所代表的“${keywords}”能量${motion}`;
  }

  function drawAt(reading, positionId) {
    return reading.draws.find((draw) => draw.position.id === positionId);
  }

  function synthesisAnchor(reading) {
    const anchorPosition = {
      single: "essence",
      timeline: "present",
      cross: "core",
      celtic: "present",
    }[reading.spread.id];
    return (
      drawAt(reading, anchorPosition) ||
      reading.draws.find((draw) => draw.card.arcana === "major") ||
      reading.draws[0]
    );
  }

  function createSpreadNarrative(reading) {
    const theme = (positionId) => drawTheme(drawAt(reading, positionId));
    const brief = (positionId) => {
      const draw = drawAt(reading, positionId);
      return `${draw.card.name}${draw.reversed ? "逆位" : "正位"}（${draw.card.keywords
        .slice(0, 2)
        .join("、")}）`;
    };
    if (reading.spread.id === "single") {
      return `${theme("essence")}。单张牌提供的是一个聚焦镜头：先把它与真实处境核对，再决定要采纳哪一部分提醒。`;
    }
    if (reading.spread.id === "timeline") {
      return `过去位的${theme("past")}，仍在塑造此刻；当下位的${theme("present")}，呈现目前最活跃的状态；未来位的${theme("future")}，显示当前选择继续发展时的近期方向。未来牌表示趋势，不是无法改变的预言。`;
    }
    if (reading.spread.id === "cross") {
      return `十字中央的${theme("core")}，定义了当前核心；左侧的${theme("root")}，交代仍在作用的前因；上方的${theme("influence")}，揭示需要纳入判断的关键影响；右侧的${theme("trend")}，呈现沿当前路径可能展开的方向；下方的${theme("action")}，把整副牌收束为可执行的回应。`;
    }
    if (reading.spread.id === "celtic") {
      return `中心的${brief("present")}描述当前态势，横跨其上的${brief("challenge")}指出眼前最需要处理的挑战。左侧${brief("past")}是仍在作用的前因，右侧${brief("future")}则是近期最可能出现的变化。上方${brief("above")}呈现你主动追求的目标，下方${brief("below")}揭示更深层的动机。右侧权杖从${brief("advice")}给出的行动切口开始，经由${brief("external")}所代表的外界变量与${brief("hopes")}所反映的期待和担忧，最终抵达${brief("outcome")}。结果位是保持当前路径时的阶段趋势，并非不可改变的定论。`;
    }
    return reading.draws.map((draw) => `${draw.position.name}：${drawTheme(draw)}`).join("；");
  }

  function createConnections(reading) {
    if (reading.draws.length < 2) return [];
    const { draws } = reading;
    const start = draws[0];
    const end = draws[draws.length - 1];
    const connections = [];

    if (start.card.element === end.card.element) {
      connections.push(
        `从“${start.position.name}”到“${end.position.name}”都落在${start.card.element}元素，说明答案始终围绕${elementMeaning(start.card.element)}展开，重点在于把同一课题做得更成熟。`,
      );
    } else {
      connections.push(
        `牌阵从“${start.position.name}”的${start.card.element}元素走向“${end.position.name}”的${end.card.element}元素，提示你需要把${elementMeaning(start.card.element)}转化为${elementMeaning(end.card.element)}。`,
      );
    }

    if (reading.spread.id === "celtic") {
      const above = drawAt(reading, "above");
      const below = drawAt(reading, "below");
      const future = drawAt(reading, "future");
      const outcome = drawAt(reading, "outcome");
      connections.push(
        above.card.element === below.card.element
          ? `意识目标位的${above.card.name}与潜意识根基位的${below.card.name}同属${above.card.element}元素，内在动机与表层追求较容易彼此支持。`
          : `意识目标位的${above.card.name}偏向${elementMeaning(above.card.element)}，潜意识根基位的${below.card.name}则偏向${elementMeaning(below.card.element)}；先承认这层落差，行动才不会一边推进、一边自我抵消。`,
      );
      connections.push(
        `近期发展位的${future.card.name}${future.reversed ? "逆位" : "正位"}是下一阶段的变化，结果位的${outcome.card.name}${outcome.reversed ? "逆位" : "正位"}才是当前路线继续累积后的落点；两者之间仍可通过建议位主动调整。`,
      );
    }

    const reversedPositions = draws
      .filter((draw) => draw.reversed)
      .map((draw) => draw.position.name);
    if (reversedPositions.length > 0) {
      connections.push(
        `逆位集中在${reversedPositions.join("、")}，这些位置更像需要先疏通的内部课题；处理它们之后，其他正位牌的力量才更容易落地。`,
      );
    } else {
      connections.push("所有牌均为正位，讯息较直接；真正的挑战不是继续寻找暗示，而是选择一个最重要的提示开始执行。");
    }

    const suitCounts = draws.reduce((result, draw) => {
      if (!draw.card.suitName) return result;
      result[draw.card.suitName] = (result[draw.card.suitName] || 0) + 1;
      return result;
    }, {});
    const dominantSuit = Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0];
    if (dominantSuit?.[1] >= 2) {
      const suitCard = draws.find((draw) => draw.card.suitName === dominantSuit[0]);
      connections.push(
        `${dominantSuit[0]}重复出现 ${dominantSuit[1]} 次，使“${suitCard.card.suitTheme}”成为贯穿多张牌的共同线索。`,
      );
    } else {
      const courtCount = draws.filter((draw) =>
        ["page", "knight", "queen", "king"].includes(draw.card.rank),
      ).length;
      connections.push(
        courtCount > 0
          ? `${courtCount} 张宫廷牌出现，提醒你留意具体人物、互动角色，以及自己在这件事中正以何种成熟度回应。`
          : "花色与牌型较分散，说明问题并非由单一因素造成；先处理最接近行动位的提示，比一次解决全部变量更有效。",
      );
    }
    return connections.slice(0, 3);
  }

  function createActionSteps(reading) {
    const priorityBySpread = {
      single: ["essence"],
      timeline: ["present", "future", "past"],
      cross: ["action", "influence", "core"],
      celtic: ["advice", "challenge", "future", "outcome"],
    };
    const orderedDraws = (priorityBySpread[reading.spread.id] || [])
      .map((positionId) => drawAt(reading, positionId))
      .filter(Boolean);
    const actions = [];
    for (const draw of orderedDraws) {
      if (!actions.includes(draw.card.advice)) actions.push(draw.card.advice);
      if (actions.length === 3) break;
    }
    const fallbacks = [
      categoryFallbackAction(reading.category.id, 0),
      categoryFallbackAction(reading.category.id, 1),
      "用一天记录行动后的事实与感受，再决定是否继续沿这个方向前进。",
    ];
    for (const fallback of fallbacks) {
      if (actions.length === 3) break;
      if (!actions.includes(fallback)) actions.push(fallback);
    }
    return actions
      .slice(0, 3)
      .map((action, index) => `${["第一步", "第二步", "第三步"][index]} · ${action}`);
  }

  function createSynthesis(reading) {
    const { draws, category, question } = reading;
    const uprightCount = draws.filter((draw) => !draw.reversed).length;
    const reversedCount = draws.length - uprightCount;
    const majorCount = draws.filter((draw) => draw.card.arcana === "major").length;
    const [element, elementCount] = dominantElement(draws);
    const primary = synthesisAnchor(reading);

    let energyTone;
    if (uprightCount > reversedCount) {
      energyTone = "整体能量较为外放，局面愿意向前流动；清晰回应会比反复猜测更有帮助。";
    } else if (reversedCount > uprightCount) {
      energyTone = "能量更多指向内部整理。先松动阻碍、校正边界，再追求外部结果会更稳妥。";
    } else {
      energyTone = "牌面同时呈现推进与回看，真正的转折点在于如何平衡行动速度与内在准备。";
    }

    const headlineMap = {
      love: [
        "真诚表达与清晰边界，会让关系走向更真实的位置",
        "先看清关系中的失衡，再决定该靠近还是留白",
      ],
      career: [
        "把能力集中到关键方向，阶段成果会逐渐变得可见",
        "当前更需要校准结构与节奏，而不是继续透支推进",
      ],
      wealth: [
        "现实验证与长期视角，是筛选机会的最佳罗盘",
        "先减少不确定消耗，再为新的资源流动腾出空间",
      ],
      growth: [
        "你正在整合旧经验，并为新的自我腾出位置",
        "真正的改变从承认内在阻力、停止自我催促开始",
      ],
      decision: [
        "最合适的选择，会同时经得起事实与长期价值的检验",
        "答案尚未完全成熟，补齐信息与安全余量比仓促定夺重要",
      ],
      daily: [
        "今天不必解决全部问题，完成一个清楚的小行动就很好",
        "今天适合放慢反应，让事实与感受先重新对齐",
      ],
    };

    const observations = [];
    if (majorCount > 0) {
      observations.push(
        `${majorCount} 张大阿卡纳出现，说明这个问题触及的不只是日常细节，也包含阶段性的价值选择或身份转变。`,
      );
    } else {
      observations.push("牌面以小阿卡纳为主，变化更可能来自日常选择、沟通方式与持续行动。");
    }
    observations.push(
      draws.length === 1
        ? `这张牌属于${element}元素，适合从${elementMeaning(element)}的角度核对它与你现实处境的关系。`
        : `${element}元素出现 ${elementCount} 次，是当前最集中的能量；它提示你从${elementMeaning(element)}的角度重新理解问题。`,
    );
    observations.push(energyTone);

    return {
      headline: headlineMap[category.id][reversedCount > uprightCount ? 1 : 0],
      overview: `围绕“${question.text}”，${primary.position.name}的${primary.card.name}${primary.reversed ? "逆位" : "正位"}成为这次牌阵的锚点。${energyTone}`,
      uprightCount,
      reversedCount,
      majorCount,
      element,
      elementCount,
      primaryCardId: primary.card.id,
      narrative: createSpreadNarrative(reading),
      connections: createConnections(reading),
      observations,
      actions: createActionSteps(reading),
    };
  }

  function elementMeaning(element) {
    const meanings = {
      火: "行动、热情与创造",
      水: "情感、关系与直觉",
      风: "思考、沟通与判断",
      土: "资源、身体与现实执行",
      灵: "价值、阶段转变与整体方向",
    };
    return meanings[element] || "整体节奏";
  }

  function categoryFallbackAction(categoryId, index) {
    const actions = {
      love: ["安排一次不回避重点的坦诚沟通。", "确认你希望被如何对待，并清楚表达边界。"],
      career: ["把下一个目标缩小到一周内可交付的成果。", "找一位可信的人验证你的方向。"],
      wealth: ["先核对真实数据与最坏情形，再决定投入。", "为基本储备设置不可动用的边界。"],
      growth: ["记录七天情绪与行为触发点，寻找重复模式。", "给恢复和成长设定可持续节奏。"],
      decision: ["写下每个选项的收益、代价与不可逆部分。", "为决定设置一个明确截止时间。"],
      daily: ["选择今天唯一最重要的小事并完成它。", "在回应前给自己三次深呼吸。"],
    };
    return actions[categoryId]?.[index % 2] || "把启发落实成一个可观察的小行动。";
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
      <article class="summary-reading" style="--summary-accent: ${category.accent}">
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

  function formatDate(dateValue) {
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(dateValue));
    } catch {
      return String(dateValue);
    }
  }

  function showToast(message, icon = "✦") {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span aria-hidden="true">${escapeHtml(icon)}</span>${escapeHtml(message)}`;
    dom.toastRegion.appendChild(toast);
    window.setTimeout(
      () => {
        toast.classList.add("is-leaving");
        window.setTimeout(() => toast.remove(), 260);
      },
      reducedMotion.matches ? 900 : 2800,
    );
  }

  function renderHistory() {
    const records = loadHistory();
    dom.clearHistoryButton.hidden = records.length === 0;
    if (records.length === 0) {
      dom.historyList.innerHTML = `
        <div class="history-empty">
          <div><span>☾</span>还没有占卜记录<br />完成一次牌阵后，它会出现在这里。</div>
        </div>
      `;
      return;
    }
    dom.historyList.innerHTML = records
      .map(
        (record) => `
          <article class="history-item" data-history-id="${escapeHtml(record.id)}" style="--history-accent: ${record.categoryAccent || "#d8bb7a"}">
            <span class="history-icon" aria-hidden="true">${record.categoryIcon || "✦"}</span>
            <div class="history-summary">
              <strong>${escapeHtml(record.question)}</strong>
              <small>${escapeHtml(record.categoryName)} · ${escapeHtml(record.spreadName)} · ${escapeHtml(record.headline || "牌阵已完成")}</small>
              <time>${escapeHtml(formatDate(record.createdAt))}</time>
            </div>
            <div class="history-actions">
              <button class="history-view-button" type="button" data-history-action="view" title="展开查看" aria-label="展开查看" aria-expanded="false">
                <span>展开查看</span>
              </button>
              <button class="history-delete-button" type="button" data-history-action="delete" title="删除记录" aria-label="删除记录">×</button>
            </div>
          </article>
        `,
      )
      .join("");
  }

  function toggleHistoryDetail(item, record) {
    const existing = item.querySelector(".history-expanded");
    const viewButton = item.querySelector('[data-history-action="view"]');
    if (existing) {
      existing.remove();
      viewButton?.setAttribute("aria-expanded", "false");
      viewButton?.setAttribute("aria-label", "展开查看");
      const label = viewButton?.querySelector("span");
      if (label) label.textContent = "展开查看";
      return;
    }
    const detail = document.createElement("div");
    detail.className = "history-expanded";
    const cards = (record.cards || [])
      .map(
        (card) =>
          `<span><b>${escapeHtml(card.position)}</b>${escapeHtml(card.name)} · ${escapeHtml(card.orientation)}</span>`,
      )
      .join("");
    detail.innerHTML = `
      <small>牌面：${escapeHtml(record.deckName || "经典韦特")}</small>
      <p>${escapeHtml(record.headline || "这次牌阵已完成。")}</p>
      <div>${cards}</div>
    `;
    item.appendChild(detail);
    viewButton?.setAttribute("aria-expanded", "true");
    viewButton?.setAttribute("aria-label", "收起记录");
    const label = viewButton?.querySelector("span");
    if (label) label.textContent = "收起记录";
  }

  function deleteHistoryRecord(id) {
    const records = loadHistory().filter((record) => record.id !== id);
    writeHistory(records);
    renderHistory();
    showToast("该条记录已删除", "×");
  }

  function openDialog(dialog) {
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  function confirmAction(title, message, acceptLabel = "确认") {
    dom.confirmTitle.textContent = title;
    dom.confirmMessage.textContent = message;
    dom.confirmAccept.textContent = acceptLabel;
    openDialog(dom.confirmDialog);
    return new Promise((resolve) => {
      state.confirmResolver = resolve;
    });
  }

  function resolveConfirmation(value) {
    if (state.confirmResolver) {
      const resolver = state.confirmResolver;
      state.confirmResolver = null;
      closeDialog(dom.confirmDialog);
      resolver(value);
    }
  }

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
    showToast(`已切换为${currentDeckStyle().name}牌面`, "✦");
  }

  function bindEvents() {
    dom.categoryGrid.addEventListener("click", onCategoryClick);
    dom.questionList.addEventListener("click", onQuestionClick);
    dom.spreadList.addEventListener("click", onSpreadClick);
    dom.deckStyleList.addEventListener("click", onDeckStyleClick);
    dom.questionPickerButton.addEventListener("click", () => {
      if (state.phase !== "setup") return;
      openDialog(dom.questionDialog);
    });
    dom.startReading.addEventListener("click", startReading);
    dom.cardTable.addEventListener("click", (event) => {
      const button = event.target.closest(".card-hitbox");
      if (!button) return;
      revealCard(Number(button.dataset.cardIndex));
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
      if (tab === "summary") {
        renderSummary();
      } else {
        const index =
          state.selectedIndex ??
          [...state.revealed].sort((a, b) => a - b)[0];
        if (index !== undefined) renderCardInsight(index);
      }
    });

    dom.historyButton.addEventListener("click", () => {
      renderHistory();
      openDialog(dom.historyDialog);
    });
    dom.helpButton.addEventListener("click", () => openDialog(dom.helpDialog));
    dom.brandHome.addEventListener("click", async (event) => {
      event.preventDefault();
      await requestNewReading();
    });

    document.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => {
        const dialog = button.closest("dialog");
        if (dialog) closeDialog(dialog);
      });
    });

    document.querySelectorAll(".app-dialog").forEach((dialog) => {
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeDialog(dialog);
      });
    });

    document.querySelectorAll("[data-confirm-cancel]").forEach((button) => {
      button.addEventListener("click", () => resolveConfirmation(false));
    });
    dom.confirmAccept.addEventListener("click", () => resolveConfirmation(true));
    dom.confirmDialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      resolveConfirmation(false);
    });

    dom.historyList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-history-action]");
      const item = event.target.closest("[data-history-id]");
      if (!button || !item) return;
      const record = loadHistory().find((entry) => entry.id === item.dataset.historyId);
      if (!record) return;
      const action = button.dataset.historyAction;
      if (action === "view") toggleHistoryDetail(item, record);
      if (action === "delete") deleteHistoryRecord(record.id);
    });

    dom.clearHistoryButton.addEventListener("click", async () => {
      const confirmed = await confirmAction(
        "清空全部记录？",
        "这会删除保存在此浏览器中的所有占卜记录，且无法恢复。",
        "全部清空",
      );
      if (!confirmed) return;
      writeHistory([]);
      renderHistory();
      showToast("全部占卜记录已清空", "×");
    });

    window.addEventListener("beforeinstallprompt", (event) => {
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

    window.addEventListener("appinstalled", () => {
      state.installPrompt = null;
      dom.installButton.hidden = true;
      showToast("星纱塔罗已安装到桌面", "✦");
    });

    document.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter" && state.phase === "setup") {
        event.preventDefault();
        startReading();
      }
      if (event.key.toLowerCase() === "r" && state.phase === "revealing" && !event.ctrlKey && !event.metaKey) {
        const tagName = document.activeElement?.tagName;
        if (!["INPUT", "TEXTAREA", "SELECT"].includes(tagName)) {
          event.preventDefault();
          revealAllCards();
        }
      }
    });
  }

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
    registerServiceWorker();
    registerLocalLifecycle();
  }

  initialize();
})();
