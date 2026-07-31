import { TarotData as data } from "../src/knowledge/legacy/index.js";

if (data.deck.length !== 78) throw new Error(`Expected 78 cards, received ${data.deck.length}`);
if (new Set(data.deck.map((card) => card.id)).size !== 78) throw new Error("Card IDs must be unique");
if (data.deck.filter((card) => card.arcana === "major").length !== 22) throw new Error("Expected 22 major arcana cards");
if (data.deck.filter((card) => card.arcana === "minor").length !== 56) throw new Error("Expected 56 minor arcana cards");
if (data.categories.length !== 6) throw new Error("Expected six question categories");
if (data.categories.some((category) => category.questions.length !== 15)) throw new Error("Expected fifteen preset questions in every category");
if (data.categories.reduce((sum, category) => sum + category.questions.length, 0) !== 90) throw new Error("Expected 90 preset questions");
if (data.spreads.length !== 4) throw new Error("Expected four spreads");
const spreadCounts = data.spreads.map((spread) => spread.positions.length).join(",");
if (spreadCounts !== "1,3,5,10") throw new Error(`Expected spread sizes 1,3,5,10; received ${spreadCounts}`);
for (const card of data.deck) {
  for (const field of ["name", "en", "upright", "reversed", "advice"]) {
    if (!card[field]) throw new Error(`${card.id} is missing ${field}`);
  }
}
console.log("Tarot data smoke test passed: direct ESM knowledge, 78 cards, 90 questions, and 1/3/5/10-card spreads.");
