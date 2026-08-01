import { validateJsonSchema } from "./schema-validator.js";
import { TAXONOMY } from "../../knowledge/vocabularies/taxonomy.js";
import { LEGACY_SPREADS_V1 as SPREADS } from "../../knowledge/spreads/definitions.js";

const sets = Object.freeze({
  domains: new Set(TAXONOMY.questionDomains),
  intents: new Set(TAXONOMY.questionIntents),
  answerDimensions: new Set(TAXONOMY.answerDimensions),
  conclusionTypes: new Set(TAXONOMY.conclusionTypes),
  forbiddenClaims: new Set(TAXONOMY.forbiddenClaims),
  timeframes: new Set(TAXONOMY.timeframes),
  riskLevels: new Set(TAXONOMY.riskLevels),
});

function issue(code, path, value) {
  return Object.freeze({ code, path, keyword: "questionContract", value });
}

function checkMembers(values, allowed, path, errors, code) {
  for (const [index, value] of (values || []).entries()) {
    if (!allowed.has(value)) errors.push(issue(code, `${path}[${index}]`, value));
  }
}

export function validateQuestionProfile(profile, schema) {
  const errors = [...validateJsonSchema(profile, schema)];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return errors;
  if (!sets.domains.has(profile.domain)) errors.push(issue("question.domain_unknown", "$.domain", profile.domain));
  if (!sets.intents.has(profile.intent)) errors.push(issue("question.intent_unknown", "$.intent", profile.intent));
  if (!sets.timeframes.has(profile.timeframe)) errors.push(issue("question.timeframe_unknown", "$.timeframe", profile.timeframe));
  if (!sets.riskLevels.has(profile.riskLevel)) errors.push(issue("question.risk_unknown", "$.riskLevel", profile.riskLevel));
  checkMembers(profile.answerDimensions, sets.answerDimensions, "$.answerDimensions", errors, "question.dimension_unknown");
  checkMembers(profile.allowedConclusionTypes, sets.conclusionTypes, "$.allowedConclusionTypes", errors, "question.conclusion_unknown");
  checkMembers(profile.forbiddenClaims, sets.forbiddenClaims, "$.forbiddenClaims", errors, "question.forbidden_claim_unknown");

  const allowedDimensions = new Set(profile.answerDimensions || []);
  for (const spread of SPREADS) {
    const spreadProfile = profile.spreadProfiles?.[spread.id];
    if (!spreadProfile) continue;
    const actualPositions = Object.keys(spreadProfile.positionResponsibilities || {}).sort();
    const expectedPositions = spread.positions.map((item) => item.id).sort();
    if (JSON.stringify(actualPositions) !== JSON.stringify(expectedPositions)) {
      errors.push(issue("question.position_set_mismatch", `$.spreadProfiles.${spread.id}.positionResponsibilities`, actualPositions));
    }
    for (const [positionId, dimensions] of Object.entries(spreadProfile.positionResponsibilities || {})) {
      for (const [index, dimension] of dimensions.entries()) {
        if (!allowedDimensions.has(dimension)) {
          errors.push(issue("question.position_dimension_not_declared", `$.spreadProfiles.${spread.id}.positionResponsibilities.${positionId}[${index}]`, dimension));
        }
      }
    }
    for (const [index, dimension] of (spreadProfile.requiredConclusionDimensions || []).entries()) {
      if (!allowedDimensions.has(dimension)) {
        errors.push(issue("question.required_dimension_not_declared", `$.spreadProfiles.${spread.id}.requiredConclusionDimensions[${index}]`, dimension));
      }
    }
  }
  return errors.sort((a, b) => a.path.localeCompare(b.path) || a.code.localeCompare(b.code));
}
