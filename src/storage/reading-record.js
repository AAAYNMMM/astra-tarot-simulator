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
  return Object.freeze({
    status: engineResult ? "available" : "pending-ui-integration",
    observations: clone(engineResult?.observations || []),
    relations: clone(engineResult?.relations || []),
    claims: clone(engineResult?.claims || []),
    rendered: clone(engineResult?.rendered || null),
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
    legacySynthesis: clone(reading.synthesis || null),
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
  errors.push(...validateArtifactFingerprint(record.artifactFingerprint));
  if (record.artifactFingerprint && ("commit" in record.artifactFingerprint || "commitSha" in record.artifactFingerprint)) {
    errors.push("ReadingRecord must not embed final commit metadata.");
  }
  return errors;
}
