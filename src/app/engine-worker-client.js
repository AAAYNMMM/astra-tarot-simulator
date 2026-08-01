const WORKER_MESSAGE = "ASTRA_SYNTHESIZE_READING";
const WARM_MESSAGE = "ASTRA_WARM_READING_ENGINE";

export function createReadingEngineWorkerClient({
  WorkerRef = globalThis.Worker,
  workerUrl = new URL("./reading-engine.worker.js", import.meta.url),
  timeoutMs = 30000,
} = {}) {
  let worker = null;
  let sequence = 0;
  let warmPromise = null;
  let workerCreations = 0;
  let synthesisRequests = 0;
  const pending = new Map();

  function failAll(error) {
    for (const item of pending.values()) {
      clearTimeout(item.timer);
      item.reject(error);
    }
    pending.clear();
  }

  function ensureWorker() {
    if (worker) return worker;
    if (typeof WorkerRef !== "function") {
      throw new Error("当前浏览器不支持模块 Worker，无法执行牌面推理。");
    }
    worker = new WorkerRef(workerUrl, {
      type: "module",
      name: "astra-reading-engine",
    });
    workerCreations += 1;
    worker.addEventListener("message", (event) => {
      const message = event.data || {};
      const item = pending.get(message.id);
      if (!item) return;
      clearTimeout(item.timer);
      pending.delete(message.id);
      if (message.status === "completed" || message.status === "ready") {
        item.resolve(message.value);
      } else {
        const error = new Error(message.error?.message || "牌面推理失败。");
        error.name = message.error?.name || "ReadingWorkerError";
        item.reject(error);
      }
    });
    worker.addEventListener("error", () => {
      failAll(new Error("牌面推理 Worker 已终止。"));
      worker?.terminate?.();
      worker = null;
      warmPromise = null;
    });
    return worker;
  }

  function request(type, payload = null) {
    const activeWorker = ensureWorker();
    const id = `reading-${Date.now()}-${sequence += 1}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(type === WARM_MESSAGE ? "牌面引擎预热超时。" : "牌面推理超时。"));
      }, timeoutMs);
      pending.set(id, { resolve, reject, timer });
      activeWorker.postMessage({ type, id, payload });
    });
  }

  function warmUp() {
    if (!warmPromise) {
      warmPromise = request(WARM_MESSAGE).catch((error) => {
        warmPromise = null;
        throw error;
      });
    }
    return warmPromise;
  }

  function synthesize(payload) {
    synthesisRequests += 1;
    void warmUp().catch(() => {});
    return request(WORKER_MESSAGE, payload);
  }

  function stats() {
    return Object.freeze({
      workerCreations,
      synthesisRequests,
      pendingRequests: pending.size,
      warmStarted: Boolean(warmPromise),
    });
  }

  function dispose() {
    failAll(new Error("牌面推理 Worker 已关闭。"));
    worker?.terminate?.();
    worker = null;
    warmPromise = null;
  }

  return Object.freeze({ warmUp, synthesize, stats, dispose });
}

export { WORKER_MESSAGE, WARM_MESSAGE };
