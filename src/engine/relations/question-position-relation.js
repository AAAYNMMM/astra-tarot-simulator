function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function unique(values) {
  return [...new Set(values || [])];
}

function orderedIntersection(left, right) {
  const allowed = new Set(right || []);
  return unique(left).filter((item) => allowed.has(item));
}

function priorityWeight(priority) {
  return ({ core: 1, primary: 0.8, secondary: 0.6, context: 0.5 })[priority] || 0.4;
}

export function analyzeQuestionPositionRelation({
  candidate,
  sourceObservation,
  targetObservation,
  question,
}) {
  if (!candidate || !sourceObservation || !targetObservation || !question) {
    throw new TypeError("candidate, sourceObservation, targetObservation, and question are required");
  }
  const spreadId = sourceObservation.spreadId;
  if (sourceObservation.spreadId !== targetObservation.spreadId || sourceObservation.spreadId !== spreadId) {
    throw new Error("Relation endpoints must belong to the candidate spread.");
  }
  if (candidate.structure?.sourcePositionId !== sourceObservation.positionId) {
    throw new Error("Source observation does not match the structural candidate.");
  }
  if (candidate.structure?.targetPositionId !== targetObservation.positionId) {
    throw new Error("Target observation does not match the structural candidate.");
  }

  const spreadProfile = question.spreadProfiles?.[spreadId];
  if (!spreadProfile) throw new Error(`Question ${question.id} does not support spread ${spreadId}.`);
  const sourceResponsibilities = unique(spreadProfile.positionResponsibilities?.[sourceObservation.positionId]);
  const targetResponsibilities = unique(spreadProfile.positionResponsibilities?.[targetObservation.positionId]);
  if (!sourceResponsibilities.length || !targetResponsibilities.length) {
    throw new Error(`Question ${question.id} has incomplete position responsibilities for ${spreadId}.`);
  }

  const answerDimensions = unique(question.answerDimensions);
  const sourceAnswerDimensions = orderedIntersection(sourceResponsibilities, answerDimensions);
  const targetAnswerDimensions = orderedIntersection(targetResponsibilities, answerDimensions);
  const sharedResponsibilities = orderedIntersection(sourceAnswerDimensions, targetAnswerDimensions);
  const sourceMatched = orderedIntersection(sourceObservation.matchedDimensions, sourceResponsibilities);
  const targetMatched = orderedIntersection(targetObservation.matchedDimensions, targetResponsibilities);
  const handoffDimensions = orderedIntersection(sourceMatched, targetResponsibilities);
  const introducedDimensions = targetAnswerDimensions.filter((item) => !sourceAnswerDimensions.includes(item));
  const retainedDimensions = targetAnswerDimensions.filter((item) => sourceAnswerDimensions.includes(item));
  const sourceCoverage = sourceAnswerDimensions.length
    ? sourceMatched.length / sourceAnswerDimensions.length
    : 0;
  const targetCoverage = targetAnswerDimensions.length
    ? targetMatched.length / targetAnswerDimensions.length
    : 0;
  const evidenceWeight = Number((
    (priorityWeight(sourceObservation.positionRole?.evidencePriority)
      + priorityWeight(targetObservation.positionRole?.evidencePriority)) / 2
  ).toFixed(4));

  return deepFreeze({
    schemaVersion: "1.0.0",
    questionId: question.id,
    spreadId,
    answerDimensions,
    source: {
      positionId: sourceObservation.positionId,
      responsibilities: sourceResponsibilities,
      answerDimensions: sourceAnswerDimensions,
      matchedDimensions: sourceMatched,
      evidencePriority: sourceObservation.positionRole?.evidencePriority || null,
    },
    target: {
      positionId: targetObservation.positionId,
      responsibilities: targetResponsibilities,
      answerDimensions: targetAnswerDimensions,
      matchedDimensions: targetMatched,
      evidencePriority: targetObservation.positionRole?.evidencePriority || null,
    },
    sharedResponsibilities,
    handoffDimensions,
    introducedDimensions,
    retainedDimensions,
    priorityDimension: targetAnswerDimensions[0] || sourceAnswerDimensions[0] || null,
    coverage: {
      source: Number(sourceCoverage.toFixed(4)),
      target: Number(targetCoverage.toFixed(4)),
      combined: Number(((sourceCoverage + targetCoverage) / 2).toFixed(4)),
    },
    evidenceWeight,
    compatible: sourceAnswerDimensions.length > 0 && targetAnswerDimensions.length > 0,
  });
}
