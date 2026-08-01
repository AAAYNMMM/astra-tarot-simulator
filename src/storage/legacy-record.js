import { resolveDeckStyle } from "../config/decks.js";

export function createLegacyReadingRecord(reading) {
  const isV3 = reading.schemaVersion === "3.0.0" || reading.question?.purpose === "history-only";
  const presentation = reading.presentation || reading.assessment?.presentation || reading.synthesis;
  const record = {
    id: reading.id,
    createdAt: reading.createdAt,
    categoryId: isV3 ? "history-only" : reading.category.id,
    categoryName: isV3 ? "自由问题" : reading.category.name,
    categoryIcon: isV3 ? "✦" : reading.category.icon,
    categoryAccent: isV3 ? "#a58ad4" : reading.category.accent,
    question: reading.question.text,
    spreadName: reading.spread.name,
    deckName: resolveDeckStyle(reading.deckStyle).name,
    cards: reading.draws.map((draw) => ({
      name: draw.card.name,
      orientation: draw.reversed ? "逆位" : "正位",
      position: draw.position.name,
    })),
    headline: presentation?.structuralTendency?.text
      || presentation?.structuralTendency
      || presentation?.summary?.takeaway
      || reading.synthesis?.judgment
      || reading.synthesis?.headline
      || "",
  };
  if (isV3) {
    record.spreadId = reading.spread.id;
    record.spreadDefinitionVersion = reading.spread.definitionVersion || "2.0.0";
  }
  if (!isV3 && reading.question?.id) record.questionId = reading.question.id;
  if (!isV3 && reading.evaluationSelection) {
    record.evaluationSelection = {
      outputContract: reading.evaluationSelection.outputContract || null,
      expectationId: reading.evaluationSelection.expectationId || null,
      criterionId: reading.evaluationSelection.criterionId || null,
      comparisonOptions: (reading.evaluationSelection.comparisonOptions || []).map((item) => ({ id: item.id, label: item.label })),
    };
  }
  return record;
}
