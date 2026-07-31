import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

const requiredFiles = [
  "docs/MODULE_MAP.md",
  "scripts/check_module_size.py",
  "scripts/check_import_boundaries.py",
  "tests/module_contract_test.mjs",
  "automation/validate.py",
  "automation/README.md",
  "automation/quality-baseline.json",
  "src/README.md",
];

for (const relativePath of requiredFiles) {
  assert.equal(exists(relativePath), true, `Missing MOD-001 deliverable: ${relativePath}`);
}

const dataSource = read("data.js");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(dataSource, sandbox, { filename: "data.js" });

const data = sandbox.window.TarotData;
assert.ok(data, "data.js must initialize window.TarotData");
assert.equal(data.deck.length, 78, "The existing deck must keep 78 cards");
assert.equal(data.categories.length, 6, "The existing question system must keep six categories");
assert.equal(
  data.categories.reduce((total, category) => total + category.questions.length, 0),
  42,
  "The existing question system must keep 42 preset questions",
);
assert.equal(data.spreads.length, 4, "The existing product must keep four spreads");

const kebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const cardIds = data.deck.map((card) => card.id);
const questionIds = data.categories.flatMap((category) =>
  category.questions.map((question) => question.id),
);
const spreadIds = data.spreads.map((spread) => spread.id);
const positionIds = data.spreads.flatMap((spread) =>
  spread.positions.map((position) => `${spread.id}:${position.id}`),
);

for (const id of [...cardIds, ...questionIds, ...spreadIds]) {
  assert.match(id, kebabCase, `Public business ID must remain kebab-case: ${id}`);
}
for (const compound of positionIds) {
  const [, id] = compound.split(":");
  assert.match(id, kebabCase, `Public position ID must remain kebab-case: ${compound}`);
}

assert.equal(new Set(cardIds).size, 78, "Card IDs must remain unique");
assert.equal(new Set(questionIds).size, 42, "Question IDs must remain unique");
assert.deepEqual([...spreadIds], ["single", "timeline", "cross", "celtic"]);
assert.deepEqual(
  Array.from(data.spreads, (spread) => spread.positions.length),
  [1, 3, 5, 10],
  "Spread sizes must remain 1/3/5/10",
);

const cross = data.spreads.find((spread) => spread.id === "cross");
assert.deepEqual(
  Array.from(cross.positions, (position) => position.id),
  ["core", "root", "trend", "influence", "action"],
);
const celtic = data.spreads.find((spread) => spread.id === "celtic");
assert.deepEqual(
  Array.from(celtic.positions, (position) => position.id),
  [
    "present",
    "challenge",
    "past",
    "future",
    "above",
    "below",
    "advice",
    "external",
    "hopes",
    "outcome",
  ],
);

const appSource = read("app.js");
assert.match(appSource, /astra-tarot-history-v1/, "Legacy history storage key changed");
assert.match(appSource, /astra-tarot-settings-v1/, "Legacy settings storage key changed");
assert.match(appSource, /const HISTORY_LIMIT = 20;/, "Legacy history limit baseline changed");
assert.match(appSource, /window\.TarotData/, "Legacy data bridge changed before MOD-003A");
assert.match(appSource, /Math\.random\(\)/, "Current random fallback must be recorded until MOD-003B");

const indexSource = read("index.html");
const dataScriptIndex = indexSource.indexOf('<script src="data.js"></script>');
const appScriptIndex = indexSource.indexOf('<script src="app.js"></script>');
assert.ok(dataScriptIndex >= 0, "index.html must still load data.js during MOD-001");
assert.ok(appScriptIndex > dataScriptIndex, "index.html must still load app.js after data.js");

assert.ok(
  indexSource.includes('<link rel="stylesheet" href="src/styles/index.css" />'),
  "index.html must load the MOD-002 stylesheet index",
);
assert.equal(indexSource.includes('href="styles.css"'), false, "Legacy styles.css must not be loaded");
assert.equal(exists("styles.css"), false, "Legacy styles.css must be removed after MOD-002");

const styleIndex = read("src/styles/index.css");
const cssImports = [...styleIndex.matchAll(/@import url\("\.\/(.+?)"\);/g)].map(
  (match) => `src/styles/${match[1]}`,
);
assert.deepEqual(cssImports, [
  "src/styles/foundation.css",
  "src/styles/setup.css",
  "src/styles/cards.css",
  "src/styles/insights.css",
  "src/styles/history.css",
  "src/styles/desktop.css",
  "src/styles/wide.css",
  "src/styles/responsive.css"
]);
const reconstructedCss = cssImports.map((relativePath) => read(relativePath)).join("");
assert.equal(
  crypto.createHash("sha256").update(reconstructedCss).digest("hex"),
  "087ab37e367357fbb1ea4532f0f0d9a81973e2dadd163a6d7c104cfbc6c466db",
  "Split CSS modules must reconstruct the exact original stylesheet bytes",
);
for (const relativePath of cssImports) {
  const lines = read(relativePath).split(/\r?\n/).length;
  assert.ok(lines <= 901, `${relativePath} exceeds the 900-line manual CSS limit`);
}

const serviceWorkerSource = read("sw.js");
assert.match(serviceWorkerSource, /cache\.addAll\(CORE_FILES\)/, "Current precache baseline changed");
assert.match(serviceWorkerSource, /astra-tarot-v6/, "MOD-002 must bump the cache version");
for (const relativePath of ["src/styles/index.css", ...cssImports]) {
  assert.ok(serviceWorkerSource.includes(`"./${relativePath}"`), `SW missing ${relativePath}`);
}
assert.equal(serviceWorkerSource.includes('"./styles.css"'), false, "SW still caches styles.css");
assert.match(serviceWorkerSource, /self\.skipWaiting\(\)/, "Current skipWaiting baseline changed");
assert.match(serviceWorkerSource, /self\.clients\.claim\(\)/, "Current clients.claim baseline changed");
assert.match(
  serviceWorkerSource,
  /cached \|\| caches\.match\("\.\/index\.html"\)/,
  "Current generic index fallback baseline changed",
);

const qualityBaseline = JSON.parse(read("automation/quality-baseline.json"));
assert.equal(qualityBaseline.schemaVersion, 1);
assert.deepEqual(
  qualityBaseline.knownDebt.map((item) => [item.path, item.baselineLines, item.expiresAfterTask]),
  [
    ["app.js", 1528, "MOD-006A"],
    ["data.js", 637, "MOD-006A"],
  ],
);
assert.deepEqual(
  qualityBaseline.resolvedDebt.map((item) => [item.path, item.resolvedByTask, item.replacement]),
  [["styles.css", "MOD-002", "src/styles/index.css"]],
);
assert.equal(qualityBaseline.policy.knownDebtGrowth, "FAIL");
assert.equal(qualityBaseline.policy.newUnregisteredOverLimitFile, "FAIL");

const moduleMap = read("docs/MODULE_MAP.md");
for (const requiredText of [
  "app.js",
  "styles.css",
  "data.js",
  "astra-tarot-history-v1",
  "Service Worker",
  "业务随机",
  "平台随机",
  "SUPPORTED",
]) {
  assert.ok(moduleMap.includes(requiredText), `MODULE_MAP.md is missing baseline section: ${requiredText}`);
}

console.log(
  "MOD-002 module contract passed: CSS cascade, public IDs, legacy storage, PWA resources, and debt baseline are preserved.",
);
