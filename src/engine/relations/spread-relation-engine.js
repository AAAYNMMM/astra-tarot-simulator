import { validateStructuralRelationCandidates } from "./structural-relation-candidates.js";
import { analyzeSpreadPositionRelation } from "./spread-position-relation.js";
import { resolveSemanticRelation } from "./semantic-relation-resolver.js";
import { createAuxiliaryRelationSignals, auxiliaryStrengthAdjustment } from "./auxiliary-relation-signals.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function asMap(items, key = "id") {
  if (items instanceof Map) return new Map(items);
  if (Array.isArray(items)) return new Map(items.map((item) => [item[key], item]));
  if (items && typeof items === "object") return new Map(Object.entries(items));
  throw new TypeError("Expected an array, Map, or object registry.");
}

function round(value) {
  return Number(value.toFixed(4));
}

export function createSpreadRelationGraph({ structuralBatch, observations, readingProfile, cards }) {
  const structuralErrors = validateStructuralRelationCandidates(structuralBatch);
  if (structuralErrors.length) throw new Error(structuralErrors.join("; "));
  if (!readingProfile || readingProfile.spreadId !== structuralBatch.spreadId) {
    throw new Error("SpreadReadingProfile must match the structural batch.");
  }
  if (!Array.isArray(observations) || observations.some((item) => item.spreadId !== readingProfile.spreadId)) {
    throw new Error("Observation batch must match the SpreadReadingProfile.");
  }
  const observationsById = asMap(observations);
  const cardsById = asMap(cards);
  const relations = structuralBatch.candidates.map((candidate) => {
    const sourceObservation = observationsById.get(candidate.sourceObservationId);
    const targetObservation = observationsById.get(candidate.targetObservationId);
    if (!sourceObservation || !targetObservation) throw new Error(`Missing Relation endpoint for ${candidate.id}.`);
    const sourceCard = cardsById.get(sourceObservation.cardId);
    const targetCard = cardsById.get(targetObservation.cardId);
    if (!sourceCard || !targetCard) throw new Error(`Missing card profile for ${candidate.id}.`);
    const responsibilityFit = analyzeSpreadPositionRelation({
      candidate,
      sourceObservation,
      targetObservation,
      readingProfile,
    });
    const semantic = resolveSemanticRelation({
      candidate,
      sourceObservation,
      targetObservation,
      sourceCard,
      targetCard,
      responsibilityFit,
    });
    const auxiliarySignals = createAuxiliaryRelationSignals({
      sourceCard,
      targetCard,
      sourceObservation,
      targetObservation,
    });
    const strength = round(Math.min(1, Math.max(0, semantic.strength + auxiliaryStrengthAdjustment(auxiliarySignals))));
    return {
      schemaVersion: "2.0.0",
      id: `rel-${readingProfile.spreadId}-${candidate.structure.edgeId}`,
      spreadId: structuralBatch.spreadId,
      sourceObservationId: sourceObservation.id,
      targetObservationId: targetObservation.id,
      sourceCardId: sourceCard.id,
      targetCardId: targetCard.id,
      type: semantic.type,
      polarity: semantic.polarity,
      strength,
      confidence: semantic.confidence,
      candidateTypes: [...candidate.candidateTypes],
      responsibilityFit,
      semanticEvidence: semantic.evidence,
      auxiliarySignals,
      explanationKeys: [...semantic.explanationKeys],
      tags: [...new Set([
        ...candidate.tags,
        `relation:${semantic.type}`,
        `polarity:${semantic.polarity}`,
        `spread:${readingProfile.spreadId}`,
      ])],
      structure: { ...candidate.structure },
      provenance: {
        topology: "spread-structure",
        profileLayer: "spread-position-responsibility",
        semanticLayer: "card-observation-semantics",
        auxiliaryLayer: "element-number-court-stage",
      },
    };
  });
  return deepFreeze({
    schemaVersion: "2.0.0",
    spreadId: structuralBatch.spreadId,
    graphId: structuralBatch.graphId,
    ...(structuralBatch.spreadDefinitionVersion ? { spreadDefinitionVersion: structuralBatch.spreadDefinitionVersion } : {}),
    relationCount: relations.length,
    relations,
  });
}
