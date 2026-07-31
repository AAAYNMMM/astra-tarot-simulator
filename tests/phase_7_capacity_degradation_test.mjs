import assert from "node:assert/strict";
import { evaluateCapacity } from "../src/storage/capacity-policy.js";
import { createHistoryRepository } from "../src/storage/history-repository.js";
import { createMemoryStore, sampleRecord } from "./phase_7_test_support.mjs";

const warning = evaluateCapacity({
  count: 410,
  estimate: { usage: 85, quota: 100 },
});
assert.equal(warning.level, "warning");
assert.ok(warning.actions.includes("export-history"));

const quotaError = Object.assign(new Error("full"), { name: "QuotaExceededError" });
const store = createMemoryStore({ failPut: quotaError });
const repository = createHistoryRepository({ store });
await repository.initialize();
const result = await repository.save(sampleRecord("pending-1"));
assert.equal(result.status, "degraded");
assert.equal(result.reason, "quota-exceeded");
assert.equal(result.retainedInMemory, true);
assert.equal(repository.pendingCount, 1);
assert.equal((await repository.list())[0].id, "pending-1");

const unavailable = createHistoryRepository({ store: createMemoryStore({ failOpen: true }) });
assert.equal((await unavailable.initialize()).mode, "memory");
const memorySave = await unavailable.save(sampleRecord("memory-1"));
assert.equal(memorySave.status, "degraded");
assert.equal((await unavailable.list()).length, 1);
console.log("AU-003C capacity warning and lossless degradation passed.");
