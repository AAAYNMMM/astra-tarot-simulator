import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { validateQuestionProfile } from "../src/engine/validation/question-profile-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "src/knowledge/schemas/question-profile.schema.json"), "utf8"));
assert.equal(QUESTION_PROFILE_IDS.length, 42);
for (const classification of QUESTION_CLASSIFICATIONS) {
  const profile = await loadQuestionProfile(classification.id);
  assert.equal(profile.id, classification.id);
  assert.equal(profile.text, classification.text);
  assert.equal(profile.domain, classification.domain);
  assert.deepEqual(validateQuestionProfile(profile, schema), [], classification.id);
}
const sample = structuredClone(await loadQuestionProfile("career-change"));
sample.spreadProfiles.cross.positionResponsibilities.core = ["not-declared"];
const errors = validateQuestionProfile(sample, schema);
assert.ok(errors.some((item) => item.code === "question.position_dimension_not_declared"));
console.log("QP-002 complete QuestionProfile schema and 42 independent modules passed.");
