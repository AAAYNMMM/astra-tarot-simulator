const REQUIRED_IDS = Object.freeze([
  "brandHome", "questionInput", "questionValidationMessage", "questionCharacterCount",
  "spreadList", "deckStyleList", "startReading", "readingKicker",
  "readingTitle", "readingMeta", "metaCategory", "metaSpread", "readingStage", "idleState",
  "idleDeckImage", "shuffleScene", "shuffleDeck", "shufflePhase", "shuffleProgress",
  "cardTable", "stageGuidance", "guidanceText", "statusText", "insightTabs",
  "insightContent", "newReadingButton", "revealAllButton", "historyButton", "helpButton",
  "historyDialog", "helpDialog", "confirmDialog", "confirmTitle", "confirmMessage",
  "confirmAccept", "historyList", "clearHistoryButton", "toastRegion", "installButton",
]);

export function bindDom(documentRef = globalThis.document) {
  if (!documentRef) throw new Error("DOM bindings require a document.");
  const bindings = {};
  for (const id of REQUIRED_IDS) {
    const element = documentRef.getElementById(id);
    if (!element) throw new Error(`Required DOM element is missing: #${id}`);
    bindings[id] = element;
  }
  const readingPanel = documentRef.querySelector(".reading-panel");
  if (!readingPanel) throw new Error("Required DOM element is missing: .reading-panel");
  bindings.readingPanel = readingPanel;
  return Object.freeze(bindings);
}
