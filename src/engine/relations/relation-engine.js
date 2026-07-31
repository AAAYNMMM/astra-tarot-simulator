import { validateStructuralRelationCandidates } from "./structural-relation-candidates.js";
import { analyzeQuestionPositionRelation } from "./question-position-relation.js";
import { resolveSemanticRelation, RELATION_TYPES } from "./semantic-relation-resolver.js";
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

export function createRelationGraph({ structuralBatch, observations, question, cards }) {
  const structuralErrors = validateStructuralRelationCandidates(structuralBatch);
  if (structuralErrors.length) throw new Error(structuralErrors.join("; "));
  if (!question || question.id !== observations?.[0]?.questionId) {
    throw new Error("QuestionProfile must match the observation batch.");
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
    const questionFit = analyzeQuestionPositionRelation({ candidate, sourceObservation, targetObservation, question });
    const semantic = resolveSemanticRelation({
      candidate,
      sourceObservation,
      targetObservation,
      sourceCard,
      targetCard,
      questionFit,
    });
    const auxiliarySignals = createAuxiliaryRelationSignals({
      sourceCard,
      targetCard,
      sourceObservation,
      targetObservation,
    });
    const strength = round(Math.min(1, Math.max(0, semantic.strength + auxiliaryStrengthAdjustment(auxiliarySignals))));
    return {
      schemaVersion: "1.0.0",
      id: `rel-${question.id}-${candidate.structure.edgeId}`,
      questionId: question.id,
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
      questionFit,
      semanticEvidence: semantic.evidence,
      auxiliarySignals,
      explanationKeys: [...semantic.explanationKeys],
      tags: [...new Set([
        ...candidate.tags,
        `relation:${semantic.type}`,
        `polarity:${semantic.polarity}`,
        `question:${question.id}`,
      ])],
      structure: { ...candidate.structure },
      provenance: {
        topology: "spread-structure",
        questionLayer: "question-position-responsibility",
        semanticLayer: "card-observation-semantics",
        auxiliaryLayer: "element-number-court-stage",
      },
    };
  });
  return deepFreeze({
    schemaVersion: "1.0.0",
    questionId: question.id,
    spreadId: structuralBatch.spreadId,
    graphId: structuralBatch.graphId,
    relationCount: relations.length,
    relations,
  });
}

export function validateRelationGraph(batch, structuralBatch) {
  const errors = [];
  if (!batch || !structuralBatch) return ["Relation batch and structural batch are required."];
  if (batch.spreadId !== structuralBatch.spreadId) errors.push("spreadId mismatch");
  if (batch.graphId !== structuralBatch.graphId) errors.push("graphId mismatch");
  const relations = Array.isArray(batch.relations) ? batch.relations : [];
  if (relations.length !== structuralBatch.candidates.length) errors.push("Relation count differs from structural candidates");
  if (batch.relationCount !== relations.length) errors.push("relationCount mismatch");
  const ids = new Set();
  for (let index = 0; index < relations.length; index += 1) {
    const relation = relations[index];
    const candidate = structuralBatch.candidates[index];
    if (!candidate) {
      errors.push(`Unexpected Relation ${relation?.id}`);
      continue;
    }
    if (ids.has(relation.id)) errors.push(`Duplicate Relation ${relation.id}`);
    ids.add(relation.id);
    if (relation.structure?.edgeId !== candidate.structure.edgeId) errors.push(`Structural edge mismatch at ${relation.id}`);
    if (relation.sourceObservationId !== candidate.sourceObservationId) errors.push(`Source mismatch at ${relation.id}`);
    if (relation.targetObservationId !== candidate.targetObservationId) errors.push(`Target mismatch at ${relation.id}`);
    if (!candidate.candidateTypes.includes(relation.type)) errors.push(`Final type escaped candidate limits at ${relation.id}`);
    if (!RELATION_TYPES.includes(relation.type)) errors.push(`Unknown Relation type at ${relation.id}`);
    if (!Number.isFinite(relation.strength) || relation.strength < 0 || relation.strength > 1) errors.push(`Invalid strength at ${relation.id}`);
    if (!relation.questionFit?.compatible) errors.push(`Question/position mismatch at ${relation.id}`);
    if (!Array.isArray(relation.auxiliarySignals)) errors.push(`Missing auxiliary signals at ${relation.id}`);
    if (relation.provenance?.topology !== "spread-structure") errors.push(`Invalid topology provenance at ${relation.id}`);
  }
  return errors;
}
