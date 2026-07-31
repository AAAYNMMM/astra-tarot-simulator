const SAFE_COLOR = /^#[0-9a-fA-F]{6}$/;
const SAFE_IDENTIFIER = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function safeColor(value, fallback = "#d8bb7a") {
  const text = String(value ?? "");
  return SAFE_COLOR.test(text) ? text.toLowerCase() : fallback;
}

export function safeIdentifier(value, fallback = "unknown") {
  const text = String(value ?? "");
  return SAFE_IDENTIFIER.test(text) ? text : fallback;
}

export function setText(element, value) {
  element.textContent = value == null ? "" : String(value);
  return element;
}

export function createElement(documentRef, tagName, options = {}) {
  const element = documentRef.createElement(tagName);
  if (options.className) element.className = options.className;
  if (options.text != null) setText(element, options.text);
  for (const [name, value] of Object.entries(options.attributes || {})) {
    if (value != null) element.setAttribute(name, String(value));
  }
  return element;
}

export function replaceChildren(parent, children) {
  parent.replaceChildren(...children);
}
