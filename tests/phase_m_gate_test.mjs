import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TarotData } from "../src/knowledge/legacy/index.js";
import { historyRecordView } from "../src/ui/renderers/history.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));
for (const removed of ["app.js", "data.js", "styles.css", "src/app/legacy-runtime.js"]) {
  assert.equal(exists(removed), false, `${removed} was reintroduced`);
}
assert.equal(TarotData.deck.length, 78);
assert.equal(TarotData.categories.length, 6);
assert.ok(TarotData.categories.reduce((sum, item) => sum + item.questions.length, 0) >= 42);
assert.deepEqual(TarotData.spreads.map((item) => item.positions.length), [1, 3, 5, 10]);
const application = read("src/app/application.js");
assert.match(application, /const \{ deck, categories, spreads \} = TarotData;/);
assert.equal(application.includes("window.TarotData"), false);
assert.equal(application.includes("window.AstraRuntime"), false);
const bootstrap = read("src/app/bootstrap.js");
assert.match(bootstrap, /dataset\.astraBoot = result\.started \? "ready" : "skipped"/);
const csp = read("src/server/security.py");
assert.match(csp, /script-src 'self'/);
assert.match(csp, /style-src-attr 'none'/);
assert.equal(csp.includes("unsafe-inline"), false);
assert.equal(csp.includes("unsafe-eval"), false);
const payload = '<img src=x onerror="globalThis.injected=true">';
const view = historyRecordView({
  id: payload,
  question: payload,
  categoryName: payload,
  spreadName: payload,
  headline: payload,
  categoryAccent: "red;background:url(javascript:alert(1))",
  cards: [{ position: payload, name: payload, orientation: payload }],
}, (value) => value);
assert.equal(view.question, payload);
assert.equal(view.headline, payload);
assert.notEqual(view.accent, "red;background:url(javascript:alert(1))");
const historyRenderer = read("src/ui/renderers/history.js");
assert.match(historyRenderer, /createElement/);
assert.equal(historyRenderer.includes("innerHTML"), false);
const sw = read("sw.js");
assert.match(sw, /^importScripts\("\.\/src\/generated\/precache-manifest\.js"\);/);
for (const forbidden of ["skipWaiting", "clients.claim", "caches.keys", "cached || caches.match(\"./index.html\")"]) {
  assert.equal(sw.includes(forbidden), false, `SW contains forbidden fallback/update behavior: ${forbidden}`);
}
for (const state of ["APP-SHELL-READY", "DEFAULT-DECK-READY", "SELECTED-DECKS-READY"]) {
  assert.ok(sw.includes(state), `SW missing ${state}`);
}
const packageMetadata = JSON.parse(read("package.json"));
assert.equal("dependencies" in packageMetadata, false);
assert.equal("devDependencies" in packageMetadata, false);
assert.equal(packageMetadata.scripts["test:full"], "python automation/validate.py --scope full");
console.log("MOD-006D Phase M gate passed: runtime, CSP, safe history DOM, PWA classes, generated artifacts, and public invariants are closed.");
