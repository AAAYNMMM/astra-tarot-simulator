function normalizedFacet(reference) {
  return typeof reference === "string" ? reference.split(".")[0] : "";
}

function overlapCount(references, selectableFacets) {
  const selectable = new Set(selectableFacets || []);
  return new Set((references || []).map(normalizedFacet).filter((facet) => selectable.has(facet))).size;
}

function validate({ card, operator }) {
  if (!card?.reversal || !Array.isArray(card.reversal.supportedModes) || !card.reversal.supportedModes.length) {
    throw new TypeError("A card with reversal.supportedModes is required.");
  }
  if (!operator || !Array.isArray(operator.selectableFacets) || !operator.selectableFacets.length) {
    throw new TypeError("A Position Operator with selectableFacets is required.");
  }
}

export function rankReversalModes({ card, operator } = {}) {
  validate({ card, operator });
  return card.reversal.supportedModes.map((mode, supportedModeIndex) => {
    const overlap = overlapCount(card.reversal.modeFacetRefs?.[mode], operator.selectableFacets);
    const defaultWeight = Number.isFinite(Number(card.reversal.defaultWeights?.[mode]))
      ? Number(card.reversal.defaultWeights[mode])
      : 0;
    return {
      mode,
      overlap,
      defaultWeight,
      selectionScore: overlap + defaultWeight,
      supportedModeIndex,
      modeFacetRefs: [...(card.reversal.modeFacetRefs?.[mode] || [])],
    };
  }).sort((left, right) => (
    right.selectionScore - left.selectionScore
    || left.supportedModeIndex - right.supportedModeIndex
  ));
}

export function resolveReversalMode(input = {}) {
  return rankReversalModes(input)[0].mode;
}

export function resolveReversalModeWithTrace(input = {}) {
  const ranking = rankReversalModes(input);
  return Object.freeze({
    schemaVersion: "1.0.0",
    mode: ranking[0].mode,
    reason: "facet-overlap-default-weight-supported-mode-order",
    ranking: Object.freeze(ranking.map((entry) => Object.freeze({ ...entry, modeFacetRefs: Object.freeze(entry.modeFacetRefs) }))),
  });
}
