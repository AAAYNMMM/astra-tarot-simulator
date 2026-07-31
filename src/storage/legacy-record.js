import { resolveDeckStyle } from "../config/decks.js";

export function createLegacyReadingRecord(reading) {
  return {
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
    headline: reading.synthesis?.headline || "",
  };
}
