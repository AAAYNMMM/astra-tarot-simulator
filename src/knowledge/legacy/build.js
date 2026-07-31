import { MAJOR_ARCANA } from "./cards/major.js";
import { RANK_META, SUITS } from "./cards/minor.js";

export const majorCards = MAJOR_ARCANA.map((card) => ({
  ...card,
  id: `major-${card.number}`,
  arcana: "major",
  element: "灵",
  suit: null,
  accent: "#c8a66a",
  pips: 0,
  rankShort: card.roman,
}));

export const minorCards = SUITS.flatMap((suit) =>
  suit.cards.map((entry, index) => {
    const rank = RANK_META[index];
    const [keywords, upright, reversed, advice] = entry;
    return {
      id: `${suit.id}-${rank.id}`,
      arcana: "minor",
      number: index + 1,
      roman: rank.short,
      rank: rank.id,
      rankLabel: rank.label,
      rankShort: rank.short,
      pips: rank.pips,
      name: `${suit.name}${rank.label}`,
      en: `${rank.id.toUpperCase()} OF ${suit.en}`,
      symbol: suit.symbol,
      accent: suit.accent,
      element: suit.element,
      suit: suit.id,
      suitName: suit.name,
      suitTheme: suit.theme,
      keywords,
      upright,
      reversed,
      advice,
    };
  }),
);
