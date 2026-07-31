import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startApplication } from "../src/app/application.js";
import { bootstrapBrowser } from "../src/app/bootstrap.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
assert.deepEqual(startApplication({}), { started: false, reason: "browser-globals-unavailable" });
assert.deepEqual(await bootstrapBrowser({}), { started: false, reason: "browser-globals-unavailable" });
for (const removed of ["app.js", "data.js", "src/app/legacy-runtime.js"]) {
  assert.equal(fs.existsSync(path.join(root, removed)), false, `${removed} must be removed`);
}
const applicationSource = fs.readFileSync(path.join(root, "src/app/application.js"), "utf8");
const bootstrapSource = fs.readFileSync(path.join(root, "src/app/bootstrap.js"), "utf8");
assert.equal(applicationSource.includes("window.TarotData"), false);
assert.equal(applicationSource.includes("window.AstraRuntime"), false);
assert.equal(bootstrapSource.includes("legacy-runtime"), false);
assert.match(bootstrapSource, /from "\.\/application\.js"/);
assert.ok(applicationSource.split(/\r?\n/).length <= 601, "application.js exceeds manual JavaScript limit");
console.log("MOD-006A application contract passed: direct ESM startup has no legacy globals or root monoliths.");
