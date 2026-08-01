export { createSingleWorkflow, buildSingleWorkflow, runSingleWorkflow } from "./single.js";
export { createTimelineWorkflow, buildTimelineWorkflow, runTimelineWorkflow } from "./timeline.js";
export { createCrossWorkflow, buildCrossWorkflow, runCrossWorkflow } from "./cross.js";
export { createCelticWorkflow, buildCelticWorkflow, runCelticWorkflow } from "./celtic.js";

import { createSingleWorkflow } from "./single.js";
import { createTimelineWorkflow } from "./timeline.js";
import { createCrossWorkflow } from "./cross.js";
import { createCelticWorkflow } from "./celtic.js";

const WORKFLOWS = Object.freeze({
  single: createSingleWorkflow,
  timeline: createTimelineWorkflow,
  cross: createCrossWorkflow,
  celtic: createCelticWorkflow,
});

export function createSpreadWorkflow(spreadId, input = {}) {
  const resolvedSpreadId = typeof spreadId === "object" ? spreadId?.spreadId : spreadId;
  const resolvedInput = typeof spreadId === "object" ? spreadId : input;
  const workflow = WORKFLOWS[resolvedSpreadId];
  if (!workflow) throw new RangeError(`Unsupported spread workflow: ${resolvedSpreadId}.`);
  return workflow(resolvedInput);
}

export const runSpreadWorkflow = createSpreadWorkflow;
