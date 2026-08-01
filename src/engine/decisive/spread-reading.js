import { replayReadingRandomContext } from "../../core/random/production-random.js";
import { assessStructuralReading } from "../assessment/structural-assessor.js";
import { createStructuralPresentation } from "../assessment/structural-presentation.js";
import { createSpreadWorkflow } from "../interpretation/workflows/index.js";
import { validateReadingPresentationV3 } from "../interpretation/reading-presentation-validator.js";
import { executeSpreadReading } from "../runtime/reading-engine.js";

export const SPREAD_READING_REQUEST_PROTOCOL_VERSION = "3.0.0";
const ALLOWED_KEYS = Object.freeze([
  "protocolVersion", "readingId", "spreadId", "spreadDefinitionVersion", "draws", "randomAudit",
]);
const DRAW_KEYS = Object.freeze(["cardId", "positionId", "orientation"]);
const RANDOM_AUDIT_KEYS = Object.freeze([
  "schemaVersion", "algorithm", "version", "rootSeed", "entropySource", "streams",
]);
const RANDOM_STREAM_KEYS = Object.freeze(["name", "derivedSeed"]);
const RANDOM_STREAM_NAMES = Object.freeze(["draw", "orientation", "rendering"]);
const GRADE_LABELS = Object.freeze({
  SSS: "结构高度支持", SS: "整体强势支持", S: "明显顺势", A: "较为顺畅",
  B: "略有支持", C: "条件参半", D: "阻力明显", E: "结构明显受阻",
});
let warmPromise = null;

export class SpreadReadingRequestError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SpreadReadingRequestError";
    this.code = code;
  }
}

export function warmSpreadReadingEngine() {
  if (!warmPromise) {
    warmPromise = Promise.resolve(Object.freeze({
      status: "ready",
      strategy: "spread-profile-card-on-demand",
      protocolVersion: SPREAD_READING_REQUEST_PROTOCOL_VERSION,
    }));
  }
  return warmPromise;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function validateRequest(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new SpreadReadingRequestError("READING_V3_REQUEST_REQUIRED", "EngineReadingRequestV3 must be an object.");
  }
  const unknown = Object.keys(request).filter((key) => !ALLOWED_KEYS.includes(key));
  if (unknown.length) {
    throw new SpreadReadingRequestError("READING_V3_UNKNOWN_FIELDS", `EngineReadingRequestV3 rejects fields: ${unknown.sort().join(", ")}.`);
  }
  if (request.protocolVersion !== SPREAD_READING_REQUEST_PROTOCOL_VERSION) {
    throw new SpreadReadingRequestError("READING_V3_PROTOCOL_UNSUPPORTED", `Unsupported reading protocol: ${request.protocolVersion || "missing"}.`);
  }
  for (const key of ["readingId", "spreadId", "spreadDefinitionVersion"]) {
    if (typeof request[key] !== "string" || !request[key]) {
      throw new SpreadReadingRequestError("READING_V3_FIELD_REQUIRED", `${key} is required.`);
    }
  }
  if (request.spreadDefinitionVersion !== "2.0.0") {
    throw new SpreadReadingRequestError("READING_V3_SPREAD_VERSION_UNSUPPORTED", `V3 readings require spread definition 2.0.0, received ${request.spreadDefinitionVersion}.`);
  }
  if (!Array.isArray(request.draws) || !request.draws.length) {
    throw new SpreadReadingRequestError("READING_V3_DRAWS_REQUIRED", "draws must be a non-empty array.");
  }
  const cardIds = new Set();
  for (const [index, draw] of request.draws.entries()) {
    const unknownDrawKeys = Object.keys(draw || {}).filter((key) => !DRAW_KEYS.includes(key));
    if (unknownDrawKeys.length) {
      throw new SpreadReadingRequestError("READING_V3_DRAW_UNKNOWN_FIELDS", `Draw ${index} rejects fields: ${unknownDrawKeys.sort().join(", ")}.`);
    }
    if (!draw || typeof draw.cardId !== "string" || typeof draw.positionId !== "string") {
      throw new SpreadReadingRequestError("READING_V3_DRAW_INVALID", `Draw ${index} requires cardId and positionId.`);
    }
    if (!["upright", "reversed"].includes(draw.orientation)) {
      throw new SpreadReadingRequestError("READING_V3_DRAW_INVALID", `Draw ${index} has an unsupported orientation.`);
    }
    if (cardIds.has(draw.cardId)) {
      throw new SpreadReadingRequestError("READING_V3_DUPLICATE_CARD", `Duplicate cardId: ${draw.cardId}.`);
    }
    cardIds.add(draw.cardId);
  }
  if (!request.randomAudit || typeof request.randomAudit !== "object") {
    throw new SpreadReadingRequestError("READING_V3_RANDOM_AUDIT_REQUIRED", "randomAudit is required.");
  }
  const unknownAuditKeys = Object.keys(request.randomAudit).filter((key) => !RANDOM_AUDIT_KEYS.includes(key));
  if (unknownAuditKeys.length) {
    throw new SpreadReadingRequestError("READING_V3_RANDOM_AUDIT_UNKNOWN_FIELDS", `randomAudit rejects fields: ${unknownAuditKeys.sort().join(", ")}.`);
  }
  if (request.randomAudit.schemaVersion !== "1.0.0" || typeof request.randomAudit.rootSeed !== "string") {
    throw new SpreadReadingRequestError("READING_V3_RANDOM_AUDIT_INVALID", "randomAudit must use schemaVersion 1.0.0 and contain rootSeed.");
  }
  const streamNames = Object.keys(request.randomAudit.streams || {}).sort();
  if (JSON.stringify(streamNames) !== JSON.stringify([...RANDOM_STREAM_NAMES].sort())) {
    throw new SpreadReadingRequestError("READING_V3_RANDOM_STREAMS_INVALID", "randomAudit must contain draw, orientation, and rendering streams.");
  }
  for (const name of RANDOM_STREAM_NAMES) {
    const stream = request.randomAudit.streams[name];
    const unknownStreamKeys = Object.keys(stream || {}).filter((key) => !RANDOM_STREAM_KEYS.includes(key));
    if (unknownStreamKeys.length || stream?.name !== name || !Number.isInteger(stream?.derivedSeed)) {
      throw new SpreadReadingRequestError("READING_V3_RANDOM_STREAMS_INVALID", `randomAudit stream ${name} is invalid.`);
    }
  }
}

function supportedItems(items) {
  return (items || []).filter((item) => item?.status === "supported" && item.evidenceRefs?.length);
}

function createReadingPresentation({ spreadId, assessment, assessmentPresentation, workflow }) {
  const valid = assessment.status === "valid" && workflow.status === "complete";
  const success = workflow.successSignal?.status === "supported" ? [workflow.successSignal] : [];
  const stopSignals = workflow.stopSignal?.status === "supported" ? [workflow.stopSignal] : [];
  const turningPoints = workflow.turningPoint?.status === "supported" ? [workflow.turningPoint] : [];
  return deepFreeze({
    schemaVersion: "3.0.0",
    spreadId,
    status: valid ? "complete" : "insufficient",
    grade: valid ? { level: assessment.grade, label: GRADE_LABELS[assessment.grade] } : null,
    factorBands: assessmentPresentation.factorSummaries.map((item) => ({
      factor: item.factor,
      label: item.label,
      band: item.band,
      text: item.text,
      evidenceRefs: item.evidenceRefs,
    })),
    structuralTendency: workflow.spreadAnalysis,
    spreadAnalysis: workflow.spreadAnalysis,
    basis: workflow.basis,
    favorableFactors: supportedItems(workflow.favorableFactors).slice(0, 3),
    limitingFactors: supportedItems(workflow.limitingFactors).slice(0, 3),
    conditions: { success, stopSignals, turningPoints },
    realityReference: workflow.realityReference,
    ...(workflow.resultSupport ? { resultSupport: workflow.resultSupport } : {}),
    evidenceRefs: unique([
      ...(assessment.evidenceRefs || []),
      ...(workflow.spreadAnalysis?.evidenceRefs || []),
      ...workflow.basis.flatMap((item) => item.evidenceRefs || []),
    ]),
    provenance: {
      presentationVersion: "spread-presentation-v3",
      assessmentVersion: assessment.schemaVersion,
      workflowVersion: workflow.schemaVersion,
      spreadWorkflow: spreadId,
      caps: assessmentPresentation.caps,
      ...(workflow.resultSupport ? { resultSupport: workflow.resultSupport } : {}),
    },
    ...(valid ? {} : { issues: unique([...(assessment.issues || []), `workflow:${workflow.status}`]) }),
  });
}

export async function executeSpreadReadingRequest(request = {}) {
  validateRequest(request);
  const startedAt = performance.now();
  let randomContext;
  try {
    randomContext = replayReadingRandomContext(request.randomAudit);
  } catch (error) {
    throw new SpreadReadingRequestError("READING_V3_RANDOM_UNSUPPORTED", error.message);
  }
  const engineStartedAt = performance.now();
  const engineResult = await executeSpreadReading({
    readingId: request.readingId,
    spreadId: request.spreadId,
    spreadDefinitionVersion: request.spreadDefinitionVersion,
    draws: request.draws,
    renderingStream: randomContext.rendering,
  });
  const engineMs = performance.now() - engineStartedAt;
  const interpretationStartedAt = performance.now();
  const assessment = assessStructuralReading({
    spreadId: request.spreadId,
    observations: engineResult.observations,
    relations: engineResult.relations,
    activeCandidates: engineResult.resolution.activeCandidates,
    conflicts: engineResult.resolution.conflicts,
  });
  const assessmentPresentation = createStructuralPresentation(assessment);
  const workflow = createSpreadWorkflow(request.spreadId, {
    observations: engineResult.observations,
    relations: engineResult.relations,
    activeCandidates: engineResult.resolution.activeCandidates,
    conflicts: engineResult.resolution.conflicts,
    assessment,
  });
  const presentation = createReadingPresentation({
    spreadId: request.spreadId,
    assessment,
    assessmentPresentation,
    workflow,
  });
  const presentationErrors = validateReadingPresentationV3(presentation);
  if (presentationErrors.length) {
    throw new SpreadReadingRequestError("READING_V3_PRESENTATION_INVALID", presentationErrors.join("; "));
  }
  const interpretationMs = performance.now() - interpretationStartedAt;
  const totalMs = performance.now() - startedAt;
  return deepFreeze({
    protocolVersion: SPREAD_READING_REQUEST_PROTOCOL_VERSION,
    status: presentation.status === "complete" ? "completed" : "incomplete",
    synthesis: presentation,
    presentation,
    engineResult,
    assessment: {
      schemaVersion: "3.0.0",
      status: assessment.status,
      grade: presentation.grade,
      factorBands: presentation.factorBands,
      caps: assessmentPresentation.caps,
      evidenceRefs: assessment.evidenceRefs,
      presentation,
    },
    timings: {
      engineMs: Number(engineMs.toFixed(3)),
      interpretationMs: Number(interpretationMs.toFixed(3)),
      totalMs: Number(totalMs.toFixed(3)),
    },
  });
}
