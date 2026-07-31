function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

const SUIT_ELEMENTS = Object.freeze({
  wands: "fire",
  cups: "water",
  swords: "air",
  pentacles: "earth",
});
const COMPLEMENTARY_ELEMENTS = new Set(["air:fire", "earth:water", "fire:air", "water:earth"]);
const TENSION_ELEMENTS = new Set(["fire:water", "water:fire", "air:earth", "earth:air"]);
const COURT_STAGES = Object.freeze({ page: 1, knight: 2, queen: 3, king: 4 });
const NUMBER_NAMES = Object.freeze({ ace: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 });
const STAGE_ORDER = Object.freeze({ foundation: 1, initiation: 2, development: 3, challenge: 4, integration: 5, completion: 6 });

function cardParts(card) {
  const [prefix, suffix] = String(card.id || "").split("-");
  const suit = SUIT_ELEMENTS[prefix] ? prefix : null;
  const court = COURT_STAGES[suffix] ? suffix : null;
  const number = Number.isFinite(card.number) ? card.number : (NUMBER_NAMES[suffix] || null);
  return { suit, element: suit ? SUIT_ELEMENTS[suit] : null, court, number };
}

function elementSignal(source, target) {
  if (!source.element || !target.element) return null;
  const pair = `${source.element}:${target.element}`;
  const relation = source.element === target.element
    ? "resonates"
    : COMPLEMENTARY_ELEMENTS.has(pair)
      ? "complements"
      : TENSION_ELEMENTS.has(pair)
        ? "tensions"
        : "mixed";
  return { kind: "element", relation, source: source.element, target: target.element };
}

function numberSignal(source, target) {
  if (!Number.isFinite(source.number) || !Number.isFinite(target.number)) return null;
  const delta = target.number - source.number;
  const relation = delta === 0 ? "echoes" : Math.abs(delta) === 1 ? "progresses" : delta > 0 ? "advances" : "revisits";
  return { kind: "number", relation, source: source.number, target: target.number, delta };
}

function courtSignal(source, target) {
  if (!source.court || !target.court) return null;
  const delta = COURT_STAGES[target.court] - COURT_STAGES[source.court];
  const relation = delta === 0 ? "peer" : delta > 0 ? "matures" : "returns-to-learning";
  return { kind: "court", relation, source: source.court, target: target.court, delta };
}

function stageSignal(sourceCard, targetCard) {
  const sourceStages = [...new Set(sourceCard.relations?.stageTags || [])];
  const targetStages = [...new Set(targetCard.relations?.stageTags || [])];
  if (!sourceStages.length || !targetStages.length) return null;
  const shared = sourceStages.filter((item) => targetStages.includes(item));
  const sourceOrder = Math.min(...sourceStages.map((item) => STAGE_ORDER[item] || 99));
  const targetOrder = Math.min(...targetStages.map((item) => STAGE_ORDER[item] || 99));
  const relation = shared.length ? "shared-stage" : targetOrder > sourceOrder ? "stage-progression" : targetOrder < sourceOrder ? "stage-return" : "stage-contrast";
  return { kind: "stage", relation, source: sourceStages, target: targetStages, shared };
}

export function createAuxiliaryRelationSignals({ sourceCard, targetCard, sourceObservation, targetObservation }) {
  if (!sourceCard || !targetCard || !sourceObservation || !targetObservation) {
    throw new TypeError("Auxiliary Relation signals require cards and observations.");
  }
  const source = cardParts(sourceCard);
  const target = cardParts(targetCard);
  const signals = [
    elementSignal(source, target),
    numberSignal(source, target),
    courtSignal(source, target),
    stageSignal(sourceCard, targetCard),
    {
      kind: "orientation",
      relation: sourceObservation.orientation === targetObservation.orientation ? "aligned" : "mixed",
      source: sourceObservation.orientation,
      target: targetObservation.orientation,
    },
  ].filter(Boolean);
  return deepFreeze(signals);
}

export function auxiliaryStrengthAdjustment(signals) {
  let adjustment = 0;
  for (const signal of signals || []) {
    if (["resonates", "complements", "echoes", "progresses", "matures", "shared-stage", "stage-progression", "aligned"].includes(signal.relation)) adjustment += 0.01;
    if (["tensions", "returns-to-learning", "stage-return", "mixed"].includes(signal.relation)) adjustment -= 0.01;
  }
  return Number(Math.max(-0.04, Math.min(0.04, adjustment)).toFixed(4));
}
