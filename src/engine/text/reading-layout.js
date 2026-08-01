function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

const LAYOUTS = Object.freeze({
  single: Object.freeze([
    Object.freeze({ id: "core", title: "核心讯息", positionIds: Object.freeze(["essence"]) }),
  ]),
  timeline: Object.freeze([
    Object.freeze({ id: "past", title: "过去线索", positionIds: Object.freeze(["past"]) }),
    Object.freeze({ id: "present", title: "当下状态", positionIds: Object.freeze(["present"]) }),
    Object.freeze({ id: "future", title: "近期趋势", positionIds: Object.freeze(["future"]) }),
  ]),
  cross: Object.freeze([
    Object.freeze({ id: "situation", title: "现状与根源", positionIds: Object.freeze(["core", "root"]) }),
    Object.freeze({ id: "trajectory", title: "趋势与影响", positionIds: Object.freeze(["trend", "influence"]) }),
    Object.freeze({ id: "action", title: "行动方向", positionIds: Object.freeze(["action"]) }),
  ]),
  celtic: Object.freeze([
    Object.freeze({ id: "present", title: "当前与挑战", positionIds: Object.freeze(["present", "challenge"]) }),
    Object.freeze({ id: "foundation", title: "过去与深层根基", positionIds: Object.freeze(["past", "below"]) }),
    Object.freeze({ id: "trajectory", title: "近期发展与意识目标", positionIds: Object.freeze(["future", "above"]) }),
    Object.freeze({ id: "guidance", title: "建议与外部影响", positionIds: Object.freeze(["advice", "external"]) }),
    Object.freeze({ id: "horizon", title: "期待、担忧与阶段结果", positionIds: Object.freeze(["hopes", "outcome"]) }),
  ]),
});

const CELTIC_V2_LAYOUT = Object.freeze([
  Object.freeze({ id: "present", title: "当前与挑战", positionIds: Object.freeze(["present", "challenge"]) }),
  Object.freeze({ id: "foundation", title: "过去与深层根基", positionIds: Object.freeze(["past", "below"]) }),
  Object.freeze({ id: "trajectory", title: "发展与意识方向", positionIds: Object.freeze(["future", "above"]) }),
  Object.freeze({ id: "self-environment", title: "当事人状态与外部环境", positionIds: Object.freeze(["self", "external"]) }),
  Object.freeze({ id: "horizon", title: "希望、恐惧与最终结果", positionIds: Object.freeze(["hopes", "outcome"]) }),
]);

export function createReadingLayout({ spreadId, observations, candidateBatch }) {
  const definition = spreadId === "celtic" && observations.some((item) => item.positionId === "self")
    ? CELTIC_V2_LAYOUT
    : LAYOUTS[spreadId];
  if (!definition) throw new Error(`Unknown reading layout: ${spreadId}`);
  const observationsByPosition = new Map(observations.map((item) => [item.positionId, item]));
  const sections = definition.map((section) => {
    const sectionObservations = section.positionIds.map((id) => observationsByPosition.get(id)).filter(Boolean);
    const sectionCandidates = candidateBatch.candidates.filter((candidate) => (
      candidate.positionIds.some((positionId) => section.positionIds.includes(positionId))
    ));
    return {
      ...section,
      observations: sectionObservations,
      candidateIds: sectionCandidates.map((item) => item.id),
      evidenceRefs: [...new Set(sectionCandidates.flatMap((item) => item.evidenceRefs))],
    };
  });
  return deepFreeze({
    schemaVersion: "1.0.0",
    spreadId,
    sections,
    conclusionSection: { id: "conclusion", title: "综合结论" },
  });
}

export { CELTIC_V2_LAYOUT, LAYOUTS };
