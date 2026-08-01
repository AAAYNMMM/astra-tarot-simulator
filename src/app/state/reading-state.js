export function createReadingState({ initialDeckStyle } = {}) {
  return {
    questionText: "",
    spreadId: "timeline",
    deckStyleId: initialDeckStyle,
    phase: "setup",
    reading: null,
    revealed: new Set(),
    selectedIndex: null,
    activeTab: "card",
    completing: false,
    confirmResolver: null,
    installPrompt: null,
  };
}

export function resetReadingState(state) {
  state.questionText = "";
  state.phase = "setup";
  state.reading = null;
  state.revealed = new Set();
  state.selectedIndex = null;
  state.activeTab = "card";
  state.completing = false;
}
