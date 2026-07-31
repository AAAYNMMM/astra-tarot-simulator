function legacyRandomContext({ secureShuffle, randomUnit }) {
  if (typeof secureShuffle !== "function" || typeof randomUnit !== "function") {
    throw new TypeError("createRandomContext or legacy random functions are required.");
  }
  return {
    audit: null,
    draw: { shuffle: secureShuffle, nextInt: (maximum) => Math.floor(randomUnit() * maximum) },
    orientation: { nextUnit: randomUnit },
    rendering: null,
  };
}

export function createReadingFactory({
  deck,
  selectors,
  createRandomContext = null,
  secureShuffle = null,
  randomUnit = null,
  now = () => new Date(),
}) {
  const { currentCategory, currentQuestion, currentSpread, currentDeckStyle } = selectors;
  return function createReading() {
    const category = currentCategory();
    const question = currentQuestion();
    const spread = currentSpread();
    const randomContext = createRandomContext
      ? createRandomContext()
      : legacyRandomContext({ secureShuffle, randomUnit });
    const selectedCards = randomContext.draw.shuffle(deck).slice(0, spread.positions.length);
    const draws = selectedCards.map((card, index) => ({
      card,
      reversed: randomContext.orientation.nextUnit() < 0.33,
      position: spread.positions[index],
      index,
    }));
    const createdAt = now();
    const reading = {
      id: `reading-${createdAt.getTime()}-${randomContext.draw.nextInt(100000)}`,
      createdAt: createdAt.toISOString(),
      category,
      question,
      spread,
      deckStyle: currentDeckStyle(),
      randomAudit: randomContext.audit,
      draws,
      synthesis: null,
    };
    Object.defineProperty(reading, "renderingRandom", {
      value: randomContext.rendering,
      enumerable: false,
      writable: false,
    });
    return reading;
  };
}
