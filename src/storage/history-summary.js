export function createStructuredHistorySummary(engineResult) {
  if (!engineResult?.claim || !engineResult?.rendered) return null;
  return Object.freeze({
    schemaVersion: "1.0.0",
    status: "available",
    conclusionType: engineResult.claim.conclusionType,
    confidence: engineResult.claim.confidence,
    score: engineResult.claim.score,
    evidenceCount: engineResult.claim.evidenceRefs.length,
    relationCount: engineResult.relations?.length || 0,
    conflictCount: engineResult.claim.conflicts?.length || 0,
    conditionCount: engineResult.claim.conditions?.length || 0,
    coverageGapCount: engineResult.claim.coverageGaps?.length || 0,
    rendererVersion: engineResult.rendered.provenance?.rendererVersion || null,
  });
}
