function categoryLens(draw, reading) {
  const { card, position } = draw;
  const keywordPair = card.keywords.slice(0, 2).join("与");
  const lensByCategory = {
    love: `放在感情关系中，“${keywordPair}”提醒你观察双方的回应是否真实、边界是否平衡，以及感受能否被坦诚表达。`,
    career: `放在事业或学业中，“${keywordPair}”指向当前能力、方向和协作方式。重点是把抽象判断转化为可验证的下一步。`,
    wealth: `放在资源议题中，“${keywordPair}”要求同时评估机会与代价。任何决定都应回到现金流、时间成本和长期稳定。`,
    growth: `放在自我成长中，“${keywordPair}”映照的是你正在形成的新认知。改变会从一个被诚实看见的旧模式开始。`,
    decision: `放在选择议题中，“${keywordPair}”提供的是判断维度，而非替你决定。请把它与事实、风险和长期价值一起衡量。`,
    daily: `作为今日提示，“${keywordPair}”更适合被落实成一个小而清楚的行动，而不是预测所有细节。`,
  };
  return `${position.prompt} ${lensByCategory[reading.category.id]}`;
}

function cardStructureNote(card) {
  if (card.arcana === "major") {
    return `${card.name}属于大阿卡纳，通常会把眼前事件拉回更深的价值、身份或阶段课题；它的分量不等于吉凶，而是提醒你认真看待这次转折。`;
  }
  return `${card.name}属于${card.suitName}，以“${card.suitTheme}”为背景。它更可能通过具体沟通、选择与日常行动显现，而不是遥远且不可改变的命运。`;
}

function orientationNote(draw) {
  if (draw.reversed) {
    return "这张牌在此处为逆位，优先理解为能量受阻、向内、过度使用或正在调整；它不是正位牌义的简单反面，也不等于必然的坏结果。";
  }
  return "这张牌在此处为正位，表示相关能量较容易被意识到并向外展开；仍需结合牌位与现实信息判断如何表达，而不是把它当成绝对保证。";
}

function reflectionPrompt(draw, reading) {
  const keyword = draw.card.keywords[0];
  const prompts = {
    love: `在“${draw.position.name}”里，当“${keyword}”出现时，我真正需要表达、确认或守住的是什么？`,
    career: `关于“${draw.position.name}”所指的“${keyword}”，我能用哪一个可验证的成果判断自己是否走在正确方向？`,
    wealth: `面对“${keyword}”，有哪些真实数字、时间成本或风险边界还没有被我核对？`,
    growth: `“${keyword}”让我看见了哪一种重复模式？我愿意从哪个最小环节开始改变？`,
    decision: `哪一项事实能够帮助我区分“${keyword}”带来的真实信号与一时的期待或恐惧？`,
    daily: `今天怎样用一个二十分钟内能完成的小行动，回应“${keyword}”这项提示？`,
  };
  return prompts[reading.category.id] || `我可以怎样在现实中验证“${keyword}”带来的提醒？`;
}

export { categoryLens, cardStructureNote, orientationNote, reflectionPrompt };
