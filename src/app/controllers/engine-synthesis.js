function serializeDraw(draw) {
  const card = draw?.card;
  const position = draw?.enginePosition || draw?.position;
  if (!card?.id || !position?.id) throw new TypeError("Every draw requires card and position identities.");
  return Object.freeze({
    cardId: card.id,
    positionId: position.id,
    orientation: draw.reversed ? "reversed" : "upright",
  });
}

export const READING_REQUEST_PROTOCOL_VERSION = "3.0.0";
export const LEGACY_READING_REQUEST_PROTOCOL_VERSION = "2.0.0";

function serializeLegacyReading(reading) {
  const serializeLegacyDraw = (draw) => {
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
  };
  const comparison = reading.comparison ? {
    schemaVersion: reading.comparison.schemaVersion,
    options: reading.comparison.options.map((option) => ({
      id: option.id,
      label: option.label,
      draws: reading.draws.filter((draw) => draw.branchId === option.id).map(serializeLegacyDraw),
    })),
  } : null;
  return {
    protocolVersion: LEGACY_READING_REQUEST_PROTOCOL_VERSION,
    questionId: reading.question.id,
    questionText: reading.question.text,
    categoryId: reading.category?.id || null,
    spreadId: reading.spread.id,
    expectationId: reading.evaluationSelection?.expectationId || null,
    criterionId: reading.evaluationSelection?.criterionId || null,
    draws: comparison ? [] : reading.draws.map(serializeLegacyDraw),
    comparison,
  };
}

function isLegacyRuntimeReading(reading) {
  if (reading?.schemaVersion === "3.0.0"
    || reading?.question?.purpose === "history-only"
    || reading?.spread?.definitionVersion === "2.0.0") return false;
  return Boolean(
    reading?.evaluationSelection?.outputContract
    || (!reading?.randomAudit && reading?.question?.id),
  );
}

export function serializeReadingForWorker(reading) {
  if (!reading?.spread?.id || !Array.isArray(reading.draws)) {
    throw new TypeError("Complete reading input is required.");
  }
  if (isLegacyRuntimeReading(reading)) return serializeLegacyReading(reading);
  if (!reading.id) throw new TypeError("V3 reading input requires readingId.");
  if (!reading.randomAudit) throw new TypeError("V3 reading input requires randomAudit.");
  return Object.freeze({
    protocolVersion: READING_REQUEST_PROTOCOL_VERSION,
    readingId: reading.id,
    spreadId: reading.spread.id,
    spreadDefinitionVersion: reading.spread.definitionVersion || "2.0.0",
    draws: Object.freeze(reading.draws.map(serializeDraw)),
    randomAudit: reading.randomAudit,
  });
}

export function createEngineSynthesis({ workerClient } = {}) {
  if (!workerClient?.synthesize) throw new TypeError("Reading Engine Worker client is required.");
  return (reading) => workerClient.synthesize(serializeReadingForWorker(reading));
}
