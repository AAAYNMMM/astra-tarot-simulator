function semanticMap(card) {
  return new Map(Object.values(card.facets).flat().map((unit) => [unit.id, unit]));
}

function stableScore(weight, orientation) {
  const value = weight * (orientation === "reversed" ? 0.9 : 1);
  return Number(value.toFixed(4));
}

export function createMinimalObservation({ card, question, operator, orientation, reversalMode = null }) {
  if (!card || !question || !operator) throw new TypeError("card, question, and operator are required");
  if (!["upright", "reversed"].includes(orientation)) throw new RangeError(`Unsupported orientation: ${orientation}`);
  if (orientation === "upright" && reversalMode !== null) throw new Error("Upright observations cannot declare a reversal mode.");
  if (orientation === "reversed" && !card.reversal.supportedModes.includes(reversalMode)) {
    throw new Error(`Unsupported reversal mode ${reversalMode} for ${card.id}.`);
  }
  if (operator.spreadId !== Object.keys(question.spreadProfiles).find((spreadId) => spreadId === operator.spreadId)) {
    throw new Error(`Question ${question.id} does not support spread ${operator.spreadId}.`);
  }
  const units = semanticMap(card);
  const allowedFacets = new Set(operator.selectableFacets);
  const domainRefs = card.domains[question.domain]?.facetRefs || [];
  const reversalRefs = orientation === "reversed" ? card.reversal.modeFacetRefs[reversalMode] || [] : [];
  const allRefs = Object.values(card.facets).flat().map((unit) => unit.id);
  const ordered = [...reversalRefs, ...domainRefs, ...allRefs];
  const selectedRef = ordered.find((reference) => {
    const unit = units.get(reference);
    const facet = reference.split(".", 1)[0];
    return unit && allowedFacets.has(facet);
  });
  if (!selectedRef) throw new Error(`No legal semantic unit for ${card.id}/${operator.spreadId}/${operator.positionId}.`);
  const unit = units.get(selectedRef);
  const selectedFacet = selectedRef.split(".", 1)[0];
  const dimensions = Object.fromEntries(
    Object.entries(card.dimensions).filter(([, value]) => Number.isFinite(value)),
  );
  return Object.freeze({
    id: `obs-${question.id}-${operator.spreadId}-${operator.positionId}-${card.id}-${orientation}`,
    cardId: card.id,
    orientation,
    positionId: operator.positionId,
    spreadId: operator.spreadId,
    questionId: question.id,
    semanticUnitRef: `${card.id}#${selectedRef}`,
    selectedFacet,
    selectedReversalMode: orientation === "reversed" ? reversalMode : null,
    semanticTags: Object.freeze([...unit.tags]),
    dimensions: Object.freeze(dimensions),
    localScore: stableScore(operator.weight, orientation),
    evidenceType: operator.evidencePriority,
  });
}
