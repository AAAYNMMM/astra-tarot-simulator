import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUESTION_PROFILE_IDS, loadQuestionProfile, SPREADS, cards, cardsById } from "./phase_6_test_support.mjs";
import { getLegacyPositionOperator as getPositionOperator } from "../src/knowledge/spreads/operators/index.js";
import { createObservation } from "../src/engine/observations/observation-engine.js";
import { createStructuralRelationCandidates } from "../src/engine/relations/structural-relation-candidates.js";
import { createRelationGraph } from "../src/engine/relations/relation-engine.js";
import { createValidatedClaim } from "../src/engine/claims/claim-engine.js";
import { createDeterministicStreams } from "../src/core/random/deterministic-streams.js";
import { renderReadingText } from "../src/engine/text/template-renderer.js";
import { validateRenderedReading } from "../src/engine/text/text-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
let batches = 0;
let claims = 0;
let paragraphs = 0;
const conclusionCoverage = new Set();

for (let questionIndex = 0; questionIndex < QUESTION_PROFILE_IDS.length; questionIndex += 1) {
  const question = await loadQuestionProfile(QUESTION_PROFILE_IDS[questionIndex]);
  for (const spread of SPREADS) {
    for (const orientation of ["upright", "reversed"]) {
      const observations = spread.positions.map((position, index) => {
        const card = cards[(questionIndex + index + batches) % cards.length];
        return createObservation({
          card,
          question,
          operator: getPositionOperator(spread.id, position.id),
          orientation,
          reversalMode: orientation === "reversed" ? card.reversal.supportedModes[0] : null,
        });
      });
      const structuralBatch = createStructuralRelationCandidates({ spreadId: spread.id, observations, spreadDefinitionVersion: "1.0.0" });
      const relationBatch = createRelationGraph({ structuralBatch, observations, question, cards: cardsById });
      const pipeline = createValidatedClaim({ relationBatch, observations, question });
      const repeated = createValidatedClaim({
        relationBatch,
        observations: [...observations].reverse(),
        question,
      });
      assert.deepEqual(pipeline, repeated, `${question.id}/${spread.id}/${orientation}: deterministic Claim pipeline`);
      assert.ok(question.allowedConclusionTypes.includes(pipeline.claim.conclusionType));
      assert.equal(pipeline.claim.validation.status, "valid");
      const rendered = renderReadingText({
        claim: pipeline.claim,
        candidateBatch: pipeline.candidateBatch,
        observations,
        renderingStream: createDeterministicStreams(`${question.id}:${spread.id}:${orientation}`).streams.rendering,
      });
      assert.deepEqual(validateRenderedReading({
        rendered,
        claim: pipeline.claim,
        candidateBatch: pipeline.candidateBatch,
      }), []);
      conclusionCoverage.add(pipeline.claim.conclusionCategory);
      paragraphs += rendered.sections.flatMap((item) => item.paragraphs).length;
      claims += 1;
      batches += 1;
    }
  }
}

assert.equal(QUESTION_PROFILE_IDS.length, 90);
assert.equal(batches, 90 * 4 * 2);
assert.equal(claims, batches);
assert.ok(paragraphs > batches);
assert.ok(conclusionCoverage.size >= 2);
const progress = fs.readFileSync(path.join(root, "docs/PROGRESS.md"), "utf8");
assert.match(progress, /Phase 6状态 \| `PARENT-DONE`/);
assert.equal(fs.existsSync(path.join(root, "automation/phase_6_complete.py")), false);
console.log(`Phase 6 terminal gate passed: ${batches} batches, ${claims} validated Claims, ${paragraphs} paragraphs.`);
