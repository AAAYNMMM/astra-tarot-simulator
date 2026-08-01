import { executeDecisiveReading } from "../engine/decisive/reading.js";

self.addEventListener("message", async (event) => {
  const message = event.data || {};
  if (message.type !== "ASTRA_SYNTHESIZE_READING" || !message.id) return;
  try {
    const value = await executeDecisiveReading(message.payload);
    self.postMessage({
      id: message.id,
      status: "completed",
      value,
    });
  } catch (error) {
    self.postMessage({
      id: message.id,
      status: "failed",
      error: {
        name: error?.name || "Error",
        message: error?.message || "Reading worker failed.",
      },
    });
  }
});
