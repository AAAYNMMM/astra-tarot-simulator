// Legacy-only adapter retained for read-only Phase 13 fixtures. The current
// application never constructs this renderer and exposes no evaluation UI.
export function createEvaluationSetupRenderer({ documentRef, state, dom, currentPolicy = null } = {}) {
  if (typeof currentPolicy !== "function") {
    return Object.freeze({
      renderEvaluationSetup() { return true; },
      isEvaluationSelectionValid() { return true; },
      readSelectionFromInputs() { return null; },
      setLocked() {},
    });
  }
  let locked = false;
  const normalized = (value) => typeof value === "string" ? value.trim() : "";

  function valid() {
    const policy = currentPolicy();
    if (policy.outputContract === "alignment-grade") {
      return Boolean((policy.expectations || []).some((item) => item.id === state.expectationId));
    }
    if (policy.outputContract === "comparison-support") {
      const first = normalized(state.comparisonOptionA);
      const second = normalized(state.comparisonOptionB);
      return Boolean((policy.criteria || []).some((item) => item.id === state.criterionId) && first && second && first !== second);
    }
    return true;
  }

  function buttonFor(item, key) {
    const button = documentRef.createElement("button");
    button.type = "button";
    button.dataset[key] = item.id;
    button.textContent = item.label;
    button.disabled = locked;
    return button;
  }

  function renderEvaluationSetup() {
    const policy = currentPolicy();
    const alignment = policy.outputContract === "alignment-grade";
    const comparison = policy.outputContract === "comparison-support";
    dom.evaluationSetupSection.hidden = false;
    dom.expectationList.replaceChildren(...(alignment ? (policy.expectations || []).map((item) => buttonFor(item, "expectationId")) : []));
    dom.criterionList.replaceChildren(...(comparison ? (policy.criteria || []).map((item) => buttonFor(item, "criterionId")) : []));
    dom.comparisonPathFields.hidden = !comparison;
    if (comparison) {
      dom.comparisonOptionA.value = state.comparisonOptionA || "";
      dom.comparisonOptionB.value = state.comparisonOptionB || "";
      dom.comparisonOptionA.disabled = locked;
      dom.comparisonOptionB.disabled = locked;
    }
    dom.startReading.disabled = locked || !valid();
    return valid();
  }

  function readSelectionFromInputs() {
    const policy = currentPolicy();
    return Object.freeze({
      outputContract: policy.outputContract,
      expectationId: policy.outputContract === "alignment-grade" ? state.expectationId || null : null,
      criterionId: policy.outputContract === "comparison-support" ? state.criterionId || null : null,
      comparisonOptions: policy.outputContract === "comparison-support"
        ? Object.freeze([{ id: "a", label: normalized(state.comparisonOptionA) }, { id: "b", label: normalized(state.comparisonOptionB) }])
        : Object.freeze([]),
    });
  }

  function setLocked(nextLocked) {
    locked = Boolean(nextLocked);
    for (const container of [dom.expectationList, dom.criterionList, dom.comparisonPathFields]) {
      container?.querySelectorAll?.("button, input").forEach((item) => { item.disabled = locked; });
    }
    dom.startReading.disabled = locked || !valid();
  }

  return Object.freeze({ renderEvaluationSetup, isEvaluationSelectionValid: valid, readSelectionFromInputs, setLocked });
}
