import { accentToken } from "../../config/accent-tokens.js";
import { resolveDeckStyle } from "../../config/decks.js";

function scrollTop(dom) {
  requestAnimationFrame(() => {
    dom.insightContent.scrollTop = 0;
  });
}

function factorForPosition(synthesis, positionId) {
  return synthesis?.positionAnalyses?.find((factor) => factor.positionId === positionId)
    || synthesis?.decisiveFactors?.find((factor) => factor.positionIds.includes(positionId))
    || null;
}

function createElement(documentRef, tag, className = "", text = "") {
  const element = documentRef.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function section(documentRef, label, className = "") {
  const element = createElement(documentRef, "section", `reading-block longform-block ${className}`.trim());
  element.append(createElement(documentRef, "div", "reading-block-label", label));
  return element;
}

function paragraph(documentRef, text, className = "") {
  return createElement(documentRef, "p", className, text);
}

function conditionCard(documentRef, label, text, tone) {
  const item = createElement(documentRef, "article", `condition-card is-${tone}`);
  item.append(
    createElement(documentRef, "span", "condition-label", label),
    paragraph(documentRef, text),
  );
  return item;
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
  const documentRef = dom.insightContent.ownerDocument;
  const summaryCache = new WeakMap();
  const cardCache = new WeakMap();

  function commit(node) {
    dom.insightContent.replaceChildren(node);
    scrollTop(dom);
  }

  function renderLoading() {
    const fragment = documentRef.createDocumentFragment();
    const container = createElement(documentRef, "div", "interpretation-loading");
    container.setAttribute("role", "status");
    container.setAttribute("aria-live", "polite");
    container.append(
      createElement(documentRef, "span", "loading-kicker", "正在整理完整判词"),
      createElement(documentRef, "div", "loading-line is-wide"),
      createElement(documentRef, "div", "loading-line"),
      createElement(documentRef, "div", "loading-line is-short"),
    );
    fragment.append(container);
    commit(fragment);
  }

  function buildCardInsight(index) {
    const draw = state.reading.draws[index];
    const { card, reversed, position } = draw;
    const deckStyle = resolveDeckStyle(state.reading.deckStyle || currentDeckStyle());
    const orientation = reversed ? "逆位" : "正位";
    const factor = factorForPosition(state.reading.synthesis, position.id);
    const directMeaning = factor?.body || (reversed ? card.reversed : card.upright);
    const role = factor?.role || (reversed ? "阻力" : "推动");

    const article = createElement(documentRef, "article", "card-reading");
    const header = createElement(documentRef, "header", "selected-card-heading");
    const miniCard = createElement(documentRef, "div", `mini-card deck-style-${deckStyle.id} ${reversed ? "is-reversed" : ""}`.trim());
    miniCard.dataset.accentToken = accentToken(card.accent);
    const image = documentRef.createElement("img");
    image.src = cardImagePath(card.id, deckStyle);
    image.alt = "";
    miniCard.append(image);
    const copy = createElement(documentRef, "div", "selected-card-copy");
    copy.append(
      createElement(documentRef, "span", "position-overline", `${String(index + 1).padStart(2, "0")} · ${position.name}`),
      createElement(documentRef, "h3", "", card.name),
      createElement(documentRef, "p", "", card.en),
      createElement(documentRef, "span", `orientation-badge ${reversed ? "is-reversed" : ""}`.trim(), `${reversed ? "↧" : "↥"} ${orientation}`),
    );
    header.append(miniCard, copy);

    const verdict = section(documentRef, "牌位详解", "position-detail-block");
    verdict.append(paragraph(documentRef, directMeaning));
    const context = section(documentRef, "在整副牌中的作用");
    const contextBody = createElement(documentRef, "div", "position-context");
    contextBody.append(
      createElement(documentRef, "strong", "", role),
      paragraph(documentRef, position.prompt),
    );
    context.append(contextBody);
    article.append(header, verdict, context);
    return article;
  }

  function renderCardInsight(index) {
    if (!state.reading) return;
    let cache = cardCache.get(state.reading);
    if (!cache) {
      cache = new Map();
      cardCache.set(state.reading, cache);
    }
    if (!cache.has(index)) cache.set(index, buildCardInsight(index));
    commit(cache.get(index));
  }

  function buildSummary() {
    const { synthesis, category } = state.reading;
    const article = createElement(documentRef, "article", "summary-reading longform-reading");
    article.dataset.accentToken = accentToken(category.accent);

    const hero = createElement(documentRef, "header", "summary-hero longform-hero");
    hero.append(
      createElement(documentRef, "span", "summary-overline", "FINAL JUDGMENT · 最终判断"),
      createElement(documentRef, "h3", "", synthesis.verdict.label),
      paragraph(documentRef, synthesis.judgment, "judgment-copy"),
    );
    article.append(hero);

    const situation = section(documentRef, "局势总解", "situation-analysis");
    for (const text of synthesis.situationAnalysis) {
      situation.append(paragraph(documentRef, text));
    }
    article.append(situation);

    const positions = section(documentRef, "关键牌位详解", "position-analysis-section");
    const list = createElement(documentRef, "ol", "position-analysis-list");
    for (const item of synthesis.positionAnalyses) {
      const row = createElement(documentRef, "li", "position-analysis-card");
      const heading = createElement(documentRef, "header", "position-analysis-heading");
      heading.append(
        createElement(documentRef, "span", "position-index", String(synthesis.positionAnalyses.indexOf(item) + 1).padStart(2, "0")),
        createElement(documentRef, "strong", "", `${item.positionName}｜${item.cardName} ${item.orientation}`),
        createElement(documentRef, "em", "", item.role),
      );
      row.append(heading, paragraph(documentRef, item.body));
      list.append(row);
    }
    positions.append(list);
    article.append(positions);

    const conditions = section(documentRef, "成立、失败与转折条件", "conditions-section");
    const conditionGrid = createElement(documentRef, "div", "condition-grid");
    conditionGrid.append(
      conditionCard(documentRef, "成立条件", synthesis.conditions.success, "success"),
      conditionCard(documentRef, "失败条件", synthesis.conditions.failure, "failure"),
      conditionCard(documentRef, "转折信号", synthesis.conditions.turningPoint, "turning"),
    );
    conditions.append(conditionGrid);
    article.append(conditions);

    if (synthesis.manifestation) {
      const manifestation = section(documentRef, "时间与表现形式", "manifestation-section");
      const details = createElement(documentRef, "dl", "manifestation-grid");
      for (const [label, text] of [
        ["出现渠道", synthesis.manifestation.channel],
        ["发展速度", synthesis.manifestation.pace],
        ["演变顺序", synthesis.manifestation.sequence],
        ["兑现信号", synthesis.manifestation.sign],
      ]) {
        details.append(
          createElement(documentRef, "dt", "", label),
          createElement(documentRef, "dd", "", text),
        );
      }
      manifestation.append(details);
      article.append(manifestation);
    }
    return article;
  }

  function renderSummary() {
    if (!state.reading?.synthesis) return;
    if (!summaryCache.has(state.reading)) summaryCache.set(state.reading, buildSummary());
    commit(summaryCache.get(state.reading));
  }

  return Object.freeze({ renderCardInsight, renderSummary, renderLoading });
}
