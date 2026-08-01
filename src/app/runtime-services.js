import { createBusinessRandom } from "../core/random/business-random.js";
import { createReadingRandomContextFactory } from "../core/random/production-random.js";
import { createLifecycleClient } from "../platform/lifecycle-client.js";
import { createOfflineStatusClient } from "../platform/offline-status.js";
import { registerServiceWorker as registerPwaServiceWorker } from "../platform/pwa-client.js";
import { createArtifactFingerprintLoader } from "../storage/artifact-fingerprint.js";
import { createHistoryRepository } from "../storage/history-repository.js";
import { createHistoryExport, importHistoryExport } from "../storage/history-transfer.js";
import { createIndexedDbHistoryStore } from "../storage/indexeddb-history.js";
import { createLegacyHistoryStore } from "../storage/legacy-history.js";
import { migrateLegacyHistory } from "../storage/legacy-migration.js";
import { createLegacyReadingRecord } from "../storage/legacy-record.js";
import { createReadingRecord } from "../storage/reading-record.js";
import { createSettingsStore } from "../storage/settings.js";
import { getSpreadDefinition } from "../knowledge/spreads/definitions.js";

function safeLocalStorage(windowRef) {
  try {
    return windowRef?.localStorage ?? null;
  } catch {
    return null;
  }
}

export function createRuntimeServices(windowRef = globalThis.window) {
  if (!windowRef) throw new Error("Runtime services require a browser window.");
  const storageRef = safeLocalStorage(windowRef);
  const settings = createSettingsStore(storageRef);
  const history = createLegacyHistoryStore(storageRef);
  const businessRandom = createBusinessRandom({
    cryptoRef: windowRef.crypto,
    fallbackRandom: windowRef.Math?.random?.bind(windowRef.Math) ?? Math.random,
  });
  const createReadingRandomContext = createReadingRandomContextFactory({
    cryptoRef: windowRef.crypto,
    fallbackRandom: windowRef.Math?.random?.bind(windowRef.Math) ?? Math.random,
  });
  const structuredStore = createIndexedDbHistoryStore({ indexedDBRef: windowRef.indexedDB });
  const structuredHistory = createHistoryRepository({
    store: structuredStore,
    estimateStorage: windowRef.navigator?.storage?.estimate?.bind(windowRef.navigator.storage) || null,
  });
  const loadArtifactFingerprint = createArtifactFingerprintLoader({
    fetchRef: windowRef.fetch?.bind(windowRef),
  });
  const lifecycle = createLifecycleClient({ windowRef });
  const offlineStatus = createOfflineStatusClient({ windowRef });
  let structuredCache = [];

  function structuredProjection(record) {
    const v3 = record?.schemaVersion === "3.0.0";
    const presentation = v3 ? record.interpretation : record.assessment?.presentation;
    const grade = v3 ? presentation?.grade?.level : presentation?.grade;
    const gradeLabel = v3 ? presentation?.grade?.label : presentation?.gradeLabel;
    const spread = getSpreadDefinition(record.spread?.id, record.spread?.definitionVersion || "1.0.0");
    return {
      id: record.id,
      createdAt: record.createdAt,
      categoryId: v3 ? "history-only" : record.question?.domain || "legacy",
      categoryName: v3 ? "自由问题" : record.question?.domain || "兼容历史",
      categoryIcon: "✦",
      categoryAccent: "#a58ad4",
      question: record.question?.text || "旧版占卜记录",
      spreadId: record.spread?.id,
      spreadDefinitionVersion: record.spread?.definitionVersion || "1.0.0",
      spreadName: record.spread?.name || spread?.name || "旧版牌阵",
      deckName: record.deck?.id || "经典韦特",
      cards: (record.draw || []).map((draw) => ({
        name: draw.cardName,
        orientation: draw.orientation === "reversed" ? "逆位" : "正位",
        position: draw.positionName,
      })),
      headline: v3
        ? presentation?.structuralTendency?.text || "这次牌阵已完成。"
        : presentation?.summary || record.legacySynthesis?.headline || "这次牌阵已完成。",
      structured: {
        schemaVersion: record.schemaVersion,
        status: record.evidence?.status || "available",
        interpretationSchemaVersion: record.interpretation?.schemaVersion || null,
        verdictCode: grade || "",
        verdictLabel: grade && gradeLabel ? `${grade} · ${gradeLabel}` : "",
        takeaway: v3 ? presentation?.structuralTendency?.text : presentation?.summary,
        conclusionType: v3 ? "structural-flow" : record.evidence?.claims?.[0]?.conclusionType || "",
        confidence: v3 ? "" : record.evidence?.claims?.[0]?.confidence || "",
        score: null,
        evidenceCount: record.evidence?.observations?.length || 0,
        relationCount: record.evidence?.relations?.length || 0,
        conflictCount: record.evidence?.claims?.[0]?.conflicts?.length || 0,
        conditionCount: v3 ? Object.values(presentation?.conditions || {}).flat().length : 0,
        coverageGapCount: 0,
        assessment: presentation ? {
          grade: grade || null,
          gradeLabel: gradeLabel || "",
          trend: null,
          summary: v3 ? presentation?.structuralTendency?.text : presentation?.summary,
          reason: v3 ? (presentation?.basis || []).map((item) => item.text).join("；") : presentation?.reason,
          outputContract: v3 ? "structural-flow" : presentation?.outputContract,
          mode: v3 ? "unified-structural-grade" : presentation?.mode,
        } : null,
      },
    };
  }

  function loadCombinedHistory() {
    const merged = new Map(history.load().map((record) => [record.id, record]));
    for (const record of structuredCache) {
      const projection = structuredProjection(record);
      merged.set(record.id, { ...(merged.get(record.id) || {}), ...projection });
    }
    return [...merged.values()].sort((left, right) => (
      String(right.createdAt || "").localeCompare(String(left.createdAt || ""))
      || String(left.id).localeCompare(String(right.id))
    ));
  }

  async function initializeStructuredHistory() {
    const initialized = await structuredHistory.initialize();
    if (initialized.mode !== "indexeddb") return initialized;
    try {
      const migration = await migrateLegacyHistory({
        legacyRecords: history.load(),
        repository: structuredHistory,
      });
      structuredCache = await structuredHistory.list();
      return Object.freeze({ ...initialized, migration });
    } catch (error) {
      return Object.freeze({ ...initialized, migration: { status: "failed", reason: error.message } });
    }
  }

  async function saveStructuredReading(reading, engineResult = null) {
    const artifactFingerprint = await loadArtifactFingerprint();
    const record = createReadingRecord({ reading, artifactFingerprint, engineResult });
    const result = await structuredHistory.save(record);
    if (result.status !== "rejected") {
      structuredCache = [record, ...structuredCache.filter((item) => item.id !== record.id)];
    }
    return result;
  }

  async function exportStructuredHistory(options) {
    return createHistoryExport(await structuredHistory.list(), options);
  }

  async function importStructuredHistory(bundle, options = {}) {
    const result = await importHistoryExport({ bundle, repository: structuredHistory, ...options });
    structuredCache = await structuredHistory.list();
    return result;
  }

  async function deleteStructuredReading(id) {
    structuredCache = structuredCache.filter((record) => record.id !== id);
    return structuredHistory.remove(id);
  }

  async function clearStructuredHistory() {
    const records = await structuredHistory.list();
    await Promise.all(records.map((record) => structuredHistory.remove(record.id)));
    structuredCache = [];
  }

  return Object.freeze({
    randomUnit: businessRandom.randomUnit,
    secureShuffle: businessRandom.secureShuffle,
    createReadingRandomContext,
    registerServiceWorker: (options = {}) =>
      registerPwaServiceWorker({
        navigatorRef: windowRef.navigator,
        locationRef: windowRef.location,
        windowRef,
        ...options,
      }),
    registerLocalLifecycle: lifecycle.register,
    offlineStatus,
    loadSettings: settings.load,
    saveSettings: settings.save,
    loadHistory: loadCombinedHistory,
    writeHistory: history.write,
    readingRecord: createLegacyReadingRecord,
    initializeStructuredHistory,
    saveStructuredReading,
    deleteStructuredReading,
    clearStructuredHistory,
    exportStructuredHistory,
    importStructuredHistory,
    structuredHistory,
  });
}
