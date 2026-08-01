import { executeReadingEngine } from "../runtime/reading-engine.js";
import { createDecisiveInterpretation } from "./verdict.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

export async function executeDecisiveReading({
  questionId,
  questionText,
  spreadId,
  draws,
} = {}) {
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
  const synthesis = createDecisiveInterpretation({
    engineResult,
    questionText,
    draws,
  });
  return deepFreeze({ synthesis, engineResult });
}
