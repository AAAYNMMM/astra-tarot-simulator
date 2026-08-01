export const SUPPORT_STATUSES = Object.freeze([
  "SUPPORTED",
  "SUPPORTED-WITH-DEGRADATION",
  "NOT-TESTED",
  "NOT-SUPPORTED",
]);

export function validateCompatibilityMatrix(matrix) {
  if (!matrix || matrix.schemaVersion !== "1.0.0") throw new Error("Invalid compatibility matrix.");
  for (const entry of matrix.browsers || []) {
    if (!SUPPORT_STATUSES.includes(entry.status)) {
      throw new Error(`Invalid browser support status: ${entry.status}`);
    }
  }
  return true;
}

export function historyCompatibility(record, matrix) {
  const version = String(record?.schemaVersion || "1.0.0");
  const policy = matrix?.historySchemas?.[version];
  return policy?.mode || "read-only";
}

export function detectMixedRelease({
  matrix = null,
  appVersion = null,
  artifactManifest = null,
  offlineStatus = null,
  shellReleaseId = null,
  artifactReleaseId = null,
} = {}) {
  const expectedVersion = matrix?.release
    || artifactManifest?.appVersion
    || artifactManifest?.applicationVersion
    || artifactManifest?.version
    || artifactReleaseId
    || null;
  const currentVersion = appVersion || shellReleaseId || null;
  const reportedReleaseId = offlineStatus?.releaseId || artifactReleaseId || null;
  const activeReleaseId = offlineStatus?.activeReleaseId || shellReleaseId || null;
  const versionMismatch = Boolean(currentVersion && expectedVersion && currentVersion !== expectedVersion);
  const cacheMismatch = Boolean(reportedReleaseId && activeReleaseId && reportedReleaseId !== activeReleaseId);
  const mixed = versionMismatch || cacheMismatch;
  return Object.freeze({
    mixed,
    action: mixed ? "reload-or-rollback" : "continue",
    versionMismatch,
    cacheMismatch,
  });
}
