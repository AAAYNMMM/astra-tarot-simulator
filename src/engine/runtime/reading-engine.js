import { createSpreadClaimPipeline } from "../claims/spread-claim-engine.js";
import { createSpreadObservation } from "../observations/spread-observation-engine.js";
import { createSpreadRelationGraph } from "../relations/spread-relation-engine.js";
import { createStructuralRelationCandidates } from "../relations/structural-relation-candidates.js";
import { renderReadingText } from "../text/template-renderer.js";
import { resolveReversalMode } from "../reversal/reversal-mode-resolver.js";
import { loadCardProfile } from "../../knowledge/cards/registry.js";
import { getSpreadReadingProfile } from "../../knowledge/readings/spread-reading-profiles.js";
import { getSpreadDefinition } from "../../knowledge/spreads/definitions.js";
import { getPositionOperator } from "../../knowledge/spreads/operators/index.js";

const RELATION_LABELS = Object.freeze({
  supports: ["support", "支持"],
  reinforces: ["support", "强化"],
  weakens: ["conflict", "削弱"],
  contradicts: ["conflict", "冲突"],
  causes: ["continuation", "因果"],
  continues: ["continuation", "延续"],
  transforms: ["turning", "转折"],
  repairs: ["turning", "修复"],
});

const REVERSAL_LABELS = Object.freeze({
  blocked: "受阻", distorted: "失真", excessive: "过度", misdirected: "错置",
  avoided: "回避", "loss-of-control": "失控", delayed: "延迟", deficient: "不足",
  internalized: "内化", released: "释放",
});
const FACET_LABELS = Object.freeze({
  state: "状态", cause: "根源", motivation: "动机", obstacle: "阻碍", opportunity: "机会",
  resource: "资源", relationship: "关系", action: "行动", boundary: "边界", trend: "趋势",
  outcome: "结果", reflection: "反思",
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function normalizeDraw(draw, index, spread) {
  const position = spread.positions[index];
  if (!position) throw new RangeError(`Spread ${spread.id} has no position at index ${index}.`);
  if (draw?.positionId && draw.positionId !== position.id) {
    throw new Error(`Draw position ${draw.positionId} does not match ${position.id}.`);
  }
  const orientation = draw?.orientation || (draw?.reversed ? "reversed" : "upright");
  if (!["upright", "reversed"].includes(orientation)) throw new Error(`Unsupported orientation: ${orientation}`);
  const cardId = draw?.cardId || draw?.card?.id;
  if (!cardId) throw new TypeError(`Draw ${index} is missing cardId.`);
  return Object.freeze({ cardId, orientation, position });
}

function sanitizeEvidence(value, key = "") {
  if (Array.isArray(value)) return value.map((item) => sanitizeEvidence(item));
  if (!value || typeof value !== "object") {
    if (typeof value === "string" && key === "tags" && value.startsWith("question:")) return null;
    return value;
  }
  const result = {};
  for (const [entryKey, entryValue] of Object.entries(value)) {
    if (["questionId", "domainMatched"].includes(entryKey)) continue;
    if (entryKey === "questionDimensions") {
      result.positionResponsibilities = sanitizeEvidence(entryValue, entryKey);
      continue;
    }
    if (entryKey === "questionMatch") {
      result.responsibilityFit = sanitizeEvidence(entryValue, entryKey);
      continue;
    }
    if (entryKey === "questionFit") {
      result.structuralFit = sanitizeEvidence(entryValue, entryKey);
      continue;
    }
    if (entryKey === "questionLayer") {
      result.profileLayer = "spread-position-responsibility";
      continue;
    }
    if (entryKey === "tags" && Array.isArray(entryValue)) {
      result.tags = entryValue.filter((tag) => !String(tag).startsWith("question:"));
      continue;
    }
    result[entryKey] = sanitizeEvidence(entryValue, entryKey);
  }
  return result;
}

function baseMeaning(card, orientation, reversalMode) {
  const traditional = orientation === "reversed"
    ? card.traditions?.reversedSummary
    : card.traditions?.uprightSummary;
  if (typeof traditional === "string" && traditional.trim()) return traditional.trim();
  const essence = String(card.identity?.essence || card.identity?.coreArchetype || "").trim();
  const keywords = orientation === "reversed" ? card.language?.keywordsReversed : card.language?.keywordsUpright;
  const keywordText = (keywords || []).filter(Boolean).join("、");
  if (orientation === "upright") return `${essence}${keywordText ? `；正位关键词：${keywordText}` : ""}。`;
  const mode = REVERSAL_LABELS[reversalMode] || reversalMode || "逆位修正";
  return `${essence}；当前以“${mode}”机制呈现${keywordText ? `，逆位关键词：${keywordText}` : ""}。`;
}

function relationDetails({ draw, observation, relations, observationsById, cardsById, edgeOrder }) {
  const direct = relations.filter((relation) => (
    relation.sourceObservationId === observation.id || relation.targetObservationId === observation.id
  )).filter((relation) => relation.confidence !== "low" && RELATION_LABELS[relation.type]);
  direct.sort((left, right) => (
    (edgeOrder.get(left.structure?.edgeId) ?? 999) - (edgeOrder.get(right.structure?.edgeId) ?? 999)
    || Number(right.strength || 0) - Number(left.strength || 0)
    || left.id.localeCompare(right.id)
  ));
  return direct.slice(0, 3).map((relation) => {
    const outgoing = relation.sourceObservationId === observation.id;
    const otherObservation = observationsById.get(outgoing ? relation.targetObservationId : relation.sourceObservationId);
    const otherCard = cardsById.get(otherObservation?.cardId);
    const [kind, label] = RELATION_LABELS[relation.type];
    return {
      relationId: relation.id,
      kind,
      label,
      direction: outgoing ? "outgoing" : "incoming",
      relatedCardId: otherCard?.id || null,
      relatedCardName: otherCard?.name || "关联牌",
      relatedPositionId: otherObservation?.positionId || null,
      text: `与“${otherCard?.name || "关联牌"}”形成${label}关系，强度为${relation.strength >= 0.7 ? "明显" : "中等"}。`,
      evidenceRefs: [relation.id, observation.id, otherObservation?.id].filter(Boolean),
    };
  });
}

function createCardDetails({ normalized, cards, observations, relations, structuralBatch }) {
  const observationsById = new Map(observations.map((item) => [item.id, item]));
  const cardsById = new Map(cards.map((item) => [item.id, item]));
  const edgeOrder = new Map(structuralBatch.candidates.map((item, index) => [item.structure?.edgeId, index]));
  return normalized.map((draw, index) => {
    const card = cards[index];
    const observation = observations[index];
    return {
      schemaVersion: "3.0.0",
      cardId: card.id,
      cardName: card.name,
      orientation: draw.orientation,
      reversalMode: observation.selectedReversalMode,
      reversalModeLabel: observation.selectedReversalMode ? REVERSAL_LABELS[observation.selectedReversalMode] || observation.selectedReversalMode : null,
      baseMeaning: baseMeaning(card, draw.orientation, observation.selectedReversalMode),
      positionId: draw.position.id,
      positionName: draw.position.name,
      positionMeaning: draw.position.prompt,
      spreadRole: `此牌在“${draw.position.name}”位置以${FACET_LABELS[observation.selectedFacet] || "综合"}线索承担结构职责：${observation.semanticText}`,
      relations: relationDetails({ draw, observation, relations, observationsById, cardsById, edgeOrder }),
      evidenceRefs: [observation.id],
    };
  });
}

export async function executeSpreadReading({
  readingId,
  spreadId,
  spreadDefinitionVersion,
  draws,
  renderingStream = null,
} = {}) {
  if (typeof readingId !== "string" || !readingId) throw new TypeError("readingId is required.");
  if (typeof spreadId !== "string" || !spreadId) throw new TypeError("spreadId is required.");
  if (typeof spreadDefinitionVersion !== "string" || !spreadDefinitionVersion) throw new TypeError("spreadDefinitionVersion is required.");
  if (!Array.isArray(draws) || !draws.length) throw new TypeError("draws must be non-empty.");
  const spread = getSpreadDefinition(spreadId, spreadDefinitionVersion);
  if (!spread || spread.definitionVersion !== spreadDefinitionVersion || spreadDefinitionVersion !== "2.0.0") {
    throw new RangeError(`Unsupported spread definition: ${spreadId}/${spreadDefinitionVersion}.`);
  }
  const profileDefinition = getSpreadReadingProfile(spreadId);
  if (!profileDefinition) throw new RangeError(`Missing SpreadReadingProfile: ${spreadId}.`);
  if (draws.length !== spread.positions.length) throw new Error(`Spread ${spreadId} requires ${spread.positions.length} draws.`);
  const normalized = draws.map((draw, index) => normalizeDraw(draw, index, spread));
  const cards = await Promise.all(normalized.map((draw) => loadCardProfile(draw.cardId)));
  const cardsById = new Map(cards.map((card) => [card.id, card]));
  const observations = normalized.map((draw, index) => {
    const card = cards[index];
    const operator = getPositionOperator(spreadId, draw.position.id);
    if (!operator) throw new Error(`Missing Position Operator: ${spreadId}/${draw.position.id}.`);
    const reversalMode = draw.orientation === "reversed" ? resolveReversalMode({ card, operator }) : null;
    return createSpreadObservation({
      card,
      readingProfile: profileDefinition,
      operator,
      orientation: draw.orientation,
      reversalMode,
    });
  });
  const structuralBatch = createStructuralRelationCandidates({ spreadId, observations });
  const relationBatch = createSpreadRelationGraph({
    structuralBatch,
    observations,
    readingProfile: profileDefinition,
    cards: cardsById,
  });
  const claimPipeline = createSpreadClaimPipeline({
    relationBatch,
    observations,
    readingProfile: profileDefinition,
  });
  const rendered = renderReadingText({
    claim: claimPipeline.claim,
    candidateBatch: claimPipeline.candidateBatch,
    observations,
    renderingStream,
  });
  const cardDetails = createCardDetails({
    normalized,
    cards,
    observations,
    relations: relationBatch.relations,
    structuralBatch,
  });
  const sanitizedObservations = sanitizeEvidence(observations);
  const sanitizedRelations = sanitizeEvidence(relationBatch.relations);
  const sanitizedCandidateBatch = sanitizeEvidence(claimPipeline.candidateBatch);
  const sanitizedResolution = sanitizeEvidence(claimPipeline.resolution);
  const sanitizedClaim = sanitizeEvidence(claimPipeline.claim);
  return deepFreeze({
    schemaVersion: "2.0.0",
    readingId,
    spreadId,
    spreadDefinitionVersion,
    observations: sanitizedObservations,
    relations: sanitizedRelations,
    claims: [sanitizedClaim],
    claim: sanitizedClaim,
    candidateBatch: sanitizedCandidateBatch,
    resolution: sanitizedResolution,
    rendered: sanitizeEvidence(rendered),
    cardDetails,
    provenance: {
      engineVersion: "spread-reading-v2",
      spreadProfileVersion: profileDefinition.schemaVersion,
      observationCount: observations.length,
      relationCount: relationBatch.relationCount,
      claimCount: 1,
      semanticScope: "spread-and-card-only",
    },
  });
}

export async function executeReadingEngine(input) {
  const { executeLegacyReadingEngine } = await import("./legacy-reading-engine.js");
  return executeLegacyReadingEngine(input);
}
