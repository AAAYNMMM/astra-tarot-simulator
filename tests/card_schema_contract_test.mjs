import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CARD_SCHEMA_VERSION } from "../src/config/version.js";
import {
  validateCardSemanticProfile,
  validateStableCardReference,
} from "../src/engine/validation/card-profile-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const schemaPath = "src/knowledge/schemas/card-semantic-profile.schema.json";
const fixtureRoot = "tests/fixtures/card-schema";
const schema = readJson(schemaPath);

assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.equal(schema.$id.endsWith(`/${CARD_SCHEMA_VERSION}`), true);
assert.equal(schema.additionalProperties, false);
assert.equal(schema.description.includes("TQ-002"), true);

for (const file of ["valid-major-7.json", "valid-minor-cups-two.json"]) {
  const errors = validateCardSemanticProfile(readJson(`${fixtureRoot}/${file}`), schema);
  assert.deepEqual(errors, [], `${file}: ${JSON.stringify(errors)}`);
}

const expectations = readJson(`${fixtureRoot}/invalid/expected-errors.json`);
for (const [file, expectedCode] of Object.entries(expectations)) {
  const errors = validateCardSemanticProfile(readJson(`${fixtureRoot}/invalid/${file}`), schema);
  assert.ok(errors.some((item) => item.code === expectedCode), `${file} did not produce ${expectedCode}: ${JSON.stringify(errors)}`);
}

assert.equal(validateStableCardReference("major-7#action.primary"), true);
assert.equal(validateStableCardReference("cups-two#relationship.secondary"), true);
assert.equal(validateStableCardReference("major_7#action.primary"), false);
assert.equal(validateStableCardReference("major-7/action.primary"), false);

const cli = spawnSync(process.execPath, ["scripts/validate_card_profiles.mjs", `${fixtureRoot}/valid-major-7.json`], {
  cwd: root,
  encoding: "utf8",
});
assert.equal(cli.status, 0, cli.stderr);
const cliPayload = JSON.parse(cli.stdout);
assert.deepEqual(cliPayload.summary, { PASS: 1, FAIL: 0 });

const invalidCli = spawnSync(process.execPath, ["scripts/validate_card_profiles.mjs", `${fixtureRoot}/invalid/unresolved-reference.json`], {
  cwd: root,
  encoding: "utf8",
});
assert.equal(invalidCli.status, 1);
assert.equal(JSON.parse(invalidCli.stdout).summary.FAIL, 1);

console.log(`TQ-001 card schema contract passed: ${Object.keys(expectations).length} invalid fixtures rejected with stable error codes.`);
