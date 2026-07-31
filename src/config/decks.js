const freezeDeckStyle = (style) =>
  Object.freeze({
    ...style,
    ...(style.faceExtensions
      ? { faceExtensions: Object.freeze({ ...style.faceExtensions }) }
      : {}),
  });

export const DECK_STYLES = Object.freeze(
  [
    {
      id: "rws",
      name: "经典韦特",
      description: "1909 · 象征叙事",
      assetDirectory: "assets/rws",
      faceExtension: "jpg",
      cardBack: "assets/rws/card-back-rws.jpg",
      previewCard: "major-17",
    },
    {
      id: "arnoult",
      name: "阿尔诺古典",
      description: "1748 · 木刻原色",
      assetDirectory: "assets/decks/arnoult",
      faceExtension: "png",
      cardBack: "assets/decks/arnoult/card-back.jpg",
      previewCard: "major-2",
    },
    {
      id: "swiss",
      name: "瑞士 1JJ",
      description: "19 世纪 · 明快原色",
      assetDirectory: "assets/decks/swiss-1jj",
      faceExtension: "jpg",
      faceExtensions: { "major-5": "png" },
      cardBack: "assets/decks/swiss-1jj/card-back.png",
      previewCard: "major-18",
    },
    {
      id: "piedmont",
      name: "皮埃蒙特",
      description: "1865 · 意式双头",
      assetDirectory: "assets/decks/piedmont",
      faceExtension: "jpg",
      cardBack: "assets/decks/piedmont/card-back.jpg",
      previewCard: "major-19",
    },
  ].map(freezeDeckStyle),
);

export const LEGACY_DECK_IDS = Object.freeze({
  vintage: "arnoult",
  moonlit: "swiss",
  rose: "piedmont",
});

export function resolveDeckStyle(style) {
  const requestedId = typeof style === "string" ? style : style?.id;
  const deckId = LEGACY_DECK_IDS[requestedId] || requestedId;
  return DECK_STYLES.find((item) => item.id === deckId) || DECK_STYLES[0];
}
