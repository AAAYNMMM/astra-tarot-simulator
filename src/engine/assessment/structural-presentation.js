const LABELS = Object.freeze({
  foundation: "基础", process: "过程", outcome: "结果", stability: "稳定性",
  resistance: "阻力", cost: "代价", controllability: "可控性", interCardConflict: "牌间冲突",
});
const PENALTY_FACTORS = new Set(["resistance", "cost", "interCardConflict"]);
const GRADE_LABELS = Object.freeze({
  SSS: "结构高度支持", SS: "整体强势支持", S: "明显顺势", A: "较为顺畅",
  B: "略有支持", C: "条件参半", D: "阻力明显", E: "结构明显受阻",
});
const CAP_TEXT = Object.freeze({
  "single-maximum": "单张牌不支持高于 S 的综合等级",
  "weak-foundation": "基础支撑偏弱",
  "weak-core-factor": "过程、稳定性或可控性存在明显短板",
  "severe-resistance-or-conflict": "阻力或牌间冲突偏高",
  "high-cost": "现实成本偏高",
  "sss-eligibility": "尚未同时满足最高等级的全部资格条件",
  "ss-conflict-eligibility": "牌间冲突超过 SS 资格线",
  "s-outcome-eligibility": "结果支撑尚未达到 S 资格线",
  "conditional-result-support": "凯尔特结果仅获得条件性支持",
  "contradicted-result-support": "凯尔特结果受到前九位置反证",
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

export function createStructuralPresentation(input) {
  const assessment = input?.assessment || input;
  if (!assessment || !["valid", "incomplete", "invalid"].includes(assessment.status)) {
    throw new TypeError("A structural assessment is required.");
  }
  const factorSummaries = Object.entries(assessment.factorBands || {}).map(([factor, value]) => {
    const penalty = PENALTY_FACTORS.has(factor);
    const text = value.band === "not-applicable" ? "不适用"
      : value.band === "unavailable" ? "证据不足"
        : `${penalty ? "程度" : "支撑"}${value.band === "high" ? "高" : value.band === "medium" ? "中" : "低"}`;
    return {
      factor,
      label: LABELS[factor] || factor,
      band: value.band,
      text,
      evidenceRefs: [...(value.evidenceRefs || [])],
    };
  });
  return deepFreeze({
    schemaVersion: "2.0.0",
    spreadId: assessment.spreadId,
    status: assessment.status,
    grade: assessment.status === "valid" ? assessment.grade : null,
    gradeLabel: assessment.status === "valid" ? GRADE_LABELS[assessment.grade] || null : null,
    factorSummaries,
    caps: (assessment.caps || []).map((cap) => ({
      reason: cap.reason,
      maximumGrade: cap.maximumGrade,
      text: CAP_TEXT[cap.reason] || "当前条件限制了最高可支持等级",
    })),
    evidenceRefs: [...(assessment.evidenceRefs || [])],
    ...(assessment.status !== "valid" ? { issues: [...(assessment.issues || [])] } : {}),
    ...(assessment.resultSupport ? {
      resultSupport: {
        status: assessment.resultSupport.status,
        evidenceRefs: [...assessment.resultSupport.evidenceRefs],
      },
    } : {}),
  });
}

export const presentStructuralAssessment = createStructuralPresentation;
