import { LEGACY_SPREADS_V1 as SPREADS } from "../src/knowledge/spreads/definitions.js";
import { CARD_PROFILE_IDS, loadCardProfile } from "../src/knowledge/cards/registry.js";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { getLegacyPositionOperator as getPositionOperator } from "../src/knowledge/spreads/operators/index.js";
import { createObservation } from "../src/engine/observations/observation-engine.js";
import { createStructuralRelationCandidates } from "../src/engine/relations/structural-relation-candidates.js";
import { createRelationGraph } from "../src/engine/relations/relation-engine.js";

export const cards = await Promise.all(CARD_PROFILE_IDS.map(loadCardProfile));
export const cardsById = new Map(cards.map((card) => [card.id, card]));
export { QUESTION_PROFILE_IDS, loadQuestionProfile, SPREADS };

export async function buildPhase6Fixture({
  questionIndex = 0,
  spreadId = "cross",
  orientation = "upright",
  offset = 0,
} = {}) {
  const question = await loadQuestionProfile(QUESTION_PROFILE_IDS[questionIndex % QUESTION_PROFILE_IDS.length]);
  const spread = SPREADS.find((item) => item.id === spreadId);
  if (!spread) throw new Error(`Unknown fixture spread ${spreadId}`);
  const observations = spread.positions.map((position, index) => {
    const card = cards[(offset + index) % cards.length];
    return createObservation({
      card,
      question,
      operator: getPositionOperator(spread.id, position.id),
      orientation,
      reversalMode: orientation === "reversed" ? card.reversal.supportedModes[0] : null,
    });
  });
  const structuralBatch = createStructuralRelationCandidates({ spreadId, observations, spreadDefinitionVersion: "1.0.0" });
  const relationBatch = createRelationGraph({
    structuralBatch,
    observations,
    question,
    cards: cardsById,
  });
  return { question, spread, observations, structuralBatch, relationBatch };
}
