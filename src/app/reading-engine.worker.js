import {
  executeDecisiveReading,
  warmDecisiveReadingEngine,
} from "../engine/decisive/reading.js";

const SYNTHESIZE_MESSAGE = "ASTRA_SYNTHESIZE_READING";
const WARM_MESSAGE = "ASTRA_WARM_READING_ENGINE";

self.addEventListener("message", async (event) => {
  const message = event.data || {};
  if (!message.id) return;
  try {
    if (message.type === WARM_MESSAGE) {
      const value = await warmDecisiveReadingEngine();
      self.postMessage({ id: message.id, status: "ready", value });
      return;
    }
    if (message.type !== SYNTHESIZE_MESSAGE) return;
    const value = await executeDecisiveReading(message.payload);
    self.postMessage({ id: message.id, status: "completed", value });
  } catch (error) {
    self.postMessage({
      id: message.id,
      status: "failed",
      error: {
        code: error?.code || "ASTRA-ENGINE-EXECUTION",
        name: error?.name || "Error",
        message: error?.message || "Reading worker failed.",
      },
    });
  }
});
