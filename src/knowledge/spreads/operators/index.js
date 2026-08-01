export { SINGLE_POSITION_OPERATORS } from "./single.js";
export { TIMELINE_POSITION_OPERATORS } from "./timeline.js";
export { CROSS_POSITION_OPERATORS } from "./cross.js";
export { CELTIC_POSITION_OPERATORS } from "./celtic.js";
export {
  LEGACY_SINGLE_POSITION_OPERATORS,
  LEGACY_TIMELINE_POSITION_OPERATORS,
  LEGACY_CROSS_POSITION_OPERATORS,
  LEGACY_CELTIC_POSITION_OPERATORS,
  LEGACY_POSITION_OPERATOR_GROUPS,
} from "./legacy-v1.js";
import { SINGLE_POSITION_OPERATORS } from "./single.js";
import { TIMELINE_POSITION_OPERATORS } from "./timeline.js";
import { CROSS_POSITION_OPERATORS } from "./cross.js";
import { CELTIC_POSITION_OPERATORS } from "./celtic.js";
import { LEGACY_POSITION_OPERATOR_GROUPS } from "./legacy-v1.js";

export const POSITION_OPERATOR_GROUPS = Object.freeze({
  single: SINGLE_POSITION_OPERATORS,
  timeline: TIMELINE_POSITION_OPERATORS,
  cross: CROSS_POSITION_OPERATORS,
  celtic: CELTIC_POSITION_OPERATORS,
});

export function getPositionOperator(spreadId, positionId, definitionVersion = "2.0.0") {
  const groups = definitionVersion === "1.0.0" ? LEGACY_POSITION_OPERATOR_GROUPS : POSITION_OPERATOR_GROUPS;
  return groups[spreadId]?.find((item) => item.positionId === positionId) || null;
}

export const getLegacyPositionOperator = (spreadId, positionId) => getPositionOperator(spreadId, positionId, "1.0.0");

export const POSITION_EVIDENCE_WEIGHTS = Object.freeze(Object.fromEntries(
  Object.entries(POSITION_OPERATOR_GROUPS).map(([spreadId, operators]) => [
    spreadId,
    Object.freeze(Object.fromEntries(operators.map((operator) => [operator.positionId, operator.weight]))),
  ]),
));

export const LEGACY_POSITION_EVIDENCE_WEIGHTS = Object.freeze(Object.fromEntries(
  Object.entries(LEGACY_POSITION_OPERATOR_GROUPS).map(([spreadId, operators]) => [
    spreadId,
    Object.freeze(Object.fromEntries(operators.map((operator) => [operator.positionId, operator.weight]))),
  ]),
));
