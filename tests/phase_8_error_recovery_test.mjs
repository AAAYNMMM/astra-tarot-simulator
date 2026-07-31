import assert from "node:assert/strict";

import { AppError, ERROR_CODES, serializeAppError } from "../src/core/errors/app-error.js";
import { createDiagnosticLog } from "../src/platform/diagnostics.js";
import { createRecoveryCoordinator } from "../src/app/recovery/recovery-coordinator.js";

const error = new AppError(ERROR_CODES.ENGINE_EXECUTION_FAILED, {
  context: {
    operation: "engine",
    spreadId: "cross",
    questionText: "private question",
    rootSeed: "private-root-seed",
  },
});
const serialized = serializeAppError(error);
assert.equal(serialized.code, ERROR_CODES.ENGINE_EXECUTION_FAILED);
assert.deepEqual(serialized.context, { operation: "engine", spreadId: "cross" });
assert.equal(JSON.stringify(serialized).includes("private question"), false);
assert.equal(JSON.stringify(serialized).includes("private-root-seed"), false);

let clock = Date.parse("2026-08-01T00:00:00.000Z");
const log = createDiagnosticLog({ maxEntries: 2, now: () => clock++ });
log.capture(error);
log.capture(new Error("second"));
log.capture(new Error("third"));
assert.equal(log.snapshot().length, 2);
const exported = JSON.parse(log.exportReport({ appVersion: "test" }));
assert.equal(exported.privacy.includesQuestionText, false);
assert.equal(exported.privacy.includesReadingText, false);
assert.equal(exported.privacy.includesRootSeed, false);

let attempts = 0;
const coordinator = createRecoveryCoordinator({ diagnosticLog: log });
const failed = await coordinator.execute("engine", async () => {
  attempts += 1;
  throw new Error("engine unavailable");
}, { spreadId: "single" });
assert.equal(failed.status, "failed");
assert.equal(failed.error.code, ERROR_CODES.ENGINE_EXECUTION_FAILED);
const recovered = await coordinator.execute("engine", async () => {
  attempts += 1;
  return "ok";
}, { spreadId: "single" });
assert.deepEqual(recovered, { status: "completed", value: "ok" });
assert.equal(attempts, 2);
console.log("ERR-001A..D error normalization, redaction, diagnostics, and recovery passed.");
