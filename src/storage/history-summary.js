export function createStructuredHistorySummary(engineResult, synthesis = null, assessment = null) {
  const assessmentSummary = assessment?.presentation ? Object.freeze({
    schemaVersion: assessment.schemaVersion,
    outputContract: assessment.presentation.outputContract,
    mode: assessment.presentation.mode,
    expectationId: assessment.selection?.expectationId || null,
    criterionId: assessment.selection?.criterionId || null,
    grade: assessment.presentation.grade,
    gradeLabel: assessment.presentation.gradeLabel,
    trend: assessment.presentation.trend,
    summary: assessment.presentation.summary,
    reason: assessment.presentation.reason,
    policyVersion: assessment.presentation.policyVersion,
  }) : null;
  if (engineResult?.kind === "comparison") {
    const branchResults = (engineResult.branches || []).map((branch) => branch.engineResult).filter(Boolean);
    return Object.freeze({
      schemaVersion: "2.0.0",
      status: "available",
      interpretationSchemaVersion: synthesis?.schemaVersion || null,
      verdictCode: synthesis?.summary?.verdictCode || "wait",
      verdictLabel: synthesis?.summary?.verdictLabel || "分别核验",
      takeaway: synthesis?.summary?.takeaway || null,
      conclusionType: "comparison-support",
      confidence: null,
      score: null,
      evidenceCount: branchResults.reduce((sum, item) => sum + (item.claim?.evidenceRefs?.length || 0), 0),
      relationCount: branchResults.reduce((sum, item) => sum + (item.relations?.length || 0), 0),
      conflictCount: branchResults.reduce((sum, item) => sum + (item.claim?.conflicts?.length || 0), 0),
      conditionCount: branchResults.reduce((sum, item) => sum + (item.claim?.conditions?.length || 0), 0),
      coverageGapCount: branchResults.reduce((sum, item) => sum + (item.claim?.coverageGaps?.length || 0), 0),
      rendererVersion: "comparison-evidence-v1",
      assessment: assessmentSummary,
    });
  }
  if (!engineResult?.claim || !engineResult?.rendered) return null;
  return Object.freeze({
    schemaVersion: "2.0.0",
    status: "available",
    interpretationSchemaVersion: synthesis?.schemaVersion || null,
    verdictCode: synthesis?.summary?.verdictCode || null,
    verdictLabel: synthesis?.summary?.verdictLabel || null,
    takeaway: synthesis?.summary?.takeaway || null,
    conclusionType: engineResult.claim.conclusionType,
    confidence: engineResult.claim.confidence,
    score: engineResult.claim.score,
    evidenceCount: engineResult.claim.evidenceRefs.length,
    relationCount: engineResult.relations?.length || 0,
    conflictCount: engineResult.claim.conflicts?.length || 0,
    conditionCount: engineResult.claim.conditions?.length || 0,
    coverageGapCount: engineResult.claim.coverageGaps?.length || 0,
    rendererVersion: engineResult.rendered.provenance?.rendererVersion || null,
    assessment: assessmentSummary,
  });
}
