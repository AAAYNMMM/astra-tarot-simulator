export const V3_PROTOCOL_VERSION = "3.0.0";
export const SPREAD_DEFINITION_VERSION = "2.0.0";

export const RANDOM_AUDIT_V1 = Object.freeze({
  schemaVersion: "1.0.0",
  algorithm: "fnv1a-mulberry32",
  version: "astra-prng-v1",
  rootSeed: "v3-contract-seed",
  entropySource: "replay",
  streams: Object.freeze({
    draw: Object.freeze({ name: "draw", derivedSeed: 1 }),
    orientation: Object.freeze({ name: "orientation", derivedSeed: 2 }),
    rendering: Object.freeze({ name: "rendering", derivedSeed: 3 }),
  }),
});

export const ARTIFACT_FINGERPRINT = Object.freeze({
  schemaVersion: "1.0.0",
  status: "available",
  appVersion: "3.0.0-test",
  generatorVersion: "1.0.0",
  sourceSetHash: "source-test-hash",
  engineManifestHash: "engine-test-hash",
  knowledgeManifestHash: "knowledge-test-hash",
});

export function createV3Reading({ questionText = "这段问题正文只供历史展示。" } = {}) {
  return {
    id: "reading-v3-contract",
    createdAt: "2026-08-01T00:00:00.000Z",
    question: {
      id: "must-not-cross-worker-boundary",
      text: questionText,
      domain: "must-not-cross-worker-boundary",
      intent: "must-not-cross-worker-boundary",
      questionType: "must-not-cross-worker-boundary",
    },
    category: { id: "must-not-cross-worker-boundary" },
    spread: {
      id: "single",
      name: "心语单张",
      definitionVersion: SPREAD_DEFINITION_VERSION,
    },
    deckStyle: "rws",
    evaluationSelection: {
      expectationId: "must-not-cross-worker-boundary",
      criterionId: "must-not-cross-worker-boundary",
      timeframe: "must-not-cross-worker-boundary",
    },
    randomAudit: structuredClone(RANDOM_AUDIT_V1),
    draws: [{
      index: 0,
      card: { id: "major-0", name: "愚者", arcana: "major" },
      position: { id: "essence", name: "核心讯息" },
      reversed: false,
      reversalMode: null,
    }],
  };
}

export function createV3WorkerRequest() {
  return {
    protocolVersion: V3_PROTOCOL_VERSION,
    readingId: "reading-v3-contract",
    spreadId: "single",
    spreadDefinitionVersion: SPREAD_DEFINITION_VERSION,
    draws: [{
      cardId: "major-0",
      positionId: "essence",
      orientation: "upright",
    }],
    randomAudit: structuredClone(RANDOM_AUDIT_V1),
  };
}

export function hasOwnKeyDeep(value, forbiddenKey) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, forbiddenKey)) return true;
  return Object.values(value).some((item) => hasOwnKeyDeep(item, forbiddenKey));
}
