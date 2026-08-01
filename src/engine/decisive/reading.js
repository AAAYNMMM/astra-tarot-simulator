import { executeReadingEngine } from "../runtime/reading-engine.js";
import { CARD_PROFILE_IDS, loadCardProfile } from "../../knowledge/cards/registry.js";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../../knowledge/questions/registry.js";
import { createLongformInterpretation } from "../longform/narrative.js";

let warmPromise = null;
let warmRuns = 0;

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

async function warmInBatches(ids, loader, size = 12) {
  for (let index = 0; index < ids.length; index += size) {
    await Promise.all(ids.slice(index, index + size).map((id) => loader(id)));
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

export function warmDecisiveReadingEngine() {
  if (warmPromise) return warmPromise;
  warmRuns += 1;
  warmPromise = (async () => {
    const startedAt = performance.now();
    await Promise.all([
      warmInBatches(CARD_PROFILE_IDS, loadCardProfile),
      warmInBatches(QUESTION_PROFILE_IDS, loadQuestionProfile),
    ]);
    return deepFreeze({
      status: "ready",
      warmRuns,
      cardProfiles: CARD_PROFILE_IDS.length,
      questionProfiles: QUESTION_PROFILE_IDS.length,
      durationMs: Number((performance.now() - startedAt).toFixed(3)),
    });
  })();
  warmPromise.catch(() => {
    warmPromise = null;
  });
  return warmPromise;
}

export async function executeDecisiveReading({
  questionId,
  questionText,
  categoryId,
  spreadId,
  draws,
} = {}) {
  const startedAt = performance.now();
  const engineResult = await executeReadingEngine({
    questionId,
    spreadId,
    draws: (draws || []).map((draw) => ({
      cardId: draw.cardId,
      positionId: draw.positionId,
      orientation: draw.orientation,
    })),
    renderingStream: null,
  });
  const synthesis = createLongformInterpretation({
    engineResult,
    questionId,
    questionText,
    categoryId,
    spreadId,
    draws,
  });
  return deepFreeze({
    synthesis,
    engineResult,
    performance: {
      workerExecutionMs: Number((performance.now() - startedAt).toFixed(3)),
      warmStarted: Boolean(warmPromise),
      warmRuns,
    },
  });
}
