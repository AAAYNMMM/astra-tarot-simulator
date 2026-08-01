function serializeDraw(draw) {
  const card = draw.card;
  const position = draw.enginePosition || draw.position;
  return {
    cardId: card.id,
    cardName: card.name,
    positionId: position.id,
    positionName: position.name,
    orientation: draw.reversed ? "reversed" : "upright",
    suit: card.suit || (card.arcana === "major" ? "major" : null),
    arcana: card.arcana,
  };
}

export const READING_REQUEST_PROTOCOL_VERSION = "2.0.0";

export function serializeReadingForWorker(reading) {
  if (!reading?.question?.id || !reading?.spread?.id || !Array.isArray(reading.draws)) {
    throw new TypeError("Complete reading input is required.");
  }
  const comparison = reading.comparison ? {
    schemaVersion: reading.comparison.schemaVersion,
    options: reading.comparison.options.map((option) => ({
      id: option.id,
      label: option.label,
      draws: reading.draws.filter((draw) => draw.branchId === option.id).map(serializeDraw),
    })),
  } : null;
  return {
    protocolVersion: READING_REQUEST_PROTOCOL_VERSION,
    questionId: reading.question.id,
    questionText: reading.question.text,
    categoryId: reading.category?.id || null,
    spreadId: reading.spread.id,
    expectationId: reading.evaluationSelection?.expectationId || null,
    criterionId: reading.evaluationSelection?.criterionId || null,
    draws: comparison ? [] : reading.draws.map(serializeDraw),
    comparison,
  };
}

export function createEngineSynthesis({ workerClient } = {}) {
  if (!workerClient?.synthesize) throw new TypeError("Reading Engine Worker client is required.");
  return (reading) => workerClient.synthesize(serializeReadingForWorker(reading));
}
