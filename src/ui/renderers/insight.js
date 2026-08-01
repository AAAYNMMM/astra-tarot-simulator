import { accentToken } from "../../config/accent-tokens.js";
import { resolveDeckStyle } from "../../config/decks.js";
import { escapeHtml } from "../../core/html.js";

function scrollTop(dom) {
  requestAnimationFrame(() => {
    dom.insightContent.scrollTop = 0;
  });
}

function factorForPosition(synthesis, positionId) {
  return synthesis?.decisiveFactors?.find((factor) => factor.positionIds.includes(positionId)) || null;
}

export function createInsightRenderer({
  dom,
  state,
  currentDeckStyle,
  cardImagePath,
} = {}) {
  if (typeof cardImagePath !== "function") {
    throw new TypeError("Card image path resolver is required.");
  }
  function renderCardInsight(index) {
    if (!state.reading) return;
    const draw = state.reading.draws[index];
    const { card, reversed, position } = draw;
    const deckStyle = resolveDeckStyle(state.reading.deckStyle || currentDeckStyle());
    const orientation = reversed ? "逆位" : "正位";
    const meaning = reversed ? card.reversed : card.upright;
    const factor = factorForPosition(state.reading.synthesis, position.id);
    const directMeaning = factor?.text || meaning;
    const role = factor?.role || (reversed ? "阻断" : "推动");

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
              ${reversed ? "↧" : "↥"} ${orientation}
            </span>
          </div>
        </header>

        <section class="reading-block">
          <div class="reading-block-label">牌位判词</div>
          <p>${escapeHtml(`${position.name}由${card.name}${orientation}定调：${directMeaning}`)}</p>
        </section>

        <section class="reading-block">
          <div class="reading-block-label">在牌阵中的作用</div>
          <div class="position-context">
            <strong>${escapeHtml(role)}</strong>
            <p>${escapeHtml(position.prompt)}</p>
          </div>
        </section>
      </article>
    `;
    scrollTop(dom);
  }

  function renderSummary() {
    if (!state.reading?.synthesis) return;
    const { synthesis, category } = state.reading;
    const factors = synthesis.decisiveFactors.map((factor) => `
      <li>
        <strong>${escapeHtml(`${factor.positionName} · ${factor.cardName} ${factor.orientation}`)}</strong>
        <span>${escapeHtml(factor.role)}</span>
        <p>${escapeHtml(factor.text)}</p>
      </li>
    `).join("");

    dom.insightContent.innerHTML = `
      <article class="summary-reading decisive-reading" data-accent-token="${accentToken(category.accent)}">
        <header class="summary-hero">
          <span class="summary-overline">FINAL JUDGMENT · 最终判断</span>
          <h3>${escapeHtml(synthesis.verdict.label)}</h3>
          <p>${escapeHtml(synthesis.judgment)}</p>
        </header>

        <section class="reading-block">
          <div class="reading-block-label">走势依据</div>
          <p>${escapeHtml(synthesis.trajectory)}</p>
        </section>

        <section class="reading-block">
          <div class="reading-block-label">决定性牌位</div>
          <ul class="summary-list decisive-factor-list">${factors}</ul>
        </section>

        <section class="reading-block">
          <div class="reading-block-label">改判条件</div>
          <p>${escapeHtml(synthesis.changeCondition)}</p>
        </section>
      </article>
    `;
    scrollTop(dom);
  }

  return Object.freeze({ renderCardInsight, renderSummary });
}
