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

export function createDialogController({ dom, state }) {
  function openDialog(dialog) {
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  function closeDialog(dialog) {
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
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
