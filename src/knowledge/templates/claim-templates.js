export const CLAIM_TEMPLATES = Object.freeze({
  sectionOpeners: Object.freeze([
    "从这一层的牌面证据看，",
    "这一部分更值得注意的是，",
    "放在当前问题中，这组证据提示，",
  ]),
  conclusionOpeners: Object.freeze([
    "综合现有证据，",
    "把各层信息合在一起，",
    "在保留不确定性的前提下，",
  ]),
  conditionOpeners: Object.freeze([
    "这个判断成立时，需要同时留意：",
    "结论仍受以下条件约束：",
    "继续观察时，可把这些条件作为检查点：",
  ]),
  conflictText: "牌面之间仍有不同方向的证据，因此这里保留张力，不把其中一方静默删除。",
  gapText: "部分问题维度目前证据不足，解读到此为止，不再向外推断。",
  conclusionLabels: Object.freeze({
    "act-now": "当前更偏向可以行动，但仍应核对现实条件",
    "act-with-conditions": "当前更适合在条件明确后行动",
    "wait-and-prepare": "当前更适合先准备并继续观察",
    "adjust-current-path": "当前更适合调整现有路径",
    "currently-unfavorable": "当前条件偏不利，宜降低推进强度",
    "indeterminate": "现有证据不足以给出单一方向",
  }),
  conditionLabels: Object.freeze({
    "maintain-evidence-boundary": "只依据已经出现的证据作判断",
    "low-relation-confidence": "关系证据置信度较低",
    "position-conditional": "牌位本身带有条件性",
    "position-contextual": "需要结合上下文",
    "relation-conditions": "两张牌之间存在条件关系",
    "relation-transforms": "后续变化可能改变当前判断",
    "relation-repairs": "修正行动会影响结果",
  }),
});

export function humanConclusionLabel(type) {
  return CLAIM_TEMPLATES.conclusionLabels[type] || "当前只能给出有限、可复核的方向判断";
}

export function humanConditionLabel(condition) {
  if (CLAIM_TEMPLATES.conditionLabels[condition]) return CLAIM_TEMPLATES.conditionLabels[condition];
  if (condition.startsWith("reversal-")) return "逆位机制使证据需要谨慎解释";
  if (condition.startsWith("position-")) return "牌位职责要求结合具体情境";
  if (condition.startsWith("relation-")) return "牌与牌之间的关系会影响结论";
  return "继续核对现实条件";
}
