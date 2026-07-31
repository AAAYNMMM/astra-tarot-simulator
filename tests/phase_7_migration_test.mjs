import assert from "node:assert/strict";
import { migrateLegacyHistory, LEGACY_MIGRATION_KEY } from "../src/storage/legacy-migration.js";
import { createMemoryRepository } from "./phase_7_test_support.mjs";

const legacy = [{
  id: "legacy-1",
  createdAt: "2026-07-01T00:00:00.000Z",
  categoryId: "daily",
  question: "今天如何安排？",
  spreadName: "心语单张",
  deckName: "RWS",
  cards: [{ name: "愚者", orientation: "正位", position: "核心讯息" }],
  headline: "旧记录",
}];
const original = structuredClone(legacy);
const { repository } = await createMemoryRepository();
const first = await migrateLegacyHistory({
  legacyRecords: legacy,
  repository,
  now: () => "2026-08-01T00:00:00.000Z",
});
assert.deepEqual(first, { status: "completed", migrated: 1, skipped: 0 });
assert.deepEqual(legacy, original, "Migration must not mutate or delete legacy history.");
assert.equal((await repository.get("legacy-1")).source, "legacy-localstorage");
assert.equal((await repository.getMeta(LEGACY_MIGRATION_KEY)).status, "completed");
const second = await migrateLegacyHistory({ legacyRecords: legacy, repository });
assert.deepEqual(second, { status: "already-completed", migrated: 0, skipped: 1 });
console.log("AU-003A idempotent legacy migration passed.");
