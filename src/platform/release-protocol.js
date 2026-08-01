export const RELEASE_PROTOCOL_VERSION = "1.0.0";

export const RELEASE_CLIENT_STATES = Object.freeze([
  "idle",
  "reading",
  "pending-save",
  "migration",
  "unknown",
]);

export function normalizeClientState(value) {
  return RELEASE_CLIENT_STATES.includes(value) ? value : "unknown";
}

export function createClientReport({ clientId, releaseId, state, timestamp = Date.now() } = {}) {
  return Object.freeze({
    protocolVersion: RELEASE_PROTOCOL_VERSION,
    type: "ASTRA_CLIENT_STATE",
    clientId: String(clientId || "unknown-client"),
    releaseId: releaseId ? String(releaseId) : null,
    state: normalizeClientState(state),
    timestamp: Number(timestamp) || 0,
  });
}

export function reportAllowsActivation(report) {
  return Boolean(
    report
      && report.protocolVersion === RELEASE_PROTOCOL_VERSION
      && report.type === "ASTRA_CLIENT_STATE"
      && report.state === "idle",
  );
}

export function activationDecision(reports, { force = false, timedOut = false } = {}) {
  if (force) return Object.freeze({ allowed: true, reason: "user-forced" });
  if (timedOut) return Object.freeze({ allowed: false, reason: "client-timeout" });
  if (!Array.isArray(reports) || reports.length === 0) {
    return Object.freeze({ allowed: false, reason: "no-client-reports" });
  }
  const blocked = reports.find((report) => !reportAllowsActivation(report));
  return blocked
    ? Object.freeze({ allowed: false, reason: `client-${blocked.state || "unknown"}` })
    : Object.freeze({ allowed: true, reason: "all-clients-idle" });
}
