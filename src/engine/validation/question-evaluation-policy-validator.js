import { validateJsonSchema } from "./schema-validator.js";
import { TAXONOMY } from "../../knowledge/vocabularies/taxonomy.js";
import { SEMANTIC_TAGS } from "../../knowledge/vocabularies/tags.js";

const semanticTags = new Set(SEMANTIC_TAGS.map((item) => item.id));
const dimensions = new Set(TAXONOMY.answerDimensions);

function issue(code, path, value) {
  return Object.freeze({ code, path, keyword: "questionEvaluationPolicy", value });
}

function checkDimensions(values, path, errors) {
  for (const [index, value] of (values || []).entries()) {
    if (!dimensions.has(value)) errors.push(issue("question_evaluation.dimension_unknown", `${path}[${index}]`, value));
  }
}

function checkUniqueIds(values, path, code, errors) {
  const ids = new Set();
  for (const [index, item] of (values || []).entries()) {
    if (ids.has(item?.id)) errors.push(issue(code, `${path}[${index}].id`, item?.id));
    ids.add(item?.id);
  }
}

export function validateQuestionEvaluationPolicy(policy, schema, { question = null } = {}) {
  const errors = [...validateJsonSchema(policy, schema)];
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) return errors;
  checkUniqueIds(policy.observableSignals, "$.observableSignals", "question_evaluation.observable_signal_id_duplicate", errors);
  checkUniqueIds(policy.expectations, "$.expectations", "question_evaluation.expectation_id_duplicate", errors);
  checkUniqueIds(policy.criteria, "$.criteria", "question_evaluation.criterion_id_duplicate", errors);
  checkDimensions(policy.requiredEvidenceDimensions, "$.requiredEvidenceDimensions", errors);
  const constructIds = new Set();
  for (const [expectationIndex, expectation] of (policy.expectations || []).entries()) {
    for (const [constructIndex, construct] of (expectation?.constructs || []).entries()) {
      const base = `$.expectations[${expectationIndex}].constructs[${constructIndex}]`;
      if (constructIds.has(construct.id)) errors.push(issue("question_evaluation.construct_id_duplicate", `${base}.id`, construct.id));
      constructIds.add(construct.id);
      for (const [tagIndex, tag] of (construct.supportTags || []).entries()) if (!semanticTags.has(tag)) errors.push(issue("question_evaluation.support_tag_unknown", `${base}.supportTags[${tagIndex}]`, tag));
      for (const [tagIndex, tag] of (construct.counterTags || []).entries()) {
        if (!semanticTags.has(tag)) errors.push(issue("question_evaluation.counter_tag_unknown", `${base}.counterTags[${tagIndex}]`, tag));
        if ((construct.supportTags || []).includes(tag)) errors.push(issue("question_evaluation.construct_tags_overlap", `${base}.counterTags[${tagIndex}]`, tag));
      }
    }
  }
  for (const [index, criterion] of (policy.criteria || []).entries()) checkDimensions(criterion?.focusDimensions, `$.criteria[${index}].focusDimensions`, errors);

  const grades = (policy.expectations || []).filter((item) => item.resultMode === "alignment-grade");
  const observeOnly = (policy.expectations || []).filter((item) => item.id === "observe-only" && item.resultMode === "situation-map");
  if (policy.outputContract === "alignment-grade") {
    if (grades.length < 2) errors.push(issue("question_evaluation.alignment_grades_missing", "$.expectations", grades.length));
    if (observeOnly.length !== 1) errors.push(issue("question_evaluation.observe_only_invalid", "$.expectations", observeOnly.length));
    if (grades.length + observeOnly.length !== (policy.expectations || []).length) {
      errors.push(issue("question_evaluation.expectation_mode_invalid", "$.expectations", policy.expectations.length));
    }
    if ((policy.allowedSpreads || []).includes("single")) errors.push(issue("question_evaluation.single_grade_forbidden", "$.allowedSpreads", "single"));
  } else if ((policy.expectations || []).length) {
    errors.push(issue("question_evaluation.expectations_not_allowed", "$.expectations", policy.outputContract));
  }
  if (policy.criterionMode === "none" && (policy.criteria || []).length) {
    errors.push(issue("question_evaluation.criteria_not_allowed", "$.criteria", policy.criteria.length));
  }
  if (["optional", "required"].includes(policy.criterionMode) && !(policy.criteria || []).length) {
    errors.push(issue("question_evaluation.criteria_missing", "$.criteria", policy.criterionMode));
  }
  if (policy.outputContract === "comparison-support") {
    if (policy.criterionMode !== "required") errors.push(issue("question_evaluation.comparison_criterion_mode_invalid", "$.criterionMode", policy.criterionMode));
    if ((policy.criteria || []).length < 2) errors.push(issue("question_evaluation.comparison_criteria_missing", "$.criteria", policy.criteria?.length || 0));
    if (JSON.stringify(policy.allowedSpreads) !== JSON.stringify(["timeline"])) {
      errors.push(issue("question_evaluation.comparison_spread_invalid", "$.allowedSpreads", policy.allowedSpreads));
    }
  }
  if (policy.outputContract === "alignment-grade" && policy.criterionMode !== "none") {
    errors.push(issue("question_evaluation.alignment_criterion_mode_invalid", "$.criterionMode", policy.criterionMode));
  }
  if (question) {
    if (question.id !== policy.questionId) errors.push(issue("question_evaluation.question_id_mismatch", "$.questionId", policy.questionId));
    const questionDimensions = new Set(question.answerDimensions || []);
    for (const [index, value] of (policy.requiredEvidenceDimensions || []).entries()) {
      if (!questionDimensions.has(value)) errors.push(issue("question_evaluation.dimension_not_in_question", `$.requiredEvidenceDimensions[${index}]`, value));
    }
    const supportedSpreads = new Set(Object.keys(question.spreadProfiles || {}));
    for (const [index, value] of (policy.allowedSpreads || []).entries()) {
      if (!supportedSpreads.has(value)) errors.push(issue("question_evaluation.spread_not_in_question", `$.allowedSpreads[${index}]`, value));
    }
    for (const [criterionIndex, criterion] of (policy.criteria || []).entries()) {
      for (const [dimensionIndex, value] of (criterion.focusDimensions || []).entries()) {
        if (!questionDimensions.has(value)) errors.push(issue("question_evaluation.criterion_dimension_not_in_question", `$.criteria[${criterionIndex}].focusDimensions[${dimensionIndex}]`, value));
      }
    }
  }
  return errors.sort((left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code));
}
