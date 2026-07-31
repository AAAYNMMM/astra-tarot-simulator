import { createElement, replaceChildren } from "../safe-dom.js";

const ACTION_LABELS = Object.freeze({
  retry: "重新尝试",
  "export-diagnostics": "导出诊断",
  "export-history": "导出历史",
  "manage-storage": "管理存储",
  "continue-online": "联网继续",
  "choose-file": "重新选择文件",
});

export function renderRecoveryPanel({
  documentRef,
  container,
  error,
  onAction = null,
} = {}) {
  if (!documentRef || !container || !error) throw new TypeError("Recovery panel inputs are required.");
  const section = createElement(documentRef, "section", {
    className: "recovery-panel",
    attributes: {
      role: error.severity === "error" ? "alert" : "status",
      "aria-labelledby": "recoveryPanelTitle",
      tabindex: "-1",
    },
  });
  section.append(
    createElement(documentRef, "h3", {
      text: "这一步没有完成",
      attributes: { id: "recoveryPanelTitle" },
    }),
    createElement(documentRef, "p", { text: error.userMessage }),
    createElement(documentRef, "small", { text: `错误码：${error.code}` }),
  );
  const actions = createElement(documentRef, "div", { className: "recovery-actions" });
  for (const action of error.recoveryActions || []) {
    const button = createElement(documentRef, "button", {
      className: action === "retry" ? "primary-button compact-primary" : "secondary-button",
      text: ACTION_LABELS[action] || action,
      attributes: { type: "button" },
    });
    button.dataset.recoveryAction = action;
    actions.append(button);
  }
  section.append(actions);
  actions.addEventListener("click", (event) => {
    const button = event.target.closest?.("[data-recovery-action]");
    if (button) onAction?.(button.dataset.recoveryAction);
  });
  replaceChildren(container, [section]);
  section.focus?.({ preventScroll: true });
  return section;
}
