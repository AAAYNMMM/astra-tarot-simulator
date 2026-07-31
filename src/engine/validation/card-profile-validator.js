import { validateJsonSchema } from "./schema-validator.js";

export const CARD_FACET_ROLES = Object.freeze([
  "state", "cause", "motivation", "obstacle", "opportunity", "resource",
  "relationship", "action", "boundary", "trend", "outcome", "reflection",
]);
export const CARD_DOMAIN_IDS = Object.freeze(["relationship", "career", "finance", "growth", "decision", "daily"]);
export const CARD_DIMENSION_IDS = Object.freeze([
  "activation", "stability", "clarity", "agency", "openness", "reciprocity",
  "materiality", "emotionality", "risk", "transition", "speed",
]);

const RANKS = Object.freeze([
  "ace", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "page", "knight", "queen", "king",
]);
const CARD_ID = new RegExp(`^(?:major-(?:0|[1-9]|1[0-9]|2[01])|(?:wands|cups|swords|pentacles)-(?:${RANKS.join("|")}))$`);
const SEMANTIC_ID = new RegExp(`^(?:${CARD_FACET_ROLES.join("|")})\\.[a-z0-9]+(?:-[a-z0-9]+)*$`);

function issue(code, path, message) {
  return Object.freeze({ code, path, keyword: "cardContract", message });
}

function objectKeys(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value).sort() : [];
}

function sameMembers(left, right) {
  const a = [...new Set(left)].sort();
  const b = [...new Set(right)].sort();
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function collectSemanticUnits(profile) {
  const units = [];
  for (const role of CARD_FACET_ROLES) {
    for (const [index, unit] of (profile?.facets?.[role] || []).entries()) {
      units.push({ role, unit, path: `$.facets.${role}[${index}]` });
    }
  }
  for (const domain of CARD_DOMAIN_IDS) {
    for (const [index, unit] of (profile?.domains?.[domain]?.overrides || []).entries()) {
      units.push({ role: null, unit, path: `$.domains.${domain}.overrides[${index}]` });
    }
  }
  return units;
}

function referenceEntries(profile) {
  const entries = [];
  for (const [mode, refs] of Object.entries(profile?.reversal?.modeFacetRefs || {})) {
    for (const [index, value] of (Array.isArray(refs) ? refs : []).entries()) {
      entries.push({ value, path: `$.reversal.modeFacetRefs.${mode}[${index}]` });
    }
  }
  for (const domain of CARD_DOMAIN_IDS) {
    for (const [index, value] of (profile?.domains?.[domain]?.facetRefs || []).entries()) {
      entries.push({ value, path: `$.domains.${domain}.facetRefs[${index}]` });
    }
  }
  for (const key of ["conciseUprightRefs", "conciseReversedRefs", "actionPhraseRefs", "cautionPhraseRefs"]) {
    for (const [index, value] of (profile?.language?.[key] || []).entries()) {
      entries.push({ value, path: `$.language.${key}[${index}]` });
    }
  }
  return entries;
}

export function validateStableCardReference(value) {
  if (typeof value !== "string") return false;
  const separator = value.indexOf("#");
  if (separator <= 0 || separator !== value.lastIndexOf("#")) return false;
  return CARD_ID.test(value.slice(0, separator)) && SEMANTIC_ID.test(value.slice(separator + 1));
}

export function validateCardSemanticProfile(profile, schema) {
  const errors = [...validateJsonSchema(profile, schema)];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return errors;

  if (profile.arcana === "major") {
    if (profile.suit !== undefined || profile.rank !== undefined) {
      errors.push(issue("card.major_forbids_suit_rank", "$", "Major Arcana profiles cannot declare suit or rank."));
    }
    if (Number.isInteger(profile.number) && profile.id !== `major-${profile.number}`) {
      errors.push(issue("card.id_number_mismatch", "$.id", "Major Arcana id must match number."));
    }
  }
  if (profile.arcana === "minor") {
    if (profile.number !== undefined) errors.push(issue("card.minor_forbids_number", "$.number", "Minor Arcana profiles cannot declare number."));
    if (typeof profile.suit === "string" && typeof profile.rank === "string" && profile.id !== `${profile.suit}-${profile.rank}`) {
      errors.push(issue("card.id_suit_rank_mismatch", "$.id", "Minor Arcana id must match suit and rank."));
    }
  }

  const semanticIds = new Map();
  for (const entry of collectSemanticUnits(profile)) {
    const id = entry.unit?.id;
    if (typeof id !== "string") continue;
    if (semanticIds.has(id)) {
      errors.push(issue("card.semantic_id_duplicate", `${entry.path}.id`, `Semantic id ${id} duplicates ${semanticIds.get(id)}.`));
    } else {
      semanticIds.set(id, `${entry.path}.id`);
    }
    if (entry.role && Array.isArray(entry.unit?.allowedRoles) && !entry.unit.allowedRoles.includes(entry.role)) {
      errors.push(issue("card.semantic_role_mismatch", `${entry.path}.allowedRoles`, `Semantic unit in ${entry.role} must allow that role.`));
    }
  }

  for (const entry of referenceEntries(profile)) {
    if (typeof entry.value === "string" && !semanticIds.has(entry.value)) {
      errors.push(issue("card.reference_unresolved", entry.path, `Local semantic reference ${entry.value} does not resolve.`));
    }
  }

  const supportedModes = Array.isArray(profile?.reversal?.supportedModes) ? profile.reversal.supportedModes : [];
  const weightKeys = objectKeys(profile?.reversal?.defaultWeights);
  const refKeys = objectKeys(profile?.reversal?.modeFacetRefs);
  if (!sameMembers(supportedModes, weightKeys)) {
    errors.push(issue("card.reversal_weight_keys", "$.reversal.defaultWeights", "defaultWeights keys must exactly match supportedModes."));
  }
  if (!sameMembers(supportedModes, refKeys)) {
    errors.push(issue("card.reversal_reference_keys", "$.reversal.modeFacetRefs", "modeFacetRefs keys must exactly match supportedModes."));
  }

  for (const domain of CARD_DOMAIN_IDS) {
    for (const key of objectKeys(profile?.domains?.[domain]?.weightAdjustments)) {
      if (!CARD_DIMENSION_IDS.includes(key)) {
        errors.push(issue("card.dimension_key_unknown", `$.domains.${domain}.weightAdjustments.${key}`, `Unknown dimension ${key}.`));
      }
    }
  }

  return errors.sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code));
}

export function assertValidCardSemanticProfile(profile, schema) {
  const errors = validateCardSemanticProfile(profile, schema);
  if (errors.length) {
    const failure = new Error(`CardSemanticProfile validation failed with ${errors.length} error(s).`);
    failure.name = "CardSemanticProfileValidationError";
    failure.errors = errors;
    throw failure;
  }
  return profile;
}
