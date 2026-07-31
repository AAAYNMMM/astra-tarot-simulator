function dominantElement(draws) {
  const counts = draws.reduce((result, draw) => {
    result[draw.card.element] = (result[draw.card.element] || 0) + 1;
    return result;
  }, {});
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || ["灵", 0];
}

function drawTheme(draw) {
  const keywords = draw.card.keywords.slice(0, 2).join("、");
  const motion = draw.reversed ? "正在受阻、内收或等待校正" : "较容易被看见并向外展开";
  return `${draw.card.name}${draw.reversed ? "逆位" : "正位"}所代表的“${keywords}”能量${motion}`;
}

function drawAt(reading, positionId) {
  return reading.draws.find((draw) => draw.position.id === positionId);
}

function synthesisAnchor(reading) {
  const anchorPosition = {
    single: "essence",
    timeline: "present",
    cross: "core",
    celtic: "present",
  }[reading.spread.id];
  return (
    drawAt(reading, anchorPosition) ||
    reading.draws.find((draw) => draw.card.arcana === "major") ||
    reading.draws[0]
  );
}

function createSpreadNarrative(reading) {
  const theme = (positionId) => drawTheme(drawAt(reading, positionId));
  const brief = (positionId) => {
    const draw = drawAt(reading, positionId);
    return `${draw.card.name}${draw.reversed ? "逆位" : "正位"}（${draw.card.keywords
      .slice(0, 2)
      .join("、")}）`;
  };
  if (reading.spread.id === "single") {
    return `${theme("essence")}。单张牌提供的是一个聚焦镜头：先把它与真实处境核对，再决定要采纳哪一部分提醒。`;
  }
  if (reading.spread.id === "timeline") {
    return `过去位的${theme("past")}，仍在塑造此刻；当下位的${theme("present")}，呈现目前最活跃的状态；未来位的${theme("future")}，显示当前选择继续发展时的近期方向。未来牌表示趋势，不是无法改变的预言。`;
  }
  if (reading.spread.id === "cross") {
    return `十字中央的${theme("core")}，定义了当前核心；左侧的${theme("root")}，交代仍在作用的前因；上方的${theme("influence")}，揭示需要纳入判断的关键影响；右侧的${theme("trend")}，呈现沿当前路径可能展开的方向；下方的${theme("action")}，把整副牌收束为可执行的回应。`;
  }
  if (reading.spread.id === "celtic") {
    return `中心的${brief("present")}描述当前态势，横跨其上的${brief("challenge")}指出眼前最需要处理的挑战。左侧${brief("past")}是仍在作用的前因，右侧${brief("future")}则是近期最可能出现的变化。上方${brief("above")}呈现你主动追求的目标，下方${brief("below")}揭示更深层的动机。右侧权杖从${brief("advice")}给出的行动切口开始，经由${brief("external")}所代表的外界变量与${brief("hopes")}所反映的期待和担忧，最终抵达${brief("outcome")}。结果位是保持当前路径时的阶段趋势，并非不可改变的定论。`;
  }
  return reading.draws.map((draw) => `${draw.position.name}：${drawTheme(draw)}`).join("；");
}

function createConnections(reading) {
  if (reading.draws.length < 2) return [];
  const { draws } = reading;
  const start = draws[0];
  const end = draws[draws.length - 1];
  const connections = [];

  if (start.card.element === end.card.element) {
    connections.push(
      `从“${start.position.name}”到“${end.position.name}”都落在${start.card.element}元素，说明答案始终围绕${elementMeaning(start.card.element)}展开，重点在于把同一课题做得更成熟。`,
    );
  } else {
    connections.push(
      `牌阵从“${start.position.name}”的${start.card.element}元素走向“${end.position.name}”的${end.card.element}元素，提示你需要把${elementMeaning(start.card.element)}转化为${elementMeaning(end.card.element)}。`,
    );
  }

  if (reading.spread.id === "celtic") {
    const above = drawAt(reading, "above");
    const below = drawAt(reading, "below");
    const future = drawAt(reading, "future");
    const outcome = drawAt(reading, "outcome");
    connections.push(
      above.card.element === below.card.element
        ? `意识目标位的${above.card.name}与潜意识根基位的${below.card.name}同属${above.card.element}元素，内在动机与表层追求较容易彼此支持。`
        : `意识目标位的${above.card.name}偏向${elementMeaning(above.card.element)}，潜意识根基位的${below.card.name}则偏向${elementMeaning(below.card.element)}；先承认这层落差，行动才不会一边推进、一边自我抵消。`,
    );
    connections.push(
      `近期发展位的${future.card.name}${future.reversed ? "逆位" : "正位"}是下一阶段的变化，结果位的${outcome.card.name}${outcome.reversed ? "逆位" : "正位"}才是当前路线继续累积后的落点；两者之间仍可通过建议位主动调整。`,
    );
  }

  const reversedPositions = draws
    .filter((draw) => draw.reversed)
    .map((draw) => draw.position.name);
  if (reversedPositions.length > 0) {
    connections.push(
      `逆位集中在${reversedPositions.join("、")}，这些位置更像需要先疏通的内部课题；处理它们之后，其他正位牌的力量才更容易落地。`,
    );
  } else {
    connections.push("所有牌均为正位，讯息较直接；真正的挑战不是继续寻找暗示，而是选择一个最重要的提示开始执行。");
  }

  const suitCounts = draws.reduce((result, draw) => {
    if (!draw.card.suitName) return result;
    result[draw.card.suitName] = (result[draw.card.suitName] || 0) + 1;
    return result;
  }, {});
  const dominantSuit = Object.entries(suitCounts).sort((a, b) => b[1] - a[1])[0];
  if (dominantSuit?.[1] >= 2) {
    const suitCard = draws.find((draw) => draw.card.suitName === dominantSuit[0]);
    connections.push(
      `${dominantSuit[0]}重复出现 ${dominantSuit[1]} 次，使“${suitCard.card.suitTheme}”成为贯穿多张牌的共同线索。`,
    );
  } else {
    const courtCount = draws.filter((draw) =>
      ["page", "knight", "queen", "king"].includes(draw.card.rank),
    ).length;
    connections.push(
      courtCount > 0
        ? `${courtCount} 张宫廷牌出现，提醒你留意具体人物、互动角色，以及自己在这件事中正以何种成熟度回应。`
        : "花色与牌型较分散，说明问题并非由单一因素造成；先处理最接近行动位的提示，比一次解决全部变量更有效。",
    );
  }
  return connections.slice(0, 3);
}

function createActionSteps(reading) {
  const priorityBySpread = {
    single: ["essence"],
    timeline: ["present", "future", "past"],
    cross: ["action", "influence", "core"],
    celtic: ["advice", "challenge", "future", "outcome"],
  };
  const orderedDraws = (priorityBySpread[reading.spread.id] || [])
    .map((positionId) => drawAt(reading, positionId))
    .filter(Boolean);
  const actions = [];
  for (const draw of orderedDraws) {
    if (!actions.includes(draw.card.advice)) actions.push(draw.card.advice);
    if (actions.length === 3) break;
  }
  const fallbacks = [
    categoryFallbackAction(reading.category.id, 0),
    categoryFallbackAction(reading.category.id, 1),
    "用一天记录行动后的事实与感受，再决定是否继续沿这个方向前进。",
  ];
  for (const fallback of fallbacks) {
    if (actions.length === 3) break;
    if (!actions.includes(fallback)) actions.push(fallback);
  }
  return actions
    .slice(0, 3)
    .map((action, index) => `${["第一步", "第二步", "第三步"][index]} · ${action}`);
}

function createSynthesis(reading) {
  const { draws, category, question } = reading;
  const uprightCount = draws.filter((draw) => !draw.reversed).length;
  const reversedCount = draws.length - uprightCount;
  const majorCount = draws.filter((draw) => draw.card.arcana === "major").length;
  const [element, elementCount] = dominantElement(draws);
  const primary = synthesisAnchor(reading);

  let energyTone;
  if (uprightCount > reversedCount) {
    energyTone = "整体能量较为外放，局面愿意向前流动；清晰回应会比反复猜测更有帮助。";
  } else if (reversedCount > uprightCount) {
    energyTone = "能量更多指向内部整理。先松动阻碍、校正边界，再追求外部结果会更稳妥。";
  } else {
    energyTone = "牌面同时呈现推进与回看，真正的转折点在于如何平衡行动速度与内在准备。";
  }

  const headlineMap = {
    love: [
      "真诚表达与清晰边界，会让关系走向更真实的位置",
      "先看清关系中的失衡，再决定该靠近还是留白",
    ],
    career: [
      "把能力集中到关键方向，阶段成果会逐渐变得可见",
      "当前更需要校准结构与节奏，而不是继续透支推进",
    ],
    wealth: [
      "现实验证与长期视角，是筛选机会的最佳罗盘",
      "先减少不确定消耗，再为新的资源流动腾出空间",
    ],
    growth: [
      "你正在整合旧经验，并为新的自我腾出位置",
      "真正的改变从承认内在阻力、停止自我催促开始",
    ],
    decision: [
      "最合适的选择，会同时经得起事实与长期价值的检验",
      "答案尚未完全成熟，补齐信息与安全余量比仓促定夺重要",
    ],
    daily: [
      "今天不必解决全部问题，完成一个清楚的小行动就很好",
      "今天适合放慢反应，让事实与感受先重新对齐",
    ],
  };

  const observations = [];
  if (majorCount > 0) {
    observations.push(
      `${majorCount} 张大阿卡纳出现，说明这个问题触及的不只是日常细节，也包含阶段性的价值选择或身份转变。`,
    );
  } else {
    observations.push("牌面以小阿卡纳为主，变化更可能来自日常选择、沟通方式与持续行动。");
  }
  observations.push(
    draws.length === 1
      ? `这张牌属于${element}元素，适合从${elementMeaning(element)}的角度核对它与你现实处境的关系。`
      : `${element}元素出现 ${elementCount} 次，是当前最集中的能量；它提示你从${elementMeaning(element)}的角度重新理解问题。`,
  );
  observations.push(energyTone);

  return {
    headline: headlineMap[category.id][reversedCount > uprightCount ? 1 : 0],
    overview: `围绕“${question.text}”，${primary.position.name}的${primary.card.name}${primary.reversed ? "逆位" : "正位"}成为这次牌阵的锚点。${energyTone}`,
    uprightCount,
    reversedCount,
    majorCount,
    element,
    elementCount,
    primaryCardId: primary.card.id,
    narrative: createSpreadNarrative(reading),
    connections: createConnections(reading),
    observations,
    actions: createActionSteps(reading),
  };
}

function elementMeaning(element) {
  const meanings = {
    火: "行动、热情与创造",
    水: "情感、关系与直觉",
    风: "思考、沟通与判断",
    土: "资源、身体与现实执行",
    灵: "价值、阶段转变与整体方向",
  };
  return meanings[element] || "整体节奏";
}

function categoryFallbackAction(categoryId, index) {
  const actions = {
    love: ["安排一次不回避重点的坦诚沟通。", "确认你希望被如何对待，并清楚表达边界。"],
    career: ["把下一个目标缩小到一周内可交付的成果。", "找一位可信的人验证你的方向。"],
    wealth: ["先核对真实数据与最坏情形，再决定投入。", "为基本储备设置不可动用的边界。"],
    growth: ["记录七天情绪与行为触发点，寻找重复模式。", "给恢复和成长设定可持续节奏。"],
    decision: ["写下每个选项的收益、代价与不可逆部分。", "为决定设置一个明确截止时间。"],
    daily: ["选择今天唯一最重要的小事并完成它。", "在回应前给自己三次深呼吸。"],
  };
  return actions[categoryId]?.[index % 2] || "把启发落实成一个可观察的小行动。";
}

export { createSynthesis };
