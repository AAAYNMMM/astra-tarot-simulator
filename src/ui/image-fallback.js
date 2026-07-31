const DEFAULT_PLACEHOLDER = "./icon.svg";

export function installImageFallbacks(documentRef = globalThis.document, {
  placeholderUrl = DEFAULT_PLACEHOLDER,
} = {}) {
  if (!documentRef?.addEventListener) return () => {};
  const onError = (event) => {
    const image = event.target;
    if (!image || String(image.tagName).toUpperCase() !== "IMG") return;
    if (image.dataset.imageStatus === "unavailable") return;
    image.dataset.imageStatus = "unavailable";
    image.alt = image.alt || "牌面图片暂时不可用";
    image.src = placeholderUrl;
  };
  documentRef.addEventListener("error", onError, true);
  return () => documentRef.removeEventListener("error", onError, true);
}
