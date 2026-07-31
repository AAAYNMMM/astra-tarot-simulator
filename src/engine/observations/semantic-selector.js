import {
  dimensionMatchesFacet,
  facetPriorityFor,
  responsibilitiesFor,
} from "./dimension-facet-map.js";

function asciiCompare(left, right) {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

function stableHash(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function semanticStrength(reference) {
  if (reference.endsWith(".primary")) return 1;
  if (reference.endsWith(".secondary")) return 0.92;
  if (reference.endsWith(".tertiary")) return 0.84;
  return 0.8;
}

export function rankSemanticCandidates({ card, question, operator, orientation, reversalMode = null }) {
  const responsibilities = responsibilitiesFor(question, operator.spreadId, operator.positionId);
  const facetPriority = facetPriorityFor(question, operator);
  const domainRefs = new Set(card.domains?.[question.domain]?.facetRefs || []);
  const reversalRefs = new Set(
    orientation === "reversed" ? card.reversal?.modeFacetRefs?.[reversalMode] || [] : [],
  );
  const candidates = [];
  for (const [facet, units] of Object.entries(card.facets || {})) {
    if (!operator.selectableFacets.includes(facet)) continue;
    const facetIndex = facetPriority.indexOf(facet);
    for (const unit of units) {
      const matches = responsibilities.filter((dimension) => dimensionMatchesFacet(dimension, facet));
      const domainMatched = domainRefs.has(unit.id);
      const reversalMatched = reversalRefs.has(unit.id);
      const roleMatched = (unit.allowedRoles || []).includes(facet);
      const positionAffinity = (stableHash(`${operator.positionId}:${unit.id}`) % 997) / 1_000_000;
      const semanticUnitStrength = semanticStrength(unit.id);
      const selectionScore = Number((
        Math.max(0.2, 1 - Math.max(0, facetIndex) * 0.08)
        + matches.length * 0.18
        + (domainMatched ? 0.12 : 0)
        + (reversalMatched ? 0.16 : 0)
        + (roleMatched ? 0.08 : 0)
        + semanticUnitStrength * 0.15
        + positionAffinity
      ).toFixed(6));
      candidates.push(Object.freeze({
        reference: unit.id,
        facet,
        unit,
        matchedDimensions: Object.freeze(matches),
        domainMatched,
        reversalMatched,
        semanticUnitStrength,
        selectionScore,
      }));
    }
  }
  candidates.sort((left, right) => (
    right.selectionScore - left.selectionScore
    || asciiCompare(left.reference, right.reference)
  ));
  return Object.freeze(candidates);
}

export function selectSemanticUnit(input) {
  const candidates = rankSemanticCandidates(input);
  if (!candidates.length) {
    const { card, operator } = input;
    throw new Error(`No legal semantic candidate for ${card.id}/${operator.spreadId}/${operator.positionId}.`);
  }
  return Object.freeze({ selected: candidates[0], candidates });
}
