import { createElement } from "../safe-dom.js";

export function createToast({ documentRef, windowRef, dom, reducedMotion }) {
  return function showToast(message, icon = "✦") {
    const toast = createElement(documentRef, "div", { className: "toast" });
    toast.append(
      createElement(documentRef, "span", { text: icon, attributes: { "aria-hidden": "true" } }),
      documentRef.createTextNode(String(message ?? "")),
    );
    dom.toastRegion.appendChild(toast);
    windowRef.setTimeout(() => {
      toast.classList.add("is-leaving");
      windowRef.setTimeout(() => toast.remove(), 260);
    }, reducedMotion.matches ? 900 : 2800);
  };
}
