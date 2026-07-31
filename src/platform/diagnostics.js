import { serializeAppError } from "../core/errors/app-error.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

export function createDiagnosticLog({
  maxEntries = 50,
  maxAgeMs = 7 * 24 * 60 * 60 * 1000,
  now = () => Date.now(),
} = {}) {
  const entries = [];

  function prune() {
    const cutoff = now() - maxAgeMs;
    while (entries.length && (entries[0].timestampMs < cutoff || entries.length > maxEntries)) {
      entries.shift();
    }
  }

  function capture(error, extra = {}) {
    const timestampMs = now();
    entries.push({
      timestamp: new Date(timestampMs).toISOString(),
      timestampMs,
      error: serializeAppError(error),
      environment: {
        online: typeof extra.online === "boolean" ? extra.online : null,
        releaseId: typeof extra.releaseId === "string" ? extra.releaseId : null,
      },
    });
    prune();
    return entries.length;
  }

  function snapshot() {
    prune();
    return deepFreeze(entries.map(({ timestampMs: _timestampMs, ...entry }) => entry));
  }

  function exportReport({ appVersion = "unknown", artifactHash = null } = {}) {
    return JSON.stringify({
      schemaVersion: "1.0.0",
      generatedAt: new Date(now()).toISOString(),
      appVersion,
      artifactHash,
      privacy: {
        includesQuestionText: false,
        includesReadingText: false,
        includesRootSeed: false,
        includesHistoryBody: false,
      },
      entries: snapshot(),
    }, null, 2);
  }

  return Object.freeze({ capture, snapshot, exportReport });
}
