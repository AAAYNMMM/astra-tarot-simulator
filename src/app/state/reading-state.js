export function createReadingState({ categories, initialDeckStyle }) {
  const firstCategory = categories?.[0];
  const firstQuestion = firstCategory?.questions?.[0];
  if (!firstCategory || !firstQuestion) {
    throw new Error("Reading state requires at least one category and question.");
  }
  return {
    categoryId: firstCategory.id,
    questionId: firstQuestion.id,
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
  state.phase = "setup";
  state.reading = null;
  state.revealed = new Set();
  state.selectedIndex = null;
  state.activeTab = "card";
  state.completing = false;
}
