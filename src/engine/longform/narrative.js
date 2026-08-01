import { createDecisiveInterpretation } from "../decisive/verdict.js";
import { createReadingArgument, normalize, choose } from "./argument.js";

const LENGTH_RULES = Object.freeze({
  single: Object.freeze({ min: 420, max: 1300 }),
  timeline: Object.freeze({ min: 850, max: 2200 }),
  cross: Object.freeze({ min: 1250, max: 3400 }),
  celtic: Object.freeze({ min: 2100, max: 5600 }),
});

const BANNED_PATTERNS = Object.freeze([
  /对[“「『].+[”」』]的判定/,
  /走势从[“「『]/,
  /牌阵故事/,
  /牌与牌之间如何对话/,
  /你可以留意/,
  /接下来的三步/,
  /作为[^。]{0,20}(?:状态|线索|证据)时指出/,
  /需要同时核对/,
  /继续观察/,
  /可能|也许|或许|倾向|不宜作确定判断/,
  /只有现实前提发生实质变化/,
]);

const VERDICT_OPENINGS = Object.freeze({
  advance: Object.freeze([
    "主导力量已经形成，推动因素明显强于阻力，事情应当进入实际推进阶段。",
    "牌面给出的方向明确：继续向前比停留原地更有利，当前条件足以支持行动。",
  ]),
  conditional: Object.freeze([
    "事情可以发展，但它不是自动兑现的结果；关键门槛必须先在现实中成立。",
    "牌面允许推进，同时把成败压在一个清楚的条件上：条件落实就继续，条件落空就停下。",
  ]),
  wait: Object.freeze([
    "现在不适合做不可撤回的投入，最关键的信息尚未进入现实。",
    "当前阶段的正确动作是等待事实成形，而不是用猜测提前替结果下结论。",
  ]),
  adjust: Object.freeze([
    "问题不在目标本身，而在现有方法已经失效；先改变路径，结果才会重新打开。",
    "继续沿用旧做法只会重复当前困局，必须先调整边界、节奏或执行方式。",
  ]),
  stop: Object.freeze([
    "继续投入只会扩大已经出现的损耗，当前方向应当停止。",
    "牌面没有给出值得追加成本的基础，及时停下比勉强维持更有利。",
  ]),
  redirect: Object.freeze([
    "当前方向已经完成它能提供的作用，继续维持不会产生新的结果，应当结束并转向。",
    "这条路径的主要价值已经耗尽，真正的进展来自退出旧结构并重新分配资源。",
  ]),
});

const ROLE_TRANSITIONS = Object.freeze({
  origin: "形成当前局面的原因并不在眼前这一个事件，而在此前累积的选择和惯性。",
  current: "当下最重要的是辨认真实状态，而不是继续按照原先的期待解释局面。",
  conflict: "真正卡住事情的不是表面节奏，而是一个尚未处理的矛盾持续消耗资源。",
  force: "局面能否改变，还取决于一个会放大或削弱主方向的关键变量。",
  intent: "主观愿望本身不是问题，但愿望与现实条件之间存在需要校正的距离。",
  action: "转折点不会自行出现，它必须通过具体行动把牌面力量带入现实。",
  outcome: "结果不是突然降临，而是前面各项条件累积后的阶段性落点。",
  core: "整次解读围绕同一个核心展开，其他牌位都在解释它为何成立。",
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function sentence(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  return /[。！？]$/.test(text) ? text : `${text}。`;
}

function textSimilarity(left, right) {
  const a = normalize(left);
  const b = normalize(right);
  if (!a || !b) return 0;
  const grams = (text) => {
    const result = new Set();
    for (let index = 0; index < text.length - 1; index += 1) result.add(text.slice(index, index + 2));
    return result;
  };
  const ag = grams(a);
  const bg = grams(b);
  const shared = [...ag].filter((item) => bg.has(item)).length;
  return shared / Math.max(1, ag.size + bg.size - shared);
}

function verdictJudgment(base, argument, questionId) {
  const opening = choose(`${questionId}:${base.verdict.code}`, VERDICT_OPENINGS[base.verdict.code] || VERDICT_OPENINGS.wait);
  const subject = argument.domain.subject;
  const outcome = argument.outcome?.meaning || "结果必须由现实反馈确认";
  const support = argument.support?.meaning || argument.conditions.success;
  const obstacle = argument.obstacle?.meaning || argument.conditions.failure;
  const endings = {
    advance: `${subject}已经具备继续发展的基础。${support}构成主要推动力，${outcome}给出明确落点；现在应把优势转成持续行动。`,
    conditional: `${subject}能够推进，但成败不取决于意愿强弱。只有${argument.conditions.success}；若${argument.conditions.failure}，结果会停在当前层级。`,
    wait: `${subject}缺少足以支撑最终投入的关键事实。${obstacle}仍在制造干扰，等到${argument.conditions.turningPoint}之后再作决定。`,
    adjust: `${subject}的问题集中在执行路径。${obstacle}说明旧方法正在消耗结果，必须先完成调整，再让${support}接管后续走势。`,
    stop: `${subject}继续维持的成本已经高于可得到的回报。${obstacle}是决定性阻力，${outcome}说明停止新增投入更有利。`,
    redirect: `${subject}在当前结构里已经无法继续产生有效结果。${outcome}要求结束旧方向，并把资源转向能够承接${support}的新选择。`,
  };
  return `${opening}${endings[base.verdict.code] || endings.wait}`;
}

function chainParagraphs(argument, spreadId) {
  const paragraphs = [];
  for (const item of argument.causalChain) {
    const transition = ROLE_TRANSITIONS[item.stage] || ROLE_TRANSITIONS.force;
    const positions = argument.analyses.filter((analysis) => item.positionIds.includes(analysis.positionId));
    const evidence = positions.map((analysis) => analysis.meaning).join("；");
    const consequences = positions.map((analysis) => analysis.body.split("。").slice(-3, -1).join("。")).filter(Boolean);
    paragraphs.push(`${transition}${sentence(evidence)}${sentence(consequences.join("；"))}`);
  }

  if (spreadId === "single") {
    const core = argument.analyses[0];
    return [
      `这张牌同时承担局面定性、阻力辨认和结果指向三个功能。${sentence(core.meaning)}它的${core.orientation}状态说明，当前判断必须直接落实到${argument.domain.id === "relationship" ? "关系回应与真实投入" : argument.domain.id === "career" ? "职责、资源与完成标准" : argument.domain.id === "finance" ? "成本、现金流与风险边界" : "可观察的现实行动"}，否则牌义只会停留在抽象层面。`,
      `${core.body}因此，本次单牌不是提供多个并列选项，而是把问题压缩为一个必须处理的核心：${argument.conditions.turningPoint}`,
    ];
  }
  return paragraphs;
}

function conflictParagraph(argument) {
  const support = argument.support;
  const obstacle = argument.obstacle;
  if (support && obstacle) {
    return `整副牌的核心张力来自两股力量同时存在：一边是“${support.meaning}”，它负责${support.role}；另一边是“${obstacle.meaning}”，它负责${obstacle.role}。两者并非互相抵消，而是在争夺现实中的主导权。最终判断取决于哪一方能够连续出现、占据更多行动和资源，而不是哪一句牌义听起来更理想。`;
  }
  if (support) {
    return `牌面中的力量并不平均，主导方向集中在“${support.meaning}”。它承担${support.role}作用，其他牌位主要负责说明这股力量如何落地，而没有形成足以推翻它的同级阻力。`;
  }
  if (obstacle) {
    return `本次牌阵的证据集中在“${obstacle.meaning}”。它承担${obstacle.role}作用，当前没有足够强的推动因素与之抗衡，因此结论必须先处理损耗和边界，而不能直接讨论扩张。`;
  }
  return "牌面没有形成互相争夺的两股主导力量，判断由核心牌位和结果牌位直接收束。";
}

function outcomeParagraph(argument, verdict) {
  const outcome = argument.outcome;
  const subject = argument.domain.subject;
  if (!outcome) return `${subject}的结果仍然服从当前判断：${verdict.directive}`;
  return `${outcome.positionName}承担结果证据。${sentence(outcome.meaning)}这意味着${subject}的落点不会脱离前面的形成原因和现实矛盾；只有当成立条件持续存在，结果才会按${outcome.role}方向稳定下来。`;
}

function conditionsSection(argument) {
  return Object.freeze({
    success: sentence(argument.conditions.success),
    failure: sentence(argument.conditions.failure),
    turningPoint: sentence(argument.conditions.turningPoint),
  });
}

function manifestationSection(argument) {
  if (!argument.manifestation) return null;
  return Object.freeze({
    channel: sentence(argument.manifestation.channel),
    pace: sentence(argument.manifestation.pace),
    sequence: sentence(argument.manifestation.sequence),
    sign: sentence(argument.manifestation.sign),
  });
}

function visibleParagraphs(result) {
  return [
    result.judgment,
    ...result.situationAnalysis,
    ...result.positionAnalyses.map((item) => item.body),
    result.conditions.success,
    result.conditions.failure,
    result.conditions.turningPoint,
    ...(result.manifestation ? Object.values(result.manifestation) : []),
  ].filter(Boolean);
}

function visibleLength(result) {
  return visibleParagraphs(result).join("").replace(/\s+/g, "").length;
}

function validateUniqueness(paragraphs) {
  const errors = [];
  for (let left = 0; left < paragraphs.length; left += 1) {
    for (let right = left + 1; right < paragraphs.length; right += 1) {
      const similarity = textSimilarity(paragraphs[left], paragraphs[right]);
      if (similarity >= 0.72) errors.push(`Paragraphs ${left + 1} and ${right + 1} are too similar (${similarity.toFixed(2)}).`);
    }
  }
  return errors;
}

export function validateLongformInterpretation(result, { questionText = "", spreadId = "single" } = {}) {
  const errors = [];
  const paragraphs = visibleParagraphs(result);
  const visible = paragraphs.join("\n");
  if (!result?.verdict?.code || result.verdict.code === "indeterminate") errors.push("A decisive verdict is required.");
  if (questionText && visible.includes(String(questionText).trim())) errors.push("The question was repeated in the interpretation.");
  for (const pattern of BANNED_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(visible)) errors.push(`Banned mechanical phrase leaked: ${pattern}`);
  }
  const cardNames = new Set(result.positionAnalyses.map((item) => item.cardName));
  for (const item of result.positionAnalyses) {
    for (const cardName of cardNames) {
      if (item.body.includes(cardName)) errors.push(`Card name repeated inside position body: ${cardName}`);
    }
  }
  errors.push(...validateUniqueness(paragraphs));
  const rule = LENGTH_RULES[spreadId] || LENGTH_RULES.single;
  const length = visibleLength(result);
  if (length < rule.min) errors.push(`Interpretation is too short for ${spreadId}: ${length} < ${rule.min}.`);
  if (length > rule.max) errors.push(`Interpretation is too long for ${spreadId}: ${length} > ${rule.max}.`);
  if (!result.conditions?.success || !result.conditions?.failure || !result.conditions?.turningPoint) {
    errors.push("Success, failure, and turning-point conditions are required.");
  }
  return errors;
}

export function createLongformInterpretation({
  engineResult,
  questionId,
  questionText,
  categoryId,
  spreadId,
  draws,
} = {}) {
  const base = createDecisiveInterpretation({ engineResult, questionText, draws });
  const argument = createReadingArgument({
    engineResult,
    draws,
    questionId,
    questionText,
    categoryId,
    spreadId,
  });
  const situationAnalysis = [
    ...chainParagraphs(argument, spreadId),
    conflictParagraph(argument),
    outcomeParagraph(argument, base.verdict),
  ];
  const result = {
    schemaVersion: "3.0.0",
    verdict: base.verdict,
    judgment: verdictJudgment(base, argument, questionId),
    situationAnalysis,
    positionAnalyses: argument.analyses.map((item) => ({
      positionId: item.positionId,
      positionName: item.positionName,
      cardId: item.cardId,
      cardName: item.cardName,
      orientation: item.orientation,
      role: item.role,
      stage: item.stage,
      body: item.body,
    })),
    conditions: conditionsSection(argument),
    manifestation: manifestationSection(argument),
    decisiveFactors: base.decisiveFactors,
    provenance: {
      ...base.provenance,
      narrativeVersion: "longform-causal-v1",
      visibleCharacterCount: 0,
      paragraphCount: 0,
    },
  };
  result.provenance.visibleCharacterCount = visibleLength(result);
  result.provenance.paragraphCount = visibleParagraphs(result).length;
  const errors = validateLongformInterpretation(result, { questionText, spreadId });
  if (errors.length) throw new Error(errors.join("; "));
  return deepFreeze(result);
}

export { BANNED_PATTERNS, LENGTH_RULES, textSimilarity, visibleLength };
