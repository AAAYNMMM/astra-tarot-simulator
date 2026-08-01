function serializeDraw(draw) {
  return {
    cardId: draw.card.id,
    cardName: draw.card.name,
    positionId: draw.position.id,
    positionName: draw.position.name,
    orientation: draw.reversed ? "reversed" : "upright",
  };
}

export function serializeReadingForWorker(reading) {
  if (!reading?.question?.id || !reading?.spread?.id || !Array.isArray(reading.draws)) {
    throw new TypeError("Complete reading input is required.");
  }
  return {
    questionId: reading.question.id,
    questionText: reading.question.text,
    spreadId: reading.spread.id,
    draws: reading.draws.map(serializeDraw),
  };
}

export function createEngineSynthesis({ workerClient } = {}) {
  if (!workerClient?.synthesize) throw new TypeError("Reading Engine Worker client is required.");
  return (reading) => workerClient.synthesize(serializeReadingForWorker(reading));
}
