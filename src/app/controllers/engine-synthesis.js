function serializeDraw(draw) {
  const card = draw.card;
  return {
    cardId: card.id,
    cardName: card.name,
    positionId: draw.position.id,
    positionName: draw.position.name,
    orientation: draw.reversed ? "reversed" : "upright",
    meaning: draw.reversed ? card.reversed : card.upright,
    advice: card.advice,
    keywords: [...(card.keywords || [])].slice(0, 4),
    suit: card.suit || (card.arcana === "major" ? "major" : null),
    arcana: card.arcana,
  };
}

export function serializeReadingForWorker(reading) {
  if (!reading?.question?.id || !reading?.spread?.id || !Array.isArray(reading.draws)) {
    throw new TypeError("Complete reading input is required.");
  }
  return {
    questionId: reading.question.id,
    questionText: reading.question.text,
    categoryId: reading.category?.id || null,
    spreadId: reading.spread.id,
    draws: reading.draws.map(serializeDraw),
  };
}

export function createEngineSynthesis({ workerClient } = {}) {
  if (!workerClient?.synthesize) throw new TypeError("Reading Engine Worker client is required.");
  return (reading) => workerClient.synthesize(serializeReadingForWorker(reading));
}
