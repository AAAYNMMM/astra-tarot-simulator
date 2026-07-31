export const GOLDEN_CARD_IDS = Object.freeze(["major-0", "major-7", "major-9", "major-16", "cups-two", "pentacles-eight"]);

export const GOLDEN_CARD_REGISTRY = Object.freeze({
  "major-0": async () => (await import("./major-0.js")).CARD_PROFILE,
  "major-7": async () => (await import("./major-7.js")).CARD_PROFILE,
  "major-9": async () => (await import("./major-9.js")).CARD_PROFILE,
  "major-16": async () => (await import("./major-16.js")).CARD_PROFILE,
  "cups-two": async () => (await import("./cups-two.js")).CARD_PROFILE,
  "pentacles-eight": async () => (await import("./pentacles-eight.js")).CARD_PROFILE,
});

export async function loadGoldenCardProfile(cardId) {
  const loader = GOLDEN_CARD_REGISTRY[cardId];
  if (!loader) throw new Error(`Unknown golden card profile: ${cardId}`);
  return loader();
}
