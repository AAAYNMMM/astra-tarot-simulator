import { executeReadingEngine } from "../../engine/runtime/reading-engine.js";
import { humanConclusionLabel } from "../../knowledge/templates/claim-templates.js";

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function dominantElement(draws) {
  const counts = new Map();
  for (const draw of draws || []) {
    const element = draw.card?.element || "综合";
    counts.set(element, (counts.get(element) || 0) + 1);
  }
  return [...counts.entries()].sort((left, right) => (
    right[1] - left[1] || (left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0)
  ))[0]?.[0] || "综合";
}

function relationSentence(relation) {
  const type = {
    causes: "形成",
    conditions: "构成条件",
    supports: "提供支持",
    weakens: "削弱",
    reinforces: "强化",
    contradicts: "形成张力",
    transforms: "推动转化",
    repairs: "提供修正",
    continues: "延续",
  }[relation.type] || "产生关联";
  return `${relation.structure?.sourcePositionId || "前一牌位"}与${relation.structure?.targetPositionId || "后一牌位"}之间${type}，需要结合两处证据共同理解。`;
}

export async function createEngineSynthesis(reading) {
  if (!reading) throw new TypeError("reading is required.");
  const engineResult = await executeReadingEngine({
    questionId: reading.question.id,
    spreadId: reading.spread.id,
    draws: reading.draws.map((draw) => ({
      cardId: draw.card.id,
      positionId: draw.position.id,
      orientation: draw.reversed ? "reversed" : "upright",
    })),
    renderingStream: reading.renderingRandom || null,
  });
  const paragraphs = engineResult.rendered.sections.flatMap((section) => section.paragraphs);
  const evidence = paragraphs.filter((item) => item.role === "evidence").map((item) => item.text);
  const decisions = paragraphs
    .filter((item) => ["conclusion", "conditions", "coverage-gap", "conflict"].includes(item.role))
    .map((item) => item.text);
  const actions = unique([
    ...decisions,
    "把最重要的条件写下来，再选择一个可撤回的小步骤。",
    "在行动前核对现实信息，并为不确定性保留调整空间。",
  ]).slice(0, 3);
  const conclusion = humanConclusionLabel(engineResult.claim.conclusionType);
  const synthesis = {
    headline: conclusion,
    overview: paragraphs.find((item) => item.role === "conclusion")?.text || `当前结论更接近：${conclusion}。`,
    narrative: engineResult.rendered.plainText,
    observations: evidence.slice(0, 4),
    connections: engineResult.relations.map(relationSentence).slice(0, 6),
    actions,
    uprightCount: reading.draws.filter((draw) => !draw.reversed).length,
    reversedCount: reading.draws.filter((draw) => draw.reversed).length,
    element: dominantElement(reading.draws),
  };
  Object.defineProperty(synthesis, "engineResult", {
    value: engineResult,
    enumerable: false,
    writable: false,
  });
  return Object.freeze(synthesis);
}
