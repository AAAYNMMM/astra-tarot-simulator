import { SEMANTIC_TAGS } from "../../knowledge/vocabularies/tags.js";
import { TAG_ALIASES } from "../../knowledge/vocabularies/tag-aliases.js";
import { SOURCE_REGISTRY } from "../../knowledge/vocabularies/sources.js";
import { TAXONOMY } from "../../knowledge/vocabularies/taxonomy.js";

const tagIds = new Set(SEMANTIC_TAGS.map((item) => item.id));
const sourceIds = new Set(SOURCE_REGISTRY.map((item) => item.id));
const reversalModes = new Set(TAXONOMY.reversalModes);
const dimensions = new Set(TAXONOMY.dimensions);
const domains = new Set(TAXONOMY.domains);

function issue(code, path, value, suggestion = null) {
  return Object.freeze({ code, path, value, suggestion });
}

function checkToken(value, path, allowed, aliases, errors) {
  if (aliases && Object.hasOwn(aliases, value)) {
    errors.push(issue("vocabulary.alias_not_canonical", path, value, aliases[value]));
  } else if (!allowed.has(value)) {
    errors.push(issue("vocabulary.unknown_token", path, value));
  }
}

function sourceRefsFrom(profile) {
  const refs = [];
  for (const group of Object.values(profile.facets || {})) {
    for (const unit of group || []) refs.push(...(unit.sourceRefs || []));
  }
  for (const symbol of profile.traditions?.symbols || []) refs.push(...(symbol.sourceRefs || []));
  for (const caution of profile.traditions?.cautions || []) refs.push(...(caution.sourceRefs || []));
  for (const group of Object.values(profile.boundaries || {})) {
    for (const item of group || []) refs.push(...(item.sourceRefs || []));
  }
  refs.push(...(profile.provenance?.sourceRefs || []));
  return refs;
}

export function validateCardVocabulary(profile) {
  const errors = [];
  const tagLocations = [
    ["$.themes", profile.themes || []],
    ["$.relations.supportsTags", profile.relations?.supportsTags || []],
    ["$.relations.conflictsTags", profile.relations?.conflictsTags || []],
    ["$.relations.transformsTags", profile.relations?.transformsTags || []],
    ["$.relations.stageTags", profile.relations?.stageTags || []],
    ["$.relations.roleTags", profile.relations?.roleTags || []],
  ];
  for (const [path, values] of tagLocations) {
    values.forEach((value, index) => checkToken(value, `${path}[${index}]`, tagIds, TAG_ALIASES, errors));
  }
  for (const [facet, units] of Object.entries(profile.facets || {})) {
    for (const [unitIndex, unit] of (units || []).entries()) {
      (unit.tags || []).forEach((value, index) => {
        checkToken(value, `$.facets.${facet}[${unitIndex}].tags[${index}]`, tagIds, TAG_ALIASES, errors);
      });
    }
  }
  sourceRefsFrom(profile).forEach((value, index) => {
    if (!sourceIds.has(value)) errors.push(issue("source.unknown_reference", `$.sourceRefs[${index}]`, value));
  });
  if (profile.provenance?.tradition && !sourceIds.has(profile.provenance.tradition)) {
    errors.push(issue("source.unknown_tradition", "$.provenance.tradition", profile.provenance.tradition));
  }
  for (const [index, mode] of (profile.reversal?.supportedModes || []).entries()) {
    if (!reversalModes.has(mode)) errors.push(issue("reversal.unknown_mode", `$.reversal.supportedModes[${index}]`, mode));
  }
  for (const [domain, definition] of Object.entries(profile.domains || {})) {
    if (!domains.has(domain)) errors.push(issue("domain.unknown", `$.domains.${domain}`, domain));
    for (const dimension of Object.keys(definition.weightAdjustments || {})) {
      if (!dimensions.has(dimension)) errors.push(issue("dimension.unknown", `$.domains.${domain}.weightAdjustments.${dimension}`, dimension));
    }
  }
  const support = new Set(profile.relations?.supportsTags || []);
  for (const tag of profile.relations?.conflictsTags || []) {
    if (support.has(tag)) errors.push(issue("relation.support_conflict_overlap", "$.relations", tag));
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
