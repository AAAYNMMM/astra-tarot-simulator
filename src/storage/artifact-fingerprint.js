import { APP_VERSION, ARTIFACT_GENERATOR_VERSION } from "../config/version.js";

function unavailable(reason) {
  return Object.freeze({
    schemaVersion: "1.0.0",
    status: "unavailable",
    appVersion: APP_VERSION,
    generatorVersion: ARTIFACT_GENERATOR_VERSION,
    sourceSetHash: null,
    engineManifestHash: null,
    knowledgeManifestHash: null,
    reason,
  });
}

export function validateArtifactFingerprint(value) {
  const errors = [];
  if (!value || typeof value !== "object") return ["Artifact fingerprint must be an object."];
  if (value.status === "unavailable") return [];
  for (const key of ["appVersion", "generatorVersion", "sourceSetHash", "engineManifestHash", "knowledgeManifestHash"]) {
    if (typeof value[key] !== "string" || value[key].length === 0) errors.push(`Missing artifact fingerprint ${key}.`);
  }
  if ("commit" in value || "commitSha" in value) errors.push("Artifact fingerprint must not embed a Git commit.");
  return errors;
}

export function createArtifactFingerprintLoader({
  fetchRef = globalThis.fetch,
  manifestUrl = new URL("../generated/artifact-manifest.json", import.meta.url),
} = {}) {
  let cached = null;
  return async function loadArtifactFingerprint() {
    if (cached) return cached;
    if (typeof fetchRef !== "function") return unavailable("fetch-unavailable");
    try {
      const response = await fetchRef(manifestUrl);
      if (!response?.ok) return unavailable(`manifest-http-${response?.status ?? "unknown"}`);
      const manifest = await response.json();
      const fingerprint = Object.freeze({
        schemaVersion: "1.0.0",
        status: "available",
        appVersion: manifest.appVersion,
        generatorVersion: manifest.generatorVersion,
        sourceSetHash: manifest.sourceSetHash,
        engineManifestHash: manifest.engineManifestHash,
        knowledgeManifestHash: manifest.knowledgeManifestHash,
      });
      const errors = validateArtifactFingerprint(fingerprint);
      cached = errors.length ? unavailable("manifest-invalid") : fingerprint;
      return cached;
    } catch {
      return unavailable("manifest-read-failed");
    }
  };
}

export { unavailable as unavailableArtifactFingerprint };
