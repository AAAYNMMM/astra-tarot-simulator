import assert from "node:assert/strict";
import cupsTwo from "../src/knowledge/cards/cups-two.js";
import cupsEight from "../src/knowledge/cards/cups-eight.js";
import wandsPage from "../src/knowledge/cards/wands-page.js";
import wandsKing from "../src/knowledge/cards/wands-king.js";
import { createAuxiliaryRelationSignals, auxiliaryStrengthAdjustment } from "../src/engine/relations/auxiliary-relation-signals.js";

const observation = { orientation: "upright" };
const numberSignals = createAuxiliaryRelationSignals({
  sourceCard: cupsTwo,
  targetCard: cupsEight,
  sourceObservation: observation,
  targetObservation: observation,
});
assert.equal(numberSignals[0].kind, "element");
assert.equal(numberSignals[0].relation, "resonates");
assert.ok(numberSignals.some((item) => item.kind === "number"));
const courtSignals = createAuxiliaryRelationSignals({
  sourceCard: wandsPage,
  targetCard: wandsKing,
  sourceObservation: observation,
  targetObservation: { orientation: "reversed" },
});
assert.ok(courtSignals.some((item) => item.kind === "court" && item.relation === "matures"));
assert.ok(courtSignals.some((item) => item.kind === "orientation" && item.relation === "mixed"));
assert.ok(auxiliaryStrengthAdjustment(courtSignals) >= -0.04);
assert.ok(Object.isFrozen(courtSignals));
console.log("MR-004 element, number, court, stage, and orientation auxiliary signals passed.");
