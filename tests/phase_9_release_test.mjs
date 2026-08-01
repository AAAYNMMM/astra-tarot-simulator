import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  detectMixedRelease,
  historyCompatibility,
  validateCompatibilityMatrix,
} from "../src/platform/release-compatibility.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const readJson = (relative) => JSON.parse(read(relative));
const matrix = readJson("src/config/compatibility-matrix.json");
const artifact = readJson("src/generated/artifact-manifest.json");
const acceptance = readJson(".qa/release/release-acceptance.json");
const release = readJson(".qa/release/release-2.1.0.json");

assert.equal(validateCompatibilityMatrix(matrix), true);
assert.equal(matrix.release, "2.1.0");
assert.equal(historyCompatibility({ schemaVersion: "3.0.0" }, matrix), "read-write");
assert.equal(historyCompatibility({ schemaVersion: "2.0.0" }, matrix), "read-only");
assert.equal(historyCompatibility({ schemaVersion: "1.0.0" }, matrix), "read-only");
assert.equal(detectMixedRelease({
  matrix,
  appVersion: "2.1.0",
  artifactManifest: artifact,
  offlineStatus: { releaseId: "same", activeReleaseId: "same" },
}).mixed, false);
assert.equal(detectMixedRelease({
  matrix,
  appVersion: "2.0.0",
  artifactManifest: artifact,
  offlineStatus: { releaseId: "new", activeReleaseId: "old" },
}).mixed, true);

assert.equal(acceptance.status, "PASS");
assert.equal(Object.values(acceptance.checks).every(Boolean), true);
assert.equal(release.status, "RELEASED");
assert.equal(release.release, "2.1.0");
assert.equal(release.guarantees.fixedQuestions, false);
assert.equal(release.guarantees.questionEngineIsolation, true);
assert.equal(release.guarantees.readingRecordSchema, "3.0.0");
assert.match(release.releaseId, /^2\.1\.0-/);
assert.equal(read("src/config/version.js").includes('APP_VERSION = "2.1.0"'), true);
for (const relative of [
  "LICENSE",
  "THIRD_PARTY_NOTICES.md",
  "CHANGELOG.md",
  "docs/RELEASE_NOTES_2.1.0.md",
  "docs/RELEASE_ROLLBACK.md",
  "docs/BROWSER_SUPPORT.md",
]) assert.equal(fs.existsSync(path.join(root, relative)), true, relative);
console.log(`Phase 9 release compatibility passed: ${release.releaseId}.`);
