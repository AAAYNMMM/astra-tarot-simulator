export function createSelectionSelectors({ categories = null, spreads, deckStyles, state }) {
  function currentCategory() {
    return categories?.find((category) => category.id === state.categoryId) || categories?.[0] || null;
  }
  function currentQuestion() {
    const category = currentCategory();
    return category?.questions?.find((question) => question.id === state.questionId) || category?.questions?.[0] || null;
  }
  function currentSpread() {
    return spreads.find((spread) => spread.id === state.spreadId) || spreads[1] || spreads[0];
  }
  function currentDeckStyle() {
    return deckStyles.find((style) => style.id === state.deckStyleId) || deckStyles[0];
  }
  const selectors = { currentSpread, currentDeckStyle };
  if (categories?.length) Object.assign(selectors, { currentCategory, currentQuestion });
  return Object.freeze(selectors);
}
