const DEFAULT_PLACEHOLDER = "./icon.svg";
const DEFAULT_RETRY_DELAY_MS = 120;
const DEFAULT_MAX_RETRIES = 1;

function currentImageSource(image) {
  return image.dataset?.imageOriginalSrc
    || image.getAttribute?.("src")
    || image.currentSrc
    || image.src
    || "";
}

export function installImageFallbacks(documentRef = globalThis.document, {
  placeholderUrl = DEFAULT_PLACEHOLDER,
  maxRetries = DEFAULT_MAX_RETRIES,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  scheduleRetry = (callback, delay) => globalThis.setTimeout(callback, delay),
} = {}) {
  if (!documentRef?.addEventListener) return () => {};

  const onLoad = (event) => {
    const image = event.target;
    if (!image || String(image.tagName).toUpperCase() !== "IMG") return;
    if (image.dataset.imageStatus !== "retrying") return;
    delete image.dataset.imageStatus;
    delete image.dataset.imageRetryCount;
    delete image.dataset.imageOriginalSrc;
  };

  const onError = (event) => {
    const image = event.target;
    if (!image || String(image.tagName).toUpperCase() !== "IMG") return;
    if (image.dataset.imageStatus === "unavailable") return;

    const originalSrc = currentImageSource(image);
    if (originalSrc && !image.dataset.imageOriginalSrc) image.dataset.imageOriginalSrc = originalSrc;
    const retryCount = Number.parseInt(image.dataset.imageRetryCount || "0", 10) || 0;
    if (originalSrc && retryCount < maxRetries) {
      image.dataset.imageStatus = "retrying";
      image.dataset.imageRetryCount = String(retryCount + 1);
      scheduleRetry(() => {
        if (image.dataset.imageStatus !== "retrying") return;
        image.src = image.dataset.imageOriginalSrc || originalSrc;
      }, retryDelayMs);
      return;
    }

    image.dataset.imageStatus = "unavailable";
    image.alt = image.alt || "牌面图片暂时不可用";
    image.src = placeholderUrl;
  };

  documentRef.addEventListener("load", onLoad, true);
  documentRef.addEventListener("error", onError, true);
  return () => {
    documentRef.removeEventListener("load", onLoad, true);
    documentRef.removeEventListener("error", onError, true);
  };
}
