import { resolveDeckStyle } from "../config/decks.js";

export function createLegacyReadingRecord(reading) {
  const record = {
    id: reading.id,
    createdAt: reading.createdAt,
    categoryId: reading.category.id,
    categoryName: reading.category.name,
    categoryIcon: reading.category.icon,
    categoryAccent: reading.category.accent,
    question: reading.question.text,
    spreadName: reading.spread.name,
    deckName: resolveDeckStyle(reading.deckStyle).name,
    cards: reading.draws.map((draw) => ({
      name: draw.card.name,
      orientation: draw.reversed ? "逆位" : "正位",
      position: draw.position.name,
    })),
    headline: reading.synthesis?.summary?.takeaway
      || reading.synthesis?.judgment
      || reading.synthesis?.headline
      || "",
  };
  if (reading.question?.id) record.questionId = reading.question.id;
  if (reading.evaluationSelection) {
    record.evaluationSelection = {
      outputContract: reading.evaluationSelection.outputContract || null,
      expectationId: reading.evaluationSelection.expectationId || null,
      criterionId: reading.evaluationSelection.criterionId || null,
      comparisonOptions: (reading.evaluationSelection.comparisonOptions || []).map((item) => ({ id: item.id, label: item.label })),
    };
  }
  return record;
}
