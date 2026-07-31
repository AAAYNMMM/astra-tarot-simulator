import assert from "node:assert/strict";
import { SEMANTIC_TAGS, TAG_ALIASES, SOURCE_REGISTRY, TAXONOMY, INTERPRETATION_POLICY } from "../src/knowledge/vocabularies/index.js";
import { validateCardVocabulary } from "../src/engine/validation/vocabulary-validator.js";

assert.equal(new Set(SEMANTIC_TAGS.map((item) => item.id)).size, SEMANTIC_TAGS.length);
assert.equal(new Set(SOURCE_REGISTRY.map((item) => item.id)).size, SOURCE_REGISTRY.length);
assert.deepEqual(TAXONOMY.domains, ["relationship", "career", "finance", "growth", "decision", "daily"]);
assert.equal(TAXONOMY.dimensions.length, 11);
assert.equal(TAXONOMY.reversalModes.length, 10);
assert.equal(INTERPRETATION_POLICY.runtimeMode, "deterministic-rules-only");
assert.equal(Object.hasOwn(TAG_ALIASES, "love"), true);

const synthetic = {
  themes: ["love"],
  facets: {},
  traditions: { symbols: [], cautions: [] },
  boundaries: {},
  provenance: { tradition: "unknown-source", sourceRefs: ["missing-source"] },
  reversal: { supportedModes: ["imaginary-mode"] },
  domains: { career: { weightAdjustments: { imaginary: 1 } } },
  relations: { supportsTags: ["direction"], conflictsTags: ["direction"], transformsTags: [], stageTags: [], roleTags: [] },
};
const result = validateCardVocabulary(synthetic);
const codes = new Set(result.errors.map((item) => item.code));
for (const code of ["vocabulary.alias_not_canonical", "source.unknown_reference", "source.unknown_tradition", "reversal.unknown_mode", "dimension.unknown", "relation.support_conflict_overlap"]) {
  assert.ok(codes.has(code), `missing ${code}`);
}
console.log("TQ-002 vocabulary, source registry, alias, and cross-vocabulary contract passed.");
