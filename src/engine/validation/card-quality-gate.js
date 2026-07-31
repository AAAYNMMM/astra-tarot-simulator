import { validateCardSemanticProfile } from "./card-profile-validator.js";
import { validateCardVocabulary } from "./vocabulary-validator.js";

const REQUIRED_DOMAIN_ROLES = Object.freeze(["state", "action"]);
const RISK_ROLES = Object.freeze(["obstacle", "boundary"]);

function points(ok, value) {
  return ok ? value : 0;
}

function semanticCount(profile) {
  return Object.values(profile.facets || {}).reduce((sum, items) => sum + items.length, 0);
}

function uniqueTexts(profile) {
  const texts = Object.values(profile.facets || {}).flat().map((item) => item.text.trim());
  return new Set(texts).size === texts.length;
}

function domainHasRoles(definition) {
  const roles = new Set((definition.facetRefs || []).map((item) => item.split(".", 1)[0]));
  return REQUIRED_DOMAIN_ROLES.every((role) => roles.has(role)) && RISK_ROLES.some((role) => roles.has(role));
}

export function scoreCardProfile(profile, schema) {
  const schemaErrors = validateCardSemanticProfile(profile, schema);
  const vocabulary = validateCardVocabulary(profile);
  const totalSemantics = semanticCount(profile);
  const minimumSemantics = profile.arcana === "major" ? 32 : 26;
  const symbolMinimum = profile.arcana === "major" ? 5 : 3;
  const sections = {
    structuralIntegrity: points(schemaErrors.length === 0, 15),
    vocabularyAndSources: points(vocabulary.valid, 10),
    semanticCoverage: points(totalSemantics >= minimumSemantics && Object.values(profile.facets).every((items) => items.length >= 2), 18),
    traditionAndIdentity: points(profile.traditions.symbols.length >= symbolMinimum && profile.identity.coreArchetype.length >= 12, 12),
    reversalQuality: points(profile.reversal.supportedModes.length >= 3 && profile.reversal.supportedModes.length <= 6, 12),
    domainCompatibility: points(Object.values(profile.domains).every(domainHasRoles), 12),
    relationAndDimensions: points(Object.values(profile.dimensions).every(Number.isFinite) && Object.values(profile.relations).some((items) => items.length >= 3), 9),
    boundariesAndProvenance: points(profile.provenance.sourceRefs.length >= 3 && Object.values(profile.boundaries).every((items) => items.length >= 1), 8),
    languageAndDistinctiveness: points(uniqueTexts(profile) && profile.language.keywordsUpright.length >= 3 && profile.language.keywordsReversed.length >= 3, 4),
  };
  const score = Object.values(sections).reduce((sum, value) => sum + value, 0);
  return Object.freeze({
    cardId: profile.id,
    score,
    admitted: score >= 90 && schemaErrors.length === 0 && vocabulary.valid,
    semanticUnits: totalSemantics,
    sections: Object.freeze(sections),
    schemaErrors: Object.freeze(schemaErrors),
    vocabularyErrors: vocabulary.errors,
    scope: "development-quality-gate-not-final-blind-review",
  });
}
