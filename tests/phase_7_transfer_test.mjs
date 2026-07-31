import assert from "node:assert/strict";
import { createHistoryExport, importHistoryExport, validateHistoryExport } from "../src/storage/history-transfer.js";
import { createMemoryRepository, sampleRecord } from "./phase_7_test_support.mjs";

const cryptoRef = null;
const records = [sampleRecord("reading-a"), sampleRecord("reading-b", "2026-08-01T01:00:00.000Z")];
const bundle = await createHistoryExport(records, {
  now: () => "2026-08-01T02:00:00.000Z",
  cryptoRef,
});
assert.deepEqual(await validateHistoryExport(bundle, { cryptoRef }), []);
const tampered = structuredClone(bundle);
tampered.records[0].question.text = "篡改";
assert.match((await validateHistoryExport(tampered, { cryptoRef })).join(" "), /checksum mismatch/);

const { repository } = await createMemoryRepository();
await repository.save(sampleRecord("reading-a"));
const skipped = await importHistoryExport({ bundle, repository, conflictPolicy: "skip", cryptoRef });
assert.deepEqual(skipped, { status: "completed", imported: 1, skipped: 1, replaced: 0 });
const kept = await importHistoryExport({ bundle, repository, conflictPolicy: "keep-both", cryptoRef });
assert.equal(kept.status, "completed");
assert.equal(kept.imported, 2);
assert.ok((await repository.list()).some((record) => record.id.startsWith("reading-a-import-")));
console.log("AU-003B history export, validation, and conflict handling passed.");
