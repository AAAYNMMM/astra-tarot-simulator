import { validateReadingRecord } from "./reading-record.js";

export const HISTORY_EXPORT_SCHEMA_VERSION = "1.0.0";

function stableValue(value) {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableValue(value[key])]));
  }
  return value;
}

function stableJson(value) {
  return JSON.stringify(stableValue(value));
}

function bytesToHex(bytes) {
  return [...bytes].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function fallbackHash(text) {
  let hash = 2166136261;
  for (const character of text) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export async function digestText(text, cryptoRef = globalThis.crypto) {
  if (typeof cryptoRef?.subtle?.digest === "function") {
    const bytes = new TextEncoder().encode(text);
    const digest = await cryptoRef.subtle.digest("SHA-256", bytes);
    return `sha256:${bytesToHex(new Uint8Array(digest))}`;
  }
  return fallbackHash(text);
}

function unsignedBundle(bundle) {
  const { checksum: _checksum, ...unsigned } = bundle;
  return unsigned;
}

export async function createHistoryExport(records, {
  now = () => new Date().toISOString(),
  cryptoRef = globalThis.crypto,
} = {}) {
  if (!Array.isArray(records)) throw new TypeError("records must be an array.");
  for (const record of records) {
    const errors = validateReadingRecord(record);
    if (errors.length) throw new Error(errors.join("; "));
  }
  const unsigned = {
    schemaVersion: HISTORY_EXPORT_SCHEMA_VERSION,
    exportedAt: now(),
    recordCount: records.length,
    records: stableValue(records),
  };
  return Object.freeze({
    ...unsigned,
    checksum: await digestText(stableJson(unsigned), cryptoRef),
  });
}

export async function validateHistoryExport(bundle, { cryptoRef = globalThis.crypto } = {}) {
  const errors = [];
  if (!bundle || typeof bundle !== "object") return ["History import bundle must be an object."];
  if (bundle.schemaVersion !== HISTORY_EXPORT_SCHEMA_VERSION) errors.push("Unsupported history export schemaVersion.");
  if (!Array.isArray(bundle.records)) errors.push("History export records must be an array.");
  if (bundle.recordCount !== bundle.records?.length) errors.push("History export recordCount mismatch.");
  const ids = new Set();
  for (const record of bundle.records || []) {
    const recordErrors = validateReadingRecord(record);
    errors.push(...recordErrors.map((error) => `${record?.id || "<unknown>"}: ${error}`));
    if (ids.has(record.id)) errors.push(`Duplicate imported record id: ${record.id}.`);
    ids.add(record.id);
  }
  const expected = await digestText(stableJson(unsignedBundle(bundle)), cryptoRef);
  if (bundle.checksum !== expected) errors.push("History export checksum mismatch.");
  return errors;
}

function conflictId(record, bundleChecksum, index) {
  const suffix = fallbackHash(`${record.id}\u0000${bundleChecksum}\u0000${index}`).split(":")[1];
  return `${record.id}-import-${suffix}`;
}

export async function importHistoryExport({
  bundle,
  repository,
  conflictPolicy = "skip",
  cryptoRef = globalThis.crypto,
} = {}) {
  if (!repository) throw new TypeError("repository is required.");
  if (!["skip", "replace", "keep-both"].includes(conflictPolicy)) throw new RangeError("Unsupported conflictPolicy.");
  const errors = await validateHistoryExport(bundle, { cryptoRef });
  if (errors.length) return Object.freeze({ status: "rejected", errors: Object.freeze(errors) });
  let imported = 0;
  let skipped = 0;
  let replaced = 0;
  for (let index = 0; index < bundle.records.length; index += 1) {
    const record = bundle.records[index];
    const existing = await repository.get(record.id);
    if (existing && conflictPolicy === "skip") {
      skipped += 1;
      continue;
    }
    let target = record;
    if (existing && conflictPolicy === "keep-both") {
      target = { ...record, id: conflictId(record, bundle.checksum, index) };
    } else if (existing) {
      replaced += 1;
    }
    const result = await repository.save(target);
    if (!["saved", "saved-with-warning"].includes(result.status)) {
      return Object.freeze({ status: "partial", imported, skipped, replaced, failedId: target.id, reason: result.reason });
    }
    imported += 1;
  }
  return Object.freeze({ status: "completed", imported, skipped, replaced });
}
