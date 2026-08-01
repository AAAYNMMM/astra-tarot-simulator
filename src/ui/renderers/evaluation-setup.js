import { createElement, replaceChildren, setText } from "../safe-dom.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function normalized(value) {
  return typeof value === "string" ? value.trim() : "";
}

function policyEntry(items, id) {
  return (items || []).find((item) => item?.id === id) || null;
}

export function createEvaluationSetupRenderer({
  documentRef,
  state,
  dom,
  currentPolicy,
  onSelectionValidityChange = () => {},
} = {}) {
  if (!documentRef || !state || !dom || typeof currentPolicy !== "function") {
    throw new TypeError("Evaluation setup renderer requires document, state, DOM bindings, and currentPolicy.");
  }
  let locked = false;

  function readPolicy() {
    const policy = currentPolicy();
    if (!policy?.outputContract) throw new TypeError("Current QuestionEvaluationPolicy is required.");
    return policy;
  }

  function isEvaluationSelectionValid() {
    const policy = readPolicy();
    if (policy.outputContract === "alignment-grade") {
      return Boolean(policyEntry(policy.expectations, state.expectationId));
    }
    if (policy.outputContract === "comparison-support") {
      const criterionValid = Boolean(policyEntry(policy.criteria, state.criterionId));
      const optionA = normalized(state.comparisonOptionA);
      const optionB = normalized(state.comparisonOptionB);
      return criterionValid && Boolean(optionA) && Boolean(optionB) && optionA !== optionB;
    }
    return true;
  }

  function readSelectionFromInputs() {
    const policy = readPolicy();
    const isComparison = policy.outputContract === "comparison-support";
    const optionA = normalized(dom.comparisonOptionA?.value ?? state.comparisonOptionA);
    const optionB = normalized(dom.comparisonOptionB?.value ?? state.comparisonOptionB);
    return deepFreeze({
      outputContract: policy.outputContract,
      expectationId: policy.outputContract === "alignment-grade" ? state.expectationId || null : null,
      criterionId: isComparison ? state.criterionId || null : null,
      comparisonOptions: deepFreeze(isComparison
        ? [{ id: "a", label: optionA }, { id: "b", label: optionB }]
        : []),
    });
  }

  function expectationButton(item) {
    const selected = item.id === state.expectationId;
    const button = createElement(documentRef, "button", {
      className: `evaluation-choice${selected ? " is-selected" : ""}`,
      attributes: { type: "button", "aria-pressed": String(selected) },
    });
    button.dataset.expectationId = item.id;
    button.disabled = locked;
    button.append(
      createElement(documentRef, "strong", { text: item.label }),
      createElement(documentRef, "small", { text: item.resultMode === "situation-map" ? "只观察当前证据，不显示等级" : "抽牌前锁定此期待" }),
    );
    return button;
  }

  function criterionButton(item) {
    const selected = item.id === state.criterionId;
    const button = createElement(documentRef, "button", {
      className: `evaluation-choice${selected ? " is-selected" : ""}`,
      attributes: { type: "button", "aria-pressed": String(selected) },
    });
    button.dataset.criterionId = item.id;
    button.disabled = locked;
    button.append(createElement(documentRef, "strong", { text: item.label }));
    return button;
  }

  function updateValidity(policy) {
    const valid = isEvaluationSelectionValid();
    const message = policy.outputContract === "alignment-grade"
      ? valid ? "期待会在抽牌前锁定；看牌后不能在原地切换期待。" : "请选择一个期待；抽牌后不能在原地切换期待。"
      : policy.outputContract === "comparison-support"
        ? valid ? "比较只提供参考：无总分、无自动赢家。" : "请选择比较维度，并填写两个不同的路径名称。"
        : "此问题不需要额外选择；抽牌前会锁定当前问题与牌阵。";
    setText(dom.evaluationValidationMessage, message);
    dom.startReading.disabled = locked || !valid;
    onSelectionValidityChange(valid);
    return valid;
  }

  function renderEvaluationSetup() {
    const policy = readPolicy();
    const contract = policy.outputContract;
    dom.evaluationSetupSection.hidden = false;
    setText(dom.evaluationSetupHeading, contract === "alignment-grade" ? "选择你的期待" : contract === "comparison-support" ? "设置比较路径" : "本次解读方式");
    setText(dom.evaluationSetupHint, contract === "alignment-grade"
      ? "请在抽牌前选定期待。牌面出现后，不能在原地更换期待。"
      : contract === "comparison-support"
        ? "填写两条要比较的路径。结果没有总分，也不会自动选出赢家。"
        : "本次问题会直接生成对应的解读方式，无需额外选择。"
    );

    replaceChildren(dom.expectationList, contract === "alignment-grade"
      ? (policy.expectations || []).map(expectationButton)
      : []);
    replaceChildren(dom.criterionList, contract === "comparison-support"
      ? (policy.criteria || []).map(criterionButton)
      : []);
    dom.expectationList.hidden = contract !== "alignment-grade";
    dom.criterionList.hidden = contract !== "comparison-support";
    dom.comparisonPathFields.hidden = contract !== "comparison-support";
    if (contract === "comparison-support") {
      dom.comparisonOptionA.value = state.comparisonOptionA || "";
      dom.comparisonOptionB.value = state.comparisonOptionB || "";
      dom.comparisonOptionA.maxLength = 40;
      dom.comparisonOptionB.maxLength = 40;
      dom.comparisonOptionA.disabled = locked;
      dom.comparisonOptionB.disabled = locked;
    }
    updateValidity(policy);
  }

  function setLocked(nextLocked) {
    locked = Boolean(nextLocked);
    for (const container of [dom.expectationList, dom.criterionList, dom.comparisonPathFields]) {
      container.querySelectorAll("button, input").forEach((item) => { item.disabled = locked; });
    }
    updateValidity(readPolicy());
  }

  return Object.freeze({ renderEvaluationSetup, isEvaluationSelectionValid, readSelectionFromInputs, setLocked });
}
