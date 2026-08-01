import { majorCards, minorCards } from "./build.js";
import { CATEGORIES } from "./questions.js";
import { SUITS } from "./cards/minor.js";
import { LEGACY_SPREADS_V1 } from "../spreads/definitions.js";
import { LEGACY_KNOWLEDGE_METADATA } from "./metadata.js";

const deck = Object.freeze([...majorCards, ...minorCards]);
const categories = Object.freeze(CATEGORIES);
// Keep the byte-for-byte V1 public snapshot free of the newer version marker.
const spreads = Object.freeze(LEGACY_SPREADS_V1.map((spread) => Object.freeze({
  id: spread.id,
  name: spread.name,
  short: spread.short,
  description: spread.description,
  positions: spread.positions,
})));
const suits = Object.freeze(SUITS);

if (deck.length !== LEGACY_KNOWLEDGE_METADATA.cardCount) throw new Error("Legacy card catalog count mismatch.");
if (categories.reduce((sum, category) => sum + category.questions.length, 0) !== LEGACY_KNOWLEDGE_METADATA.questionCount) throw new Error("Legacy question catalog count mismatch.");
if (spreads.length !== LEGACY_KNOWLEDGE_METADATA.spreadCount) throw new Error("Legacy spread catalog count mismatch.");

export const TarotData = Object.freeze({ deck, categories, spreads, suits });
export { LEGACY_KNOWLEDGE_METADATA };
