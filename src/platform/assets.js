import { resolveDeckStyle } from "../config/decks.js";

export function cardImagePath(cardId, style) {
  const deckStyle = resolveDeckStyle(style);
  const extension = deckStyle.faceExtensions?.[cardId] || deckStyle.faceExtension;
  return `${deckStyle.assetDirectory}/${cardId}.${extension}`;
}

export function cardBackPath(style) {
  return resolveDeckStyle(style).cardBack;
}
