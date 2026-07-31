import { createValidatedClaim } from "../claims/claim-engine.js";
import { createObservation } from "../observations/observation-engine.js";
import { createRelationGraph } from "../relations/relation-engine.js";
import { createStructuralRelationCandidates } from "../relations/structural-relation-candidates.js";
import { renderReadingText } from "../text/template-renderer.js";
import { loadCardProfile } from "../../knowledge/cards/registry.js";
import { loadQuestionProfile } from "../../knowledge/questions/registry.js";
import { SPREADS } from "../../knowledge/spreads/definitions.js";
import { getPositionOperator } from "../../knowledge/spreads/operators/index.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function normalizeDraw(draw, index, spread) {
  const position = spread.positions[index];
  if (!position) throw new RangeError(`Spread ${spread.id} has no position at index ${index}.`);
  if (draw.positionId && draw.positionId !== position.id) {
    throw new Error(`Draw position ${draw.positionId} does not match ${position.id}.`);
  }
  const orientation = draw.orientation || (draw.reversed ? "reversed" : "upright");
  if (!["upright", "reversed"].includes(orientation)) {
    throw new Error(`Unsupported orientation: ${orientation}`);
  }
  const cardId = draw.cardId || draw.card?.id;
  if (!cardId) throw new TypeError(`Draw ${index} is missing cardId.`);
  return { cardId, orientation, position };
}

export async function executeReadingEngine({
  questionId,
  spreadId,
  draws,
  renderingStream = null,
} = {}) {
  if (typeof questionId !== "string" || !questionId) throw new TypeError("questionId is required.");
  if (typeof spreadId !== "string" || !spreadId) throw new TypeError("spreadId is required.");
  if (!Array.isArray(draws) || draws.length === 0) throw new TypeError("draws must be non-empty.");

  const spread = SPREADS.find((item) => item.id === spreadId);
  if (!spread) throw new Error(`Unknown spread: ${spreadId}`);
  if (draws.length !== spread.positions.length) {
    throw new Error(`Spread ${spreadId} requires ${spread.positions.length} draws.`);
  }

  const question = await loadQuestionProfile(questionId);
  const normalized = draws.map((draw, index) => normalizeDraw(draw, index, spread));
  const cards = await Promise.all(normalized.map((draw) => loadCardProfile(draw.cardId)));
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const observations = normalized.map((draw, index) => {
    const card = cards[index];
    const reversalMode = draw.orientation === "reversed"
      ? card.reversal.supportedModes[0]
      : null;
    return createObservation({
      card,
      question,
      operator: getPositionOperator(spreadId, draw.position.id),
      orientation: draw.orientation,
      reversalMode,
    });
  });
  const structuralBatch = createStructuralRelationCandidates({ spreadId, observations });
  const relationBatch = createRelationGraph({
    structuralBatch,
    observations,
    question,
    cards: cardsById,
  });
  const claimPipeline = createValidatedClaim({ relationBatch, observations, question });
  const rendered = renderReadingText({
    claim: claimPipeline.claim,
    candidateBatch: claimPipeline.candidateBatch,
    observations,
    renderingStream,
  });
  return deepFreeze({
    schemaVersion: "1.0.0",
    questionId,
    spreadId,
    observations,
    relations: relationBatch.relations,
    claims: [claimPipeline.claim],
    claim: claimPipeline.claim,
    candidateBatch: claimPipeline.candidateBatch,
    resolution: claimPipeline.resolution,
    rendered,
    provenance: {
      engineVersion: "1.0.0",
      observationCount: observations.length,
      relationCount: relationBatch.relationCount,
      claimCount: 1,
    },
  });
}
