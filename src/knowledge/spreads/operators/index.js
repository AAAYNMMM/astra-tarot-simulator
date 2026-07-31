export { SINGLE_POSITION_OPERATORS } from "./single.js";
export { TIMELINE_POSITION_OPERATORS } from "./timeline.js";
export { CROSS_POSITION_OPERATORS } from "./cross.js";
export { CELTIC_POSITION_OPERATORS } from "./celtic.js";
import { SINGLE_POSITION_OPERATORS } from "./single.js";
import { TIMELINE_POSITION_OPERATORS } from "./timeline.js";
import { CROSS_POSITION_OPERATORS } from "./cross.js";
import { CELTIC_POSITION_OPERATORS } from "./celtic.js";

export const POSITION_OPERATOR_GROUPS = Object.freeze({
  single: SINGLE_POSITION_OPERATORS,
  timeline: TIMELINE_POSITION_OPERATORS,
  cross: CROSS_POSITION_OPERATORS,
  celtic: CELTIC_POSITION_OPERATORS,
});

export function getPositionOperator(spreadId, positionId) {
  return POSITION_OPERATOR_GROUPS[spreadId]?.find((item) => item.positionId === positionId) || null;
}
