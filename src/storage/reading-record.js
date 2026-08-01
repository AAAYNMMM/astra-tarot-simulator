import { validateArtifactFingerprint } from "./artifact-fingerprint.js";

export const READING_RECORD_SCHEMA_VERSION = "2.0.0";

function clone(value) {
  if (value === undefined) return null;
  return JSON.parse(JSON.stringify(value));
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string.`);
  return value;
}

function drawRecord(draw) {
  return Object.freeze({
    index: draw.index,
    cardId: requireString(draw.card?.id, "draw.card.id"),
    cardName: requireString(draw.card?.name, "draw.card.name"),
    positionId: requireString(draw.position?.id, "draw.position.id"),
    positionName: requireString(draw.position?.name, "draw.position.name"),
    orientation: draw.reversed ? "reversed" : "upright",
    reversalMode: draw.reversalMode ?? null,
  });
}

function structuredEvidence(engineResult) {
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

function interpretationSnapshot(synthesis) {
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

function assessmentSnapshot(assessment) {
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

export function createReadingRecord({
  reading,
  artifactFingerprint,
  engineResult = null,
  savedAt = new Date().toISOString(),
} = {}) {
  if (!reading || !Array.isArray(reading.draws)) throw new TypeError("reading with draws is required.");
  const fingerprintErrors = validateArtifactFingerprint(artifactFingerprint);
  if (fingerprintErrors.length) throw new Error(fingerprintErrors.join("; "));
  return Object.freeze({
    schemaVersion: READING_RECORD_SCHEMA_VERSION,
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
    draw: Object.freeze(reading.draws.map(drawRecord)),
    evidence: structuredEvidence(engineResult),
    interpretation: interpretationSnapshot(reading.synthesis),
    assessment: assessmentSnapshot(reading.assessment),
    legacySynthesis: reading.synthesis?.schemaVersion === "4.0.0"
      ? null
      : clone(reading.synthesis || null),
    artifactFingerprint: clone(artifactFingerprint),
    source: "astra-runtime",
    migration: null,
  });
}

export function validateReadingRecord(record) {
  const errors = [];
  if (!record || typeof record !== "object") return ["ReadingRecord must be an object."];
  if (record.schemaVersion !== READING_RECORD_SCHEMA_VERSION) errors.push("Unsupported ReadingRecord schemaVersion.");
  for (const key of ["id", "createdAt", "savedAt"]) {
    if (typeof record[key] !== "string" || record[key].length === 0) errors.push(`Missing ${key}.`);
  }
  if (!Array.isArray(record.draw) || record.draw.length === 0) errors.push("ReadingRecord draw must be non-empty.");
  if (!record.question?.id || !record.spread?.id) errors.push("ReadingRecord question and spread identities are required.");
  if (record.interpretation && record.interpretation.schemaVersion !== "4.0.0") {
    errors.push("Unsupported interpretation snapshot schemaVersion.");
  }
  if (record.assessment && record.assessment.schemaVersion !== "1.0.0") {
    errors.push("Unsupported assessment snapshot schemaVersion.");
  }
  errors.push(...validateArtifactFingerprint(record.artifactFingerprint));
  if (record.artifactFingerprint && ("commit" in record.artifactFingerprint || "commitSha" in record.artifactFingerprint)) {
    errors.push("ReadingRecord must not embed final commit metadata.");
  }
  return errors;
}
