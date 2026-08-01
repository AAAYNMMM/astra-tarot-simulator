import assert from "node:assert/strict";
import test from "node:test";

import { createReadingRecord, validateReadingRecord } from "../src/storage/reading-record.js";
import {
  ARTIFACT_FINGERPRINT,
  createV3Reading,
  hasOwnKeyDeep,
  SPREAD_DEFINITION_VERSION,
} from "./v3_test_support.mjs";

const V2_FIXTURE = Object.freeze({
  schemaVersion: "2.0.0",
  id: "legacy-v2-read-only",
  createdAt: "2026-07-31T23:58:00.000Z",
  savedAt: "2026-07-31T23:59:00.000Z",
  question: Object.freeze({
    id: "career-change",
    text: "现在适合转换方向吗？",
    domain: "career",
    intent: "change-decision",
  }),
  spread: Object.freeze({ id: "single", name: "心语单张" }),
  deck: Object.freeze({ id: "rws" }),
  random: Object.freeze({
    schemaVersion: "1.0.0",
    algorithm: "fnv1a-mulberry32",
    version: "astra-prng-v1",
    rootSeed: "legacy-v2-seed",
    entropySource: "replay",
    streams: Object.freeze({}),
  }),
  draw: Object.freeze([Object.freeze({
    index: 0,
    cardId: "major-0",
    cardName: "愚者",
    positionId: "essence",
    positionName: "核心讯息",
    orientation: "upright",
    reversalMode: null,
  })]),
  evidence: Object.freeze({
    status: "available",
    observations: Object.freeze([]),
    relations: Object.freeze([]),
    claims: Object.freeze([]),
    rendered: null,
    comparison: null,
  }),
  interpretation: null,
  assessment: null,
  legacySynthesis: null,
  artifactFingerprint: ARTIFACT_FINGERPRINT,
  source: "astra-runtime",
  migration: null,
});

test("validateReadingRecord accepts a frozen v2 record without rewriting it", () => {
  const fixture = structuredClone(V2_FIXTURE);
  const before = structuredClone(fixture);
  assert.deepEqual(validateReadingRecord(fixture), []);
  assert.deepEqual(fixture, before);
  assert.equal(fixture.schemaVersion, "2.0.0");
});

test("createReadingRecord writes the v3 history-only question and spread definition version", () => {
  const reading = createV3Reading({ questionText: "仅用于历史显示的问题正文" });
  const record = createReadingRecord({
    reading,
    artifactFingerprint: ARTIFACT_FINGERPRINT,
    engineResult: { observations: [], relations: [], claims: [], rendered: null },
    savedAt: "2026-08-01T00:01:00.000Z",
  });
  assert.equal(record.schemaVersion, "3.0.0");
  assert.deepEqual(record.question, {
    text: "仅用于历史显示的问题正文",
    purpose: "history-only",
  });
  assert.equal(record.spread.id, "single");
  assert.equal(record.spread.definitionVersion, SPREAD_DEFINITION_VERSION);
  assert.equal(hasOwnKeyDeep(record, "comparison"), false);
  assert.deepEqual(validateReadingRecord(record), []);
});

test("validateReadingRecord rejects unsupported record generations", () => {
  const unsupported = { ...structuredClone(V2_FIXTURE), schemaVersion: "1.0.0" };
  assert.notDeepEqual(validateReadingRecord(unsupported), []);
});
