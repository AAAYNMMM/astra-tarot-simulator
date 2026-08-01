import { accentToken } from "../../config/accent-tokens.js";
import { createElement, replaceChildren, safeColor, setText } from "../safe-dom.js";

const CONCLUSION_LABELS = Object.freeze({
  "act-now": "可以行动",
  "act-with-conditions": "有条件推进",
  conditional: "有条件推进",
  favorable: "进展有利",
  stabilizing: "趋于稳定",
  growing: "正在增长",
  slowing: "放慢节奏",
  conflicted: "存在冲突",
  restructuring: "需要重整",
  "ending-or-redefining": "结束或重新定义",
  indeterminate: "信息不足",
});

const CONFIDENCE_LABELS = Object.freeze({
  low: "较低",
  medium: "中等",
  "medium-high": "中高",
  high: "较高",
});

export function historyRecordView(record, formatDate) {
  const structured = record?.structured && typeof record.structured === "object"
    ? {
        schemaVersion: String(record.structured.schemaVersion || "1.0.0"),
        status: String(record.structured.status || "available"),
        interpretationSchemaVersion: String(record.structured.interpretationSchemaVersion || ""),
        verdictCode: String(record.structured.verdictCode || ""),
        verdictLabel: String(record.structured.verdictLabel || ""),
        takeaway: String(record.structured.takeaway || ""),
        conclusionType: String(record.structured.conclusionType || ""),
        confidence: String(record.structured.confidence || ""),
        score: Number.isFinite(record.structured.score) ? record.structured.score : null,
        evidenceCount: Number(record.structured.evidenceCount || 0),
        relationCount: Number(record.structured.relationCount || 0),
        conflictCount: Number(record.structured.conflictCount || 0),
        conditionCount: Number(record.structured.conditionCount || 0),
        coverageGapCount: Number(record.structured.coverageGapCount || 0),
        assessment: record.structured.assessment && typeof record.structured.assessment === "object"
          ? {
              outputContract: String(record.structured.assessment.outputContract || ""),
              mode: String(record.structured.assessment.mode || ""),
              grade: record.structured.assessment.grade ? String(record.structured.assessment.grade) : null,
              gradeLabel: String(record.structured.assessment.gradeLabel || ""),
              trendLabel: String(record.structured.assessment.trend?.label || ""),
              summary: String(record.structured.assessment.summary || ""),
              reason: String(record.structured.assessment.reason || ""),
            }
          : null,
      }
    : null;
  const headline = String(record?.headline || structured?.takeaway || "这次牌阵已完成。");
  const verdictLabel = (structured?.assessment?.grade
    ? `${structured.assessment.grade} · ${structured.assessment.gradeLabel}`
    : structured?.assessment?.trendLabel)
    || structured?.verdictLabel
    || CONCLUSION_LABELS[structured?.verdictCode]
    || CONCLUSION_LABELS[structured?.conclusionType]
    || "牌阵已完成";
  return Object.freeze({
    id: String(record?.id ?? ""),
    accent: safeColor(record?.categoryAccent),
    icon: String(record?.categoryIcon || "✦"),
    question: String(record?.question || ""),
    meta: `${String(record?.categoryName || "")} · ${String(record?.spreadName || "")} · ${verdictLabel}`,
    createdAt: String(formatDate(record?.createdAt)),
    deckName: String(record?.deckName || "经典韦特"),
    headline,
    verdictLabel,
    cards: Array.isArray(record?.cards) ? record.cards.map((card) => ({
      position: String(card?.position || ""),
      name: String(card?.name || ""),
      orientation: String(card?.orientation || ""),
    })) : [],
    structured,
  });
}

export function createHistoryRenderer({ documentRef, dom, loadHistory, writeHistory, deleteStructuredReading = null, showToast, formatDate }) {
  function renderHistory() {
    const records = loadHistory();
    dom.clearHistoryButton.hidden = records.length === 0;
    if (records.length === 0) {
      const empty = createElement(documentRef, "div", { className: "history-empty" });
      const content = createElement(documentRef, "div");
      content.append(
        createElement(documentRef, "span", { text: "☾" }),
        documentRef.createTextNode("还没有占卜记录"),
        createElement(documentRef, "br"),
        documentRef.createTextNode("完成一次牌阵后，它会出现在这里。"),
      );
      empty.append(content);
      replaceChildren(dom.historyList, [empty]);
      return;
    }
    const nodes = records.map((record) => {
      const view = historyRecordView(record, formatDate);
      const article = createElement(documentRef, "article", { className: "history-item" });
      article.dataset.historyId = view.id;
      article.dataset.accentToken = accentToken(view.accent);
      article.append(createElement(documentRef, "span", {
        className: "history-icon",
        text: view.icon,
        attributes: { "aria-hidden": "true" },
      }));
      const summary = createElement(documentRef, "div", { className: "history-summary" });
      summary.append(
        createElement(documentRef, "strong", { text: view.question }),
        createElement(documentRef, "small", { text: view.meta }),
        createElement(documentRef, "time", { text: view.createdAt }),
      );
      article.append(summary);
      const actions = createElement(documentRef, "div", { className: "history-actions" });
      const viewButton = createElement(documentRef, "button", {
        className: "history-view-button",
        attributes: {
          type: "button",
          title: "展开查看",
          "aria-label": "展开查看",
          "aria-expanded": "false",
        },
      });
      viewButton.dataset.historyAction = "view";
      viewButton.append(createElement(documentRef, "span", { text: "展开查看" }));
      const deleteButton = createElement(documentRef, "button", {
        className: "history-delete-button",
        text: "×",
        attributes: { type: "button", title: "删除记录", "aria-label": "删除记录" },
      });
      deleteButton.dataset.historyAction = "delete";
      actions.append(viewButton, deleteButton);
      article.append(actions);
      return article;
    });
    replaceChildren(dom.historyList, nodes);
  }

  function appendStructuredDetail(detail, structured) {
    if (!structured) {
      detail.append(createElement(documentRef, "p", {
        className: "history-audit-note",
        text: "这条记录来自兼容历史，没有结构化证据快照。",
      }));
      return;
    }
    const audit = createElement(documentRef, "section", {
      className: "history-audit",
      attributes: { "aria-label": "结构化解读摘要" },
    });
    if (structured.assessment) {
      const assessmentLabel = structured.assessment.grade
        ? `${structured.schemaVersion === "3.0.0" ? "综合顺势等级" : "好运评级"}：${structured.assessment.grade} · ${structured.assessment.gradeLabel}`
        : `走势：${structured.assessment.trendLabel || "观察模式"}`;
      audit.append(
        createElement(documentRef, "strong", { text: assessmentLabel }),
        createElement(documentRef, "p", { text: structured.assessment.summary || structured.assessment.reason }),
      );
    }
    if (structured.schemaVersion === "3.0.0") {
      audit.append(createElement(documentRef, "p", {
        className: "history-audit-note",
        text: "问题仅用于记录，不参与抽牌、解牌或评分。请根据自己的问题理解牌面提示。",
      }));
    }
    const verdictLabel = structured.verdictLabel
      || CONCLUSION_LABELS[structured.verdictCode]
      || CONCLUSION_LABELS[structured.conclusionType]
      || "牌阵已完成";
    audit.append(
      createElement(documentRef, "strong", { text: `${structured.schemaVersion === "3.0.0" ? "结构走势" : "结论"}：${verdictLabel}` }),
      createElement(documentRef, "p", {
        text: structured.takeaway || "这条记录保留了结构化证据，可以继续查看牌面。",
      }),
    );
    const technical = createElement(documentRef, "details", { className: "history-technical" });
    technical.append(
      createElement(documentRef, "summary", { text: "技术详情" }),
      createElement(documentRef, "span", {
        text: `置信度 ${CONFIDENCE_LABELS[structured.confidence] || structured.confidence || "未标注"}${structured.score === null ? "" : ` · 原始分数 ${structured.score}`}`,
      }),
      createElement(documentRef, "span", {
        text: `内部结论码 ${structured.conclusionType || structured.verdictCode || "未标注"}`,
      }),
      createElement(documentRef, "span", {
        text: `证据 ${structured.evidenceCount} · 关系 ${structured.relationCount} · 条件 ${structured.conditionCount}`,
      }),
      createElement(documentRef, "span", {
        text: `冲突 ${structured.conflictCount} · 覆盖缺口 ${structured.coverageGapCount}`,
      }),
    );
    audit.append(technical);
    detail.append(audit);
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
    detail.append(
      createElement(documentRef, "small", { text: `牌面：${view.deckName}` }),
      createElement(documentRef, "p", { text: view.headline }),
    );
    const cards = createElement(documentRef, "div");
    for (const card of view.cards) {
      const row = createElement(documentRef, "span");
      row.append(
        createElement(documentRef, "b", { text: card.position }),
        documentRef.createTextNode(`${card.name} · ${card.orientation}`),
      );
      cards.append(row);
    }
    detail.append(cards);
    appendStructuredDetail(detail, view.structured);
    item.appendChild(detail);
    viewButton?.setAttribute("aria-expanded", "true");
    viewButton?.setAttribute("aria-label", "收起记录");
    setText(viewButton?.querySelector("span"), "收起记录");
  }

  function deleteHistoryRecord(id) {
    writeHistory(loadHistory().filter((record) => record.id !== id));
    if (typeof deleteStructuredReading === "function") void deleteStructuredReading(id);
    renderHistory();
    showToast("该条记录已删除", "×");
  }

  return Object.freeze({ renderHistory, toggleHistoryDetail, deleteHistoryRecord });
}
