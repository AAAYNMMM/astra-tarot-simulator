import { createDeterministicStreams, STREAM_NAMES } from "./deterministic-streams.js";

export const PRODUCTION_RANDOM_VERSION = "astra-prng-v1";

function validateUnit(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric >= 1) {
    throw new RangeError("Fallback random source must return a finite value in [0, 1).");
  }
  return numeric;
}

function bytesToHex(bytes) {
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function secureSeed(cryptoRef) {
  if (typeof cryptoRef?.getRandomValues !== "function") return null;
  const bytes = new Uint8Array(16);
  cryptoRef.getRandomValues(bytes);
  return `seed-v1-${bytesToHex(bytes)}`;
}

function fallbackSeed({ fallbackRandom, now }) {
  const timestamp = Number(now());
  const parts = [timestamp.toString(36)];
  for (let index = 0; index < 4; index += 1) {
    parts.push(Math.floor(validateUnit(fallbackRandom()) * 0x100000000).toString(36));
  }
  return `seed-v1-fallback-${parts.join("-")}`;
}

export function createRootSeed({
  cryptoRef = globalThis.crypto,
  fallbackRandom = Math.random,
  now = Date.now,
} = {}) {
  if (typeof fallbackRandom !== "function" || typeof now !== "function") {
    throw new TypeError("fallbackRandom and now must be functions.");
  }
  const secure = secureSeed(cryptoRef);
  return Object.freeze({
    rootSeed: secure || fallbackSeed({ fallbackRandom, now }),
    entropySource: secure ? "web-crypto" : "time-random-fallback",
  });
}

function auditFor(deterministic, entropySource) {
  return Object.freeze({
    schemaVersion: "1.0.0",
    algorithm: deterministic.algorithm,
    version: deterministic.version,
    rootSeed: deterministic.rootSeed,
    entropySource,
    streams: Object.freeze(Object.fromEntries(
      STREAM_NAMES.map((name) => [name, Object.freeze({
        name,
        derivedSeed: deterministic.streams[name].derivedSeed,
      })]),
    )),
  });
}

export function createReadingRandomContextFactory({
  cryptoRef = globalThis.crypto,
  fallbackRandom = Math.random,
  now = Date.now,
  version = PRODUCTION_RANDOM_VERSION,
} = {}) {
  return function createReadingRandomContext({ rootSeed = null } = {}) {
    const entropy = rootSeed
      ? Object.freeze({ rootSeed, entropySource: "replay" })
      : createRootSeed({ cryptoRef, fallbackRandom, now });
    const deterministic = createDeterministicStreams(entropy.rootSeed, { version });
    return Object.freeze({
      audit: auditFor(deterministic, entropy.entropySource),
      draw: deterministic.streams.draw,
      orientation: deterministic.streams.orientation,
      rendering: deterministic.streams.rendering,
    });
  };
}

export function replayReadingRandomContext(audit) {
  if (!audit || typeof audit.rootSeed !== "string" || typeof audit.version !== "string") {
    throw new TypeError("A valid random audit record is required.");
  }
  return createReadingRandomContextFactory({ version: audit.version })({ rootSeed: audit.rootSeed });
}
