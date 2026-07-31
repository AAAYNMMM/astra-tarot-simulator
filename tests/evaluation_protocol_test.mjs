import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateJsonSchema } from "../src/engine/validation/schema-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const schema = readJson("src/knowledge/schemas/evaluation-case.schema.json");
const development = readJson("tests/fixtures/evaluation/development-cases.json");
assert.equal(development.length, 6);
for (const item of development) assert.deepEqual(validateJsonSchema(item, schema), []);
const blind = readJson(".qa/evaluation/blind-manifest.json");
assert.equal(blind.repositoryContainsCaseContent, false);
if (blind.status === "pending") {
  assert.equal(blind.caseCount, 0);
  assert.equal(blind.contentHash, null);
} else {
  assert.equal(blind.status, "completed");
  assert.ok(blind.caseCount > 0);
  assert.match(blind.contentHash, /^[a-f0-9]{64}$/);
}
const forbidden = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (/blind-(?:cases|content|dataset)/i.test(entry.name)) forbidden.push(absolute);
  }
}
walk(root);
assert.deepEqual(forbidden, []);
console.log("EV-000A evaluation schema, development set, rubric, and blind custody contract passed.");
