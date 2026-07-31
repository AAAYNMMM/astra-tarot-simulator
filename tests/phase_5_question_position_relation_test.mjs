import assert from "node:assert/strict";
import question from "../src/knowledge/questions/profiles/daily-action.js";
import { analyzeQuestionPositionRelation } from "../src/engine/relations/question-position-relation.js";

const candidate = {
  structure: {
    graphId: "spread-graph-cross",
    sourcePositionId: "core",
    targetPositionId: "action",
  },
};
const sourceObservation = {
  spreadId: "cross",
  positionId: "core",
  matchedDimensions: ["current-state", "main-obstacle"],
  positionRole: { evidencePriority: "core" },
};
const targetObservation = {
  spreadId: "cross",
  positionId: "action",
  matchedDimensions: ["boundary"],
  positionRole: { evidencePriority: "core" },
};
const fit = analyzeQuestionPositionRelation({ candidate, sourceObservation, targetObservation, question });
assert.deepEqual(fit.source.responsibilities, ["current-state", "main-obstacle"]);
assert.deepEqual(fit.target.responsibilities, ["boundary"]);
assert.deepEqual(fit.introducedDimensions, ["boundary"]);
assert.deepEqual(fit.sharedResponsibilities, []);
assert.equal(fit.priorityDimension, "boundary");
assert.equal(fit.coverage.source, 1);
assert.equal(fit.coverage.target, 1);
assert.equal(fit.compatible, true);
assert.ok(Object.isFrozen(fit));
assert.throws(() => analyzeQuestionPositionRelation({
  candidate,
  sourceObservation: { ...sourceObservation, positionId: "root" },
  targetObservation,
  question,
}), /Source observation/);
console.log("MR-002 question dimensions and position responsibilities passed.");
