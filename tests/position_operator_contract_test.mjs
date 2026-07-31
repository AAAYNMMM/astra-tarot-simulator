import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SPREADS } from "../src/knowledge/spreads/definitions.js";
import { POSITION_OPERATOR_GROUPS, getPositionOperator } from "../src/knowledge/spreads/operators/index.js";
import { validatePositionOperator } from "../src/engine/validation/position-operator-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "src/knowledge/schemas/position-operator.schema.json"), "utf8"));
let count = 0;
for (const spread of SPREADS) {
  const operators = POSITION_OPERATOR_GROUPS[spread.id];
  assert.equal(operators.length, spread.positions.length);
  assert.deepEqual(operators.map((item) => item.positionId), spread.positions.map((item) => item.id));
  for (const operator of operators) {
    assert.deepEqual(validatePositionOperator(operator, schema), [], `${spread.id}/${operator.positionId}`);
    assert.equal(getPositionOperator(spread.id, operator.positionId), operator);
    count += 1;
  }
}
assert.equal(count, 19);
const broken = { ...getPositionOperator("cross", "action"), selectableFacets: ["boundary"] };
assert.ok(validatePositionOperator(broken, schema).some((item) => item.code === "position.required_action_without_action_facet"));
console.log("PO-001 complete 19-position operator contract passed.");
