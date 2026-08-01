const DOMAIN_RULES = Object.freeze([
  { id: "relationship", pattern: /(love|relationship|缘分|感情|关系|对方|复合|婚姻|暧昧|桃花)/i, subject: "这段关系", success: "双方形成稳定回应，并把时间与现实安排真正留给彼此", failure: "互动长期停留在试探、猜测或单方面维持", signal: "联系节奏变得稳定，重要安排不再依赖临时情绪" },
  { id: "career", pattern: /(career|work|job|事业|工作|职业|升职|项目|同事|创业)/i, subject: "这项事业安排", success: "职责、资源和阶段目标被明确落实", failure: "任务持续增加，却没有相应权限、资源或可验证成果", signal: "关键责任被写清，资源开始围绕同一目标集中" },
  { id: "finance", pattern: /(finance|money|财富|财务|金钱|收入|投资|消费|债务)/i, subject: "这项财务安排", success: "现金流、成本与退出条件都处于可承受范围", failure: "收益预期先行，真实成本和风险却没有被量化", signal: "账面数字、合同条件和实际回款开始一致" },
  { id: "growth", pattern: /(growth|self|heal|成长|内心|疗愈|自我|人生|意义|课题)/i, subject: "这段个人转变", success: "新的理解被落实为持续行为，而不是只停留在情绪高点", failure: "反思很多，日常选择却继续重复原有惯性", signal: "旧反应不再自动出现，新的边界和习惯开始稳定" },
  { id: "decision", pattern: /(decision|choice|choose|决定|选择|是否|该不该|方向)/i, subject: "这项选择", success: "关键事实、期限与可撤回方案都被确认", failure: "在证据不足时用焦虑或期待代替判断", signal: "最关键的未知项得到明确答案，两个选项的代价可以直接比较" },
  { id: "daily", pattern: /(daily|today|week|今日|今天|本周|日常|状态|身体)/i, subject: "当前这件事", success: "时间、精力和执行顺序能够彼此配合", failure: "安排超过真实承载能力，导致注意力不断被切碎", signal: "最重要的一项任务能够连续推进，不再被反复打断" },
]);

const POSITION_RULES = Object.freeze({
  essence: Object.freeze({ stage: "core", label: "核心", functionText: "直接定义问题的主轴", consequence: "它不是旁支提醒，而是整次判断的中心条件" }),
  past: Object.freeze({ stage: "origin", label: "前因", functionText: "说明当前局面由何而来", consequence: "过去留下的惯性仍在影响现在的选择方式" }),
  root: Object.freeze({ stage: "origin", label: "根源", functionText: "揭示仍未退出局面的深层前因", consequence: "只处理表面事件，无法真正改变走势" }),
  below: Object.freeze({ stage: "origin", label: "深层根基", functionText: "指出未被充分意识到的驱动力", consequence: "它会在关键时刻改变表面上的理性判断" }),
  present: Object.freeze({ stage: "current", label: "当前", functionText: "界定此刻真正发生的事情", consequence: "所有后续行动都必须从这一现实状态出发" }),
  core: Object.freeze({ stage: "current", label: "核心现状", functionText: "集中呈现当下的主要矛盾", consequence: "其他牌位都在说明它为何形成以及将如何变化" }),
  challenge: Object.freeze({ stage: "conflict", label: "直接挑战", functionText: "指出最先需要解决的阻力", consequence: "绕开它会让看似积极的进展停在表面" }),
  influence: Object.freeze({ stage: "force", label: "关键变量", functionText: "提供推动或限制局面的外部变量", consequence: "它决定主结论能否从意愿进入现实" }),
  external: Object.freeze({ stage: "force", label: "外界作用", functionText: "说明他人、环境或资源如何介入", consequence: "这部分并不完全由提问者控制" }),
  above: Object.freeze({ stage: "intent", label: "意识目标", functionText: "呈现主动追求的方向", consequence: "目标与现实不一致时会制造额外消耗" }),
  hopes: Object.freeze({ stage: "intent", label: "期待与担忧", functionText: "揭示愿望和恐惧如何共同影响判断", consequence: "情绪越强，越需要与事实分开核对" }),
  action: Object.freeze({ stage: "action", label: "行动", functionText: "把判断转换为可执行的选择", consequence: "它决定牌面潜力是否真正落地" }),
  advice: Object.freeze({ stage: "action", label: "行动", functionText: "指出处理当前矛盾的有效方式", consequence: "行动质量会直接改变后续结果" }),
  trend: Object.freeze({ stage: "outcome", label: "发展趋势", functionText: "说明沿当前路径继续时的主要走向", consequence: "它是当前条件的延伸，不是与前因无关的突然结果" }),
  future: Object.freeze({ stage: "outcome", label: "近期发展", functionText: "显示现有力量接下来如何展开", consequence: "未来并非重新开始，而是当前选择的后果" }),
  outcome: Object.freeze({ stage: "outcome", label: "阶段结果", functionText: "给出维持当前路径时的落点", consequence: "它承担最终判断的主要结果证据" }),
});

const SUIT_CHANNELS = Object.freeze({
  cups: "情绪回应、关系互动与持续照顾",
  pentacles: "日常安排、工作协作、金钱资源或现实责任",
  swords: "沟通、决定、文件信息或一次必须说清的事实",
  wands: "主动邀约、行动机会、社交活动或快速推进的计划",
  major: "一次会改变原有生活结构的重要事件",
});

const ROLE_LABELS = Object.freeze({
  supportive: "推动",
  cautionary: "阻力",
  conditional: "门槛",
  transformative: "转向",
  descriptive: "定性",
});

function normalize(value) {
  return String(value || "")
    .replace(/\s+/g, "")
    .replace(/[，。；：、“”‘’！？,.!?;:()（）【】\[\]《》]/g, "")
    .toLowerCase();
}

function unique(values) {
  const output = [];
  const known = [];
  for (const value of values) {
    const text = String(value || "").replace(/\s+/g, " ").trim();
    const key = normalize(text);
    if (!key) continue;
    if (known.some((item) => item === key || item.includes(key) || key.includes(item))) continue;
    output.push(text);
    known.push(key);
  }
  return output;
}

function deterministicIndex(seed, length) {
  if (length <= 1) return 0;
  let hash = 2166136261;
  for (const char of String(seed || "")) {
    hash ^= char.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0) % length;
}

function choose(seed, options) {
  return options[deterministicIndex(seed, options.length)];
}

function detectDomain(questionId, questionText, categoryId) {
  const source = `${questionId || ""} ${questionText || ""} ${categoryId || ""}`;
  return DOMAIN_RULES.find((rule) => rule.pattern.test(source)) || DOMAIN_RULES[4];
}

function stripMechanicalText(value, cardName) {
  let text = String(value || "").replace(/\s+/g, " ").trim();
  if (cardName) text = text.replaceAll(cardName, "");
  return text
    .replace(/^[：:，、。\s]+/, "")
    .replace(/作为[^：。]+(?:线索|证据|状态)时指出[：:]?/g, "")
    .replace(/这说明/g, "")
    .replace(/该摘要描述[^。]+。?/g, "")
    .replace(/该牌(?:描述|表示|意味着)/g, "")
    .replace(/需要同时核对[^。]+。?/g, "")
    .replace(/不能只凭单一事件定性。?/g, "")
    .replace(/不能代替[^。]+。?/g, "")
    .replace(/不构成确定预言。?/g, "")
    .replace(/趋势判断必须[^。]+。?/g, "")
    .replace(/若关键条件未满足[^。]+。?/g, "")
    .replace(/[；;]\s*$/, "")
    .replace(/^[，、；：\s]+|[，、；：\s]+$/g, "")
    .trim();
}

function cardMeaning(draw, observation) {
  const candidates = [
    draw?.meaning,
    observation?.semanticText,
    draw?.advice,
    ...(draw?.keywords || []),
  ].map((value) => stripMechanicalText(value, draw?.cardName));
  return unique(candidates)[0] || "现实信息不足，必须回到可观察事实重新核对";
}

function candidateForPosition(candidates, positionId) {
  return candidates.find((candidate) => candidate.positionIds?.includes(positionId)) || null;
}

function observationForPosition(observations, positionId) {
  return observations.find((observation) => observation.positionId === positionId) || null;
}

function stanceFor(candidate, observation) {
  if (candidate?.stance) return candidate.stance;
  const dimensions = observation?.dimensions || {};
  const positive = Number(dimensions.activation || 0) + Number(dimensions.stability || 0) + Number(dimensions.agency || 0);
  const negative = Math.abs(Math.min(0, Number(dimensions.clarity || 0))) + Number(dimensions.risk || 0);
  if (negative > positive + 1) return "cautionary";
  if (positive > negative + 1) return "supportive";
  if (Number(dimensions.transition || 0) >= 2) return "transformative";
  return "descriptive";
}

function createPositionAnalysis({ draw, observation, candidate, index, spreadId, domain }) {
  const rule = POSITION_RULES[draw.positionId] || Object.freeze({
    stage: "force",
    label: draw.positionName || `牌位${index + 1}`,
    functionText: "补充当前局面的关键变量",
    consequence: "它会改变主结论的强弱和兑现方式",
  });
  const stance = stanceFor(candidate, observation);
  const meaning = cardMeaning(draw, observation);
  const orientationEffect = draw.orientation === "reversed"
    ? "逆位把这股力量表现为受阻、失衡或内耗，因此它不会按最直接的方式兑现"
    : "正位让这股力量能够直接进入现实，并持续影响后续选择";
  const role = ROLE_LABELS[stance] || ROLE_LABELS.descriptive;
  const domainBridge = {
    relationship: "在关系问题中，它最终会落实为回应节奏、边界和真实投入的变化",
    career: "在事业问题中，它最终会落实为职责、资源、协作方式和成果标准的变化",
    finance: "在财务问题中，它最终会落实为现金流、成本、风险承担和退出条件的变化",
    growth: "在个人成长问题中，它最终会落实为习惯、边界、情绪反应和持续行动的变化",
    decision: "在选择问题中，它最终会落实为证据、期限、代价和可撤回空间的变化",
    daily: "在日常问题中，它最终会落实为时间、体力、优先级和完成节奏的变化",
  }[domain.id];
  const body = [
    `${rule.label}位置${rule.functionText}。${meaning}。`,
    `${orientationEffect}；在整副牌里，它承担“${role}”作用。`,
    `${rule.consequence}。${domainBridge}。`,
  ].join("");
  return Object.freeze({
    index,
    positionId: draw.positionId,
    positionName: draw.positionName,
    cardId: draw.cardId,
    cardName: draw.cardName,
    orientation: draw.orientation === "reversed" ? "逆位" : "正位",
    stage: rule.stage,
    role,
    stance,
    meaning,
    body,
    score: Number(candidate?.score || observation?.localScore || 0),
    dimensions: observation?.dimensions || {},
    suit: draw.suit || (draw.cardId?.includes("-") ? draw.cardId.split("-")[0] : "major"),
    spreadId,
  });
}

function scoreDescending(left, right) {
  return right.score - left.score || left.index - right.index || left.positionId.localeCompare(right.positionId);
}

function pickByStance(analyses, stances) {
  return [...analyses].filter((item) => stances.includes(item.stance)).sort(scoreDescending)[0] || null;
}

function pickOutcome(analyses) {
  return analyses.find((item) => item.stage === "outcome")
    || [...analyses].sort(scoreDescending)[0]
    || null;
}

function buildCausalChain(analyses) {
  const stageOrder = ["origin", "current", "conflict", "force", "intent", "action", "outcome", "core"];
  const chain = [];
  for (const stage of stageOrder) {
    const items = analyses.filter((item) => item.stage === stage);
    if (!items.length) continue;
    chain.push(Object.freeze({
      stage,
      label: items[0].stage === "origin" ? "形成原因"
        : items[0].stage === "current" || items[0].stage === "core" ? "当前状态"
          : items[0].stage === "conflict" ? "核心矛盾"
            : items[0].stage === "force" ? "关键变量"
              : items[0].stage === "intent" ? "主观目标"
                : items[0].stage === "action" ? "行动转折"
                  : "结果落点",
      positionIds: items.map((item) => item.positionId),
      summary: unique(items.map((item) => item.meaning)).join("；"),
    }));
  }
  return chain;
}

function conditionText(analysis, domainText, mode) {
  if (!analysis) return domainText;
  const bridge = mode === "success"
    ? "必须在现实中形成持续、可验证的表现"
    : mode === "failure"
      ? "一旦它持续成为主导状态，当前判断就会失去成立基础"
      : "当它从偶发迹象变成稳定事实时，局面才算真正转折";
  return `${domainText}；同时，${analysis.meaning}，并且${bridge}。`;
}

function buildConditions(analyses, domain) {
  const supportive = pickByStance(analyses, ["supportive", "conditional"]);
  const cautionary = pickByStance(analyses, ["cautionary"]);
  const outcome = pickOutcome(analyses);
  return Object.freeze({
    success: conditionText(supportive, domain.success, "success"),
    failure: conditionText(cautionary, domain.failure, "failure"),
    turningPoint: conditionText(outcome, domain.signal, "signal"),
  });
}

function dominantSuit(analyses) {
  const counts = new Map();
  for (const item of analyses) counts.set(item.suit, (counts.get(item.suit) || 0) + 1);
  return [...counts.entries()].sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))[0]?.[0] || "major";
}

function paceFor(analyses) {
  const outcome = analyses.filter((item) => item.stage === "outcome");
  const source = outcome.length ? outcome : analyses;
  const values = source.map((item) => Number(item.dimensions?.speed || 0));
  const average = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
  if (average >= 1.2) return "变化会较快出现，通常先有行动或消息，再补齐稳定条件";
  if (average <= -1.2) return "变化速度偏慢，需要经过重复确认和现实磨合，不能用短期沉默判断结果";
  return "变化会分阶段出现，先形成一个清晰迹象，再逐步固定为可持续状态";
}

function buildManifestation(spreadId, analyses, domain) {
  if (spreadId === "single") return null;
  const outcome = pickOutcome(analyses);
  if (!outcome) return null;
  const channel = SUIT_CHANNELS[dominantSuit(analyses)] || SUIT_CHANNELS.major;
  const ordered = analyses
    .filter((item) => ["origin", "current", "conflict", "action", "outcome"].includes(item.stage))
    .sort((left, right) => left.index - right.index)
    .slice(0, 4)
    .map((item) => `${item.positionName}先表现为“${item.meaning}”`);
  return Object.freeze({
    channel: `事情主要通过${channel}进入现实，而不是凭空发生。`,
    pace: paceFor(analyses),
    sequence: ordered.length >= 2
      ? `${ordered.join("；")}。这些阶段按牌位顺序相互承接。`
      : `局面先确认当前条件，再向${outcome.positionName}所示结果推进。`,
    sign: `${domain.signal}；同时，${outcome.meaning}开始连续出现，而不再只是一次性的偶发现象。`,
  });
}

export function createReadingArgument({ engineResult, draws, questionId, questionText, categoryId, spreadId } = {}) {
  const candidates = [...(engineResult?.resolution?.activeCandidates || [])];
  const observations = [...(engineResult?.observations || [])];
  const domain = detectDomain(questionId, questionText, categoryId);
  const analyses = (draws || []).map((draw, index) => createPositionAnalysis({
    draw,
    observation: observationForPosition(observations, draw.positionId),
    candidate: candidateForPosition(candidates, draw.positionId),
    index,
    spreadId,
    domain,
  }));
  const support = pickByStance(analyses, ["supportive", "conditional"]);
  const obstacle = pickByStance(analyses, ["cautionary"]);
  const outcome = pickOutcome(analyses);
  return Object.freeze({
    schemaVersion: "1.0.0",
    domain: Object.freeze({ id: domain.id, subject: domain.subject }),
    analyses: Object.freeze(analyses),
    causalChain: Object.freeze(buildCausalChain(analyses)),
    support,
    obstacle,
    outcome,
    conditions: buildConditions(analyses, domain),
    manifestation: buildManifestation(spreadId, analyses, domain),
  });
}

export { normalize, stripMechanicalText, deterministicIndex, choose };
