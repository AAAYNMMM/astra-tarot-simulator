function legacyRandomContext({ secureShuffle, randomUnit }) {
  if (typeof secureShuffle !== "function" || typeof randomUnit !== "function") {
    throw new TypeError("createRandomContext or legacy random functions are required.");
  }
  return {
    audit: null,
    draw: { shuffle: secureShuffle, nextInt: (maximum) => Math.floor(randomUnit() * maximum) },
    orientation: { nextUnit: randomUnit },
    rendering: null,
    derive: null,
  };
}

function drawCards({ deck, spread, drawStream, orientationStream, branch = null, startIndex = 0 }) {
  const selectedCards = drawStream.shuffle(deck).slice(0, spread.positions.length);
  return selectedCards.map((card, index) => {
    const basePosition = spread.positions[index];
    const position = branch
      ? Object.freeze({
          ...basePosition,
          id: `${branch.id}-${basePosition.id}`,
          name: `${branch.label} · ${basePosition.name}`,
        })
      : basePosition;
    const result = {
      card,
      reversed: orientationStream.nextUnit() < 0.33,
      position,
      index: startIndex + index,
    };
    if (branch) {
      result.enginePosition = basePosition;
      result.branchId = branch.id;
      result.branchLabel = branch.label;
    }
    return result;
  });
}

function comparisonRandomAudit(audit, streams) {
  if (!audit) return null;
  return Object.freeze({
    ...audit,
    comparison: Object.freeze({
      schemaVersion: "1.0.0",
      derivation: "named-independent-substreams",
      streams: Object.freeze(Object.fromEntries(streams.map((stream) => [
        stream.name,
        Object.freeze({ name: stream.name, derivedSeed: stream.derivedSeed }),
      ]))),
    }),
  });
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
  return function createReading({ evaluationSelection = null, questionText = null } = {}) {
    const category = currentCategory();
    const question = currentQuestion();
    const spread = currentSpread();
    const randomContext = createRandomContext
      ? createRandomContext()
      : legacyRandomContext({ secureShuffle, randomUnit });
    const isComparison = evaluationSelection?.outputContract === "comparison-support";
    let draws;
    let comparison = null;
    let randomAudit = randomContext.audit;
    if (isComparison) {
      if (spread.id !== "timeline" || typeof randomContext.derive !== "function") {
        throw new Error("Comparison readings require timeline and named deterministic substreams.");
      }
      const options = evaluationSelection.comparisonOptions || [];
      if (options.length !== 2) throw new Error("Comparison readings require two named options.");
      const streams = [];
      const branchDraws = options.map((option, branchIndex) => {
        const drawStream = randomContext.derive(`comparison:${option.id}:draw`);
        const orientationStream = randomContext.derive(`comparison:${option.id}:orientation`);
        streams.push(drawStream, orientationStream);
        return drawCards({
          deck,
          spread,
          drawStream,
          orientationStream,
          branch: option,
          startIndex: branchIndex * spread.positions.length,
        });
      });
      draws = branchDraws.flat();
      comparison = Object.freeze({
        schemaVersion: "1.0.0",
        criterionId: evaluationSelection.criterionId,
        options: Object.freeze(options.map((option) => Object.freeze({ ...option }))),
      });
      randomAudit = comparisonRandomAudit(randomContext.audit, streams);
    } else {
      draws = drawCards({
        deck,
        spread,
        drawStream: randomContext.draw,
        orientationStream: randomContext.orientation,
      });
    }
    const createdAt = now();
    const readingQuestion = questionText
      ? Object.freeze({ ...question, text: String(questionText) })
      : question;
    const reading = {
      id: `reading-${createdAt.getTime()}-${randomContext.draw.nextInt(100000)}`,
      createdAt: createdAt.toISOString(),
      category,
      question: readingQuestion,
      spread,
      deckStyle: currentDeckStyle(),
      randomAudit,
      evaluationSelection,
      comparison,
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
