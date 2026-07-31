export function createReadingFactory({ deck, selectors, secureShuffle, randomUnit, now = () => new Date() }) {
  const { currentCategory, currentQuestion, currentSpread, currentDeckStyle } = selectors;
  return function createReading() {
    const category = currentCategory();
    const question = currentQuestion();
    const spread = currentSpread();
    const selectedCards = secureShuffle(deck).slice(0, spread.positions.length);
    const draws = selectedCards.map((card, index) => ({
      card,
      reversed: randomUnit() < 0.33,
      position: spread.positions[index],
      index,
    }));
    const createdAt = now();
    return {
      id: `reading-${createdAt.getTime()}-${Math.floor(randomUnit() * 100000)}`,
      createdAt: createdAt.toISOString(),
      category,
      question,
      spread,
      deckStyle: currentDeckStyle(),
      draws,
      synthesis: null,
    };
  };
}
