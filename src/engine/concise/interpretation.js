import {
  createDecisiveInterpretation,
  findUnboundedCertainty,
  VERDICTS,
} from "../decisive/verdict.js";

const OUTCOME_POSITION = Object.freeze({
  single: "essence",
  timeline: "future",
  cross: "trend",
  celtic: "outcome",
});

const ROLE_LABELS = Object.freeze({
  supportive: "推动",
  cautionary: "阻力",
  conditional: "门槛",
  transformative: "转向",
  descriptive: "现状",
});

const DOMAIN_GUIDANCE = Object.freeze({
  love: Object.freeze({
    success: "把回应节奏、边界与真实投入落实为可观察事实",
    failure: "互动持续停留在猜测、试探或单方面维持",
    turning: "联系节奏稳定，重要安排不再依赖临时情绪",
    action: "用一次清楚沟通核对双方能否给出稳定回应",
  }),
  career: Object.freeze({
    success: "确认职责、资源与阶段完成标准",
    failure: "任务持续增加，却没有相应权限、资源或可验证成果",
    turning: "关键责任被写清，资源开始围绕同一目标集中",
    action: "先确认一项可交付成果及其所需资源，再扩大投入",
  }),
  wealth: Object.freeze({
    success: "让现金流、真实成本与退出条件保持在可承受范围",
    failure: "收益预期先行，真实成本和风险却没有被量化",
    turning: "账面数字、合同条件与实际回款开始一致",
    action: "先核对数字、最坏成本与退出方式，再作财务决定",
  }),
  growth: Object.freeze({
    success: "把新的理解落实为持续行为，而不是停在情绪高点",
    failure: "反思增加，日常选择却继续重复原有惯性",
    turning: "旧反应不再自动出现，新的边界和习惯开始稳定",
    action: "选择一个可连续七天执行的小动作，检验新的理解",
  }),
  decision: Object.freeze({
    success: "确认关键事实、期限与可撤回方案",
    failure: "在证据不足时用焦虑或期待代替判断",
    turning: "最关键的未知项得到答案，两个选项的代价可以直接比较",
    action: "先补齐最关键的一项未知信息，再做可撤回的小步决定",
  }),
  daily: Object.freeze({
    success: "让时间、精力与执行顺序彼此配合",
    failure: "安排超过真实承载能力，注意力持续被切碎",
    turning: "最重要的一项任务能够连续推进，不再被反复打断",
    action: "先完成今天最关键的一件事，再处理低优先级请求",
  }),
});

const SUMMARY_DIRECTIVES = Object.freeze({
  advance: "可以推进",
  conditional: "可以推进，但必须先满足成立前提",
  wait: "先等待关键事实成形",
  adjust: "先调整路径，再决定是否继续",
  stop: "停止新增投入",
  redirect: "结束当前方向并转向",
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function cleanClause(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/^[^：。]{1,16}[：:]\s*/, "")
    .replace(/^[^：。]{1,24}作为[^：。]{0,18}(?:线索|证据)时指出[：:]?\s*/, "")
    .replace(/([。！？])[。；，、]+/g, "$1")
    .replace(/([；，、])\1+/g, "$1")
    .replace(/^[，；、\s]+|[。！？；，、\s]+$/g, "")
    .trim();
}

function sentence(value) {
  const text = cleanClause(value);
  return text ? `${text}。` : "";
}

function normalize(value) {
  return cleanClause(value)
    .replace(/[，。；：、“”‘’！？,.!?;:()（）【】\[\]《》]/g, "")
    .toLowerCase();
}

function unique(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value))];
}

function evidenceRefs(...items) {
  return unique(items.flat(Infinity));
}

function score(candidate) {
  return Number(candidate?.score || 0);
}

function observationForCandidate(candidate, observations) {
  const ids = new Set(candidate?.observationIds || []);
  return observations.find((item) => ids.has(item.id))
    || observations.find((item) => candidate?.positionIds?.includes(item.positionId))
    || null;
}

function refsFor(candidate, observation, claim) {
  const direct = evidenceRefs(
    candidate?.evidenceRefs || [],
    candidate?.relationIds || [],
    observation?.id,
    observation?.semanticUnitRef,
  );
  return direct.length ? direct : evidenceRefs(claim?.evidenceRefs || []);
}

function displayFor(candidate, draws) {
  const positions = new Set(candidate?.positionIds || []);
  const selected = draws.filter((draw) => positions.has(draw.positionId));
  return {
    positionIds: selected.map((draw) => draw.positionId),
    positionName: selected.map((draw) => draw.positionName).join(" → "),
  };
}

function domainFor(questionId, categoryId) {
  const prefix = String(categoryId || questionId || "daily").split("-")[0];
  return DOMAIN_GUIDANCE[prefix] || DOMAIN_GUIDANCE.daily;
}

function outcomeCandidate(candidates, spreadId) {
  const positionId = OUTCOME_POSITION[spreadId];
  const matching = candidates.filter((item) => item.positionIds?.includes(positionId));
  return matching.find((item) => item.positionIds.length === 1)
    || matching[0]
    || null;
}

function reconcileVerdict(baseVerdict, outcome, outcomeObservation) {
  let code = baseVerdict.code;
  if (outcome?.stance === "cautionary") {
    if (code === "advance") code = "conditional";
    else if (code === "conditional") code = score(outcome) >= 0.75 ? "adjust" : "wait";
  } else if (outcome?.stance === "transformative" && ["advance", "conditional"].includes(code)) {
    code = "adjust";
  }
  const outcomeRisk = Number(outcomeObservation?.dimensions?.risk || 0);
  const outcomeStability = Number(outcomeObservation?.dimensions?.stability || 0);
  if (outcomeRisk >= 3 && ["advance", "conditional"].includes(code)) code = "adjust";
  else if (outcomeStability <= -2 && code === "advance") code = "conditional";
  const resolved = VERDICTS[code] || VERDICTS.wait;
  return Object.freeze({
    ...resolved,
    strength: baseVerdict.strength,
    rule: outcome && code !== baseVerdict.code
      ? "structured-claim-with-outcome-reconciliation"
      : baseVerdict.rule,
  });
}

function candidateEvidence(candidate, observations, draws, claim, index, isOutcome = false) {
  const observation = observationForCandidate(candidate, observations);
  const display = displayFor(candidate, draws);
  const source = observation?.semanticText || candidate?.semanticSeeds?.[0] || "本牌位给出了有效的现实证据";
  return Object.freeze({
    id: `key-evidence-${index + 1}`,
    role: isOutcome ? "结果" : ROLE_LABELS[candidate?.stance] || ROLE_LABELS.descriptive,
    positionIds: Object.freeze(display.positionIds),
    text: sentence(`${display.positionName || "核心牌位"}显示：${source}`),
    evidenceRefs: Object.freeze(refsFor(candidate, observation, claim)),
  });
}

function createKeyEvidence(candidates, outcome, observations, draws, claim) {
  const ordered = [...candidates].sort((left, right) => (
    Number(right === outcome) - Number(left === outcome)
    || score(right) - score(left)
    || Number(left.sourceOrder || 0) - Number(right.sourceOrder || 0)
    || String(left.id).localeCompare(String(right.id))
  ));
  const result = [];
  const known = new Set();
  for (const candidate of ordered) {
    const observation = observationForCandidate(candidate, observations);
    const item = candidateEvidence(candidate, observations, draws, claim, result.length, candidate === outcome);
    const key = normalize(observation?.semanticText || candidate?.semanticSeeds?.join(" ") || item.text);
    if (!key || known.has(key)) continue;
    result.push(item);
    known.add(key);
    if (result.length === 4) break;
  }
  if (result.length === 1) {
    result.push(Object.freeze({
      id: "key-evidence-boundary",
      role: "边界",
      positionIds: Object.freeze([]),
      text: sentence(claim?.coverageGaps?.length
        ? "仍有问题维度缺少直接牌面证据，本次结论只覆盖已经出现的线索"
        : "本次判断只覆盖当前问题与牌位，不延伸到未出现的外部事实"),
      evidenceRefs: Object.freeze(evidenceRefs(claim?.evidenceRefs || [], result[0].evidenceRefs)),
    }));
  }
  return Object.freeze(result.slice(0, 4));
}

function conditionBlock({ candidates, observations, claim, domain, verdict, draws }) {
  const support = candidates.find((item) => item.stance === "supportive") || candidates[0];
  const obstacle = candidates.find((item) => item.stance === "cautionary")
    || candidates.find((item) => item.stance === "conditional")
    || candidates[candidates.length - 1];
  const supportDisplay = displayFor(support, draws);
  const obstacleDisplay = displayFor(obstacle, draws);
  const supportPosition = supportDisplay.positionName ? `${supportDisplay.positionName}的推动证据` : "推动证据";
  const obstaclePosition = obstacleDisplay.positionName ? `${obstacleDisplay.positionName}的阻力证据` : "阻力证据";
  return Object.freeze({
    success: Object.freeze({
      text: sentence(`${domain.success}，并让${supportPosition}连续兑现`),
      evidenceRefs: Object.freeze(refsFor(support, observationForCandidate(support, observations), claim)),
    }),
    failure: Object.freeze({
      text: sentence(`若${obstaclePosition}持续主导，或${domain.failure}，${["stop", "redirect"].includes(verdict.code) ? "维持停止决定" : "停止追加投入"}`),
      evidenceRefs: Object.freeze(refsFor(obstacle, observationForCandidate(obstacle, observations), claim)),
    }),
    turningPoint: Object.freeze({
      text: sentence(`${domain.turning}时，才视为局面已经转折`),
      evidenceRefs: Object.freeze(evidenceRefs(claim?.evidenceRefs || [])),
    }),
  });
}

function actionBlock({ candidates, observations, claim, draws, domain, verdict }) {
  const actionPositions = new Set(["action", "advice"]);
  const candidate = candidates.find((item) => item.positionIds?.some((id) => actionPositions.has(id)))
    || candidates[0];
  const observation = observationForCandidate(candidate, observations);
  const display = displayFor(candidate, draws);
  return Object.freeze({
    text: sentence(`${cleanClause(verdict.directive)}；${domain.action}`),
    positionIds: Object.freeze(display.positionIds),
    evidenceRefs: Object.freeze(refsFor(candidate, observation, claim)),
  });
}

function createCardEvidence(draws, observations, candidates, claim) {
  return Object.freeze(draws.map((draw, index) => {
    const observation = observations.find((item) => item.positionId === draw.positionId);
    const candidate = candidates.find((item) => item.positionIds?.includes(draw.positionId));
    return Object.freeze({
      id: `card-evidence-${index + 1}`,
      cardId: draw.cardId,
      cardName: draw.cardName,
      positionId: draw.positionId,
      positionName: draw.positionName,
      orientation: draw.orientation,
      role: ROLE_LABELS[candidate?.stance] || ROLE_LABELS.descriptive,
      text: sentence(observation?.semanticText || "该牌位只用于界定当前结论的证据边界"),
      evidenceRefs: Object.freeze(refsFor(candidate, observation, claim)),
    });
  }));
}

function visibleBlocks(result) {
  return [
    result.summary,
    ...result.keyEvidence,
    result.condition.success,
    result.condition.failure,
    result.condition.turningPoint,
    result.action,
    ...result.cardEvidence,
  ];
}

export function validateConciseInterpretation(result, { drawCount = null } = {}) {
  const errors = [];
  if (result?.schemaVersion !== "4.0.0") errors.push("Concise interpretation schemaVersion must be 4.0.0.");
  if (!VERDICTS[result?.summary?.verdictCode]) errors.push("A supported verdict is required.");
  if (!Array.isArray(result?.keyEvidence) || result.keyEvidence.length < 2 || result.keyEvidence.length > 4) {
    errors.push("Two to four key evidence items are required.");
  }
  if (drawCount !== null && result?.cardEvidence?.length !== drawCount) {
    errors.push("Every drawn card requires one cardEvidence item.");
  }
  const blocks = visibleBlocks(result);
  for (const block of blocks) {
    if (!block?.text && !block?.takeaway) errors.push("Every visible block requires text.");
    if (!Array.isArray(block?.evidenceRefs) || block.evidenceRefs.length === 0) {
      errors.push("Every visible block requires evidenceRefs.");
    }
  }
  const visible = blocks.map((item) => item?.text || item?.takeaway || "").join("\n");
  if (/[。！？][；，。]|[；，、]{2,}/.test(visible)) errors.push("Invalid punctuation sequence detected.");
  const certainty = findUnboundedCertainty(visible);
  if (certainty) errors.push(`Unbounded certainty phrase leaked: ${certainty}`);
  for (const collection of [result.keyEvidence || [], result.cardEvidence || []]) {
    const keys = collection.map((item) => normalize(item.text));
    if (new Set(keys).size !== keys.length) errors.push("Visible evidence contains duplicate text.");
  }
  if (!result?.condition?.success?.text || !result?.condition?.failure?.text) {
    errors.push("Success and failure conditions are required.");
  }
  if (result?.provenance?.outcomeEvidenceRef
    && !result.summary.evidenceRefs.includes(result.provenance.outcomeEvidenceRef)) {
    errors.push("The summary must reference the outcome evidence.");
  }
  return errors;
}

export function createConciseInterpretation({
  engineResult,
  questionText,
  questionId,
  categoryId,
  spreadId,
  draws,
} = {}) {
  if (!engineResult?.claim || !engineResult?.resolution) {
    throw new TypeError("Structured engine result is required.");
  }
  const observations = [...(engineResult.observations || [])];
  const candidates = [...(engineResult.resolution.activeCandidates || [])].sort((left, right) => (
    score(right) - score(left)
    || Number(left.sourceOrder || 0) - Number(right.sourceOrder || 0)
    || String(left.id).localeCompare(String(right.id))
  ));
  const base = createDecisiveInterpretation({ engineResult, questionText, draws });
  const outcome = outcomeCandidate(candidates, spreadId);
  const outcomeObservation = observations.find((item) => item.positionId === OUTCOME_POSITION[spreadId])
    || observationForCandidate(outcome, observations);
  const verdict = reconcileVerdict(base.verdict, outcome, outcomeObservation);
  const keyEvidence = createKeyEvidence(candidates, outcome, observations, draws || [], engineResult.claim);
  const outcomeRefs = refsFor(outcome, outcomeObservation, engineResult.claim);
  const focusText = cleanClause(outcomeObservation?.semanticText || keyEvidence[0]?.text);
  const summary = Object.freeze({
    verdictCode: verdict.code,
    verdictLabel: verdict.label,
    takeaway: sentence(`${SUMMARY_DIRECTIVES[verdict.code] || SUMMARY_DIRECTIVES.wait}；${outcomeObservation ? "结果位" : "核心牌位"}显示${focusText}`),
    evidenceRefs: Object.freeze(outcomeRefs.length ? outcomeRefs : [...keyEvidence[0].evidenceRefs]),
  });
  const domain = domainFor(questionId, categoryId);
  const condition = conditionBlock({
    candidates,
    observations,
    claim: engineResult.claim,
    domain,
    verdict,
    draws: draws || [],
  });
  const action = actionBlock({ candidates, observations, claim: engineResult.claim, draws: draws || [], domain, verdict });
  const cardEvidence = createCardEvidence(draws || [], observations, candidates, engineResult.claim);
  const result = {
    schemaVersion: "4.0.0",
    summary,
    keyEvidence,
    condition,
    action,
    cardEvidence,
    verdict,
    provenance: {
      claimId: engineResult.claim.id,
      interpretationVersion: "concise-evidence-v1",
      evidenceCount: new Set(visibleBlocks({ summary, keyEvidence, condition, action, cardEvidence })
        .flatMap((item) => item.evidenceRefs)).size,
      outcomeEvidenceRef: outcomeObservation?.id || null,
      visibleCharacterCount: 0,
    },
  };
  result.provenance.visibleCharacterCount = visibleBlocks(result)
    .map((item) => item.text || item.takeaway)
    .join("")
    .replace(/\s+/g, "").length;
  const errors = validateConciseInterpretation(result, { drawCount: draws?.length || 0 });
  if (errors.length) throw new Error(errors.join("; "));
  return deepFreeze(result);
}

export { OUTCOME_POSITION };
