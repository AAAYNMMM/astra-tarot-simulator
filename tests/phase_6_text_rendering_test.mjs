import assert from "node:assert/strict";
import { createValidatedClaim } from "../src/engine/claims/claim-engine.js";
import { createDeterministicStreams } from "../src/core/random/deterministic-streams.js";
import { renderReadingText } from "../src/engine/text/template-renderer.js";
import { validateRenderedReading } from "../src/engine/text/text-validator.js";
import { LAYOUTS } from "../src/engine/text/reading-layout.js";
import { buildPhase6Fixture } from "./phase_6_test_support.mjs";

for (const spreadId of ["single", "timeline", "cross", "celtic"]) {
  const fixture = await buildPhase6Fixture({ spreadId, orientation: "reversed", offset: 21 });
  const pipeline = createValidatedClaim(fixture);
  const renderA = renderReadingText({
    claim: pipeline.claim,
    candidateBatch: pipeline.candidateBatch,
    observations: fixture.observations,
    renderingStream: createDeterministicStreams(`render-${spreadId}`).streams.rendering,
  });
  const renderB = renderReadingText({
    claim: pipeline.claim,
    candidateBatch: pipeline.candidateBatch,
    observations: fixture.observations,
    renderingStream: createDeterministicStreams(`render-${spreadId}`).streams.rendering,
  });
  assert.deepEqual(renderA, renderB);
  assert.equal(renderA.sections.length, LAYOUTS[spreadId].length + 1);
  assert.deepEqual(validateRenderedReading({
    rendered: renderA,
    claim: pipeline.claim,
    candidateBatch: pipeline.candidateBatch,
  }), []);
  assert.ok(Object.isFrozen(renderA));
}

const fixture = await buildPhase6Fixture({ spreadId: "timeline", offset: 3 });
const pipeline = createValidatedClaim(fixture);
const rendered = renderReadingText({
  claim: pipeline.claim,
  candidateBatch: pipeline.candidateBatch,
  observations: fixture.observations,
});
const firstParagraph = rendered.sections.flatMap((item) => item.paragraphs)[0];
const unsafe = {
  ...rendered,
  sections: rendered.sections.map((section, index) => index === 0 ? {
    ...section,
    paragraphs: section.paragraphs.map((item, paragraphIndex) => paragraphIndex === 0
      ? { ...item, text: `${item.text}这件事一定会成功。` }
      : item),
  } : section),
  plainText: rendered.plainText,
};
assert.ok(validateRenderedReading({
  rendered: unsafe,
  claim: pipeline.claim,
  candidateBatch: pipeline.candidateBatch,
}).some((item) => item.includes("Forbidden certainty")));
const lostCitation = {
  ...rendered,
  sections: rendered.sections.map((section) => ({
    ...section,
    paragraphs: section.paragraphs.map((item) => ({ ...item, candidateIds: [], evidenceRefs: [] })),
  })),
};
assert.ok(validateRenderedReading({
  rendered: lostCitation,
  claim: pipeline.claim,
  candidateBatch: pipeline.candidateBatch,
}).some((item) => item.includes("citation lost")));
assert.ok(firstParagraph.candidateIds.length > 0);
console.log("TX-001 templates, TX-002 spread hierarchy, and TX-003 post-render validation passed.");
