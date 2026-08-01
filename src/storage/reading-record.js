import { validateArtifactFingerprint } from "./artifact-fingerprint.js";

export const READING_RECORD_SCHEMA_VERSION = "3.0.0";
export const LEGACY_READING_RECORD_SCHEMA_VERSION = "2.0.0";

function clone(value) {
  if (value === undefined) return null;
  return JSON.parse(JSON.stringify(value));
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string.`);
  return value;
}

function observationForDraw(draw, engineResult) {
  const positionId = draw.enginePosition?.id || draw.position?.id;
  return (engineResult?.observations || []).find((item) => (
    item.cardId === draw.card?.id && item.positionId === positionId
  )) || null;
}

function drawRecord(draw, engineResult = null) {
  const position = draw.enginePosition || draw.position;
  const observation = observationForDraw(draw, engineResult);
  return Object.freeze({
    index: draw.index,
    cardId: requireString(draw.card?.id, "draw.card.id"),
    cardName: requireString(draw.card?.name, "draw.card.name"),
    positionId: requireString(position?.id, "draw.position.id"),
    positionName: requireString(position?.name, "draw.position.name"),
    orientation: draw.reversed ? "reversed" : "upright",
    reversalMode: observation?.selectedReversalMode ?? draw.reversalMode ?? null,
  });
}

function structuredEvidenceV2(engineResult) {
  if (engineResult?.kind === "comparison") {
    return Object.freeze({
      status: "available",
      observations: [],
      relations: [],
      claims: [],
      rendered: null,
      comparison: clone((engineResult.branches || []).map((branch) => ({
        id: branch.id,
        label: branch.label,
        observations: branch.engineResult?.observations || [],
        relations: branch.engineResult?.relations || [],
        claims: branch.engineResult?.claims || [],
        rendered: branch.engineResult?.rendered || null,
      }))),
    });
  }
  return Object.freeze({
    status: engineResult ? "available" : "pending-ui-integration",
    observations: clone(engineResult?.observations || []),
    relations: clone(engineResult?.relations || []),
    claims: clone(engineResult?.claims || []),
    rendered: clone(engineResult?.rendered || null),
    comparison: null,
  });
}

function structuredEvidenceV3(engineResult) {
  return Object.freeze({
    status: engineResult ? "available" : "pending-ui-integration",
    observations: clone(engineResult?.observations || []),
    relations: clone(engineResult?.relations || []),
    claims: clone(engineResult?.claims || []),
    rendered: clone(engineResult?.rendered || null),
    cardDetails: clone(engineResult?.cardDetails || []),
  });
}

function interpretationSnapshotV2(synthesis) {
  if (synthesis?.schemaVersion !== "4.0.0") return null;
  return Object.freeze({
    schemaVersion: synthesis.schemaVersion,
    summary: clone(synthesis.summary),
    keyEvidence: clone(synthesis.keyEvidence),
    condition: clone(synthesis.condition),
    action: clone(synthesis.action),
    cardEvidence: clone(synthesis.cardEvidence),
    provenance: clone(synthesis.provenance),
  });
}

function assessmentSnapshotV2(assessment) {
  if (assessment?.schemaVersion !== "1.0.0") return null;
  return Object.freeze({
    schemaVersion: assessment.schemaVersion,
    policyVersion: assessment.presentation?.policyVersion || assessment.signal?.provenance?.policyVersion || null,
    outputContract: assessment.presentation?.outputContract || assessment.signal?.kind || null,
    selection: clone(assessment.selection || null),
    evaluation: clone(assessment.evaluation ? {
      kind: assessment.evaluation.kind,
      grade: assessment.evaluation.grade,
      outcomeAlignment: assessment.evaluation.outcomeAlignment || null,
      trend: assessment.evaluation.trend || null,
      descriptors: assessment.evaluation.descriptors || null,
      reasonCode: assessment.evaluation.reasonCode || null,
      caps: assessment.evaluation.caps || [],
      evidenceRefs: assessment.evaluation.evidenceRefs || [],
    } : null),
    comparison: clone((assessment.comparison || []).map((branch) => ({
      id: branch.id,
      label: branch.label,
      evaluation: {
        trend: branch.evaluation?.trend || null,
        descriptors: branch.evaluation?.descriptors || null,
        reasonCode: branch.evaluation?.reasonCode || null,
        evidenceRefs: branch.evaluation?.evidenceRefs || [],
      },
      presentation: branch.presentation || null,
    }))),
    presentation: clone(assessment.presentation || null),
  });
}

function isV3Reading(reading) {
  if (reading?.evaluationSelection?.outputContract) return false;
  return reading?.schemaVersion === "3.0.0"
    || reading?.question?.purpose === "history-only"
    || typeof reading?.spread?.definitionVersion === "string";
}

function createV2Record({ reading, artifactFingerprint, engineResult, savedAt }) {
  return Object.freeze({
    schemaVersion: LEGACY_READING_RECORD_SCHEMA_VERSION,
    id: requireString(reading.id, "reading.id"),
    createdAt: requireString(reading.createdAt, "reading.createdAt"),
    savedAt: requireString(savedAt, "savedAt"),
    question: Object.freeze({
      id: requireString(reading.question?.id, "reading.question.id"),
      text: requireString(reading.question?.text, "reading.question.text"),
      domain: reading.question?.domain || reading.category?.id || null,
      intent: reading.question?.intent || null,
    }),
    spread: Object.freeze({
      id: requireString(reading.spread?.id, "reading.spread.id"),
      name: requireString(reading.spread?.name, "reading.spread.name"),
    }),
    deck: Object.freeze({
      id: typeof reading.deckStyle === "string" ? reading.deckStyle : reading.deckStyle?.id || "unknown",
    }),
    random: clone(reading.randomAudit || null),
    draw: Object.freeze(reading.draws.map((draw) => drawRecord(draw, engineResult))),
    evidence: structuredEvidenceV2(engineResult),
    interpretation: interpretationSnapshotV2(reading.synthesis),
    assessment: assessmentSnapshotV2(reading.assessment),
    legacySynthesis: reading.synthesis?.schemaVersion === "4.0.0" ? null : clone(reading.synthesis || null),
    artifactFingerprint: clone(artifactFingerprint),
    source: "astra-runtime",
    migration: null,
  });
}

function createV3Record({ reading, artifactFingerprint, engineResult, savedAt }) {
  const presentation = reading.presentation || reading.assessment?.presentation || reading.synthesis || null;
  return Object.freeze({
    schemaVersion: READING_RECORD_SCHEMA_VERSION,
    id: requireString(reading.id, "reading.id"),
    createdAt: requireString(reading.createdAt, "reading.createdAt"),
    savedAt: requireString(savedAt, "savedAt"),
    question: Object.freeze({
      text: requireString(reading.question?.text, "reading.question.text"),
      purpose: "history-only",
    }),
    spread: Object.freeze({
      id: requireString(reading.spread?.id, "reading.spread.id"),
      definitionVersion: requireString(reading.spread?.definitionVersion, "reading.spread.definitionVersion"),
    }),
    deck: Object.freeze({
      id: typeof reading.deckStyle === "string" ? reading.deckStyle : reading.deckStyle?.id || "unknown",
    }),
    random: clone(reading.randomAudit || null),
    draw: Object.freeze(reading.draws.map((draw) => drawRecord(draw, engineResult))),
    evidence: structuredEvidenceV3(engineResult),
    interpretation: clone(presentation),
    assessment: clone(reading.assessment || null),
    artifactFingerprint: clone(artifactFingerprint),
    source: "astra-runtime",
    migration: null,
  });
}

export function createReadingRecord({
  reading,
  artifactFingerprint,
  engineResult = null,
  savedAt = new Date().toISOString(),
} = {}) {
  if (!reading || !Array.isArray(reading.draws)) throw new TypeError("reading with draws is required.");
  const fingerprintErrors = validateArtifactFingerprint(artifactFingerprint);
  if (fingerprintErrors.length) throw new Error(fingerprintErrors.join("; "));
  return isV3Reading(reading)
    ? createV3Record({ reading, artifactFingerprint, engineResult, savedAt })
    : createV2Record({ reading, artifactFingerprint, engineResult, savedAt });
}

function hasOwnKeyDeep(value, key) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  return Object.values(value).some((item) => hasOwnKeyDeep(item, key));
}

function validateCommon(record, errors) {
  for (const key of ["id", "createdAt", "savedAt"]) {
    if (typeof record[key] !== "string" || record[key].length === 0) errors.push(`Missing ${key}.`);
  }
  if (!Array.isArray(record.draw) || record.draw.length === 0) errors.push("ReadingRecord draw must be non-empty.");
  errors.push(...validateArtifactFingerprint(record.artifactFingerprint));
  if (record.artifactFingerprint && ("commit" in record.artifactFingerprint || "commitSha" in record.artifactFingerprint)) {
    errors.push("ReadingRecord must not embed final commit metadata.");
  }
}

function validateV2(record, errors) {
  if (!record.question?.id || !record.question?.text || !record.spread?.id) {
    errors.push("ReadingRecord v2 question and spread identities are required.");
  }
  if (record.interpretation && record.interpretation.schemaVersion !== "4.0.0") {
    errors.push("Unsupported v2 interpretation snapshot schemaVersion.");
  }
  if (record.assessment && record.assessment.schemaVersion !== "1.0.0") {
    errors.push("Unsupported v2 assessment snapshot schemaVersion.");
  }
}

function validateV3(record, errors) {
  if (record.question?.purpose !== "history-only" || typeof record.question?.text !== "string") {
    errors.push("ReadingRecord v3 question must be history-only text.");
  }
  if (Object.keys(record.question || {}).sort().join("|") !== "purpose|text") {
    errors.push("ReadingRecord v3 question contains unsupported fields.");
  }
  if (!record.spread?.id || !record.spread?.definitionVersion) {
    errors.push("ReadingRecord v3 spread identity and definitionVersion are required.");
  }
  if (hasOwnKeyDeep(record, "comparison")) errors.push("ReadingRecord v3 cannot contain comparison data.");
}

export function validateReadingRecord(record) {
  const errors = [];
  if (!record || typeof record !== "object") return ["ReadingRecord must be an object."];
  if (![LEGACY_READING_RECORD_SCHEMA_VERSION, READING_RECORD_SCHEMA_VERSION].includes(record.schemaVersion)) {
    return ["Unsupported ReadingRecord schemaVersion."];
  }
  validateCommon(record, errors);
  if (record.schemaVersion === LEGACY_READING_RECORD_SCHEMA_VERSION) validateV2(record, errors);
  else validateV3(record, errors);
  return errors;
}
