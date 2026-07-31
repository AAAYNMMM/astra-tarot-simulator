export function formatDate(dateValue) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(dateValue));
  } catch {
    return String(dateValue);
  }
}

export function createDialogController({ dom, state, documentRef = globalThis.document }) {
  const returnFocus = new WeakMap();

  function focusFirst(dialog) {
    const target = dialog.querySelector?.(
      "[autofocus], button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])",
    );
    target?.focus?.({ preventScroll: true });
  }

  function openDialog(dialog) {
    if (documentRef?.activeElement) returnFocus.set(dialog, documentRef.activeElement);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    queueMicrotask(() => focusFirst(dialog));
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
    const target = returnFocus.get(dialog);
    returnFocus.delete(dialog);
    queueMicrotask(() => target?.focus?.({ preventScroll: true }));
  }

  function confirmAction(title, message, acceptLabel = "确认") {
    dom.confirmTitle.textContent = title;
    dom.confirmMessage.textContent = message;
    dom.confirmAccept.textContent = acceptLabel;
    openDialog(dom.confirmDialog);
    return new Promise((resolve) => {
      state.confirmResolver = resolve;
    });
  }

  function resolveConfirmation(value) {
    if (!state.confirmResolver) return;
    const resolver = state.confirmResolver;
    state.confirmResolver = null;
    closeDialog(dom.confirmDialog);
    resolver(value);
  }

  return Object.freeze({ openDialog, closeDialog, confirmAction, resolveConfirmation });
}
