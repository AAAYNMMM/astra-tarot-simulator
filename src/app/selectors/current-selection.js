export function createSelectionSelectors({ categories, spreads, deckStyles, state }) {
  function currentCategory() {
    return categories.find((category) => category.id === state.categoryId) || categories[0];
  }
  function currentQuestion() {
    const category = currentCategory();
    return category.questions.find((question) => question.id === state.questionId) || category.questions[0];
  }
  function currentSpread() {
    return spreads.find((spread) => spread.id === state.spreadId) || spreads[1] || spreads[0];
  }
  function currentDeckStyle() {
    return deckStyles.find((style) => style.id === state.deckStyleId) || deckStyles[0];
  }
  return Object.freeze({ currentCategory, currentQuestion, currentSpread, currentDeckStyle });
}
