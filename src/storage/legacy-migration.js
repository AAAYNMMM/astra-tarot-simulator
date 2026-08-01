import { LEGACY_READING_RECORD_SCHEMA_VERSION } from "./reading-record.js";
import { unavailableArtifactFingerprint } from "./artifact-fingerprint.js";

export const LEGACY_MIGRATION_KEY = "legacy-localstorage-v1-to-indexeddb-v2";
export const LEGACY_MIGRATION_VERSION = 1;

function migratedDraw(card, index) {
  return {
    index,
    cardId: card.cardId || `legacy-card-${index}`,
    cardName: card.name || "未知牌",
    positionId: card.positionId || `legacy-position-${index}`,
    positionName: card.position || "未知牌位",
    orientation: card.orientation === "逆位" || card.orientation === "reversed" ? "reversed" : "upright",
    reversalMode: null,
  };
}

export function convertLegacyRecord(record, migratedAt = new Date().toISOString()) {
  const id = typeof record?.id === "string" && record.id ? record.id : `legacy-${migratedAt}`;
  return {
    schemaVersion: LEGACY_READING_RECORD_SCHEMA_VERSION,
    id,
    createdAt: record?.createdAt || migratedAt,
    savedAt: migratedAt,
    question: {
      id: record?.questionId || `legacy-question-${id}`,
      text: record?.question || "旧版占卜记录",
      domain: record?.categoryId || null,
      intent: null,
    },
    spread: {
      id: record?.spreadId || `legacy-spread-${id}`,
      name: record?.spreadName || "旧版牌阵",
    },
    deck: { id: record?.deckId || "legacy-deck" },
    random: null,
    draw: (Array.isArray(record?.cards) && record.cards.length ? record.cards : [{}]).map(migratedDraw),
    evidence: {
      status: "legacy-summary-only",
      observations: [],
      relations: [],
      claims: [],
      rendered: null,
    },
    interpretation: null,
    legacySynthesis: { headline: record?.headline || "" },
    artifactFingerprint: unavailableArtifactFingerprint("legacy-record"),
    source: "legacy-localstorage",
    migration: {
      key: LEGACY_MIGRATION_KEY,
      version: LEGACY_MIGRATION_VERSION,
      migratedAt,
    },
  };
}

export async function migrateLegacyHistory({
  legacyRecords,
  repository,
  now = () => new Date().toISOString(),
} = {}) {
  if (!Array.isArray(legacyRecords) || !repository) throw new TypeError("legacyRecords and repository are required.");
  const marker = await repository.getMeta(LEGACY_MIGRATION_KEY);
  if (marker?.version === LEGACY_MIGRATION_VERSION && marker?.status === "completed") {
    return Object.freeze({ status: "already-completed", migrated: 0, skipped: legacyRecords.length });
  }
  let migrated = 0;
  let skipped = 0;
  for (const legacyRecord of legacyRecords) {
    const converted = convertLegacyRecord(legacyRecord, now());
    if (await repository.get(converted.id)) {
      skipped += 1;
      continue;
    }
    const result = await repository.save(converted);
    if (!["saved", "saved-with-warning"].includes(result.status)) {
      throw new Error(`Legacy migration could not persist ${converted.id}: ${result.reason || result.status}`);
    }
    migrated += 1;
  }
  await repository.setMeta(LEGACY_MIGRATION_KEY, {
    version: LEGACY_MIGRATION_VERSION,
    status: "completed",
    migrated,
    skipped,
    completedAt: now(),
  });
  return Object.freeze({ status: "completed", migrated, skipped });
}
