const FACTORS = Object.freeze([
  "foundation", "process", "outcome", "stability",
  "resistance", "cost", "controllability", "interCardConflict",
]);
const GRADES = new Set(["SSS", "SS", "S", "A", "B", "C", "D", "E"]);
const FORBIDDEN_KEYS = new Set([
  "question", "questionId", "questionText", "categoryId", "domain", "intent", "questionType",
  "expectation", "expectationId", "criterionId", "timeframe", "comparison", "internalScore", "factors",
]);

function inspectForbidden(value, path, errors) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_KEYS.has(key)) errors.push(`${path}.${key} is forbidden in ReadingPresentationV3.`);
    inspectForbidden(child, `${path}.${key}`, errors);
  }
}

function validateEvidenceItem(value, path, errors, { complete = true } = {}) {
  if (!value || typeof value !== "object") {
    errors.push(`${path} must be an evidence item.`);
    return;
  }
  if (typeof value.text !== "string" || !value.text.trim()) errors.push(`${path}.text is required.`);
  if (!Array.isArray(value.evidenceRefs)) errors.push(`${path}.evidenceRefs must be an array.`);
  if (complete && value.status !== "supported") errors.push(`${path} must be supported for a complete presentation.`);
  if (value.status === "supported" && !value.evidenceRefs?.length) errors.push(`${path} has no evidenceRefs.`);
}

function validateItemList(values, path, errors, limits, complete) {
  if (!Array.isArray(values)) {
    errors.push(`${path} must be an array.`);
    return;
  }
  if (complete && (values.length < limits.min || values.length > limits.max)) {
    errors.push(`${path} must contain ${limits.min}-${limits.max} items.`);
  }
  values.forEach((value, index) => validateEvidenceItem(value, `${path}[${index}]`, errors, { complete }));
}

export function validateReadingPresentationV3(presentation) {
  const errors = [];
  if (!presentation || typeof presentation !== "object") return ["ReadingPresentationV3 must be an object."];
  if (presentation.schemaVersion !== "3.0.0") errors.push("ReadingPresentationV3 must use schemaVersion 3.0.0.");
  if (typeof presentation.spreadId !== "string" || !presentation.spreadId) errors.push("spreadId is required.");
  if (!["complete", "insufficient"].includes(presentation.status)) errors.push("status must be complete or insufficient.");
  const complete = presentation.status === "complete";
  if (complete) {
    if (!GRADES.has(presentation.grade?.level) || typeof presentation.grade?.label !== "string") errors.push("A complete presentation requires a valid grade.");
  } else if (presentation.grade !== null) errors.push("An insufficient presentation cannot expose a grade.");

  const bands = Array.isArray(presentation.factorBands) ? presentation.factorBands : [];
  if (bands.length !== FACTORS.length) errors.push("factorBands must contain all eight factors.");
  if (JSON.stringify(bands.map((entry) => entry.factor)) !== JSON.stringify(FACTORS)) errors.push("factorBands use an unexpected order or factor set.");
  for (const [index, band] of bands.entries()) {
    if (!["high", "medium", "low", "not-applicable", "unavailable"].includes(band?.band)) errors.push(`factorBands[${index}].band is invalid.`);
    if (!Array.isArray(band?.evidenceRefs)) errors.push(`factorBands[${index}].evidenceRefs must be an array.`);
    if (complete && band?.band !== "not-applicable" && !band?.evidenceRefs?.length) errors.push(`factorBands[${index}] has no evidenceRefs.`);
  }

  validateEvidenceItem(presentation.structuralTendency, "structuralTendency", errors, { complete });
  validateEvidenceItem(presentation.spreadAnalysis, "spreadAnalysis", errors, { complete });
  validateItemList(presentation.basis, "basis", errors, { min: 1, max: 16 }, complete);
  validateItemList(presentation.favorableFactors, "favorableFactors", errors, { min: 1, max: 3 }, complete);
  validateItemList(presentation.limitingFactors, "limitingFactors", errors, { min: 1, max: 3 }, complete);
  validateItemList(presentation.conditions?.success, "conditions.success", errors, { min: 1, max: 3 }, complete);
  validateItemList(presentation.conditions?.stopSignals, "conditions.stopSignals", errors, { min: 1, max: 3 }, complete);
  validateItemList(presentation.conditions?.turningPoints, "conditions.turningPoints", errors, { min: 0, max: 3 }, false);
  validateEvidenceItem(presentation.realityReference, "realityReference", errors, { complete });
  if (!Array.isArray(presentation.evidenceRefs) || (complete && !presentation.evidenceRefs.length)) errors.push("presentation evidenceRefs are required.");
  inspectForbidden(presentation, "$", errors);
  return errors;
}

export function assertReadingPresentationV3(presentation) {
  const errors = validateReadingPresentationV3(presentation);
  if (errors.length) throw new TypeError(errors.join("; "));
  return presentation;
}
