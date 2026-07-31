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
  "package.json", "src/README.md", "src/app/bootstrap.js", "src/app/application.js",
  "src/app/runtime-services.js",
  "src/ui/components/dialogs.js", "src/config/decks.js", "src/config/accent-tokens.js",
  "src/config/legacy-storage.js", "src/core/html.js", "src/core/random/business-random.js",
  "src/platform/assets.js", "src/platform/entropy.js", "src/platform/lifecycle-client.js",
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
assert.equal(data.categories.reduce((sum, category) => sum + category.questions.length, 0), 42);
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
const originalCss = cssImports.filter((item) => !item.endsWith("accent-tokens.css")).map(read).join("");
assert.equal(crypto.createHash("sha256").update(originalCss).digest("hex"), "087ab37e367357fbb1ea4532f0f0d9a81973e2dadd163a6d7c104cfbc6c466db");
const sw = read("sw.js");
assert.match(sw, /astra-tarot-v12/);
for (const runtimePath of [
  "src/app/bootstrap.js", "src/app/application.js", "src/app/runtime-services.js",
  "src/ui/components/dialogs.js",
  "src/knowledge/legacy/index.js", "src/engine/legacy/card-reading.js",
  "src/engine/legacy/synthesis.js",
]) assert.ok(sw.includes(`"./${runtimePath}"`), `SW missing ${runtimePath}`);
for (const removed of ["./app.js", "./data.js", "./src/app/legacy-runtime.js"]) assert.equal(sw.includes(`"${removed}"`), false);
const baseline = JSON.parse(read("automation/quality-baseline.json"));
assert.deepEqual(baseline.knownDebt, []);
const resolved = new Map(baseline.resolvedDebt.map((item) => [item.path, item]));
assert.equal(resolved.get("app.js").replacement, "src/app/application.js");
assert.equal(resolved.get("data.js").replacement, "src/knowledge/legacy/index.js");
assert.equal(resolved.get("src/app/legacy-runtime.js").replacement, "src/app/application.js");
console.log("MOD-006A module contract passed: direct ESM runtime, frozen public IDs, zero oversized debt, and no legacy bridge.");
