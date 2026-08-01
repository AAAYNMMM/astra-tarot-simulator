import { accentToken } from "../../config/accent-tokens.js";
import { resolveDeckStyle } from "../../config/decks.js";

function scrollTop(dom) {
  requestAnimationFrame(() => {
    dom.insightContent.scrollTop = 0;
  });
}

function evidenceForPosition(synthesis, positionId) {
  return synthesis?.cardEvidence?.find((item) => item.positionId === positionId) || null;
}

function createElement(documentRef, tag, className = "", text = "") {
  const element = documentRef.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
}

function section(documentRef, label, className = "") {
  const element = createElement(documentRef, "section", `reading-block concise-block ${className}`.trim());
  element.append(createElement(documentRef, "div", "reading-block-label", label));
  return element;
}

function paragraph(documentRef, text, className = "") {
  return createElement(documentRef, "p", className, text);
}

const HISTORY_ONLY_NOTICE = "问题仅用于记录，不参与抽牌、解牌或评分。请根据自己的问题理解牌面提示。";
const PENALTY_FACTORS = new Set(["resistance", "cost", "interCardConflict"]);

function historyOnlyNotice(documentRef) {
  const notice = paragraph(documentRef, HISTORY_ONLY_NOTICE, "history-only-reading-notice");
  notice.setAttribute("role", "note");
  return notice;
}

function textList(documentRef, items, className = "concise-evidence-list") {
  const list = createElement(documentRef, "ul", className);
  for (const item of items || []) list.append(createElement(documentRef, "li", "", item.text));
  return list;
}

function decisionCard(documentRef, label, item, tone) {
  const card = createElement(documentRef, "article", `concise-decision-card is-${tone}`);
  card.append(
    createElement(documentRef, "span", "condition-label", label),
    paragraph(documentRef, item.text),
  );
  return card;
}

function assessmentFactorCard(documentRef, label, factors, tone) {
  const card = createElement(documentRef, "article", `concise-decision-card assessment-factors is-${tone}`);
  card.append(createElement(documentRef, "span", "condition-label", label));
  if (!factors.length) {
    card.append(paragraph(documentRef, tone === "success" ? "当前没有额外的明显加分项。" : "当前没有额外的明显限制项。"));
    return card;
  }
  const list = createElement(documentRef, "ul", "assessment-factor-list");
  for (const item of factors) list.append(createElement(documentRef, "li", "", item.text));
  card.append(list);
  return card;
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
      createElement(documentRef, "span", "loading-kicker", "正在生成精简解读"),
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
    const evidence = evidenceForPosition(state.reading.synthesis, position.id);
    const detail = state.reading.engineResult?.cardDetails?.find((item) => (
      item.cardId === card.id && item.positionId === (draw.enginePosition?.id || position.id)
    ));

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

    article.append(historyOnlyNotice(documentRef));
    const meaning = section(documentRef, detail ? "当前牌面基础含义" : evidence ? "本牌位依据" : "等待综合", "position-detail-block");
    meaning.append(paragraph(documentRef, detail?.baseMeaning || evidence?.text || "完整牌阵翻开后，会依据当前方向、牌位与牌阵结构生成本牌详情。"));
    if (detail?.reversalMode) {
      const reversal = section(documentRef, "逆位机制", "position-detail-block");
      reversal.append(paragraph(documentRef, `${detail.reversalModeLabel || detail.reversalMode}（${detail.reversalMode}）`));
      article.append(meaning, reversal);
    } else {
      article.append(meaning);
    }
    const positionMeaning = section(documentRef, "所在位置的含义", "position-detail-block");
    positionMeaning.append(paragraph(documentRef, detail?.positionMeaning || position.prompt));
    const context = section(documentRef, "在整副牌中的作用");
    const contextBody = createElement(documentRef, "div", "position-context");
    contextBody.append(
      createElement(documentRef, "strong", "", detail ? position.name : evidence?.role || "待综合"),
      paragraph(documentRef, detail?.spreadRole || "牌阵完整后再形成结构作用判断。"),
    );
    context.append(contextBody);
    const relations = section(documentRef, "关键关联牌");
    if (detail?.relations?.length) {
      const relationList = createElement(documentRef, "ul", "card-relation-list");
      for (const relation of detail.relations) {
        const item = createElement(documentRef, "li", `is-${relation.kind}`);
        item.append(
          createElement(documentRef, "strong", "", `${relation.relatedCardName} · ${relation.label}`),
          paragraph(documentRef, relation.text),
        );
        relationList.append(item);
      }
      relations.append(relationList);
    } else {
      relations.append(paragraph(documentRef, state.reading.spread.id === "single"
        ? "单张牌阵不适用牌间关系判断。"
        : "当前没有达到展示置信度的直接结构关系。"));
    }
    article.prepend(header);
    article.append(positionMeaning, context, relations);
    return article;
  }

  function renderCardInsight(index) {
    if (!state.reading) return;
    let cache = cardCache.get(state.reading);
    if (!cache) {
      cache = new Map();
      cardCache.set(state.reading, cache);
    }
    if (!cache.has(index) || state.reading.engineResult) cache.set(index, buildCardInsight(index));
    commit(cache.get(index));
  }

  function buildV3Summary(presentation) {
    const article = createElement(documentRef, "article", "summary-reading assessment-summary structural-summary");
    article.dataset.schemaVersion = presentation.schemaVersion;
    article.dataset.spreadId = presentation.spreadId;
    article.append(historyOnlyNotice(documentRef));

    const hero = createElement(documentRef, "header", "summary-hero concise-hero");
    hero.append(createElement(documentRef, "span", "summary-overline", "综合顺势等级"));
    if (presentation.grade) {
      const grade = createElement(documentRef, "div", "assessment-grade");
      grade.append(
        createElement(documentRef, "strong", "", presentation.grade.level),
        createElement(documentRef, "span", "", presentation.grade.label),
      );
      hero.append(grade);
    } else {
      hero.append(createElement(documentRef, "h3", "", "结构证据不足"));
    }
    hero.append(paragraph(documentRef, presentation.structuralTendency?.text || "当前牌阵不足以形成完整结构判断。", "judgment-copy"));
    article.append(hero);

    const bands = section(documentRef, "评分依据", "concise-evidence-section");
    const bandList = createElement(documentRef, "dl", "structural-factor-bands");
    for (const factor of presentation.factorBands || []) {
      const penaltyClass = PENALTY_FACTORS.has(factor.factor) ? " is-penalty" : "";
      const row = createElement(documentRef, "div", `factor-band is-${factor.band}${penaltyClass}`);
      row.append(
        createElement(documentRef, "dt", "", factor.label),
        createElement(documentRef, "dd", "", factor.text),
      );
      bandList.append(row);
    }
    bands.append(bandList);
    article.append(bands);

    const analysis = section(documentRef, "牌阵结构解读", "concise-evidence-section");
    analysis.append(textList(documentRef, presentation.basis || []));
    article.append(analysis);

    const factors = section(documentRef, "主要有利因素与限制", "concise-decision-section");
    const factorGrid = createElement(documentRef, "div", "assessment-factor-grid");
    factorGrid.append(
      assessmentFactorCard(documentRef, "主要有利因素", presentation.favorableFactors || [], "success"),
      assessmentFactorCard(documentRef, "主要限制", presentation.limitingFactors || [], "failure"),
    );
    factors.append(factorGrid);
    article.append(factors);

    const conditions = section(documentRef, "成立条件、停止信号与转折", "concise-decision-section");
    const conditionGrid = createElement(documentRef, "div", "concise-decision-grid");
    const success = presentation.conditions?.success?.[0];
    const stop = presentation.conditions?.stopSignals?.[0];
    conditionGrid.append(
      decisionCard(documentRef, "成立条件", success || { text: "证据不足，暂不形成成立条件。" }, "success"),
      decisionCard(documentRef, "停止信号", stop || { text: "证据不足，暂不形成停止信号。" }, "failure"),
    );
    const turning = presentation.conditions?.turningPoints?.[0];
    if (turning) conditionGrid.append(decisionCard(documentRef, "转折信号", turning, "turning"));
    conditions.append(conditionGrid);
    article.append(conditions);

    const reality = section(documentRef, "现实参考", "concise-decision-section");
    reality.append(paragraph(documentRef, presentation.realityReference?.text || "证据不足，暂不形成现实参考。"));
    article.append(reality);
    return article;
  }

  function buildAssessmentSummary(presentation) {
    const { category } = state.reading;
    const article = createElement(documentRef, "article", "summary-reading assessment-summary");
    article.dataset.accentToken = accentToken(category.accent);
    article.dataset.schemaVersion = presentation.schemaVersion;
    article.dataset.outputContract = presentation.outputContract;

    const hero = createElement(documentRef, "header", "summary-hero concise-hero");
    hero.append(createElement(documentRef, "span", "summary-overline", presentation.heading));
    if (presentation.grade) {
      const grade = createElement(documentRef, "div", "assessment-grade");
      grade.append(
        createElement(documentRef, "strong", "", presentation.grade),
        createElement(documentRef, "span", "", presentation.gradeLabel || "期待契合"),
      );
      hero.append(grade);
    } else {
      hero.append(createElement(documentRef, "h3", "", presentation.trend.label));
    }
    hero.append(paragraph(documentRef, presentation.summary, "judgment-copy"));
    article.append(hero);

    const reason = section(documentRef, presentation.grade ? "为什么是这个等级" : "整体走势", "concise-evidence-section");
    reason.append(paragraph(documentRef, presentation.reason));
    article.append(reason);

    const factors = section(documentRef, "有利因素与主要限制", "concise-decision-section");
    const factorGrid = createElement(documentRef, "div", "assessment-factor-grid");
    factorGrid.append(
      assessmentFactorCard(documentRef, "主要有利因素", presentation.favorableFactors || [], "success"),
      assessmentFactorCard(documentRef, "主要限制因素", presentation.limitingFactors || [], "failure"),
    );
    factors.append(factorGrid);
    article.append(factors);

    const guidance = section(documentRef, "现实指引", "concise-decision-section");
    const action = createElement(documentRef, "article", "concise-action-card");
    action.append(createElement(documentRef, "span", "condition-label", "下一步"), paragraph(documentRef, presentation.guidance));
    if (presentation.observableSignals?.length) {
      const signalText = presentation.observableSignals.map((item) => item.label).join("；");
      action.append(createElement(documentRef, "small", "", `现实核验：${signalText}`));
    }
    guidance.append(action);
    article.append(guidance);
    return article;
  }

  function buildLegacySummary() {
    const { synthesis, category } = state.reading;
    const article = createElement(documentRef, "article", "summary-reading concise-reading");
    article.dataset.accentToken = accentToken(category.accent);
    article.dataset.schemaVersion = synthesis.schemaVersion;
    article.dataset.verdictCode = synthesis.summary.verdictCode;

    const hero = createElement(documentRef, "header", "summary-hero concise-hero");
    hero.append(
      createElement(documentRef, "span", "summary-overline", "READING · 精简解读"),
      createElement(documentRef, "h3", "", synthesis.summary.verdictLabel),
      paragraph(documentRef, synthesis.summary.takeaway, "judgment-copy"),
    );
    article.append(hero);

    const evidenceSection = section(documentRef, "关键依据", "concise-evidence-section");
    const evidenceList = createElement(documentRef, "ul", "concise-evidence-list");
    for (const item of synthesis.keyEvidence) {
      const row = createElement(documentRef, "li", "concise-evidence-item");
      row.append(
        createElement(documentRef, "strong", "", item.role),
        paragraph(documentRef, item.text),
      );
      evidenceList.append(row);
    }
    evidenceSection.append(evidenceList);
    article.append(evidenceSection);

    const conditions = section(documentRef, "条件与下一步", "concise-decision-section");
    const conditionGrid = createElement(documentRef, "div", "concise-decision-grid");
    conditionGrid.append(
      decisionCard(documentRef, "成立前提", synthesis.condition.success, "success"),
      decisionCard(documentRef, "停止信号", synthesis.condition.failure, "failure"),
    );
    const action = createElement(documentRef, "article", "concise-action-card");
    action.append(
      createElement(documentRef, "span", "condition-label", "下一步"),
      paragraph(documentRef, synthesis.action.text),
      createElement(documentRef, "small", "", `转折信号：${synthesis.condition.turningPoint.text}`),
    );
    conditionGrid.append(action);
    conditions.append(conditionGrid);
    article.append(conditions);

    const details = createElement(documentRef, "details", "card-evidence-details");
    details.append(createElement(documentRef, "summary", "", `查看逐牌依据 · ${synthesis.cardEvidence.length} 张`));
    const list = createElement(documentRef, "ol", "card-evidence-list");
    for (const [index, item] of synthesis.cardEvidence.entries()) {
      const row = createElement(documentRef, "li", "card-evidence-item");
      const heading = createElement(documentRef, "header", "card-evidence-heading");
      heading.append(
        createElement(documentRef, "span", "position-index", String(index + 1).padStart(2, "0")),
        createElement(documentRef, "strong", "", `${item.positionName}｜${item.cardName} ${item.orientation === "reversed" ? "逆位" : "正位"}`),
        createElement(documentRef, "em", "", item.role),
      );
      row.append(heading, paragraph(documentRef, item.text));
      list.append(row);
    }
    details.append(list);
    article.append(details);
    return article;
  }

  function buildSummary() {
    const presentation = state.reading?.assessment?.presentation;
    if (presentation?.schemaVersion === "3.0.0") return buildV3Summary(presentation);
    return presentation ? buildAssessmentSummary(presentation) : buildLegacySummary();
  }

  function renderSummary() {
    if (!state.reading?.synthesis) return;
    if (!summaryCache.has(state.reading)) summaryCache.set(state.reading, buildSummary());
    commit(summaryCache.get(state.reading));
  }

  return Object.freeze({ renderCardInsight, renderSummary, renderLoading });
}
