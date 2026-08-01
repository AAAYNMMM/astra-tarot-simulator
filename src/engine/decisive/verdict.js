const HEDGE_PATTERNS = Object.freeze([
  /可能/g,
  /也许/g,
  /或许/g,
  /倾向于?/g,
  /值得留意(?:的是)?/g,
  /继续观察/g,
  /不宜作确定判断/g,
  /在保留不确定性的前提下/g,
]);

const VERDICTS = Object.freeze({
  advance: Object.freeze({
    code: "advance",
    label: "推进",
    directive: "进入执行，不再等待额外信号。",
  }),
  conditional: Object.freeze({
    code: "conditional",
    label: "有条件推进",
    directive: "先核对决定性条件；条件成立就执行，条件不成立就停止。",
  }),
  wait: Object.freeze({
    code: "wait",
    label: "等待",
    directive: "现在不作最终投入，等关键事实出现后再决定。",
  }),
  adjust: Object.freeze({
    code: "adjust",
    label: "调整",
    directive: "停止沿用当前方法，改变路径后再推进。",
  }),
  stop: Object.freeze({
    code: "stop",
    label: "停止",
    directive: "停止新增投入，不继续维持当前方向。",
  }),
  redirect: Object.freeze({
    code: "redirect",
    label: "结束并转向",
    directive: "结束当前方向，把资源转向新的选择。",
  }),
});

const STANCE_GROUP = Object.freeze({
  supportive: "positive",
  cautionary: "negative",
  conditional: "conditional",
  transformative: "transformative",
  descriptive: "neutral",
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/[，。；：、“”‘’！？,.!?;:()（）【】\[\]]/g, "")
    .toLowerCase();
}

function directText(value) {
  let text = String(value || "").replace(/\s+/g, " ").trim();
  for (const pattern of HEDGE_PATTERNS) text = text.replace(pattern, "");
  return text
    .replace(/需要结合[^。；]+共同理解/g, "")
    .replace(/现有证据(?:指向|提示)/g, "")
    .replace(/当前(?:更)?(?:适合|偏向)/g, "")
    .replace(/^\s*[，、；：]\s*/g, "")
    .replace(/\s+/g, " ")
    .replace(/[。；;]+$/g, "")
    .trim();
}

function uniqueText(values) {
  const kept = [];
  const keys = [];
  for (const value of values) {
    const text = directText(value);
    const key = normalizeText(text);
    if (!key) continue;
    if (keys.some((known) => known === key || known.includes(key) || key.includes(known))) continue;
    kept.push(text);
    keys.push(key);
  }
  return kept;
}

function score(candidate) {
  return Number(candidate?.score || 0);
}

function totals(candidates) {
  const result = {
    positive: 0,
    negative: 0,
    conditional: 0,
    transformative: 0,
    neutral: 0,
  };
  for (const candidate of candidates) {
    const group = STANCE_GROUP[candidate.stance] || "neutral";
    result[group] += score(candidate);
  }
  return result;
}

function fromConclusionType(type) {
  const value = String(type || "");
  if (/(release|ending|leave|close|redirect|end)/.test(value)) return "redirect";
  if (/(unfavorable|avoid|pause|stop|decline|not-ready|no-)/.test(value)) return "stop";
  if (/(adjust|repair|balance|boundary|review|clarify|change|transform)/.test(value)) return "adjust";
  if (/(wait|prepare|observe|slow)/.test(value)) return "wait";
  if (/(condition|cautious)/.test(value)) return "conditional";
  if (/(act-now|favorable|continue|proceed|open|growth|advance|accept|yes|strengthen)/.test(value)) return "advance";
  return null;
}

function resolveVerdict(claim, candidates) {
  const mapped = fromConclusionType(claim?.conclusionType);
  if (mapped && claim?.conclusionCategory !== "indeterminate") {
    if (mapped === "advance" && claim?.conditions?.length) return VERDICTS.conditional;
    return VERDICTS[mapped];
  }

  const sum = totals(candidates);
  const ordered = [...candidates].sort((left, right) => (
    score(right) - score(left)
    || Number(left.sourceOrder || 0) - Number(right.sourceOrder || 0)
    || String(left.id).localeCompare(String(right.id))
  ));
  const top = ordered[0];
  if (!top) return VERDICTS.wait;

  if (sum.negative > sum.positive + 0.18) {
    return sum.negative >= 1.2 || score(top) >= 0.76 ? VERDICTS.stop : VERDICTS.adjust;
  }
  if (sum.positive > sum.negative + 0.18) {
    return sum.conditional >= sum.positive * 0.65 || claim?.conditions?.length
      ? VERDICTS.conditional
      : VERDICTS.advance;
  }
  if (top.stance === "supportive") return claim?.conditions?.length ? VERDICTS.conditional : VERDICTS.advance;
  if (top.stance === "cautionary") return score(top) >= 0.72 ? VERDICTS.stop : VERDICTS.adjust;
  if (top.stance === "transformative") return VERDICTS.adjust;
  if (top.stance === "conditional") return VERDICTS.conditional;
  return VERDICTS.wait;
}

function strengthFor(candidates) {
  const grouped = Object.values(totals(candidates)).sort((a, b) => b - a);
  const first = grouped[0] || 0;
  const second = grouped[1] || 0;
  const total = grouped.reduce((sum, value) => sum + value, 0) || 1;
  const separation = Math.max(0, first - second) / total;
  return Math.max(55, Math.min(96, Math.round(58 + separation * 95)));
}

function displayForPositions(positionIds, draws) {
  const byPosition = new Map((draws || []).map((draw) => [draw.positionId, draw]));
  const selected = positionIds.map((id) => byPosition.get(id)).filter(Boolean);
  return {
    positionIds: selected.map((item) => item.positionId),
    positionName: selected.map((item) => item.positionName).join(" → "),
    cardId: selected.map((item) => item.cardId).join("+"),
    cardName: selected.map((item) => item.cardName).join(" / "),
    orientation: selected.map((item) => item.orientation === "reversed" ? "逆位" : "正位").join(" / "),
  };
}

function roleFor(stance) {
  return {
    supportive: "推动",
    cautionary: "阻断",
    conditional: "设定门槛",
    transformative: "改变方向",
    descriptive: "界定局面",
  }[stance] || "界定局面";
}

function createFactors(candidates, draws) {
  const factors = [];
  const seen = [];
  for (const candidate of candidates) {
    const text = uniqueText(candidate.semanticSeeds || [])[0];
    if (!text) continue;
    const key = normalizeText(text);
    if (seen.some((known) => known === key || known.includes(key) || key.includes(known))) continue;
    const display = displayForPositions(candidate.positionIds || [], draws);
    if (!display.positionName || !display.cardName) continue;
    factors.push({
      candidateId: candidate.id,
      positionIds: display.positionIds,
      positionName: display.positionName,
      cardId: display.cardId,
      cardName: display.cardName,
      orientation: display.orientation,
      role: roleFor(candidate.stance),
      text,
      score: score(candidate),
    });
    seen.push(key);
    if (factors.length === 3) break;
  }
  return factors;
}

function createTrajectory(factors) {
  if (factors.length === 0) return "牌阵没有形成可用的主导链，结果由等待规则收束。";
  if (factors.length === 1) {
    return `走势由“${factors[0].positionName}”的${factors[0].cardName}单点定向，作用是${factors[0].role}。`;
  }
  if (factors.length === 2) {
    return `走势先由“${factors[0].positionName}”定调，再由“${factors[1].positionName}”完成${factors[1].role}。`;
  }
  return `走势从“${factors[0].positionName}”起步，经“${factors[1].positionName}”转折，最终由“${factors[2].positionName}”收束。`;
}

function oppositeStances(code) {
  if (["advance", "conditional"].includes(code)) return new Set(["cautionary"]);
  if (["stop", "redirect"].includes(code)) return new Set(["supportive"]);
  if (code === "adjust") return new Set(["supportive", "cautionary"]);
  return new Set(["supportive", "cautionary", "transformative"]);
}

function createChangeCondition(verdict, candidates, factorIds) {
  const wanted = oppositeStances(verdict.code);
  const opposing = candidates.find((candidate) => (
    wanted.has(candidate.stance)
    && !factorIds.has(candidate.id)
    && uniqueText(candidate.semanticSeeds || []).length
  ));
  if (!opposing) {
    return "当前牌阵无改判条件；只有现实前提发生实质变化，才需要重新起牌。";
  }
  const seed = uniqueText(opposing.semanticSeeds)[0];
  return `只有当“${seed}”成为现实中的主导事实，当前判断才会改变。`;
}

export function validateDecisiveInterpretation(result) {
  const errors = [];
  if (!result?.verdict?.code || !VERDICTS[result.verdict.code]) errors.push("A single decisive verdict is required.");
  const visible = [
    result?.judgment,
    result?.trajectory,
    result?.changeCondition,
    ...(result?.decisiveFactors || []).map((item) => item.text),
  ].join("\n");
  for (const pattern of HEDGE_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(visible)) errors.push(`Hedge phrase leaked: ${pattern}`);
  }
  const factorKeys = (result?.decisiveFactors || []).map((item) => normalizeText(item.text));
  if (new Set(factorKeys).size !== factorKeys.length) errors.push("Decisive factors contain duplicate text.");
  if ((result?.decisiveFactors || []).length > 3) errors.push("Too many decisive factors.");
  return errors;
}

export function createDecisiveInterpretation({
  engineResult,
  questionText,
  draws,
} = {}) {
  if (!engineResult?.claim || !engineResult?.resolution) {
    throw new TypeError("Structured engine result is required.");
  }
  const candidates = [...(engineResult.resolution.activeCandidates || [])].sort((left, right) => (
    score(right) - score(left)
    || Number(left.sourceOrder || 0) - Number(right.sourceOrder || 0)
    || String(left.id).localeCompare(String(right.id))
  ));
  const verdict = resolveVerdict(engineResult.claim, candidates);
  const decisiveFactors = createFactors(candidates, draws || []);
  const result = {
    schemaVersion: "2.0.0",
    verdict: {
      ...verdict,
      strength: strengthFor(candidates),
      rule: "net-score-evidence-coverage-stable-order",
    },
    judgment: `对“${directText(questionText) || "当前问题"}”的判定：${verdict.label}。${verdict.directive}`,
    trajectory: createTrajectory(decisiveFactors),
    decisiveFactors,
    changeCondition: createChangeCondition(
      verdict,
      candidates,
      new Set(decisiveFactors.map((item) => item.candidateId)),
    ),
    provenance: {
      claimId: engineResult.claim.id,
      activeCandidateCount: candidates.length,
      verdictRule: "net-score-evidence-coverage-stable-order",
    },
  };
  const errors = validateDecisiveInterpretation(result);
  if (errors.length) throw new Error(errors.join("; "));
  return deepFreeze(result);
}

export { HEDGE_PATTERNS, VERDICTS };
