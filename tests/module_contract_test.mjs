import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TarotData as data } from "../src/knowledge/legacy/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const requiredFiles = [
  "automation/validate.py", "automation/quality-baseline.json", "docs/MODULE_MAP.md",
  ".gitattributes", "scripts/generate_artifacts.mjs", "src/config/version.js",
  "src/generated/card-catalog.js", "src/generated/question-catalog.js",
  "src/generated/knowledge-registry.js", "src/generated/knowledge-manifest.json",
  "src/generated/artifact-manifest.json", "src/generated/precache-manifest.js",
  "tests/generated_artifacts_contract_test.mjs",
  "tests/browser_harness.py", "tests/phase_m_gate_test.mjs", "docs/BROWSER_SUPPORT.md",
  "src/knowledge/schemas/card-semantic-profile.schema.json",
  "src/engine/validation/schema-validator.js", "src/engine/validation/card-profile-validator.js",
  "scripts/validate_card_profiles.mjs", "tests/card_schema_contract_test.mjs",
  "package.json", "src/README.md", "src/app/bootstrap.js", "src/app/application.js",
  "src/app/runtime-services.js",
  "src/ui/components/dialogs.js", "src/config/decks.js", "src/config/accent-tokens.js",
  "src/config/legacy-storage.js", "src/core/html.js", "src/core/random/business-random.js",
  "src/platform/assets.js", "src/platform/entropy.js", "src/platform/lifecycle-client.js",
  "src/platform/offline-status.js", "src/ui/image-fallback.js", "tests/pwa_contract_test.mjs",
  "src/platform/pwa-client.js", "src/storage/settings.js", "src/storage/legacy-history.js",
  "src/storage/legacy-record.js", "src/engine/legacy/card-reading.js",
  "src/engine/legacy/synthesis.js", "src/knowledge/legacy/index.js",
  "tests/application_contract_test.mjs", "tests/knowledge_contract_test.mjs",
  "tests/fixtures/legacy-knowledge-fingerprint.json",
];
for (const relativePath of requiredFiles) assert.equal(exists(relativePath), true, `Missing ${relativePath}`);
for (const removed of ["app.js", "data.js", "src/app/legacy-runtime.js", "styles.css"]) {
  assert.equal(exists(removed), false, `${removed} was reintroduced`);
}
const packageMetadata = JSON.parse(read("package.json"));
assert.equal(packageMetadata.private, true);
assert.equal(packageMetadata.type, "module");
assert.equal("dependencies" in packageMetadata, false);
assert.equal("devDependencies" in packageMetadata, false);
assert.equal(data.deck.length, 78);
assert.ok(data.categories.reduce((sum, category) => sum + category.questions.length, 0) >= 42);
assert.deepEqual(data.spreads.map((spread) => spread.positions.length), [1, 3, 5, 10]);
const ids = [
  ...data.deck.map((card) => card.id),
  ...data.categories.flatMap((category) => category.questions.map((question) => question.id)),
  ...data.spreads.map((spread) => spread.id),
];
for (const id of ids) assert.match(id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const bootstrapSource = read("src/app/bootstrap.js");
const applicationSource = read("src/app/application.js");
assert.match(bootstrapSource, /from "\.\/application\.js"/);
assert.equal(bootstrapSource.includes("legacy-runtime"), false);
assert.equal(applicationSource.includes("window.TarotData"), false);
assert.equal(applicationSource.includes("window.AstraRuntime"), false);
const styleIndex = read("src/styles/index.css");
const cssImports = [...styleIndex.matchAll(/@import url\("\.\/(.+?)"\);/g)].map((match) => `src/styles/${match[1]}`);
const originalCss = cssImports.filter((item) => !item.endsWith("accent-tokens.css") && !item.endsWith("phase-8.css") && !item.endsWith("platform-status.css")).map(read).join("");
assert.equal(crypto.createHash("sha256").update(originalCss).digest("hex"), "ccc3f69d84fc95a20ddd6a119f87cf48343d5dff508088a1b45f57ff7c8f62d3");
const sw = read("sw.js");
assert.match(sw, /^importScripts\("\.\/src\/generated\/precache-manifest\.js"\);/);
assert.equal(sw.includes("clients.claim"), false);
assert.equal(/addEventListener\("install"[\s\S]{0,600}skipWaiting/.test(sw), false);
assert.match(sw, /ASTRA_ACTIVATE_RELEASE/);
assert.match(sw, /cleanupOldReleases/);
assert.match(sw, /caches\.keys/);
assert.match(sw, /APP-SHELL-READY/);
assert.match(sw, /DEFAULT-DECK-READY/);
assert.match(sw, /SELECTED-DECKS-READY/);
const baseline = JSON.parse(read("automation/quality-baseline.json"));
assert.deepEqual(baseline.knownDebt, []);
const resolved = new Map(baseline.resolvedDebt.map((item) => [item.path, item]));
assert.equal(resolved.get("app.js").replacement, "src/app/application.js");
assert.equal(resolved.get("data.js").replacement, "src/knowledge/legacy/index.js");
assert.equal(resolved.get("src/app/legacy-runtime.js").replacement, "src/app/application.js");
console.log("MOD-006D module contract passed: direct ESM runtime, frozen public IDs, zero oversized debt, and no legacy bridge.");
