#!/usr/bin/env python3
"""Apply TQ-001 CardSemanticProfile structural schema and validation contracts."""

from __future__ import annotations

import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

FACETS = (
    "state", "cause", "motivation", "obstacle", "opportunity", "resource",
    "relationship", "action", "boundary", "trend", "outcome", "reflection",
)
DOMAINS = ("relationship", "career", "finance", "growth", "decision", "daily")
DIMENSIONS = (
    "activation", "stability", "clarity", "agency", "openness", "reciprocity",
    "materiality", "emotionality", "risk", "transition", "speed",
)
REVERSAL_MODES = (
    "blocked", "delayed", "internalized", "excessive", "deficient",
    "misdirected", "distorted", "released", "avoided", "loss-of-control",
)
RANKS = (
    "ace", "two", "three", "four", "five", "six", "seven", "eight",
    "nine", "ten", "page", "knight", "queen", "king",
)


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.replace("\r\n", "\n"), encoding="utf-8", newline="\n")


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return source.replace(old, new, 1)


def stable_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def string_schema(*, min_length: int = 1, max_length: int = 240, pattern: str | None = None) -> dict[str, object]:
    result: dict[str, object] = {"type": "string", "minLength": min_length, "maxLength": max_length}
    if pattern:
        result["pattern"] = pattern
    return result


def array_schema(items: object, *, minimum: int = 0, maximum: int | None = None, unique: bool = False) -> dict[str, object]:
    result: dict[str, object] = {"type": "array", "items": items, "minItems": minimum}
    if maximum is not None:
        result["maxItems"] = maximum
    if unique:
        result["uniqueItems"] = True
    return result


def build_schema() -> dict[str, object]:
    kebab = r"^[a-z0-9]+(?:-[a-z0-9]+)*$"
    semantic_id = rf"^(?:{'|'.join(FACETS)})\.[a-z0-9]+(?:-[a-z0-9]+)*$"
    local_ref = semantic_id
    card_id = rf"^(?:major-(?:0|[1-9]|1[0-9]|2[01])|(?:wands|cups|swords|pentacles)-(?:{'|'.join(RANKS)}))$"
    evidence_id = r"^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$"
    source_ref = kebab
    semantic_unit = {
        "type": "object",
        "additionalProperties": False,
        "required": ["id", "text", "tags", "allowedRoles", "sourceRefs"],
        "properties": {
            "id": string_schema(max_length=96, pattern=semantic_id),
            "text": string_schema(max_length=320),
            "tags": array_schema(string_schema(max_length=64, pattern=kebab), minimum=1, unique=True),
            "allowedRoles": array_schema({"enum": list(FACETS)}, minimum=1, unique=True),
            "sourceRefs": array_schema(string_schema(max_length=96, pattern=source_ref), minimum=1, unique=True),
        },
    }
    evidence_unit = {
        "type": "object",
        "additionalProperties": False,
        "required": ["id", "text", "sourceRefs"],
        "properties": {
            "id": string_schema(max_length=96, pattern=evidence_id),
            "text": string_schema(max_length=360),
            "sourceRefs": array_schema(string_schema(max_length=96, pattern=source_ref), minimum=1, unique=True),
        },
    }
    symbol_unit = {
        "type": "object",
        "additionalProperties": False,
        "required": ["id", "symbol", "meaning", "traditionScopes", "sourceRefs"],
        "properties": {
            "id": string_schema(max_length=96, pattern=evidence_id),
            "symbol": string_schema(max_length=80),
            "meaning": string_schema(max_length=320),
            "traditionScopes": array_schema(string_schema(max_length=64, pattern=kebab), minimum=1, unique=True),
            "sourceRefs": array_schema(string_schema(max_length=96, pattern=source_ref), minimum=1, unique=True),
        },
    }
    domain_profile = {
        "type": "object",
        "additionalProperties": False,
        "required": ["facetRefs", "weightAdjustments", "overrides"],
        "properties": {
            "facetRefs": array_schema({"$ref": "#/$defs/localSemanticRef"}, minimum=3, unique=True),
            "weightAdjustments": {
                "type": "object",
                "maxProperties": len(DIMENSIONS),
                "additionalProperties": {"type": "number", "minimum": -1, "maximum": 1},
            },
            "overrides": array_schema({"$ref": "#/$defs/semanticUnit"}, unique=True),
        },
    }
    dimensions = {
        "type": "object",
        "additionalProperties": False,
        "required": list(DIMENSIONS),
        "properties": {name: {"type": "integer", "minimum": -3, "maximum": 3} for name in DIMENSIONS},
    }
    facets = {
        "type": "object",
        "additionalProperties": False,
        "required": list(FACETS),
        "properties": {
            name: array_schema({"$ref": "#/$defs/semanticUnit"}, minimum=2, unique=True)
            for name in FACETS
        },
    }
    domains = {
        "type": "object",
        "additionalProperties": False,
        "required": list(DOMAINS),
        "properties": {name: domain_profile for name in DOMAINS},
    }
    relation_arrays = {
        key: array_schema(string_schema(max_length=64, pattern=kebab), unique=True)
        for key in ("supportsTags", "conflictsTags", "transformsTags", "stageTags", "roleTags")
    }
    language_arrays = {
        "keywordsUpright": array_schema(string_schema(max_length=40), minimum=3, unique=True),
        "keywordsReversed": array_schema(string_schema(max_length=40), minimum=3, unique=True),
        "conciseUprightRefs": array_schema({"$ref": "#/$defs/localSemanticRef"}, minimum=1, unique=True),
        "conciseReversedRefs": array_schema({"$ref": "#/$defs/localSemanticRef"}, minimum=1, unique=True),
        "actionPhraseRefs": array_schema({"$ref": "#/$defs/localSemanticRef"}, minimum=1, unique=True),
        "cautionPhraseRefs": array_schema({"$ref": "#/$defs/localSemanticRef"}, minimum=1, unique=True),
    }
    schema: dict[str, object] = {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://astra.local/schemas/card-semantic-profile/1.0.0",
        "title": "Astra Tarot CardSemanticProfile",
        "description": "TQ-001 structural contract. Vocabulary membership and source registry policy belong to TQ-002.",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "schemaVersion", "id", "name", "arcana", "identity", "traditions", "themes",
            "dimensions", "facets", "reversal", "domains", "relations", "language",
            "boundaries", "provenance", "metadata",
        ],
        "properties": {
            "schemaVersion": {"const": "1.0.0"},
            "id": string_schema(max_length=64, pattern=card_id),
            "name": string_schema(max_length=40),
            "arcana": {"enum": ["major", "minor"]},
            "number": {"type": "integer", "minimum": 0, "maximum": 21},
            "suit": {"enum": ["wands", "cups", "swords", "pentacles"]},
            "rank": {"enum": list(RANKS)},
            "identity": {
                "type": "object",
                "additionalProperties": False,
                "required": ["coreArchetype", "essence", "developmentalStage"],
                "properties": {
                    "coreArchetype": string_schema(max_length=180),
                    "essence": string_schema(max_length=160),
                    "developmentalStage": string_schema(max_length=200),
                },
            },
            "traditions": {
                "type": "object",
                "additionalProperties": False,
                "required": ["uprightSummary", "reversedSummary", "symbols", "cautions"],
                "properties": {
                    "uprightSummary": string_schema(max_length=500),
                    "reversedSummary": string_schema(max_length=500),
                    "symbols": array_schema({"$ref": "#/$defs/symbolUnit"}, minimum=3, unique=True),
                    "cautions": array_schema({"$ref": "#/$defs/evidenceUnit"}, minimum=1, unique=True),
                },
            },
            "themes": array_schema(string_schema(max_length=64, pattern=kebab), minimum=3, unique=True),
            "dimensions": dimensions,
            "facets": facets,
            "reversal": {
                "type": "object",
                "additionalProperties": False,
                "required": ["supportedModes", "defaultWeights", "modeFacetRefs"],
                "properties": {
                    "supportedModes": array_schema({"enum": list(REVERSAL_MODES)}, minimum=3, maximum=6, unique=True),
                    "defaultWeights": {
                        "type": "object",
                        "minProperties": 3,
                        "maxProperties": 6,
                        "additionalProperties": {"type": "number", "minimum": 0, "maximum": 1},
                    },
                    "modeFacetRefs": {
                        "type": "object",
                        "minProperties": 3,
                        "maxProperties": 6,
                        "additionalProperties": array_schema({"$ref": "#/$defs/localSemanticRef"}, minimum=1, unique=True),
                    },
                },
            },
            "domains": domains,
            "relations": {
                "type": "object",
                "additionalProperties": False,
                "required": list(relation_arrays),
                "properties": relation_arrays,
            },
            "language": {
                "type": "object",
                "additionalProperties": False,
                "required": list(language_arrays),
                "properties": language_arrays,
            },
            "boundaries": {
                "type": "object",
                "additionalProperties": False,
                "required": ["forbiddenClaims", "commonMisreadings", "ambiguityNotes"],
                "properties": {
                    "forbiddenClaims": array_schema({"$ref": "#/$defs/evidenceUnit"}, minimum=1, unique=True),
                    "commonMisreadings": array_schema({"$ref": "#/$defs/evidenceUnit"}, minimum=1, unique=True),
                    "ambiguityNotes": array_schema({"$ref": "#/$defs/evidenceUnit"}, minimum=1, unique=True),
                },
            },
            "provenance": {
                "type": "object",
                "additionalProperties": False,
                "required": ["tradition", "sourceRefs", "modernizedScope"],
                "properties": {
                    "tradition": string_schema(max_length=64, pattern=kebab),
                    "sourceRefs": array_schema(string_schema(max_length=96, pattern=source_ref), minimum=1, unique=True),
                    "modernizedScope": array_schema(string_schema(max_length=240), minimum=1, unique=True),
                },
            },
            "metadata": {
                "type": "object",
                "additionalProperties": False,
                "required": ["version", "status", "reviewedBy", "reviewDate", "score"],
                "properties": {
                    "version": string_schema(max_length=32, pattern=r"^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$"),
                    "status": {"enum": [
                        "DRAFT", "SCHEMA_VALID", "CONTENT_REVIEWED", "CROSS_CARD_REVIEWED",
                        "CONSUMER_VALIDATED", "SCENARIO_TESTED", "APPROVED",
                    ]},
                    "reviewedBy": array_schema(string_schema(max_length=80), unique=True),
                    "reviewDate": {"type": ["string", "null"], "format": "date"},
                    "score": {"type": ["integer", "null"], "minimum": 0, "maximum": 100},
                },
            },
        },
        "allOf": [
            {
                "if": {"properties": {"arcana": {"const": "major"}}, "required": ["arcana"]},
                "then": {
                    "required": ["number"],
                    "properties": {"id": {"pattern": r"^major-(?:0|[1-9]|1[0-9]|2[01])$"}},
                },
            },
            {
                "if": {"properties": {"arcana": {"const": "minor"}}, "required": ["arcana"]},
                "then": {
                    "required": ["suit", "rank"],
                    "properties": {
                        "id": {"pattern": rf"^(?:wands|cups|swords|pentacles)-(?:{'|'.join(RANKS)})$"},
                    },
                },
            },
        ],
        "$defs": {
            "semanticUnit": semantic_unit,
            "evidenceUnit": evidence_unit,
            "symbolUnit": symbol_unit,
            "localSemanticRef": string_schema(max_length=96, pattern=local_ref),
            "stableCardRef": string_schema(max_length=168, pattern=rf"{card_id[1:-1]}#{semantic_id[1:-1]}"),
        },
    }
    return schema


SCHEMA_VALIDATOR = r'''function pathJoin(path, key) {
  if (typeof key === "number") return `${path}[${key}]`;
  return /^[A-Za-z_$][A-Za-z0-9_$-]*$/.test(key) ? `${path}.${key}` : `${path}[${JSON.stringify(key)}]`;
}

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function matchesType(value, type) {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  if (type === "integer") return Number.isInteger(value);
  if (type === "number") return typeof value === "number" && Number.isFinite(value);
  return typeof value === type;
}

function decodePointerPart(value) {
  return value.replace(/~1/g, "/").replace(/~0/g, "~");
}

function resolveReference(rootSchema, reference) {
  if (!reference.startsWith("#/")) throw new Error(`Only local JSON Schema references are supported: ${reference}`);
  return reference.slice(2).split("/").map(decodePointerPart).reduce((value, key) => value?.[key], rootSchema);
}

function dateIsValid(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function error(code, path, keyword, message) {
  return Object.freeze({ code, path, keyword, message });
}

function collect(value, schema, rootSchema, path) {
  if (!schema || typeof schema !== "object") return [];
  if (schema.$ref) {
    const resolved = resolveReference(rootSchema, schema.$ref);
    if (!resolved) return [error("schema.reference", path, "$ref", `Unresolved schema reference ${schema.$ref}`)];
    return collect(value, resolved, rootSchema, path);
  }

  const errors = [];
  for (const item of schema.allOf || []) errors.push(...collect(value, item, rootSchema, path));
  if (schema.if) {
    const conditionMatches = collect(value, schema.if, rootSchema, path).length === 0;
    if (conditionMatches && schema.then) errors.push(...collect(value, schema.then, rootSchema, path));
    if (!conditionMatches && schema.else) errors.push(...collect(value, schema.else, rootSchema, path));
  }

  if (Object.hasOwn(schema, "const") && canonical(value) !== canonical(schema.const)) {
    errors.push(error("schema.const", path, "const", "Value does not match the required constant."));
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => canonical(item) === canonical(value))) {
    errors.push(error("schema.enum", path, "enum", "Value is outside the allowed basic enumeration."));
  }

  const allowedTypes = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (allowedTypes.length && !allowedTypes.some((type) => matchesType(value, type))) {
    errors.push(error("schema.type", path, "type", `Expected ${allowedTypes.join(" or ")}.`));
    return errors;
  }

  if (typeof value === "string") {
    if (schema.minLength !== undefined && [...value].length < schema.minLength) {
      errors.push(error("schema.min_length", path, "minLength", `String is shorter than ${schema.minLength}.`));
    }
    if (schema.maxLength !== undefined && [...value].length > schema.maxLength) {
      errors.push(error("schema.max_length", path, "maxLength", `String is longer than ${schema.maxLength}.`));
    }
    if (schema.pattern !== undefined && !new RegExp(schema.pattern, "u").test(value)) {
      errors.push(error("schema.pattern", path, "pattern", "String does not match the required syntax."));
    }
    if (schema.format === "date" && !dateIsValid(value)) {
      errors.push(error("schema.format_date", path, "format", "String is not a valid YYYY-MM-DD date."));
    }
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(error("schema.minimum", path, "minimum", `Number is below ${schema.minimum}.`));
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(error("schema.maximum", path, "maximum", `Number is above ${schema.maximum}.`));
    }
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(error("schema.min_items", path, "minItems", `Array has fewer than ${schema.minItems} items.`));
    }
    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(error("schema.max_items", path, "maxItems", `Array has more than ${schema.maxItems} items.`));
    }
    if (schema.uniqueItems) {
      const seen = new Set();
      for (const [index, item] of value.entries()) {
        const key = canonical(item);
        if (seen.has(key)) errors.push(error("schema.unique_items", pathJoin(path, index), "uniqueItems", "Array item is duplicated."));
        seen.add(key);
      }
    }
    if (schema.items) value.forEach((item, index) => errors.push(...collect(item, schema.items, rootSchema, pathJoin(path, index))));
  }

  if (value && typeof value === "object" && !Array.isArray(value)) {
    const keys = Object.keys(value);
    if (schema.minProperties !== undefined && keys.length < schema.minProperties) {
      errors.push(error("schema.min_properties", path, "minProperties", `Object has fewer than ${schema.minProperties} properties.`));
    }
    if (schema.maxProperties !== undefined && keys.length > schema.maxProperties) {
      errors.push(error("schema.max_properties", path, "maxProperties", `Object has more than ${schema.maxProperties} properties.`));
    }
    for (const required of schema.required || []) {
      if (!Object.hasOwn(value, required)) errors.push(error("schema.required", pathJoin(path, required), "required", `Missing required property ${required}.`));
    }
    const properties = schema.properties || {};
    for (const [key, item] of Object.entries(value)) {
      if (Object.hasOwn(properties, key)) errors.push(...collect(item, properties[key], rootSchema, pathJoin(path, key)));
      else if (schema.additionalProperties === false) errors.push(error("schema.additional_property", pathJoin(path, key), "additionalProperties", `Unexpected property ${key}.`));
      else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        errors.push(...collect(item, schema.additionalProperties, rootSchema, pathJoin(path, key)));
      }
    }
  }
  return errors;
}

export function validateJsonSchema(value, schema) {
  return collect(value, schema, schema, "$"亦).map((item) => item);
}
'''.replace('"$"亦', '"$"')

CARD_VALIDATOR = r'''import { validateJsonSchema } from "./schema-validator.js";

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
'''

CLI = r'''#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { validateCardSemanticProfile } from "../src/engine/validation/card-profile-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultSchema = path.join(root, "src/knowledge/schemas/card-semantic-profile.schema.json");

function parseArguments(argv) {
  const files = [];
  let schemaPath = defaultSchema;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--schema") {
      schemaPath = path.resolve(argv[index + 1]);
      index += 1;
    } else {
      files.push(path.resolve(argv[index]));
    }
  }
  if (!files.length) throw new Error("Provide at least one CardSemanticProfile JSON file.");
  return { files, schemaPath };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

try {
  const { files, schemaPath } = parseArguments(process.argv.slice(2));
  const schema = readJson(schemaPath);
  const results = files.map((filePath) => {
    try {
      const errors = validateCardSemanticProfile(readJson(filePath), schema);
      return { file: path.relative(root, filePath).replaceAll("\\", "/"), status: errors.length ? "FAIL" : "PASS", errors };
    } catch (error) {
      return {
        file: path.relative(root, filePath).replaceAll("\\", "/"),
        status: "FAIL",
        errors: [{ code: "json.parse", path: "$", keyword: "json", message: String(error.message || error) }],
      };
    }
  });
  const summary = {
    PASS: results.filter((item) => item.status === "PASS").length,
    FAIL: results.filter((item) => item.status === "FAIL").length,
  };
  console.log(JSON.stringify({ schema: path.relative(root, schemaPath).replaceAll("\\", "/"), results, summary }));
  if (summary.FAIL) process.exitCode = 1;
} catch (error) {
  console.error(String(error.message || error));
  process.exitCode = 2;
}
'''

TEST = r'''import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { CARD_SCHEMA_VERSION } from "../src/config/version.js";
import {
  validateCardSemanticProfile,
  validateStableCardReference,
} from "../src/engine/validation/card-profile-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const schemaPath = "src/knowledge/schemas/card-semantic-profile.schema.json";
const fixtureRoot = "tests/fixtures/card-schema";
const schema = readJson(schemaPath);

assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
assert.equal(schema.$id.endsWith(`/${CARD_SCHEMA_VERSION}`), true);
assert.equal(schema.additionalProperties, false);
assert.equal(schema.description.includes("TQ-002"), true);

for (const file of ["valid-major-7.json", "valid-minor-cups-two.json"]) {
  const errors = validateCardSemanticProfile(readJson(`${fixtureRoot}/${file}`), schema);
  assert.deepEqual(errors, [], `${file}: ${JSON.stringify(errors)}`);
}

const expectations = readJson(`${fixtureRoot}/invalid/expected-errors.json`);
for (const [file, expectedCode] of Object.entries(expectations)) {
  const errors = validateCardSemanticProfile(readJson(`${fixtureRoot}/invalid/${file}`), schema);
  assert.ok(errors.some((item) => item.code === expectedCode), `${file} did not produce ${expectedCode}: ${JSON.stringify(errors)}`);
}

assert.equal(validateStableCardReference("major-7#action.primary"), true);
assert.equal(validateStableCardReference("cups-two#relationship.secondary"), true);
assert.equal(validateStableCardReference("major_7#action.primary"), false);
assert.equal(validateStableCardReference("major-7/action.primary"), false);

const cli = spawnSync(process.execPath, ["scripts/validate_card_profiles.mjs", `${fixtureRoot}/valid-major-7.json`], {
  cwd: root,
  encoding: "utf8",
});
assert.equal(cli.status, 0, cli.stderr);
const cliPayload = JSON.parse(cli.stdout);
assert.deepEqual(cliPayload.summary, { PASS: 1, FAIL: 0 });

const invalidCli = spawnSync(process.execPath, ["scripts/validate_card_profiles.mjs", `${fixtureRoot}/invalid/unresolved-reference.json`], {
  cwd: root,
  encoding: "utf8",
});
assert.equal(invalidCli.status, 1);
assert.equal(JSON.parse(invalidCli.stdout).summary.FAIL, 1);

console.log(`TQ-001 card schema contract passed: ${Object.keys(expectations).length} invalid fixtures rejected with stable error codes.`);
'''


def semantic_unit(role: str, suffix: str) -> dict[str, object]:
    return {
        "id": f"{role}.{suffix}",
        "text": f"{role} {suffix} fixture text",
        "tags": [f"{role}-tag", f"{suffix}-tag"],
        "allowedRoles": [role],
        "sourceRefs": ["fixture-source"],
    }


def build_valid_major() -> dict[str, object]:
    facets = {role: [semantic_unit(role, "primary"), semantic_unit(role, "secondary")] for role in FACETS}
    domains = {
        domain: {
            "facetRefs": ["state.primary", "obstacle.primary", "action.primary"],
            "weightAdjustments": {"agency": 0.2, "risk": 0.1},
            "overrides": [],
        }
        for domain in DOMAINS
    }
    return {
        "schemaVersion": "1.0.0",
        "id": "major-7",
        "name": "战车",
        "arcana": "major",
        "number": 7,
        "identity": {
            "coreArchetype": "驾驭相反力量并朝目标推进",
            "essence": "方向、意志、控制与推进",
            "developmentalStage": "主动确立方向并承担控制责任",
        },
        "traditions": {
            "uprightSummary": "方向明确并能整合力量。",
            "reversedSummary": "方向摇摆或控制失衡。",
            "symbols": [
                {"id": "symbol.chariot", "symbol": "战车", "meaning": "主动推进", "traditionScopes": ["cross-deck"], "sourceRefs": ["fixture-source"]},
                {"id": "symbol.opposites", "symbol": "相反力量", "meaning": "需要协调", "traditionScopes": ["rws"], "sourceRefs": ["fixture-source"]},
                {"id": "symbol.road", "symbol": "道路", "meaning": "方向与进程", "traditionScopes": ["cross-deck"], "sourceRefs": ["fixture-source"]},
            ],
            "cautions": [
                {"id": "caution.control", "text": "控制不等于压制。", "sourceRefs": ["fixture-source"]},
            ],
        },
        "themes": ["direction", "agency", "movement"],
        "dimensions": {
            "activation": 3, "stability": 1, "clarity": 2, "agency": 3, "openness": 0,
            "reciprocity": 0, "materiality": 0, "emotionality": -1, "risk": 1,
            "transition": 2, "speed": 3,
        },
        "facets": facets,
        "reversal": {
            "supportedModes": ["blocked", "excessive", "misdirected"],
            "defaultWeights": {"blocked": 0.4, "excessive": 0.3, "misdirected": 0.3},
            "modeFacetRefs": {
                "blocked": ["obstacle.primary"],
                "excessive": ["boundary.primary"],
                "misdirected": ["action.secondary"],
            },
        },
        "domains": domains,
        "relations": {
            "supportsTags": ["movement", "direction"],
            "conflictsTags": ["delay", "confusion"],
            "transformsTags": ["control-release"],
            "stageTags": ["active-direction"],
            "roleTags": ["driver"],
        },
        "language": {
            "keywordsUpright": ["推进", "方向", "自律"],
            "keywordsReversed": ["失控", "摇摆", "用力失衡"],
            "conciseUprightRefs": ["state.primary"],
            "conciseReversedRefs": ["obstacle.primary"],
            "actionPhraseRefs": ["action.primary"],
            "cautionPhraseRefs": ["boundary.primary"],
        },
        "boundaries": {
            "forbiddenClaims": [{"id": "forbidden.victory-guarantee", "text": "不得保证胜利。", "sourceRefs": ["fixture-source"]}],
            "commonMisreadings": [{"id": "misreading.force", "text": "不等于强行推进。", "sourceRefs": ["fixture-source"]}],
            "ambiguityNotes": [{"id": "ambiguity.control", "text": "控制可能指自律或压制。", "sourceRefs": ["fixture-source"]}],
        },
        "provenance": {
            "tradition": "rws-core",
            "sourceRefs": ["fixture-source"],
            "modernizedScope": ["行动建议采用现代中性表达。"],
        },
        "metadata": {
            "version": "1.0.0",
            "status": "DRAFT",
            "reviewedBy": [],
            "reviewDate": None,
            "score": None,
        },
    }


def build_valid_minor(major: dict[str, object]) -> dict[str, object]:
    result = copy.deepcopy(major)
    result["id"] = "cups-two"
    result["name"] = "圣杯二"
    result["arcana"] = "minor"
    result.pop("number", None)
    result["suit"] = "cups"
    result["rank"] = "two"
    return result


def build_invalid_fixtures(valid: dict[str, object]) -> tuple[dict[str, dict[str, object]], dict[str, str]]:
    fixtures: dict[str, dict[str, object]] = {}
    expected: dict[str, str] = {}

    def add(name: str, code: str, mutate) -> None:
        value = copy.deepcopy(valid)
        mutate(value)
        fixtures[name] = value
        expected[name] = code

    add("missing-identity.json", "schema.required", lambda value: value.pop("identity"))
    add("bad-card-id.json", "schema.pattern", lambda value: value.__setitem__("id", "major_7"))
    add("dimension-out-of-range.json", "schema.maximum", lambda value: value["dimensions"].__setitem__("agency", 4))
    add("duplicate-semantic-id.json", "card.semantic_id_duplicate", lambda value: value["facets"]["cause"][0].__setitem__("id", "state.primary"))
    add("unresolved-reference.json", "card.reference_unresolved", lambda value: value["domains"]["career"]["facetRefs"].__setitem__(0, "action.missing"))
    add("reversal-weight-keys.json", "card.reversal_weight_keys", lambda value: value["reversal"]["defaultWeights"].pop("blocked"))
    add("semantic-role-mismatch.json", "card.semantic_role_mismatch", lambda value: value["facets"]["state"][0].__setitem__("allowedRoles", ["action"]))
    add("unexpected-property.json", "schema.additional_property", lambda value: value.__setitem__("fortune", "guaranteed"))
    add("duplicate-reference.json", "schema.unique_items", lambda value: value["language"]["actionPhraseRefs"].append("action.primary"))

    minor = build_valid_minor(valid)
    minor["suit"] = "swords"
    fixtures["minor-id-mismatch.json"] = minor
    expected["minor-id-mismatch.json"] = "card.id_suit_rank_mismatch"
    return fixtures, expected


def update_validate() -> None:
    source = read("automation/validate.py")
    anchor = '''        (
            "node-knowledge-contract",
            [node, "tests/knowledge_contract_test.mjs"],
        ),
'''
    addition = anchor + '''        (
            "node-card-schema-contract",
            [node, "tests/card_schema_contract_test.mjs"],
        ),
'''
    write("automation/validate.py", replace_once(source, anchor, addition, "card schema validation step"))


def update_package() -> None:
    metadata = json.loads(read("package.json"))
    scripts = metadata.setdefault("scripts", {})
    scripts["test:card-schema"] = "node tests/card_schema_contract_test.mjs"
    scripts["validate:card"] = "node scripts/validate_card_profiles.mjs"
    write("package.json", json.dumps(metadata, ensure_ascii=False, indent=2) + "\n")


def update_version() -> None:
    source = read("src/config/version.js")
    if "CARD_SCHEMA_VERSION" not in source:
        source += 'export const CARD_SCHEMA_VERSION = "1.0.0";\n'
    write("src/config/version.js", source)


def update_module_contract() -> None:
    source = read("tests/module_contract_test.mjs")
    anchor = '  "tests/browser_harness.py", "tests/phase_m_gate_test.mjs", "docs/BROWSER_SUPPORT.md",\n'
    addition = anchor + '  "src/knowledge/schemas/card-semantic-profile.schema.json",\n  "src/engine/validation/schema-validator.js", "src/engine/validation/card-profile-validator.js",\n  "scripts/validate_card_profiles.mjs", "tests/card_schema_contract_test.mjs",\n'
    write("tests/module_contract_test.mjs", replace_once(source, anchor, addition, "TQ-001 required files"))


def update_docs() -> None:
    module_map = read("docs/MODULE_MAP.md")
    section = '''

---

## 10. Phase 1结构验证入口

`TQ-001` 冻结 `src/knowledge/schemas/card-semantic-profile.schema.json`（Draft 2020-12，Schema版本1.0.0）。

- 通用无依赖子集验证器：`src/engine/validation/schema-validator.js`。
- 卡牌结构、局部引用和跨字段验证器：`src/engine/validation/card-profile-validator.js`。
- 命令行入口：`node scripts/validate_card_profiles.mjs <profile.json...>`。
- 契约与失败样例：`tests/card_schema_contract_test.mjs`、`tests/fixtures/card-schema/`。
- Schema只检查结构、语法、范围、基础枚举、重复和局部引用；标签、来源和语义词典成员资格由 `TQ-002` 校验。
'''
    if "## 10. Phase 1结构验证入口" not in module_map:
        module_map += section
    write("docs/MODULE_MAP.md", module_map)

    automation_readme = read("automation/README.md")
    note = '''

## TQ-001 CardSemanticProfile

`baseline` 与 `full` 均运行 `node tests/card_schema_contract_test.mjs`。单独验证JSON文件：

```text
node scripts/validate_card_profiles.mjs path/to/card.json
```

退出码0表示全部通过，1表示存在结构错误，2表示命令使用错误。输出为包含稳定错误码的JSON。
'''
    if "## TQ-001 CardSemanticProfile" not in automation_readme:
        automation_readme += note
    write("automation/README.md", automation_readme)

    card_standard = read("docs/CARD_DATA_STANDARD.md")
    marker = "## 5. 内容要求\n"
    insert = '''### 4.1 TQ-001正式结构契约

正式路径：`src/knowledge/schemas/card-semantic-profile.schema.json`，Schema版本 `1.0.0`。

本Schema冻结字段、必填项、ID/引用语法、类型、范围、基础枚举、结构性重复和局部引用解析。标签成员资格、来源注册、同义词与解释政策不在结构Schema中硬编码，由 `TQ-002` 冻结。

'''
    if "### 4.1 TQ-001正式结构契约" not in card_standard:
        card_standard = replace_once(card_standard, marker, insert + marker, "card standard schema section")
    write("docs/CARD_DATA_STANDARD.md", card_standard)


def write_progress() -> None:
    write("docs/PROGRESS.md", """# 项目开发进度

> 本文件是继续任务的唯一实时状态入口；任务定义以 `EXECUTION_CONTRACTS.md` 为准。

## 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase 1：质量门禁与知识协议 |
| 当前进行中任务 | 无 |
| 最近完成任务 | `TQ-001` CardSemanticProfile结构Schema |
| 唯一下一任务 | `TQ-002` 词典、来源和解释政策 |
| 阻塞项 | 无 |
| 工作分支 | `phase-m-completion` |
| Phase M状态 | `PARENT-DONE` |
| Phase 1状态 | `PARENT-IN-PROGRESS` |
| 最后更新时间 | 2026-07-31 |

## Phase M完成记录

| 任务 | 状态 | 产物/证据 |
|---|---|---|
| `MOD-001`–`MOD-003B` | `DONE` | 基线、CSS、ESM入口与基础模块 |
| `MOD-004A` | `DONE` | `72b55c0e8b83f44b61b966eb39a849bf613b5436` |
| `MOD-004B` | `DONE` | `e1b2c8e73ad9c4e40cb5264aade7f60fe86618a9`；发现修复 `b31c2af465eb68466929d1c40938c409b60937d8` |
| `MOD-005` | `DONE` | `b03ca2602a36c4f96f2f2cf3c54d085db729116f`；固定复验 `01KYG9PHM5B2` |
| `MOD-006A` | `DONE` | `72cd7fa7ba05dab81b0f36a41c17d025002d8e29`；固定复验 `01KYG9PHM6AK2` |
| `MOD-006B` | `DONE` | `a710750d207cf13c6a4c61852356a4aaedc39c15`；永久生成器与规范manifest |
| `MOD-006C` | `DONE` | `b8973a7f1077234a04d115652e05324706dafd07`；分类缓存与离线状态 |
| `MOD-006D` | `DONE` | `70e5a70ee1f66802afdff73aa97522a5183f7181`；固定full复验 `01KYG9PHM6AN7` |

## Phase 1完成记录

| 任务 | 状态 | 产物/证据 |
|---|---|---|
| `TQ-001` | `DONE` | Draft 2020-12 CardSemanticProfile Schema、无依赖验证器、合法/失败夹具、稳定错误码和full接入 |

## 冻结不变量

- 78张牌、42个固定问题、1/3/5/10牌阵、公开ID、旧历史键和随机分布不变。
- 人工JS/CSS无超限技术债；不引入npm依赖、构建步骤或GitHub Actions。
- 人工源是唯一真相；`src/generated/` 必须由永久生成器重建并通过陈旧检查。
- `automation/validate.py --scope full` 是完整回归入口。
- `TQ-001`只冻结Card结构；QuestionProfile和Position Operator仍分别由`QP-002`和`PO-001`冻结。

## 唯一NEXT：TQ-002

建立标签、角色、逆位、领域、维度、来源与解释政策的正式词典和注册规则；验证成员资格、同义词、来源引用和跨词表约束，不修改 `TQ-001` 已冻结的结构职责。
""")


def main() -> None:
    schema = build_schema()
    write("src/knowledge/schemas/card-semantic-profile.schema.json", stable_json(schema))
    write("src/engine/validation/schema-validator.js", SCHEMA_VALIDATOR)
    write("src/engine/validation/card-profile-validator.js", CARD_VALIDATOR)
    write("scripts/validate_card_profiles.mjs", CLI)
    write("tests/card_schema_contract_test.mjs", TEST)

    valid_major = build_valid_major()
    valid_minor = build_valid_minor(valid_major)
    write("tests/fixtures/card-schema/valid-major-7.json", stable_json(valid_major))
    write("tests/fixtures/card-schema/valid-minor-cups-two.json", stable_json(valid_minor))
    invalid, expected = build_invalid_fixtures(valid_major)
    for name, value in invalid.items():
        write(f"tests/fixtures/card-schema/invalid/{name}", stable_json(value))
    write("tests/fixtures/card-schema/invalid/expected-errors.json", stable_json(expected))

    update_validate()
    update_package()
    update_version()
    update_module_contract()
    update_docs()
    write_progress()
    print(f"tq_001_applied schema={schema['$id']} invalid_fixtures={len(invalid)} next=TQ-002")


if __name__ == "__main__":
    main()
