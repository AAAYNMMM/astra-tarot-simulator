import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SPREADS } from "../src/knowledge/spreads/definitions.js";
import { CARD_PROFILE_IDS, loadCardProfile } from "../src/knowledge/cards/registry.js";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { getPositionOperator } from "../src/knowledge/spreads/operators/index.js";
import { getSpreadGraph } from "../src/engine/observations/spread-graphs.js";
import { createObservation } from "../src/engine/observations/observation-engine.js";
import { createStructuralRelationCandidates } from "../src/engine/relations/structural-relation-candidates.js";
import { createRelationGraph, validateRelationGraph } from "../src/engine/relations/relation-engine.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cards = await Promise.all(CARD_PROFILE_IDS.map(loadCardProfile));
const cardsById = new Map(cards.map((card) => [card.id, card]));
const typeCoverage = new Set();
let totalRelations = 0;
let totalBatches = 0;

function observationsFor(question, spread, orientation, offset) {
  return spread.positions.map((position, index) => {
    const card = cards[(offset + index) % cards.length];
    return createObservation({
      card,
      question,
      operator: getPositionOperator(spread.id, position.id),
      orientation,
      reversalMode: orientation === "reversed" ? card.reversal.supportedModes[0] : null,
    });
  });
}

for (let questionIndex = 0; questionIndex < QUESTION_PROFILE_IDS.length; questionIndex += 1) {
  const question = await loadQuestionProfile(QUESTION_PROFILE_IDS[questionIndex]);
  for (const spread of SPREADS) {
    const graph = getSpreadGraph(spread.id);
    for (const orientation of ["upright", "reversed"]) {
      const observations = observationsFor(question, spread, orientation, questionIndex + totalBatches);
      const structuralBatch = createStructuralRelationCandidates({ spreadId: spread.id, observations });
      const relationBatch = createRelationGraph({ structuralBatch, observations, question, cards: cardsById });
      const repeated = createRelationGraph({
        structuralBatch: createStructuralRelationCandidates({ spreadId: spread.id, observations: [...observations].reverse() }),
        observations: [...observations].reverse(),
        question,
        cards: [...cards].reverse(),
      });
      assert.deepEqual(relationBatch, repeated, `${question.id}/${spread.id}/${orientation}: deterministic output`);
      assert.deepEqual(validateRelationGraph(relationBatch, structuralBatch), [], `${question.id}/${spread.id}/${orientation}`);
      assert.equal(relationBatch.relations.length, graph.edges.length);
      assert.deepEqual(
        relationBatch.relations.map((relation) => relation.structure.edgeId),
        graph.edges.map((edge) => edge.id),
      );
      assert.ok(relationBatch.relations.length <= spread.positions.length * Math.max(0, spread.positions.length - 1));
      for (const relation of relationBatch.relations) {
        typeCoverage.add(relation.type);
        assert.ok(relation.candidateTypes.includes(relation.type));
        assert.ok(Object.isFrozen(relation));
        assert.ok(Object.isFrozen(relation.questionFit));
        assert.ok(Object.isFrozen(relation.auxiliarySignals));
      }
      totalRelations += relationBatch.relations.length;
      totalBatches += 1;
    }
  }
}

assert.equal(QUESTION_PROFILE_IDS.length, 90);
assert.equal(totalBatches, 90 * 4 * 2);
assert.equal(totalRelations, 90 * 21 * 2);
assert.ok(typeCoverage.size >= 5, `Expected broad Relation type coverage, got ${[...typeCoverage].join(", ")}`);
const progress = fs.readFileSync(path.join(root, "docs/PROGRESS.md"), "utf8");
assert.match(progress, /Phase 5状态 \| `PARENT-DONE`/);
assert.match(progress, /唯一下一任务 \| `CL-001`/);
assert.equal(fs.existsSync(path.join(root, "automation/phase_5_complete.py")), false);
console.log(`MR-005 Phase 5 terminal gate passed: ${totalBatches} batches, ${totalRelations} Relations, ${typeCoverage.size} final types.`);
