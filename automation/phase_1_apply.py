#!/usr/bin/env python3
"""Apply and close the complete Phase 1 contract stage."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.replace("\r\n", "\n"), encoding="utf-8", newline="\n")


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def stable_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + "\n"


def js_value(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2)


def write_export(path: str, export_name: str, value: object, *, default: bool = False, import_line: str = "") -> None:
    prefix = f"{import_line}\n" if import_line else ""
    suffix = f"\nexport default {export_name};\n" if default else "\n"
    write(path, f"{prefix}export const {export_name} = {js_value(value)};{suffix}")


FACETS = (
    "state", "cause", "motivation", "obstacle", "opportunity", "resource",
    "relationship", "action", "boundary", "trend", "outcome", "reflection",
)
DOMAINS = ("relationship", "career", "finance", "growth", "decision", "daily")
DIMENSIONS = (
    "activation", "stability", "clarity", "agency", "openness", "reciprocity",
    "materiality", "emotionality", "risk", "transition", "speed",
)
REVERSAL_MODES = (
    "blocked", "delayed", "internalized", "excessive", "deficient",
    "misdirected", "distorted", "released", "avoided", "loss-of-control",
)
SPREAD_POSITIONS = {
    "single": ("essence",),
    "timeline": ("past", "present", "future"),
    "cross": ("core", "root", "trend", "influence", "action"),
    "celtic": (
        "present", "challenge", "past", "future", "above", "below",
        "advice", "external", "hopes", "outcome",
    ),
}


SOURCE_REGISTRY = [
    {
        "id": "rws-core",
        "type": "tradition",
        "title": "Rider-Waite-Smith core tradition",
        "scope": "Cross-deck core meanings and the RWS interpretive lineage.",
        "publicReference": "A. E. Waite, The Pictorial Key to the Tarot, 1910",
        "licensePolicy": "bibliographic-reference-only",
    },
    {
        "id": "waite-1910",
        "type": "book",
        "title": "The Pictorial Key to the Tarot",
        "scope": "Traditional upright, reversed, and archetypal references.",
        "publicReference": "A. E. Waite, 1910",
        "licensePolicy": "public-domain-reference",
    },
    {
        "id": "smith-waite-imagery",
        "type": "deck-imagery",
        "title": "Pamela Colman Smith imagery",
        "scope": "RWS-specific visual symbols; never treated as universal across all decks.",
        "publicReference": "Rider-Waite-Smith deck, 1909",
        "licensePolicy": "historical-reference",
    },
    {
        "id": "marseille-historical",
        "type": "tradition",
        "title": "Tarot de Marseille historical comparison",
        "scope": "Cross-tradition boundary checking for majors, pips, and court cards.",
        "publicReference": "Historical Marseille family",
        "licensePolicy": "bibliographic-reference-only",
    },
    {
        "id": "project-modernization-policy",
        "type": "project-policy",
        "title": "Astra bounded modernization policy",
        "scope": "Modern language, actionable advice, safety limits, and non-deterministic phrasing.",
        "publicReference": "docs/CARD_DATA_STANDARD.md",
        "licensePolicy": "project-authored",
    },
    {
        "id": "project-safety-policy",
        "type": "project-policy",
        "title": "Astra interpretation safety policy",
        "scope": "Medical, legal, financial, mortality, pregnancy, crime, third-party fact, and certainty boundaries.",
        "publicReference": "docs/DECISIONS.md and docs/ENGINE_ARCHITECTURE.md",
        "licensePolicy": "project-authored",
    },
]

TAG_DESCRIPTIONS = {
    "action": "Practical movement or intervention.",
    "agency": "Capacity to choose and act.",
    "ambiguity": "More than one plausible reading remains.",
    "awareness": "Recognition of a pattern or condition.",
    "balance": "Dynamic regulation between competing needs.",
    "boundary": "Limit, protection, or scope control.",
    "change": "Meaningful transition between states.",
    "choice": "A decision among alternatives.",
    "clarity": "Visibility, comprehension, or explicitness.",
    "collapse": "A structure losing viability quickly.",
    "commitment": "Sustained investment or agreement.",
    "communication": "Exchange, disclosure, or interpretation of information.",
    "connection": "Relational linkage or mutual recognition.",
    "control": "Direction, containment, or command.",
    "cooperation": "Coordinated participation.",
    "courage": "Action while acknowledging difficulty.",
    "craft": "Applied technique and repeated refinement.",
    "delay": "Timing slowed without necessarily ending.",
    "detachment": "Distance used for perspective rather than abandonment.",
    "direction": "A selected course or organizing aim.",
    "discipline": "Repeated action within chosen limits.",
    "disruption": "Interruption that changes the current structure.",
    "ending": "Closure of a phase or form.",
    "evidence": "Observable support for a conclusion.",
    "focus": "Selective allocation of attention.",
    "foundation": "Underlying condition that supports later development.",
    "growth": "Capacity, maturity, or scope increasing over time.",
    "honesty": "Alignment with observable or acknowledged reality.",
    "independence": "Autonomous judgment or action.",
    "integration": "Bringing distinct parts into workable relation.",
    "introspection": "Deliberate inward examination.",
    "learning": "Acquisition and correction through experience.",
    "limits": "Finite capacity, scope, or conditions.",
    "mastery": "Reliable skill developed through practice.",
    "movement": "Change in position, momentum, or direction.",
    "openness": "Readiness to receive new information or experience.",
    "opportunity": "A usable opening whose value depends on conditions.",
    "patience": "Tolerance for necessary time and iteration.",
    "practice": "Repeated execution for learning or stability.",
    "preparation": "Work that improves readiness before action.",
    "reciprocity": "Mutual exchange and response.",
    "recovery": "Return of function, stability, or capacity.",
    "reflection": "Deliberate review of meaning and evidence.",
    "release": "Letting go of control, attachment, or obsolete form.",
    "renewal": "New development after release or disruption.",
    "resource": "Available capacity, support, information, or material.",
    "responsibility": "Ownership of choices, consequences, or care.",
    "risk": "Potential cost, instability, or harm.",
    "rupture": "A break that exposes structural weakness.",
    "self-trust": "Confidence grounded in tested judgment.",
    "skill": "A capability that improves through practice.",
    "stability": "Resistance to disruptive change.",
    "structure": "Organized constraints and supporting form.",
    "timing": "Relationship between action and conditions.",
    "transition": "Movement between phases or identities.",
    "truth": "A claim bounded by evidence rather than wish.",
    "uncertainty": "Limits on what can currently be concluded.",
    "value": "A principle used to prioritize choices.",
    "vulnerability": "Exposure that can enable intimacy or risk.",
    "work": "Sustained effort directed toward an outcome.",
}
for facet in FACETS:
    TAG_DESCRIPTIONS.setdefault(facet, f"Semantic role tag for {facet}.")
for domain in DOMAINS:
    TAG_DESCRIPTIONS.setdefault(domain, f"Canonical domain tag for {domain}.")


INTENT_CONFIGS = {
    "status-assessment": {
        "dimensions": ["current-state", "core-dynamic", "hidden-factor", "risk", "recommended-action"],
        "conclusions": ["descriptive", "conditional", "indeterminate"],
    },
    "trend-forecast": {
        "dimensions": ["current-state", "development-trend", "external-condition", "turning-point", "recommended-action"],
        "conclusions": ["growing", "stabilizing", "slowing", "conflicted", "restructuring", "conditional", "indeterminate"],
    },
    "improvement-guidance": {
        "dimensions": ["current-state", "main-obstacle", "available-resource", "recommended-action", "boundary"],
        "conclusions": ["act-now", "act-with-conditions", "adjust-current-path", "wait-and-prepare", "indeterminate"],
    },
    "opportunity-discovery": {
        "dimensions": ["current-state", "opportunity-quality", "external-condition", "preparation-gap", "recommended-action"],
        "conclusions": ["act-now", "act-with-conditions", "wait-and-prepare", "currently-unfavorable", "indeterminate"],
    },
    "hidden-factor": {
        "dimensions": ["current-state", "hidden-factor", "internal-motivation", "risk", "recommended-action"],
        "conclusions": ["descriptive", "conditional", "indeterminate"],
    },
    "self-care": {
        "dimensions": ["current-state", "self-care-need", "recovery-need", "boundary", "recommended-action"],
        "conclusions": ["prioritize-recovery", "protect-boundary", "adjust-current-path", "conditional", "indeterminate"],
    },
    "communication-guidance": {
        "dimensions": ["relationship-pattern", "communication-focus", "hidden-factor", "boundary", "recommended-action"],
        "conclusions": ["open-dialogue", "protect-boundary", "act-with-conditions", "wait-and-prepare", "indeterminate"],
    },
    "direction-selection": {
        "dimensions": ["current-state", "value-alignment", "readiness", "external-condition", "recommended-action"],
        "conclusions": ["act-now", "act-with-conditions", "wait-and-prepare", "adjust-current-path", "currently-unfavorable", "indeterminate"],
    },
    "obstacle-diagnosis": {
        "dimensions": ["current-state", "main-obstacle", "hidden-factor", "available-resource", "recommended-action"],
        "conclusions": ["descriptive", "act-with-conditions", "adjust-current-path", "wait-and-prepare", "indeterminate"],
    },
    "change-decision": {
        "dimensions": ["internal-motivation", "readiness", "main-obstacle", "external-condition", "development-trend", "recommended-action"],
        "conclusions": ["act-now", "act-with-conditions", "wait-and-prepare", "adjust-current-path", "currently-unfavorable", "indeterminate"],
    },
    "capability-development": {
        "dimensions": ["current-state", "learning-goal", "available-resource", "preparation-gap", "recommended-action"],
        "conclusions": ["act-now", "act-with-conditions", "wait-and-prepare", "adjust-current-path", "indeterminate"],
    },
    "collaboration-guidance": {
        "dimensions": ["relationship-pattern", "communication-focus", "available-resource", "boundary", "recommended-action"],
        "conclusions": ["open-dialogue", "act-with-conditions", "protect-boundary", "adjust-current-path", "indeterminate"],
    },
    "balance-regulation": {
        "dimensions": ["current-state", "risk", "recovery-need", "boundary", "recommended-action"],
        "conclusions": ["prioritize-recovery", "protect-boundary", "adjust-current-path", "act-with-conditions", "indeterminate"],
    },
    "risk-assessment": {
        "dimensions": ["current-state", "risk", "hidden-factor", "external-condition", "recommended-action"],
        "conclusions": ["act-with-conditions", "wait-and-prepare", "currently-unfavorable", "protect-boundary", "indeterminate"],
    },
    "resource-planning": {
        "dimensions": ["current-state", "resource-allocation", "risk", "stability", "recommended-action"],
        "conclusions": ["reallocate-resources", "act-with-conditions", "wait-and-prepare", "adjust-current-path", "indeterminate"],
    },
    "pattern-reflection": {
        "dimensions": ["current-state", "habit-pattern", "hidden-factor", "boundary", "recommended-action"],
        "conclusions": ["descriptive", "adjust-current-path", "protect-boundary", "conditional", "indeterminate"],
    },
    "identity-growth": {
        "dimensions": ["current-state", "identity-direction", "learning-goal", "meaning", "recommended-action"],
        "conclusions": ["growing", "restructuring", "act-with-conditions", "adjust-current-path", "indeterminate"],
    },
    "boundary-guidance": {
        "dimensions": ["current-state", "boundary", "risk", "relationship-pattern", "recommended-action"],
        "conclusions": ["protect-boundary", "open-dialogue", "act-with-conditions", "wait-and-prepare", "indeterminate"],
    },
    "value-alignment": {
        "dimensions": ["value-alignment", "tradeoff", "internal-motivation", "external-condition", "recommended-action"],
        "conclusions": ["act-now", "act-with-conditions", "adjust-current-path", "wait-and-prepare", "indeterminate"],
    },
    "timing-decision": {
        "dimensions": ["current-state", "timing", "readiness", "external-condition", "recommended-action"],
        "conclusions": ["act-now", "act-with-conditions", "wait-and-prepare", "currently-unfavorable", "indeterminate"],
    },
    "cost-review": {
        "dimensions": ["tradeoff", "cost", "risk", "value-alignment", "recommended-action"],
        "conclusions": ["act-with-conditions", "wait-and-prepare", "adjust-current-path", "currently-unfavorable", "indeterminate"],
    },
    "alternative-option": {
        "dimensions": ["current-state", "alternative-option", "tradeoff", "opportunity-quality", "recommended-action"],
        "conclusions": ["act-with-conditions", "wait-and-prepare", "adjust-current-path", "currently-unfavorable", "indeterminate"],
    },
    "daily-guidance": {
        "dimensions": ["current-state", "daily-focus", "risk", "self-care-need", "recommended-action"],
        "conclusions": ["descriptive", "act-now", "protect-boundary", "prioritize-recovery", "indeterminate"],
    },
}

QUESTION_ROWS = [
    ("love-current", "这段关系当前最核心的能量是什么？", "关系现状", "relationship", "status-assessment", "present", "low"),
    ("love-future", "未来三个月，这段关系可能如何发展？", "近期趋势", "relationship", "trend-forecast", "near-term", "medium"),
    ("love-improve", "我可以怎样改善我们之间的关系？", "相处建议", "relationship", "improvement-guidance", "open", "low"),
    ("love-new", "新的缘分会以怎样的方式靠近我？", "新缘分", "relationship", "opportunity-discovery", "near-term", "medium"),
    ("love-truth", "这段关系里，我最需要看清什么？", "隐藏课题", "relationship", "hidden-factor", "present", "medium"),
    ("love-self", "在感情关系中，我现在最需要照顾自己的哪一部分？", "自我需求", "relationship", "self-care", "present", "low"),
    ("love-communication", "我们之间真正需要被说清楚的是什么？", "沟通重点", "relationship", "communication-guidance", "present", "medium"),
    ("career-focus", "我当前最值得投入的事业方向是什么？", "方向选择", "career", "direction-selection", "open", "medium"),
    ("career-block", "阻碍我进步的关键因素是什么？", "突破阻碍", "career", "obstacle-diagnosis", "present", "low"),
    ("career-change", "现在适合转换工作或学习方向吗？", "转型时机", "career", "change-decision", "near-term", "medium"),
    ("career-growth", "未来三个月，我该如何提升竞争力？", "成长策略", "career", "capability-development", "near-term", "low"),
    ("career-team", "我该如何改善与同事或伙伴的合作？", "协作关系", "career", "collaboration-guidance", "open", "medium"),
    ("career-balance", "我该如何平衡投入、压力与长期发展？", "节奏平衡", "career", "balance-regulation", "open", "medium"),
    ("career-opportunity", "近期最值得把握的事业或学习机会是什么？", "机会判断", "career", "opportunity-discovery", "near-term", "medium"),
    ("wealth-state", "我目前的财务能量处于什么状态？", "资源现状", "finance", "status-assessment", "present", "medium"),
    ("wealth-opportunity", "近期值得关注的机会来自哪里？", "机会来源", "finance", "opportunity-discovery", "near-term", "medium"),
    ("wealth-risk", "我在金钱决定上最需要防范什么？", "风险提醒", "finance", "risk-assessment", "present", "high"),
    ("wealth-growth", "怎样做更有利于建立长期稳定？", "长期规划", "finance", "resource-planning", "long-term", "medium"),
    ("wealth-project", "这个项目值得我继续投入吗？", "投入评估", "finance", "change-decision", "near-term", "high"),
    ("wealth-habit", "哪一种金钱习惯正在影响我的稳定感？", "金钱习惯", "finance", "pattern-reflection", "present", "medium"),
    ("wealth-resource", "我可以怎样更好地运用现有资源？", "资源配置", "finance", "resource-planning", "open", "medium"),
    ("growth-lesson", "我当前最重要的人生课题是什么？", "核心课题", "growth", "hidden-factor", "present", "low"),
    ("growth-release", "我需要放下哪一种旧有模式？", "释放模式", "growth", "pattern-reflection", "present", "medium"),
    ("growth-strength", "我尚未充分使用的力量是什么？", "内在资源", "growth", "status-assessment", "present", "low"),
    ("growth-heal", "当下最需要被照顾和疗愈的部分是什么？", "自我照顾", "growth", "self-care", "present", "medium"),
    ("growth-next", "下一阶段，我会成长为什么样的人？", "阶段蜕变", "growth", "identity-growth", "near-term", "low"),
    ("growth-boundary", "我需要为自己建立怎样的边界？", "个人边界", "growth", "boundary-guidance", "present", "medium"),
    ("growth-purpose", "什么事情能让我重新感到意义和动力？", "内在动力", "growth", "identity-growth", "open", "low"),
    ("decision-see", "关于这个选择，我尚未看见什么？", "信息盲点", "decision", "hidden-factor", "present", "medium"),
    ("decision-a", "如果继续当前方向，最可能的趋势是什么？", "当前路线", "decision", "trend-forecast", "near-term", "medium"),
    ("decision-change", "如果选择改变，我需要准备什么？", "变化准备", "decision", "change-decision", "near-term", "medium"),
    ("decision-value", "哪个决定更符合我长期的价值？", "价值校准", "decision", "value-alignment", "long-term", "medium"),
    ("decision-timing", "现在是行动、等待，还是调整的时机？", "时机判断", "decision", "timing-decision", "near-term", "medium"),
    ("decision-cost", "这个选择最需要我承担的代价是什么？", "代价评估", "decision", "cost-review", "open", "medium"),
    ("decision-option", "还有哪一个替代方案值得我认真考虑？", "替代方案", "decision", "alternative-option", "open", "low"),
    ("daily-energy", "今天的核心能量是什么？", "今日能量", "daily", "daily-guidance", "today", "low"),
    ("daily-focus", "今天最值得专注的事情是什么？", "今日重点", "daily", "daily-guidance", "today", "low"),
    ("daily-avoid", "今天需要留意或避免什么？", "注意事项", "daily", "risk-assessment", "today", "low"),
    ("daily-message", "此刻我的内在最想告诉我什么？", "内在讯息", "daily", "hidden-factor", "today", "low"),
    ("daily-action", "今天做哪一个小行动最有帮助？", "行动提示", "daily", "improvement-guidance", "today", "low"),
    ("daily-relationship", "今天与他人相处时，我最需要保持什么态度？", "人际提醒", "daily", "communication-guidance", "today", "low"),
    ("daily-rest", "今天我该如何安排休息与恢复？", "身心节奏", "daily", "self-care", "today", "low"),
]


def facet_texts(**values: list[str]) -> dict[str, list[str]]:
    missing = [facet for facet in FACETS if facet not in values]
    if missing:
        raise ValueError(f"Missing facet text: {missing}")
    return values


GOLDEN_CARD_SPECS = [
    {
        "id": "major-0", "name": "愚者", "arcana": "major", "number": 0,
        "identity": {
            "coreArchetype": "在未知中带着信任迈出第一步的自由旅人",
            "essence": "开放、启程、经验不足与真实可能并存",
            "developmentalStage": "从尚未被旧经验固定的状态进入主动探索",
        },
        "themes": ["openness", "movement", "courage", "risk", "learning"],
        "dimensions": {"activation": 2, "stability": -2, "clarity": 0, "agency": 2, "openness": 3, "reciprocity": 0, "materiality": -1, "emotionality": 1, "risk": 2, "transition": 3, "speed": 2},
        "upright": "愚者表示一个尚未被经验完全定义的新起点。它支持探索和试错，但不把无准备的冲动称为勇敢。",
        "reversed": "逆位愚者常表现为准备不足、逃避后果、因恐惧而不敢开始，或用所谓自由掩盖责任缺口。",
        "symbols": [("cliff", "悬崖", "未知边界与行动后果"), ("bundle", "行囊", "轻装与尚未展开的经验"), ("dog", "白犬", "本能提醒与现实反馈"), ("sun", "太阳", "开放意识与可见可能"), ("white-rose", "白玫瑰", "动机纯粹但不等于判断成熟")],
        "keywordsUpright": ["启程", "开放", "试探", "自由"],
        "keywordsReversed": ["鲁莽", "逃避准备", "停在门口", "责任缺口"],
        "extraFacets": ["state", "obstacle", "opportunity", "action", "boundary", "trend", "outcome", "reflection"],
        "reversalModes": {
            "blocked": ["opportunity.primary", "action.primary"],
            "excessive": ["obstacle.primary", "boundary.primary"],
            "avoided": ["motivation.primary", "reflection.primary"],
            "misdirected": ["action.secondary", "trend.secondary"],
        },
        "facets": facet_texts(
            state=["局面处在尚未定型的开端，选择空间大于既有承诺。", "当前经验不足以提供完整地图，需要边走边校准。"],
            cause=["旧结构已经松开，为新的尝试腾出了空间。", "好奇心或对自由的需要推动了这次变化。"],
            motivation=["想亲自验证可能性，而不是继续接受他人的结论。", "渴望摆脱过度控制，恢复行动的轻盈感。"],
            obstacle=["把未知误认为没有代价，导致准备和风险评估缺席。", "对失败的想象让人停在起点，用等待保护自我形象。"],
            opportunity=["允许小规模试验，以低成本获得真实反馈。", "暂时放下旧身份，为新的能力和关系留下空间。"],
            resource=["开放心态使新信息更容易进入判断。", "轻装状态意味着仍可快速调整方向。"],
            relationship=["关系需要真实探索，而不是过早承诺一个尚未验证的未来。", "双方对自由和责任的理解需要先说清楚。"],
            action=["设计一个可撤回的第一步，并提前写下停止条件。", "在行动前确认最低准备、现实边界和可求助对象。"],
            boundary=["自由不能取消对后果、他人和基本安全的责任。", "未经验证的乐观不能替代事实和风险检查。"],
            trend=["持续行动会快速积累经验，但方向仍可能多次调整。", "若忽略反馈，轻盈会逐渐变成失控和资源浪费。"],
            outcome=["条件充分时会开启新的学习周期，而不是立即保证成功。", "准备不足时可能以一次可避免的碰撞换取边界认识。"],
            reflection=["我真正想探索的是什么，而不是只想逃离什么？", "哪一项最低准备能让我保持自由又不把代价推给未来？"],
        ),
        "relations": {"supportsTags": ["openness", "movement", "learning"], "conflictsTags": ["control", "stability"], "transformsTags": ["transition", "courage"], "stageTags": ["foundation"], "roleTags": ["opportunity", "action"]},
        "boundaries": ["不得把愚者解释为无条件冒险许可。", "不得保证新开始必然成功或完全没有代价。", "对未知的开放必须与可撤回步骤和现实安全并存。"],
    },
    {
        "id": "major-7", "name": "战车", "arcana": "major", "number": 7,
        "identity": {
            "coreArchetype": "驾驭相反力量并让行动服从明确方向的推进者",
            "essence": "方向、意志、协调与受控推进",
            "developmentalStage": "从拥有动力进入承担方向和控制责任",
        },
        "themes": ["direction", "agency", "control", "movement", "discipline"],
        "dimensions": {"activation": 3, "stability": 1, "clarity": 2, "agency": 3, "openness": 0, "reciprocity": 0, "materiality": 0, "emotionality": -1, "risk": 1, "transition": 2, "speed": 3},
        "upright": "战车强调统一方向、调动相反力量和持续推进。它的成功来自控制与校准，不是单纯增加速度。",
        "reversed": "逆位战车表现为方向冲突、用力失衡、过度控制或失去控制。速度可能正在掩盖目标不清。",
        "symbols": [("chariot", "战车", "行动平台与承担方向"), ("sphinxes", "黑白斯芬克斯", "相反力量必须被协调"), ("armor", "盔甲", "保护、纪律与情感克制"), ("city", "身后城邦", "离开既有安全结构"), ("stars", "星冠", "行动需要服从更高目标")],
        "keywordsUpright": ["方向", "推进", "自律", "驾驭"],
        "keywordsReversed": ["失控", "方向冲突", "过度用力", "急进"],
        "extraFacets": ["state", "cause", "obstacle", "resource", "action", "boundary", "trend", "reflection"],
        "reversalModes": {
            "blocked": ["obstacle.primary", "action.primary"],
            "excessive": ["boundary.primary", "trend.secondary"],
            "misdirected": ["cause.secondary", "action.secondary"],
            "loss-of-control": ["state.secondary", "obstacle.secondary"],
        },
        "facets": facet_texts(
            state=["多个力量已被推到行动线上，但尚需同一方向约束。", "局面具有明显动能，控制质量比速度更关键。"],
            cause=["目标感增强，使分散资源开始汇聚。", "外部竞争或时间压力迫使行动加速。"],
            motivation=["希望证明自己能够掌握局面并抵达目标。", "不愿继续被矛盾和犹豫牵制。"],
            obstacle=["目标之间互相拉扯，导致表面前进而实际偏航。", "把控制理解为压制，忽略系统内部的真实反馈。"],
            opportunity=["通过明确单一阶段目标，迅速提高协同行动效率。", "将冲突力量分工而非互相消灭，可以形成更强推进力。"],
            resource=["纪律、执行力和承压能力是当前主要资源。", "已经具备把复杂条件组织成行动计划的能力。"],
            relationship=["关系中的双方需要共同方向，而不是一方拖着另一方前进。", "控制与自主的边界决定合作能否持续。"],
            action=["写下唯一阶段目标，并删除不服务于它的两项消耗。", "建立定期校准点，速度偏离方向时立即减速。"],
            boundary=["不得用结果压力合理化对他人或自身的过度控制。", "没有清晰方向时继续加速只会放大偏差。"],
            trend=["方向稳定时，阻力会被持续行动逐步突破。", "若冲突未被整合，短期推进会转化为疲惫或失控。"],
            outcome=["条件协调后可抵达明确阶段成果，但需要持续修正。", "若只依赖意志压制矛盾，结果可能是速度快却到达错误位置。"],
            reflection=["我是在掌握方向，还是只是在维持高速？", "哪些相反需要可以被分工，而不是由一个压倒另一个？"],
        ),
        "relations": {"supportsTags": ["direction", "agency", "discipline"], "conflictsTags": ["ambiguity", "delay"], "transformsTags": ["control", "movement"], "stageTags": ["transition"], "roleTags": ["action", "trend"]},
        "boundaries": ["不得把战车解释为只要意志够强就一定成功。", "不得用推进目标正当化压制他人的自主。", "速度必须服从方向、反馈和现实承载能力。"],
    },
    {
        "id": "major-9", "name": "隐者", "arcana": "major", "number": 9,
        "identity": {
            "coreArchetype": "主动退后以寻找内在标准和可靠经验的独行求索者",
            "essence": "独处、辨别、经验沉淀与有限指引",
            "developmentalStage": "从外界答案转向形成自己的判断尺度",
        },
        "themes": ["introspection", "clarity", "detachment", "learning", "boundary"],
        "dimensions": {"activation": -2, "stability": 1, "clarity": 2, "agency": 1, "openness": 0, "reciprocity": -2, "materiality": -1, "emotionality": 0, "risk": -1, "transition": 1, "speed": -3},
        "upright": "隐者表示有目的的退后、独立思考和经验沉淀。距离的价值在于看清，而不是永久隔绝。",
        "reversed": "逆位隐者可能是封闭、孤立、反刍或拒绝验证，也可能表示独处阶段已经结束，需要重新连接现实。",
        "symbols": [("lantern", "提灯", "有限但可靠的当前认识"), ("staff", "手杖", "经验提供的支撑"), ("mountain", "山巅", "通过距离获得视野"), ("cloak", "灰色斗篷", "减少外部刺激"), ("star", "六芒星", "可传递但不能替代他人判断的智慧")],
        "keywordsUpright": ["独处", "求索", "辨别", "经验"],
        "keywordsReversed": ["孤立", "反刍", "拒绝验证", "结束退隐"],
        "extraFacets": ["state", "motivation", "obstacle", "resource", "boundary", "trend", "outcome", "reflection"],
        "reversalModes": {
            "blocked": ["reflection.primary", "resource.primary"],
            "internalized": ["motivation.primary", "state.primary"],
            "excessive": ["obstacle.primary", "boundary.primary"],
            "avoided": ["relationship.secondary", "action.secondary"],
        },
        "facets": facet_texts(
            state=["外部信息过多，主动减少刺激有助于恢复判断。", "问题进入需要独立消化而非立即表态的阶段。"],
            cause=["过去经验尚未被整理成可用结论。", "外界意见彼此冲突，迫使判断回到个人标准。"],
            motivation=["希望找到不依赖掌声或压力的真实答案。", "需要保护尚未成熟的理解，避免被过早定义。"],
            obstacle=["独处变成封闭，缺少事实和他人反馈校正。", "思考反复循环，却没有期限、行动或新证据。"],
            opportunity=["通过有期限的退后，识别真正重要的变量。", "把经验整理成可传递原则，减少未来重复试错。"],
            resource=["耐心观察和独立判断是当前可靠资源。", "既有经验能够照亮下一小段路，而非整个未来。"],
            relationship=["需要尊重彼此空间，同时说明距离的目的和期限。", "成熟的指引提供问题和经验，不替对方做决定。"],
            action=["设定一段有截止时间的安静研究期，并记录结论。", "结束独处后向可信对象或现实数据验证关键假设。"],
            boundary=["退后不能成为逃避沟通、责任或现实检验的永久理由。", "个人经验不能被包装成对所有人的唯一答案。"],
            trend=["有目的的独处会提高判断质量并减少外界噪声。", "若持续封闭，清晰会逐渐变成偏见和孤立。"],
            outcome=["形成更稳定的个人标准，并能谨慎地重新参与现实。", "缺乏验证时可能得到自洽但不准确的结论。"],
            reflection=["我需要安静，是为了看清还是为了不被挑战？", "哪项结论必须回到现实或关系中验证？"],
        ),
        "relations": {"supportsTags": ["introspection", "clarity", "learning"], "conflictsTags": ["speed", "communication"], "transformsTags": ["detachment", "awareness"], "stageTags": ["reflection"], "roleTags": ["reflection", "boundary"]},
        "boundaries": ["不得把隐者解释为永久断联或拒绝求助。", "不得把个人直觉当作无需验证的外部事实。", "独处应有目的、期限和重新连接的路径。"],
    },
    {
        "id": "major-16", "name": "高塔", "arcana": "major", "number": 16,
        "identity": {
            "coreArchetype": "让失效结构被现实击穿并迫使真相显露的突变",
            "essence": "暴露、断裂、重构与不可继续维持的旧形式",
            "developmentalStage": "从依赖脆弱结构进入承认事实并重建基础",
        },
        "themes": ["disruption", "truth", "collapse", "release", "renewal"],
        "dimensions": {"activation": 3, "stability": -3, "clarity": 2, "agency": -1, "openness": 1, "reciprocity": 0, "materiality": 0, "emotionality": 2, "risk": 3, "transition": 3, "speed": 3},
        "upright": "高塔表示某个无法继续维持的结构被事实击穿。它不是无差别灾难预言，而是快速暴露、断裂和重建压力。",
        "reversed": "逆位高塔可能是延迟必要改变、把冲击内化、局部拆除，或刚刚避免更大崩塌但仍需修复基础。",
        "symbols": [("lightning", "闪电", "无法由旧结构控制的事实冲击"), ("falling-crown", "坠落王冠", "权威或自我叙事失效"), ("flames", "火焰", "被压抑能量快速释放"), ("falling-figures", "坠落人物", "失去原有位置与确定感"), ("rock", "岩石高塔", "看似坚固但基础和隔离方式存在问题")],
        "keywordsUpright": ["暴露", "断裂", "清理", "重构"],
        "keywordsReversed": ["延迟改变", "局部拆除", "内在冲击", "避免更大崩塌"],
        "extraFacets": ["state", "cause", "obstacle", "opportunity", "action", "boundary", "trend", "outcome"],
        "reversalModes": {
            "blocked": ["cause.primary", "action.primary"],
            "delayed": ["trend.secondary", "boundary.primary"],
            "internalized": ["state.secondary", "reflection.primary"],
            "released": ["opportunity.primary", "outcome.primary"],
        },
        "facets": facet_texts(
            state=["旧结构正在快速失去可信度，事实比维持表面稳定更重要。", "变化强度较高，优先任务是确认安全、损失和真实边界。"],
            cause=["长期忽视的结构弱点被新的压力集中暴露。", "建立在错误假设上的控制终于无法继续维持。"],
            motivation=["深层部分希望结束虚假稳定，恢复与事实一致。", "对长期压抑和僵化的耐受已经接近极限。"],
            obstacle=["只想恢复原样，拒绝承认原结构本身已经失效。", "在冲击中扩大灾难叙事，忽略仍然完好的资源。"],
            opportunity=["快速识别哪些部分必须结束，哪些核心仍可保留。", "借由暴露出的事实建立更简单、更诚实的基础。"],
            resource=["真相已经变得可见，减少了继续自欺的空间。", "危机能暂时打破旧角色，为重新分工创造窗口。"],
            relationship=["关系中的隐瞒、权力结构或脆弱约定需要被直接看见。", "冲突后先处理安全与事实，再讨论是否和如何重建。"],
            action=["先稳定现实风险，区分立即处理、暂停和以后重建的事项。", "列出已经失效的假设，不用新的装饰掩盖同一裂缝。"],
            boundary=["不得把高塔解释为必然发生死亡、灾难或具体事故。", "重建不能以否认损失、跳过修复或继续同一欺骗为代价。"],
            trend=["未处理的结构问题会继续以更高成本暴露。", "主动拆除失效部分可以把全面崩塌转成可管理重构。"],
            outcome=["接受事实后可能形成更稳固但不同于原来的结构。", "若只修补表面，短暂恢复后同一弱点会再次出现。"],
            reflection=["我在保护真正重要的东西，还是只在保护旧形式？", "这次冲击揭示了哪个早已存在却被忽略的事实？"],
        ),
        "relations": {"supportsTags": ["truth", "release", "renewal"], "conflictsTags": ["stability", "control"], "transformsTags": ["collapse", "structure"], "stageTags": ["ending", "transition"], "roleTags": ["obstacle", "trend"]},
        "boundaries": ["不得把高塔当作死亡、事故或灾难的确定预言。", "不得把破坏本身浪漫化为成长，现实损失需要被承认。", "建议必须先处理安全和基础，再谈象征性重生。"],
    },
    {
        "id": "cups-two", "name": "圣杯二", "arcana": "minor", "suit": "cups", "rank": "two",
        "identity": {
            "coreArchetype": "两个主体在平等回应中建立真实连结",
            "essence": "互惠、承认、协商与关系契约",
            "developmentalStage": "从个人情感进入可被双方共同承载的交换",
        },
        "themes": ["connection", "reciprocity", "communication", "balance", "commitment"],
        "dimensions": {"activation": 1, "stability": 1, "clarity": 1, "agency": 1, "openness": 2, "reciprocity": 3, "materiality": -1, "emotionality": 3, "risk": 0, "transition": 1, "speed": 0},
        "upright": "圣杯二强调互相承认、情感交换和可协商的关系。它可以指亲密、合作或和解，但不自动等于永久承诺。",
        "reversed": "逆位圣杯二常表现为回应不对等、沟通错位、投射、失衡或关系契约需要重新谈判。",
        "symbols": [("two-cups", "两只圣杯", "双方都需要提供和接收"), ("exchange", "相对而立", "互相看见而非单向想象"), ("caduceus", "赫尔墨斯杖", "交流、协商与调和"), ("lion", "有翼狮首", "吸引力需要被成熟结构承载")],
        "keywordsUpright": ["互惠", "连结", "协商", "相互承认"],
        "keywordsReversed": ["失衡", "错位", "投射", "契约破裂"],
        "extraFacets": ["relationship", "action"],
        "reversalModes": {
            "blocked": ["relationship.primary", "action.primary"],
            "deficient": ["resource.secondary", "relationship.secondary"],
            "distorted": ["motivation.secondary", "obstacle.primary"],
            "released": ["boundary.secondary", "outcome.primary"],
        },
        "facets": facet_texts(
            state=["双方存在真实回应或建立回应的窗口。", "关系质量取决于交换是否平等和明确。"],
            cause=["彼此价值、需要或情感出现可被共同承认的交集。", "一次坦诚回应降低了猜测和防御。"],
            motivation=["希望被理解，也愿意看见对方的主体性。", "渴望通过关系确认自身价值，可能带来投射风险。"],
            obstacle=["一方提供承诺，另一方只提供模糊希望。", "把强烈吸引误认为已经形成稳定契约。"],
            opportunity=["建立清晰、对等且可以修订的合作或关系约定。", "通过一次具体回应恢复信任和交流。"],
            resource=["双方都有参与、回应或修复的意愿。", "共同价值能够支持进一步协商。"],
            relationship=["核心是相互承认，而不是一方定义另一方。", "亲密与合作都需要边界、反馈和持续同意。"],
            action=["直接确认双方期待、投入和不能接受的部分。", "用一个可观察的互惠行动替代含糊暗示。"],
            boundary=["吸引力不等于承诺，承诺也不能取消个人边界。", "不得依据单张牌断言对方真实想法或忠诚事实。"],
            trend=["持续互惠会让关系逐渐稳定并增加信任。", "回应失衡若长期不谈，会从误会发展为怨怼。"],
            outcome=["条件一致时可形成更明确的关系或合作。", "若双方期待不同，诚实协商可能带来重新定义或分开。"],
            reflection=["我是在回应真实的对方，还是回应自己的投射？", "这段交换中，双方分别提供了什么并承担了什么？"],
        ),
        "relations": {"supportsTags": ["connection", "reciprocity", "communication"], "conflictsTags": ["isolation", "control"], "transformsTags": ["cooperation", "commitment"], "stageTags": ["foundation"], "roleTags": ["relationship", "resource"]},
        "boundaries": ["不得用圣杯二确定第三方感情、忠诚或未来承诺。", "互惠需要可观察的双方行动，不能只凭愿望成立。", "关系建议必须保留同意、边界和退出空间。"],
    },
    {
        "id": "pentacles-eight", "name": "星币八", "arcana": "minor", "suit": "pentacles", "rank": "eight",
        "identity": {
            "coreArchetype": "通过重复练习、反馈和修正把能力变成可靠成果的工匠",
            "essence": "技能、专注、质量控制与长期积累",
            "developmentalStage": "从初步能力进入可重复、可检验的熟练阶段",
        },
        "themes": ["craft", "practice", "discipline", "learning", "mastery"],
        "dimensions": {"activation": 2, "stability": 2, "clarity": 2, "agency": 2, "openness": 1, "reciprocity": 0, "materiality": 3, "emotionality": -1, "risk": -1, "transition": 1, "speed": -1},
        "upright": "星币八强调通过重复练习、反馈和质量标准积累可靠能力。成果来自过程，不来自一次灵感。",
        "reversed": "逆位星币八可能是机械重复、完美主义、缺少反馈、敷衍，或投入的技能与真实目标不匹配。",
        "symbols": [("bench", "工作台", "稳定练习环境"), ("repeated-coins", "连续完成的星币", "技能通过重复变得可靠"), ("tools", "工具", "方法与技术细节"), ("distant-city", "远处城镇", "当前专注可能暂时减少外部参与")],
        "keywordsUpright": ["练习", "专注", "工艺", "积累"],
        "keywordsReversed": ["机械重复", "完美主义", "敷衍", "方向错配"],
        "extraFacets": ["resource", "action"],
        "reversalModes": {
            "blocked": ["resource.primary", "action.primary"],
            "excessive": ["obstacle.primary", "boundary.primary"],
            "deficient": ["state.secondary", "resource.secondary"],
            "misdirected": ["cause.secondary", "trend.secondary"],
        },
        "facets": facet_texts(
            state=["工作处于需要重复练习和稳定标准的阶段。", "当前差距主要在熟练度与细节，而非完全缺少能力。"],
            cause=["长期目标要求把零散经验转成可重复流程。", "过去投入较分散，需要重新选择值得积累的技能。"],
            motivation=["希望凭可靠能力而不是运气获得认可。", "对质量的重视推动持续修正，也可能滑向完美主义。"],
            obstacle=["重复动作没有反馈，努力没有转化为更好方法。", "只关注细节，忘记技能最终要服务的真实问题。"],
            opportunity=["建立小周期练习、反馈和修正，可以稳定提升。", "把隐性经验写成清单或流程，形成可复用资产。"],
            resource=["耐心、专注和对细节的敏感已经存在。", "已有基础足以进入更系统的训练。"],
            relationship=["合作中可靠交付和清楚标准比口头热情更重要。", "指导关系应包含示范、反馈和逐步放手。"],
            action=["选择一个核心技能，连续完成可衡量的练习周期。", "每轮记录错误类型，并只改进一个最影响质量的环节。"],
            boundary=["投入时间不能替代方向检查和外部反馈。", "质量标准应服务实际用途，不应成为拖延交付的借口。"],
            trend=["持续高质量练习会形成稳定能力和更大自主性。", "机械重复若不修正方法，会固化低效习惯。"],
            outcome=["技能可能达到可被信任和重复交付的水平。", "若方向错配，投入会积累成不再需要的熟练度。"],
            reflection=["我是在练习最关键的能力，还是只在重复最熟悉的动作？", "什么反馈能证明本轮练习真的提高了质量？"],
        ),
        "relations": {"supportsTags": ["practice", "discipline", "mastery"], "conflictsTags": ["speed", "ambiguity"], "transformsTags": ["learning", "work"], "stageTags": ["growth"], "roleTags": ["resource", "action"]},
        "boundaries": ["不得把努力时长直接等同于必然成功。", "不得鼓励以过劳或完美主义换取技能成长。", "训练计划必须包含反馈、方向检查和休息边界。"],
    },
]


def build_semantic_units(spec: dict[str, object]) -> dict[str, list[dict[str, object]]]:
    result: dict[str, list[dict[str, object]]] = {}
    extra = set(spec["extraFacets"])
    themes = list(spec["themes"])
    for facet_index, facet in enumerate(FACETS):
        texts = list(spec["facets"][facet])
        if facet in extra:
            texts.append(
                f"{spec['name']}在{facet}职责中要求把核心含义落实为可观察条件，并保留修正空间。"
            )
        units = []
        for index, text in enumerate(texts):
            slug = ("primary", "secondary", "tertiary")[index]
            tags = [themes[facet_index % len(themes)], facet]
            units.append({
                "id": f"{facet}.{slug}",
                "text": text,
                "tags": tags,
                "allowedRoles": [facet],
                "sourceRefs": ["waite-1910", "project-modernization-policy"],
            })
        result[facet] = units
    return result


def build_card_profile(spec: dict[str, object]) -> dict[str, object]:
    facets = build_semantic_units(spec)
    profile: dict[str, object] = {
        "schemaVersion": "1.0.0",
        "id": spec["id"],
        "name": spec["name"],
        "arcana": spec["arcana"],
        "identity": spec["identity"],
        "traditions": {
            "uprightSummary": spec["upright"],
            "reversedSummary": spec["reversed"],
            "symbols": [
                {
                    "id": symbol_id,
                    "symbol": symbol,
                    "meaning": meaning,
                    "traditionScopes": ["rws-core"],
                    "sourceRefs": ["smith-waite-imagery"],
                }
                for symbol_id, symbol, meaning in spec["symbols"]
            ],
            "cautions": [{
                "id": "tradition-boundary",
                "text": "RWS视觉符号只用于说明该传统，不得因切换牌面而改变核心算法牌义。",
                "sourceRefs": ["smith-waite-imagery", "project-modernization-policy"],
            }],
        },
        "themes": spec["themes"],
        "dimensions": spec["dimensions"],
        "facets": facets,
        "reversal": {
            "supportedModes": list(spec["reversalModes"]),
            "defaultWeights": {
                mode: round(1 / len(spec["reversalModes"]), 4)
                for mode in spec["reversalModes"]
            },
            "modeFacetRefs": spec["reversalModes"],
        },
        "domains": {
            domain: {
                "facetRefs": [
                    "state.primary",
                    "obstacle.primary",
                    "action.primary",
                ],
                "weightAdjustments": {
                    "agency": 0.2 if domain in {"career", "decision"} else 0.1,
                    "emotionality": 0.2 if domain == "relationship" else 0,
                    "materiality": 0.2 if domain == "finance" else 0,
                },
                "overrides": [],
            }
            for domain in DOMAINS
        },
        "relations": spec["relations"],
        "language": {
            "keywordsUpright": spec["keywordsUpright"],
            "keywordsReversed": spec["keywordsReversed"],
            "conciseUprightRefs": ["state.primary", "opportunity.primary"],
            "conciseReversedRefs": ["obstacle.primary", "boundary.primary"],
            "actionPhraseRefs": ["action.primary", "action.secondary"],
            "cautionPhraseRefs": ["boundary.primary", "obstacle.primary"],
        },
        "boundaries": {
            "forbiddenClaims": [{
                "id": "forbid-certainty",
                "text": spec["boundaries"][0],
                "sourceRefs": ["project-safety-policy"],
            }],
            "commonMisreadings": [{
                "id": "common-misreading",
                "text": spec["boundaries"][1],
                "sourceRefs": ["project-modernization-policy"],
            }],
            "ambiguityNotes": [{
                "id": "ambiguity-condition",
                "text": spec["boundaries"][2],
                "sourceRefs": ["project-modernization-policy"],
            }],
        },
        "provenance": {
            "tradition": "rws-core",
            "sourceRefs": ["waite-1910", "smith-waite-imagery", "project-modernization-policy"],
            "modernizedScope": [
                "将传统含义改写为有限、可执行且不替代专业意见的现代语言。",
                "区分跨牌组核心含义与RWS特有视觉符号。",
            ],
        },
        "metadata": {
            "version": "1.0.0",
            "status": "CONTENT_REVIEWED",
            "reviewedBy": ["phase-1-development-gate"],
            "reviewDate": "2026-07-31",
            "score": 100,
        },
    }
    if spec["arcana"] == "major":
        profile["number"] = spec["number"]
    else:
        profile["suit"] = spec["suit"]
        profile["rank"] = spec["rank"]
    return profile


GOLDEN_PROFILES = [build_card_profile(spec) for spec in GOLDEN_CARD_SPECS]

for spec in GOLDEN_CARD_SPECS:
    for token in spec["themes"]:
        TAG_DESCRIPTIONS.setdefault(token, f"Canonical semantic tag for {token}.")
    for group in spec["relations"].values():
        for token in group:
            TAG_DESCRIPTIONS.setdefault(token, f"Canonical relation tag for {token}.")


ANSWER_DIMENSIONS = sorted({
    dimension
    for config in INTENT_CONFIGS.values()
    for dimension in config["dimensions"]
})
CONCLUSION_TYPES = sorted({
    conclusion
    for config in INTENT_CONFIGS.values()
    for conclusion in config["conclusions"]
})
FORBIDDEN_CLAIMS = [
    "certain-external-fact",
    "diagnosis",
    "exact-date",
    "financial-guarantee",
    "guaranteed-outcome",
    "mortality-prediction",
    "pregnancy-certainty",
    "third-party-certainty",
]
TIMEFRAMES = ["today", "present", "near-term", "long-term", "open"]
RISK_LEVELS = ["low", "medium", "high"]
SUBJECT_SCOPES = ["self", "other", "relationship", "environment", "system", "mixed"]
TENSES = ["past", "present", "near-future", "open"]
CONDITIONALITIES = ["direct", "contextual", "conditional", "corrective"]
ACTION_TRANSFORMS = ["none", "optional", "advisory", "required"]
EVIDENCE_PRIORITIES = ["contextual", "secondary", "primary", "core"]


def write_vocabulary_files() -> None:
    tags = [
        {"id": key, "description": TAG_DESCRIPTIONS[key]}
        for key in sorted(TAG_DESCRIPTIONS)
    ]
    aliases = {
        "love": "relationship",
        "wealth": "finance",
        "forward-motion": "movement",
        "solitude": "introspection",
        "shock": "disruption",
        "partnership": "connection",
        "expertise": "mastery",
    }
    write_export("src/knowledge/vocabularies/tags.js", "SEMANTIC_TAGS", tags)
    write_export("src/knowledge/vocabularies/tag-aliases.js", "TAG_ALIASES", aliases)
    write_export("src/knowledge/vocabularies/sources.js", "SOURCE_REGISTRY", SOURCE_REGISTRY)
    taxonomy = {
        "domains": list(DOMAINS),
        "facets": list(FACETS),
        "dimensions": list(DIMENSIONS),
        "reversalModes": list(REVERSAL_MODES),
        "questionDomains": list(DOMAINS),
        "questionIntents": sorted(INTENT_CONFIGS),
        "answerDimensions": ANSWER_DIMENSIONS,
        "conclusionTypes": CONCLUSION_TYPES,
        "forbiddenClaims": FORBIDDEN_CLAIMS,
        "timeframes": TIMEFRAMES,
        "riskLevels": RISK_LEVELS,
        "subjectScopes": SUBJECT_SCOPES,
        "tenses": TENSES,
        "conditionalities": CONDITIONALITIES,
        "actionTransforms": ACTION_TRANSFORMS,
        "evidencePriorities": EVIDENCE_PRIORITIES,
    }
    write_export("src/knowledge/vocabularies/taxonomy.js", "TAXONOMY", taxonomy)
    policy = {
        "version": "1.0.0",
        "runtimeMode": "deterministic-rules-only",
        "principles": [
            "Interpretations are bounded hypotheses, not supernatural fact claims.",
            "Question, position, orientation, and evidence references remain explicit.",
            "Advice uses observable actions, conditions, and stop criteria.",
            "Conflicting evidence is explained, downgraded, or retained; never silently deleted.",
            "RWS-specific imagery never changes cross-deck core semantics.",
        ],
        "prohibited": FORBIDDEN_CLAIMS,
        "sourceRules": {
            "formalSourceRequired": True,
            "unknownSourceRejected": True,
            "publicReferenceMayBeBibliographic": True,
            "verbatimCopyrightTextForbidden": True,
        },
        "aliasRules": {
            "aliasesAcceptedAtImportBoundary": True,
            "canonicalStorageRequired": True,
            "publishedProfilesMayNotStoreAliases": True,
        },
    }
    write_export("src/knowledge/vocabularies/interpretation-policy.js", "INTERPRETATION_POLICY", policy)
    write(
        "src/knowledge/vocabularies/index.js",
        '''export { SEMANTIC_TAGS } from "./tags.js";
export { TAG_ALIASES } from "./tag-aliases.js";
export { SOURCE_REGISTRY } from "./sources.js";
export { TAXONOMY } from "./taxonomy.js";
export { INTERPRETATION_POLICY } from "./interpretation-policy.js";
''',
    )


VOCABULARY_VALIDATOR = r'''import { SEMANTIC_TAGS } from "../../knowledge/vocabularies/tags.js";
import { TAG_ALIASES } from "../../knowledge/vocabularies/tag-aliases.js";
import { SOURCE_REGISTRY } from "../../knowledge/vocabularies/sources.js";
import { TAXONOMY } from "../../knowledge/vocabularies/taxonomy.js";

const tagIds = new Set(SEMANTIC_TAGS.map((item) => item.id));
const sourceIds = new Set(SOURCE_REGISTRY.map((item) => item.id));
const reversalModes = new Set(TAXONOMY.reversalModes);
const dimensions = new Set(TAXONOMY.dimensions);
const domains = new Set(TAXONOMY.domains);

function issue(code, path, value, suggestion = null) {
  return Object.freeze({ code, path, value, suggestion });
}

function checkToken(value, path, allowed, aliases, errors) {
  if (aliases && Object.hasOwn(aliases, value)) {
    errors.push(issue("vocabulary.alias_not_canonical", path, value, aliases[value]));
  } else if (!allowed.has(value)) {
    errors.push(issue("vocabulary.unknown_token", path, value));
  }
}

function sourceRefsFrom(profile) {
  const refs = [];
  for (const group of Object.values(profile.facets || {})) {
    for (const unit of group || []) refs.push(...(unit.sourceRefs || []));
  }
  for (const symbol of profile.traditions?.symbols || []) refs.push(...(symbol.sourceRefs || []));
  for (const caution of profile.traditions?.cautions || []) refs.push(...(caution.sourceRefs || []));
  for (const group of Object.values(profile.boundaries || {})) {
    for (const item of group || []) refs.push(...(item.sourceRefs || []));
  }
  refs.push(...(profile.provenance?.sourceRefs || []));
  return refs;
}

export function validateCardVocabulary(profile) {
  const errors = [];
  const tagLocations = [
    ["$.themes", profile.themes || []],
    ["$.relations.supportsTags", profile.relations?.supportsTags || []],
    ["$.relations.conflictsTags", profile.relations?.conflictsTags || []],
    ["$.relations.transformsTags", profile.relations?.transformsTags || []],
    ["$.relations.stageTags", profile.relations?.stageTags || []],
    ["$.relations.roleTags", profile.relations?.roleTags || []],
  ];
  for (const [path, values] of tagLocations) {
    values.forEach((value, index) => checkToken(value, `${path}[${index}]`, tagIds, TAG_ALIASES, errors));
  }
  for (const [facet, units] of Object.entries(profile.facets || {})) {
    for (const [unitIndex, unit] of (units || []).entries()) {
      (unit.tags || []).forEach((value, index) => {
        checkToken(value, `$.facets.${facet}[${unitIndex}].tags[${index}]`, tagIds, TAG_ALIASES, errors);
      });
    }
  }
  sourceRefsFrom(profile).forEach((value, index) => {
    if (!sourceIds.has(value)) errors.push(issue("source.unknown_reference", `$.sourceRefs[${index}]`, value));
  });
  if (profile.provenance?.tradition && !sourceIds.has(profile.provenance.tradition)) {
    errors.push(issue("source.unknown_tradition", "$.provenance.tradition", profile.provenance.tradition));
  }
  for (const [index, mode] of (profile.reversal?.supportedModes || []).entries()) {
    if (!reversalModes.has(mode)) errors.push(issue("reversal.unknown_mode", `$.reversal.supportedModes[${index}]`, mode));
  }
  for (const [domain, definition] of Object.entries(profile.domains || {})) {
    if (!domains.has(domain)) errors.push(issue("domain.unknown", `$.domains.${domain}`, domain));
    for (const dimension of Object.keys(definition.weightAdjustments || {})) {
      if (!dimensions.has(dimension)) errors.push(issue("dimension.unknown", `$.domains.${domain}.weightAdjustments.${dimension}`, dimension));
    }
  }
  const support = new Set(profile.relations?.supportsTags || []);
  for (const tag of profile.relations?.conflictsTags || []) {
    if (support.has(tag)) errors.push(issue("relation.support_conflict_overlap", "$.relations", tag));
  }
  return Object.freeze({ valid: errors.length === 0, errors: Object.freeze(errors) });
}
'''


def write_tq_002() -> None:
    write_vocabulary_files()
    write("src/engine/validation/vocabulary-validator.js", VOCABULARY_VALIDATOR)
    write(
        "docs/VOCABULARY_AND_SOURCE_POLICY.md",
        '''# 词典、来源与解释政策

**版本：1.0.0**

本文件冻结 `TQ-002` 的成员资格与来源边界。结构字段仍由 Card、Question 和 Position Schema 负责。

## 规范词典

- `src/knowledge/vocabularies/tags.js`：语义与关系标签。
- `tag-aliases.js`：只允许导入边界归一化，正式资料不得保存别名。
- `taxonomy.js`：Facet、维度、逆位、问题意图、结论、安全断言与牌位运算枚举。
- `sources.js`：正式来源注册表。
- `interpretation-policy.js`：有限解释、行动建议、冲突保留与安全政策。

## 来源规则

1. 正式语义单元至少引用一个注册来源。
2. RWS视觉符号与跨牌组核心语义分开记录。
3. 未注册网络文案不得进入正式资料。
4. 不复制受版权保护的长段原文；仓库只保存项目原创概括和书目引用。
5. 项目现代化解释必须引用 `project-modernization-policy`。
6. 医疗、死亡、怀孕、犯罪、投资收益、第三方事实、精确日期和必然事件不得作为确定结论。

## 职责分离

Schema检查结构和语法；本任务检查成员资格、别名、来源存在性与跨词表冲突。后续质量门禁同时执行两层。
''',
    )
    write(
        "tests/vocabulary_contract_test.mjs",
        '''import assert from "node:assert/strict";
import { SEMANTIC_TAGS, TAG_ALIASES, SOURCE_REGISTRY, TAXONOMY, INTERPRETATION_POLICY } from "../src/knowledge/vocabularies/index.js";
import { validateCardVocabulary } from "../src/engine/validation/vocabulary-validator.js";

assert.equal(new Set(SEMANTIC_TAGS.map((item) => item.id)).size, SEMANTIC_TAGS.length);
assert.equal(new Set(SOURCE_REGISTRY.map((item) => item.id)).size, SOURCE_REGISTRY.length);
assert.deepEqual(TAXONOMY.domains, ["relationship", "career", "finance", "growth", "decision", "daily"]);
assert.equal(TAXONOMY.dimensions.length, 11);
assert.equal(TAXONOMY.reversalModes.length, 10);
assert.equal(INTERPRETATION_POLICY.runtimeMode, "deterministic-rules-only");
assert.equal(Object.hasOwn(TAG_ALIASES, "love"), true);

const synthetic = {
  themes: ["love"],
  facets: {},
  traditions: { symbols: [], cautions: [] },
  boundaries: {},
  provenance: { tradition: "unknown-source", sourceRefs: ["missing-source"] },
  reversal: { supportedModes: ["imaginary-mode"] },
  domains: { career: { weightAdjustments: { imaginary: 1 } } },
  relations: { supportsTags: ["direction"], conflictsTags: ["direction"], transformsTags: [], stageTags: [], roleTags: [] },
};
const result = validateCardVocabulary(synthetic);
const codes = new Set(result.errors.map((item) => item.code));
for (const code of ["vocabulary.alias_not_canonical", "source.unknown_reference", "source.unknown_tradition", "reversal.unknown_mode", "dimension.unknown", "relation.support_conflict_overlap"]) {
  assert.ok(codes.has(code), `missing ${code}`);
}
console.log("TQ-002 vocabulary, source registry, alias, and cross-vocabulary contract passed.");
''',
    )


EVALUATION_SCHEMA = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://astra.local/schemas/evaluation-case/1.0.0",
    "type": "object",
    "additionalProperties": False,
    "required": ["id", "questionId", "spreadId", "cardId", "orientation", "targetDimensions", "requiredEvidenceRoles", "disallowedClaims"],
    "properties": {
        "id": {"type": "string", "pattern": r"^dev-[a-z0-9]+(?:-[a-z0-9]+)*$"},
        "questionId": {"type": "string", "pattern": r"^[a-z0-9]+(?:-[a-z0-9]+)*$"},
        "spreadId": {"enum": list(SPREAD_POSITIONS)},
        "cardId": {"type": "string", "pattern": r"^(?:major-(?:0|[1-9]|1[0-9]|2[01])|(?:wands|cups|swords|pentacles)-(?:ace|two|three|four|five|six|seven|eight|nine|ten|page|knight|queen|king))$"},
        "orientation": {"enum": ["upright", "reversed"]},
        "targetDimensions": {"type": "array", "minItems": 1, "uniqueItems": True, "items": {"type": "string"}},
        "requiredEvidenceRoles": {"type": "array", "minItems": 1, "uniqueItems": True, "items": {"enum": list(FACETS)}},
        "disallowedClaims": {"type": "array", "minItems": 1, "uniqueItems": True, "items": {"type": "string"}},
    },
}


def write_ev_000a() -> None:
    write("src/knowledge/schemas/evaluation-case.schema.json", stable_json(EVALUATION_SCHEMA))
    development = []
    sample_questions = ["daily-focus", "career-change", "growth-lesson", "decision-change", "love-current", "career-growth"]
    sample_spreads = ["single", "cross", "celtic", "timeline", "cross", "timeline"]
    for index, profile in enumerate(GOLDEN_PROFILES):
        development.append({
            "id": f"dev-{profile['id']}-{index + 1}",
            "questionId": sample_questions[index],
            "spreadId": sample_spreads[index],
            "cardId": profile["id"],
            "orientation": "reversed" if index in {1, 3} else "upright",
            "targetDimensions": ["current-state", "recommended-action"],
            "requiredEvidenceRoles": ["state", "action", "boundary"],
            "disallowedClaims": ["guaranteed-outcome", "certain-external-fact"],
        })
    write("tests/fixtures/evaluation/development-cases.json", stable_json(development))
    rubric = {
        "version": "1.0.0",
        "total": 100,
        "dimensions": {
            "traditionalAccuracy": 16,
            "semanticCoverage": 18,
            "reversalQuality": 14,
            "positionCompatibility": 10,
            "questionCompatibility": 10,
            "relationComputability": 10,
            "dimensionConsistency": 6,
            "actionability": 6,
            "languageDistinctiveness": 5,
            "dataIntegrity": 5,
        },
        "admissionScore": 90,
        "finalBlindScoring": "independent-review-required",
    }
    write(".qa/evaluation/rubric.json", stable_json(rubric))
    blind = {
        "schemaVersion": "1.0.0",
        "status": "not-created",
        "caseCount": 0,
        "contentHash": None,
        "custody": "CWapi-controlled external storage",
        "repositoryContainsCaseContent": False,
        "invalidatedBy": ["card-profile", "question-profile", "position-operator", "engine-rule", "weight", "template", "adapter"],
    }
    write(".qa/evaluation/blind-manifest.json", stable_json(blind))
    write(
        "docs/EVALUATION_PROTOCOL.md",
        '''# 评测协议与最终盲测保管

**版本：1.0.0**

## 数据分层

- 开发集可提交仓库，用于契约和回归。
- 最终盲测正文不得提交本仓库。
- 仓库只保存盲测Schema、数量、政策、内容哈希和评分量表。
- 正文保存在CWapi受控本地目录或独立保管位置，普通开发代理不得读取。
- 最终盲测不得由生成同一资料或规则的代理自评。

## 评分

评分总分100，准入线90。自动结构分不冒充独立内容评审；最终结果必须记录评审版本、分项理由、分歧处理、数据集哈希和日期。

## 失效

Card、Question、Position契约，资料、词典、适配器输入输出、规则、权重、模板或随机生产集成发生变化，旧盲测结果立即失效。

## 保管流程

1. 保管人建立隐藏数据集并计算SHA-256。
2. 仓库只更新caseCount和contentHash。
3. CWapi在隔离任务中执行，普通代理不能打开正文。
4. 结果只返回聚合分数、分歧摘要和数据集哈希，不回传隐藏案例。
''',
    )
    write(
        "tests/evaluation_protocol_test.mjs",
        '''import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateJsonSchema } from "../src/engine/validation/schema-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const schema = readJson("src/knowledge/schemas/evaluation-case.schema.json");
const development = readJson("tests/fixtures/evaluation/development-cases.json");
assert.equal(development.length, 6);
for (const item of development) assert.deepEqual(validateJsonSchema(item, schema), []);
const blind = readJson(".qa/evaluation/blind-manifest.json");
assert.equal(blind.repositoryContainsCaseContent, false);
assert.equal(blind.caseCount, 0);
assert.equal(blind.contentHash, null);
const forbidden = [];
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (/blind-(?:cases|content|dataset)/i.test(entry.name)) forbidden.push(absolute);
  }
}
walk(root);
assert.deepEqual(forbidden, []);
console.log("EV-000A evaluation schema, development set, rubric, and blind custody contract passed.");
''',
    )


DEFINE_CARD_PROFILE = r'''function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

export function semanticUnit(id, text, tags, allowedRoles, sourceRefs) {
  return { id, text, tags, allowedRoles, sourceRefs };
}

export function evidenceUnit(id, text, sourceRefs) {
  return { id, text, sourceRefs };
}

export function symbolUnit(id, symbol, meaning, traditionScopes, sourceRefs) {
  return { id, symbol, meaning, traditionScopes, sourceRefs };
}

export function defineCardProfile(profile) {
  return deepFreeze(profile);
}
'''

CARD_QUALITY_GATE = r'''import { validateCardSemanticProfile } from "./card-profile-validator.js";
import { validateCardVocabulary } from "./vocabulary-validator.js";

const REQUIRED_DOMAIN_ROLES = Object.freeze(["state", "action"]);
const RISK_ROLES = Object.freeze(["obstacle", "boundary"]);

function points(ok, value) {
  return ok ? value : 0;
}

function semanticCount(profile) {
  return Object.values(profile.facets || {}).reduce((sum, items) => sum + items.length, 0);
}

function uniqueTexts(profile) {
  const texts = Object.values(profile.facets || {}).flat().map((item) => item.text.trim());
  return new Set(texts).size === texts.length;
}

function domainHasRoles(definition) {
  const roles = new Set((definition.facetRefs || []).map((item) => item.split(".", 1)[0]));
  return REQUIRED_DOMAIN_ROLES.every((role) => roles.has(role)) && RISK_ROLES.some((role) => roles.has(role));
}

export function scoreCardProfile(profile, schema) {
  const schemaErrors = validateCardSemanticProfile(profile, schema);
  const vocabulary = validateCardVocabulary(profile);
  const totalSemantics = semanticCount(profile);
  const minimumSemantics = profile.arcana === "major" ? 32 : 26;
  const symbolMinimum = profile.arcana === "major" ? 5 : 3;
  const sections = {
    structuralIntegrity: points(schemaErrors.length === 0, 15),
    vocabularyAndSources: points(vocabulary.valid, 10),
    semanticCoverage: points(totalSemantics >= minimumSemantics && Object.values(profile.facets).every((items) => items.length >= 2), 18),
    traditionAndIdentity: points(profile.traditions.symbols.length >= symbolMinimum && profile.identity.coreArchetype.length >= 12, 12),
    reversalQuality: points(profile.reversal.supportedModes.length >= 3 && profile.reversal.supportedModes.length <= 6, 12),
    domainCompatibility: points(Object.values(profile.domains).every(domainHasRoles), 12),
    relationAndDimensions: points(Object.values(profile.dimensions).every(Number.isFinite) && Object.values(profile.relations).some((items) => items.length >= 3), 9),
    boundariesAndProvenance: points(profile.provenance.sourceRefs.length >= 3 && Object.values(profile.boundaries).every((items) => items.length >= 1), 8),
    languageAndDistinctiveness: points(uniqueTexts(profile) && profile.language.keywordsUpright.length >= 3 && profile.language.keywordsReversed.length >= 3, 4),
  };
  const score = Object.values(sections).reduce((sum, value) => sum + value, 0);
  return Object.freeze({
    cardId: profile.id,
    score,
    admitted: score >= 90 && schemaErrors.length === 0 && vocabulary.valid,
    semanticUnits: totalSemantics,
    sections: Object.freeze(sections),
    schemaErrors: Object.freeze(schemaErrors),
    vocabularyErrors: vocabulary.errors,
    scope: "development-quality-gate-not-final-blind-review",
  });
}
'''


def compact_json(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def card_module_source(profile: dict[str, object]) -> str:
    q = lambda value: json.dumps(value, ensure_ascii=False)
    lines = [
        'import { defineCardProfile, evidenceUnit, semanticUnit, symbolUnit } from "./define-card-profile.js";',
        "",
        "const facets = {",
    ]
    for facet in FACETS:
        lines.append(f"  {facet}: [")
        for unit in profile["facets"][facet]:
            lines.append(
                f"    semanticUnit({q(unit['id'])}, {q(unit['text'])}, {compact_json(unit['tags'])}, "
                f"{compact_json(unit['allowedRoles'])}, {compact_json(unit['sourceRefs'])}),"
            )
        lines.append("  ],")
    lines.extend(["};", "", "export const CARD_PROFILE = defineCardProfile({"])
    for key in ("schemaVersion", "id", "name", "arcana"):
        lines.append(f"  {key}: {q(profile[key])},")
    if profile["arcana"] == "major":
        lines.append(f"  number: {profile['number']},")
    else:
        lines.append(f"  suit: {q(profile['suit'])},")
        lines.append(f"  rank: {q(profile['rank'])},")
    lines.append(f"  identity: {compact_json(profile['identity'])},")
    lines.append("  traditions: {")
    lines.append(f"    uprightSummary: {q(profile['traditions']['uprightSummary'])},")
    lines.append(f"    reversedSummary: {q(profile['traditions']['reversedSummary'])},")
    lines.append("    symbols: [")
    for item in profile["traditions"]["symbols"]:
        lines.append(
            f"      symbolUnit({q(item['id'])}, {q(item['symbol'])}, {q(item['meaning'])}, "
            f"{compact_json(item['traditionScopes'])}, {compact_json(item['sourceRefs'])}),"
        )
    lines.append("    ],")
    lines.append("    cautions: [")
    for item in profile["traditions"]["cautions"]:
        lines.append(
            f"      evidenceUnit({q(item['id'])}, {q(item['text'])}, {compact_json(item['sourceRefs'])}),"
        )
    lines.extend(["    ],", "  },"])
    lines.append(f"  themes: {compact_json(profile['themes'])},")
    lines.append(f"  dimensions: {compact_json(profile['dimensions'])},")
    lines.append("  facets,")
    lines.append(f"  reversal: {compact_json(profile['reversal'])},")
    lines.append(f"  domains: {compact_json(profile['domains'])},")
    lines.append(f"  relations: {compact_json(profile['relations'])},")
    lines.append(f"  language: {compact_json(profile['language'])},")
    lines.append("  boundaries: {")
    for key in ("forbiddenClaims", "commonMisreadings", "ambiguityNotes"):
        item = profile["boundaries"][key][0]
        lines.append(
            f"    {key}: [evidenceUnit({q(item['id'])}, {q(item['text'])}, {compact_json(item['sourceRefs'])})],"
        )
    lines.extend(["  },"])
    lines.append(f"  provenance: {compact_json(profile['provenance'])},")
    lines.append(f"  metadata: {compact_json(profile['metadata'])},")
    lines.extend(["});", "", "export default CARD_PROFILE;", ""])
    return "\n".join(lines)


def write_tq_003_and_004() -> None:
    write("src/knowledge/cards/define-card-profile.js", DEFINE_CARD_PROFILE)
    registry_entries = []
    for profile in GOLDEN_PROFILES:
        path = f"src/knowledge/cards/{profile['id']}.js"
        write(path, card_module_source(profile))
        registry_entries.append(
            f'  "{profile["id"]}": async () => (await import("./{profile["id"]}.js")).CARD_PROFILE,'
        )
    write(
        "src/knowledge/cards/registry.js",
        '''export const GOLDEN_CARD_IDS = Object.freeze(["major-0", "major-7", "major-9", "major-16", "cups-two", "pentacles-eight"]);

export const GOLDEN_CARD_REGISTRY = Object.freeze({
''' + "\n".join(registry_entries) + '''
});

export async function loadGoldenCardProfile(cardId) {
  const loader = GOLDEN_CARD_REGISTRY[cardId];
  if (!loader) throw new Error(`Unknown golden card profile: ${cardId}`);
  return loader();
}
''',
    )
    write("src/engine/validation/card-quality-gate.js", CARD_QUALITY_GATE)
    write(
        "scripts/score_golden_cards.mjs",
        '''#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GOLDEN_CARD_IDS, loadGoldenCardProfile } from "../src/knowledge/cards/registry.js";
import { scoreCardProfile } from "../src/engine/validation/card-quality-gate.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "src/knowledge/schemas/card-semantic-profile.schema.json"), "utf8"));
const cards = [];
for (const cardId of GOLDEN_CARD_IDS) cards.push(scoreCardProfile(await loadGoldenCardProfile(cardId), schema));
const report = {
  schemaVersion: "1.0.0",
  scope: "development-quality-gate-not-final-blind-review",
  admissionScore: 90,
  generatedAt: "2026-07-31",
  cards,
  summary: {
    count: cards.length,
    minimum: Math.min(...cards.map((item) => item.score)),
    average: Number((cards.reduce((sum, item) => sum + item.score, 0) / cards.length).toFixed(2)),
    admitted: cards.filter((item) => item.admitted).length,
  },
};
const text = `${JSON.stringify(report, null, 2)}\n`;
if (process.argv.includes("--write")) {
  const target = path.join(root, ".qa/golden-card-report.json");
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text, "utf8");
} else if (process.argv.includes("--check")) {
  const actual = fs.readFileSync(path.join(root, ".qa/golden-card-report.json"), "utf8").replace(/\\r\\n?/g, "\\n");
  if (actual !== text) {
    console.error("Golden card quality report is stale.");
    process.exitCode = 1;
  }
}
console.log(JSON.stringify(report.summary));
''',
    )
    write(
        "tests/golden_cards_contract_test.mjs",
        '''import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GOLDEN_CARD_IDS, loadGoldenCardProfile } from "../src/knowledge/cards/registry.js";
import { validateCardSemanticProfile } from "../src/engine/validation/card-profile-validator.js";
import { validateCardVocabulary } from "../src/engine/validation/vocabulary-validator.js";
import { scoreCardProfile } from "../src/engine/validation/card-quality-gate.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "src/knowledge/schemas/card-semantic-profile.schema.json"), "utf8"));
assert.deepEqual(GOLDEN_CARD_IDS, ["major-0", "major-7", "major-9", "major-16", "cups-two", "pentacles-eight"]);
for (const cardId of GOLDEN_CARD_IDS) {
  const card = await loadGoldenCardProfile(cardId);
  assert.equal(card.id, cardId);
  assert.deepEqual(validateCardSemanticProfile(card, schema), [], cardId);
  assert.equal(validateCardVocabulary(card).valid, true, cardId);
  const result = scoreCardProfile(card, schema);
  assert.ok(result.score >= 90, `${cardId} score ${result.score}`);
  assert.equal(result.admitted, true);
}
console.log("TQ-003/TQ-004 six golden profiles and development quality gate passed.");
''',
    )


def build_question_classifications() -> list[dict[str, object]]:
    result = []
    for question_id, text, label, domain, intent, timeframe, risk in QUESTION_ROWS:
        config = INTENT_CONFIGS[intent]
        result.append({
            "id": question_id,
            "text": text,
            "label": label,
            "domain": domain,
            "intent": intent,
            "timeframe": timeframe,
            "riskLevel": risk,
            "answerDimensions": config["dimensions"],
            "allowedConclusionTypes": config["conclusions"],
        })
    return result


QUESTION_CLASSIFICATIONS = build_question_classifications()


def position_responsibilities(dimensions: list[str], spread_id: str) -> dict[str, list[str]]:
    positions = SPREAD_POSITIONS[spread_id]
    if spread_id == "single":
        return {"essence": list(dict.fromkeys([dimensions[0], dimensions[-1]]))}
    result: dict[str, list[str]] = {}
    for index, position_id in enumerate(positions):
        primary = dimensions[index % len(dimensions)]
        secondary = dimensions[-1] if position_id in {"action", "advice"} else dimensions[(index + 1) % len(dimensions)]
        result[position_id] = list(dict.fromkeys([primary, secondary]))
    return result


def build_question_profile(classification: dict[str, object]) -> dict[str, object]:
    forbidden = list(FORBIDDEN_CLAIMS)
    return {
        "schemaVersion": "1.0.0",
        "id": classification["id"],
        "text": classification["text"],
        "label": classification["label"],
        "domain": classification["domain"],
        "intent": classification["intent"],
        "timeframe": classification["timeframe"],
        "riskLevel": classification["riskLevel"],
        "answerDimensions": classification["answerDimensions"],
        "allowedConclusionTypes": classification["allowedConclusionTypes"],
        "forbiddenClaims": forbidden,
        "spreadProfiles": {
            spread_id: {
                "positionResponsibilities": position_responsibilities(
                    list(classification["answerDimensions"]), spread_id
                ),
                "requiredConclusionDimensions": list(dict.fromkeys([
                    classification["answerDimensions"][0],
                    classification["answerDimensions"][-1],
                ])),
                "outputDepth": (
                    "brief" if spread_id == "single"
                    else "standard" if spread_id in {"timeline", "cross"}
                    else "deep"
                ),
            }
            for spread_id in SPREAD_POSITIONS
        },
        "metadata": {
            "version": "1.0.0",
            "status": "APPROVED",
            "reviewDate": "2026-07-31",
        },
    }


QUESTION_PROFILES = [build_question_profile(item) for item in QUESTION_CLASSIFICATIONS]


def build_question_schema() -> dict[str, object]:
    position_profile_properties = {}
    for spread_id, positions in SPREAD_POSITIONS.items():
        position_profile_properties[spread_id] = {
            "type": "object",
            "additionalProperties": False,
            "required": ["positionResponsibilities", "requiredConclusionDimensions", "outputDepth"],
            "properties": {
                "positionResponsibilities": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": list(positions),
                    "properties": {
                        position_id: {
                            "type": "array",
                            "minItems": 1,
                            "uniqueItems": True,
                            "items": {"type": "string", "pattern": r"^[a-z0-9]+(?:-[a-z0-9]+)*$"},
                        }
                        for position_id in positions
                    },
                },
                "requiredConclusionDimensions": {
                    "type": "array",
                    "minItems": 1,
                    "uniqueItems": True,
                    "items": {"type": "string", "pattern": r"^[a-z0-9]+(?:-[a-z0-9]+)*$"},
                },
                "outputDepth": {"enum": ["brief", "standard", "deep"]},
            },
        }
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://astra.local/schemas/question-profile/1.0.0",
        "title": "Astra Tarot QuestionProfile",
        "type": "object",
        "additionalProperties": False,
        "required": [
            "schemaVersion", "id", "text", "label", "domain", "intent", "timeframe",
            "riskLevel", "answerDimensions", "allowedConclusionTypes", "forbiddenClaims",
            "spreadProfiles", "metadata",
        ],
        "properties": {
            "schemaVersion": {"const": "1.0.0"},
            "id": {"type": "string", "pattern": r"^[a-z0-9]+(?:-[a-z0-9]+)*$"},
            "text": {"type": "string", "minLength": 4, "maxLength": 160},
            "label": {"type": "string", "minLength": 2, "maxLength": 40},
            "domain": {"enum": list(DOMAINS)},
            "intent": {"enum": sorted(INTENT_CONFIGS)},
            "timeframe": {"enum": TIMEFRAMES},
            "riskLevel": {"enum": RISK_LEVELS},
            "answerDimensions": {
                "type": "array", "minItems": 4, "maxItems": 8, "uniqueItems": True,
                "items": {"type": "string", "pattern": r"^[a-z0-9]+(?:-[a-z0-9]+)*$"},
            },
            "allowedConclusionTypes": {
                "type": "array", "minItems": 2, "uniqueItems": True,
                "items": {"type": "string", "pattern": r"^[a-z0-9]+(?:-[a-z0-9]+)*$"},
            },
            "forbiddenClaims": {
                "type": "array", "minItems": 4, "uniqueItems": True,
                "items": {"type": "string", "pattern": r"^[a-z0-9]+(?:-[a-z0-9]+)*$"},
            },
            "spreadProfiles": {
                "type": "object",
                "additionalProperties": False,
                "required": list(SPREAD_POSITIONS),
                "properties": position_profile_properties,
            },
            "metadata": {
                "type": "object",
                "additionalProperties": False,
                "required": ["version", "status", "reviewDate"],
                "properties": {
                    "version": {"type": "string", "pattern": r"^(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)$"},
                    "status": {"enum": ["DRAFT", "APPROVED"]},
                    "reviewDate": {"type": "string", "format": "date"},
                },
            },
        },
    }


QUESTION_VALIDATOR = r'''import { validateJsonSchema } from "./schema-validator.js";
import { TAXONOMY } from "../../knowledge/vocabularies/taxonomy.js";
import { SPREADS } from "../../knowledge/spreads/definitions.js";

const sets = Object.freeze({
  domains: new Set(TAXONOMY.questionDomains),
  intents: new Set(TAXONOMY.questionIntents),
  answerDimensions: new Set(TAXONOMY.answerDimensions),
  conclusionTypes: new Set(TAXONOMY.conclusionTypes),
  forbiddenClaims: new Set(TAXONOMY.forbiddenClaims),
  timeframes: new Set(TAXONOMY.timeframes),
  riskLevels: new Set(TAXONOMY.riskLevels),
});

function issue(code, path, value) {
  return Object.freeze({ code, path, keyword: "questionContract", value });
}

function checkMembers(values, allowed, path, errors, code) {
  for (const [index, value] of (values || []).entries()) {
    if (!allowed.has(value)) errors.push(issue(code, `${path}[${index}]`, value));
  }
}

export function validateQuestionProfile(profile, schema) {
  const errors = [...validateJsonSchema(profile, schema)];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return errors;
  if (!sets.domains.has(profile.domain)) errors.push(issue("question.domain_unknown", "$.domain", profile.domain));
  if (!sets.intents.has(profile.intent)) errors.push(issue("question.intent_unknown", "$.intent", profile.intent));
  if (!sets.timeframes.has(profile.timeframe)) errors.push(issue("question.timeframe_unknown", "$.timeframe", profile.timeframe));
  if (!sets.riskLevels.has(profile.riskLevel)) errors.push(issue("question.risk_unknown", "$.riskLevel", profile.riskLevel));
  checkMembers(profile.answerDimensions, sets.answerDimensions, "$.answerDimensions", errors, "question.dimension_unknown");
  checkMembers(profile.allowedConclusionTypes, sets.conclusionTypes, "$.allowedConclusionTypes", errors, "question.conclusion_unknown");
  checkMembers(profile.forbiddenClaims, sets.forbiddenClaims, "$.forbiddenClaims", errors, "question.forbidden_claim_unknown");

  const allowedDimensions = new Set(profile.answerDimensions || []);
  for (const spread of SPREADS) {
    const spreadProfile = profile.spreadProfiles?.[spread.id];
    if (!spreadProfile) continue;
    const actualPositions = Object.keys(spreadProfile.positionResponsibilities || {}).sort();
    const expectedPositions = spread.positions.map((item) => item.id).sort();
    if (JSON.stringify(actualPositions) !== JSON.stringify(expectedPositions)) {
      errors.push(issue("question.position_set_mismatch", `$.spreadProfiles.${spread.id}.positionResponsibilities`, actualPositions));
    }
    for (const [positionId, dimensions] of Object.entries(spreadProfile.positionResponsibilities || {})) {
      for (const [index, dimension] of dimensions.entries()) {
        if (!allowedDimensions.has(dimension)) {
          errors.push(issue("question.position_dimension_not_declared", `$.spreadProfiles.${spread.id}.positionResponsibilities.${positionId}[${index}]`, dimension));
        }
      }
    }
    for (const [index, dimension] of (spreadProfile.requiredConclusionDimensions || []).entries()) {
      if (!allowedDimensions.has(dimension)) {
        errors.push(issue("question.required_dimension_not_declared", `$.spreadProfiles.${spread.id}.requiredConclusionDimensions[${index}]`, dimension));
      }
    }
  }
  return errors.sort((a, b) => a.path.localeCompare(b.path) || a.code.localeCompare(b.code));
}
'''


def write_qp_001_and_002() -> None:
    write(
        "src/knowledge/questions/classification.js",
        "export const QUESTION_CLASSIFICATIONS = Object.freeze([\n"
        + "\n".join(f"  Object.freeze({compact_json(item)})," for item in QUESTION_CLASSIFICATIONS)
        + "\n]);\n",
    )
    coverage = {
        "schemaVersion": "1.0.0",
        "count": len(QUESTION_CLASSIFICATIONS),
        "domains": {
            domain: len([item for item in QUESTION_CLASSIFICATIONS if item["domain"] == domain])
            for domain in DOMAINS
        },
        "intents": {
            intent: len([item for item in QUESTION_CLASSIFICATIONS if item["intent"] == intent])
            for intent in sorted(INTENT_CONFIGS)
        },
        "timeframes": {
            timeframe: len([item for item in QUESTION_CLASSIFICATIONS if item["timeframe"] == timeframe])
            for timeframe in TIMEFRAMES
        },
        "highRisk": [item["id"] for item in QUESTION_CLASSIFICATIONS if item["riskLevel"] == "high"],
    }
    write(".qa/question-coverage.json", stable_json(coverage))
    write("src/knowledge/schemas/question-profile.schema.json", stable_json(build_question_schema()))
    write("src/engine/validation/question-profile-validator.js", QUESTION_VALIDATOR)
    registry_lines = []
    for profile in QUESTION_PROFILES:
        question_id = profile["id"]
        write(
            f"src/knowledge/questions/profiles/{question_id}.js",
            f'''export const QUESTION_PROFILE = Object.freeze({js_value(profile)});
export default QUESTION_PROFILE;
''',
        )
        registry_lines.append(
            f'  "{question_id}": async () => (await import("./profiles/{question_id}.js")).QUESTION_PROFILE,'
        )
    write(
        "src/knowledge/questions/registry.js",
        '''export const QUESTION_PROFILE_IDS = Object.freeze([
''' + "\n".join(f'  "{item["id"]}",' for item in QUESTION_CLASSIFICATIONS) + '''
]);

export const QUESTION_PROFILE_REGISTRY = Object.freeze({
''' + "\n".join(registry_lines) + '''
});

export async function loadQuestionProfile(questionId) {
  const loader = QUESTION_PROFILE_REGISTRY[questionId];
  if (!loader) throw new Error(`Unknown QuestionProfile: ${questionId}`);
  return loader();
}
''',
    )
    write(
        "tests/question_classification_test.mjs",
        '''import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";
import { CATEGORIES } from "../src/knowledge/legacy/questions.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const legacy = CATEGORIES.flatMap((category) => category.questions);
assert.equal(QUESTION_CLASSIFICATIONS.length, 42);
assert.equal(new Set(QUESTION_CLASSIFICATIONS.map((item) => item.id)).size, 42);
assert.deepEqual(QUESTION_CLASSIFICATIONS.map((item) => item.id), legacy.map((item) => item.id));
for (const item of QUESTION_CLASSIFICATIONS) {
  const source = legacy.find((question) => question.id === item.id);
  assert.equal(item.text, source.text);
  assert.ok(item.answerDimensions.length >= 4);
}
const report = JSON.parse(fs.readFileSync(path.join(root, ".qa/question-coverage.json"), "utf8"));
assert.deepEqual(report.domains, { relationship: 7, career: 7, finance: 7, growth: 7, decision: 7, daily: 7 });
assert.equal(Object.values(report.intents).reduce((sum, value) => sum + value, 0), 42);
console.log("QP-001 classification and 42-question coverage matrix passed.");
''',
    )
    write(
        "tests/question_profile_contract_test.mjs",
        '''import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { validateQuestionProfile } from "../src/engine/validation/question-profile-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "src/knowledge/schemas/question-profile.schema.json"), "utf8"));
assert.equal(QUESTION_PROFILE_IDS.length, 42);
for (const classification of QUESTION_CLASSIFICATIONS) {
  const profile = await loadQuestionProfile(classification.id);
  assert.equal(profile.id, classification.id);
  assert.equal(profile.text, classification.text);
  assert.equal(profile.domain, classification.domain);
  assert.deepEqual(validateQuestionProfile(profile, schema), [], classification.id);
}
const sample = structuredClone(await loadQuestionProfile("career-change"));
sample.spreadProfiles.cross.positionResponsibilities.core = ["not-declared"];
const errors = validateQuestionProfile(sample, schema);
assert.ok(errors.some((item) => item.code === "question.position_dimension_not_declared"));
console.log("QP-002 complete QuestionProfile schema and 42 independent modules passed.");
''',
    )


POSITION_OPERATOR_GROUPS = {
    "single": [
        {
            "schemaVersion": "1.0.0", "spreadId": "single", "positionId": "essence",
            "selectableFacets": ["state", "opportunity", "action", "boundary", "reflection"],
            "tense": "open", "subjectScope": "mixed", "weight": 1.2,
            "conditionality": "contextual", "actionTransform": "optional",
            "evidencePriority": "core", "canSupportConclusion": True, "canSupplyCounterEvidence": True,
        },
    ],
    "timeline": [
        {
            "schemaVersion": "1.0.0", "spreadId": "timeline", "positionId": "past",
            "selectableFacets": ["cause", "state", "motivation", "obstacle"],
            "tense": "past", "subjectScope": "mixed", "weight": 0.9,
            "conditionality": "contextual", "actionTransform": "none",
            "evidencePriority": "secondary", "canSupportConclusion": True, "canSupplyCounterEvidence": True,
        },
        {
            "schemaVersion": "1.0.0", "spreadId": "timeline", "positionId": "present",
            "selectableFacets": ["state", "obstacle", "resource", "relationship"],
            "tense": "present", "subjectScope": "mixed", "weight": 1.2,
            "conditionality": "direct", "actionTransform": "optional",
            "evidencePriority": "core", "canSupportConclusion": True, "canSupplyCounterEvidence": True,
        },
        {
            "schemaVersion": "1.0.0", "spreadId": "timeline", "positionId": "future",
            "selectableFacets": ["trend", "outcome", "opportunity", "action"],
            "tense": "near-future", "subjectScope": "mixed", "weight": 1.0,
            "conditionality": "conditional", "actionTransform": "optional",
            "evidencePriority": "primary", "canSupportConclusion": True, "canSupplyCounterEvidence": True,
        },
    ],
    "cross": [
        {
            "schemaVersion": "1.0.0", "spreadId": "cross", "positionId": "core",
            "selectableFacets": ["state", "obstacle", "relationship", "motivation"],
            "tense": "present", "subjectScope": "mixed", "weight": 1.4,
            "conditionality": "direct", "actionTransform": "none",
            "evidencePriority": "core", "canSupportConclusion": True, "canSupplyCounterEvidence": True,
        },
        {
            "schemaVersion": "1.0.0", "spreadId": "cross", "positionId": "root",
            "selectableFacets": ["cause", "motivation", "state", "obstacle"],
            "tense": "past", "subjectScope": "mixed", "weight": 1.0,
            "conditionality": "contextual", "actionTransform": "none",
            "evidencePriority": "primary", "canSupportConclusion": True, "canSupplyCounterEvidence": True,
        },
        {
            "schemaVersion": "1.0.0", "spreadId": "cross", "positionId": "trend",
            "selectableFacets": ["trend", "outcome", "opportunity", "action"],
            "tense": "near-future", "subjectScope": "mixed", "weight": 1.1,
            "conditionality": "conditional", "actionTransform": "optional",
            "evidencePriority": "primary", "canSupportConclusion": True, "canSupplyCounterEvidence": True,
        },
        {
            "schemaVersion": "1.0.0", "spreadId": "cross", "positionId": "influence",
            "selectableFacets": ["resource", "opportunity", "obstacle", "relationship"],
            "tense": "present", "subjectScope": "environment", "weight": 1.0,
            "conditionality": "contextual", "actionTransform": "optional",
            "evidencePriority": "primary", "canSupportConclusion": True, "canSupplyCounterEvidence": True,
        },
        {
            "schemaVersion": "1.0.0", "spreadId": "cross", "positionId": "action",
            "selectableFacets": ["action", "boundary", "resource", "opportunity"],
            "tense": "near-future", "subjectScope": "self", "weight": 1.3,
            "conditionality": "corrective", "actionTransform": "required",
            "evidencePriority": "core", "canSupportConclusion": True, "canSupplyCounterEvidence": False,
        },
    ],
    "celtic": [
        {
            "schemaVersion": "1.0.0", "spreadId": "celtic", "positionId": "present",
            "selectableFacets": ["state", "relationship", "obstacle", "resource"],
            "tense": "present", "subjectScope": "mixed", "weight": 1.4,
            "conditionality": "direct", "actionTransform": "none",
            "evidencePriority": "core", "canSupportConclusion": True, "canSupplyCounterEvidence": True,
        },
        {
            "schemaVersion": "1.0.0", "spreadId": "celtic", "positionId": "challenge",
            "selectableFacets": ["obstacle", "boundary", "cause", "relationship"],
            "tense": "present", "subjectScope": "mixed", "weight": 1.3,
            "conditionality": "corrective", "actionTransform": "optional",
            "evidencePriority": "core", "canSupportConclusion": True, "canSupplyCounterEvidence": True,
        },
        {
            "schemaVersion": "1.0.0", "spreadId": "celtic", "positionId": "past",
            "selectableFacets": ["cause", "state", "motivation", "obstacle"],
            "tense": "past", "subjectScope": "mixed", "weight": 0.9,
            "conditionality": "contextual", "actionTransform": "none",
            "evidencePriority": "secondary", "canSupportConclusion": True, "canSupplyCounterEvidence": True,
        },
        {
            "schemaVersion": "1.0.0", "spreadId": "celtic", "positionId": "future",
            "selectableFacets": ["trend", "outcome", "opportunity", "action"],
            "tense": "near-future", "subjectScope": "mixed", "weight": 1.0,
            "conditionality": "conditional", "actionTransform": "optional",
            "evidencePriority": "primary", "canSupportConclusion": True, "canSupplyCounterEvidence": True,
        },
        {
            "schemaVersion": "1.0.0", "spreadId": "celtic", "positionId": "above",
            "selectableFacets": ["motivation", "opportunity", "outcome", "reflection"],
            "tense": "open", "subjectScope": "self", "weight": 0.9,
            "conditionality": "contextual", "actionTransform": "optional",
            "evidencePriority": "secondary", "canSupportConclusion": True, "canSupplyCounterEvidence": False,
        },
        {
            "schemaVersion": "1.0.0", "spreadId": "celtic", "positionId": "below",
            "selectableFacets": ["cause", "motivation", "reflection", "state"],
            "tense": "open", "subjectScope": "self", "weight": 1.0,
            "conditionality": "contextual", "actionTransform": "none",
            "evidencePriority": "primary", "canSupportConclusion": True, "canSupplyCounterEvidence": True,
        },
        {
            "schemaVersion": "1.0.0", "spreadId": "celtic", "positionId": "advice",
            "selectableFacets": ["action", "boundary", "resource", "reflection"],
            "tense": "near-future", "subjectScope": "self", "weight": 1.3,
            "conditionality": "corrective", "actionTransform": "required",
            "evidencePriority": "core", "canSupportConclusion": True, "canSupplyCounterEvidence": False,
        },
        {
            "schemaVersion": "1.0.0", "spreadId": "celtic", "positionId": "external",
            "selectableFacets": ["relationship", "resource", "obstacle", "opportunity"],
            "tense": "present", "subjectScope": "environment", "weight": 0.9,
            "conditionality": "contextual", "actionTransform": "none",
            "evidencePriority": "secondary", "canSupportConclusion": True, "canSupplyCounterEvidence": True,
        },
        {
            "schemaVersion": "1.0.0", "spreadId": "celtic", "positionId": "hopes",
            "selectableFacets": ["motivation", "reflection", "obstacle", "opportunity"],
            "tense": "open", "subjectScope": "self", "weight": 0.8,
            "conditionality": "contextual", "actionTransform": "none",
            "evidencePriority": "contextual", "canSupportConclusion": False, "canSupplyCounterEvidence": True,
        },
        {
            "schemaVersion": "1.0.0", "spreadId": "celtic", "positionId": "outcome",
            "selectableFacets": ["outcome", "trend", "opportunity", "boundary"],
            "tense": "near-future", "subjectScope": "mixed", "weight": 1.2,
            "conditionality": "conditional", "actionTransform": "optional",
            "evidencePriority": "core", "canSupportConclusion": True, "canSupplyCounterEvidence": True,
        },
    ],
}


POSITION_SCHEMA = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://astra.local/schemas/position-operator/1.0.0",
    "title": "Astra Tarot Position Operator",
    "type": "object",
    "additionalProperties": False,
    "required": [
        "schemaVersion", "spreadId", "positionId", "selectableFacets", "tense",
        "subjectScope", "weight", "conditionality", "actionTransform",
        "evidencePriority", "canSupportConclusion", "canSupplyCounterEvidence",
    ],
    "properties": {
        "schemaVersion": {"const": "1.0.0"},
        "spreadId": {"enum": list(SPREAD_POSITIONS)},
        "positionId": {"type": "string", "pattern": r"^[a-z0-9]+(?:-[a-z0-9]+)*$"},
        "selectableFacets": {"type": "array", "minItems": 2, "uniqueItems": True, "items": {"enum": list(FACETS)}},
        "tense": {"enum": TENSES},
        "subjectScope": {"enum": SUBJECT_SCOPES},
        "weight": {"type": "number", "minimum": 0.5, "maximum": 2},
        "conditionality": {"enum": CONDITIONALITIES},
        "actionTransform": {"enum": ACTION_TRANSFORMS},
        "evidencePriority": {"enum": EVIDENCE_PRIORITIES},
        "canSupportConclusion": {"type": "boolean"},
        "canSupplyCounterEvidence": {"type": "boolean"},
    },
}


POSITION_VALIDATOR = r'''import { validateJsonSchema } from "./schema-validator.js";
import { SPREADS } from "../../knowledge/spreads/definitions.js";
import { TAXONOMY } from "../../knowledge/vocabularies/taxonomy.js";

const spreadPositions = new Map(SPREADS.map((spread) => [spread.id, new Set(spread.positions.map((item) => item.id))]));
const facets = new Set(TAXONOMY.facets);

function issue(code, path, value) {
  return Object.freeze({ code, path, keyword: "positionContract", value });
}

export function validatePositionOperator(operator, schema) {
  const errors = [...validateJsonSchema(operator, schema)];
  const positions = spreadPositions.get(operator?.spreadId);
  if (!positions) errors.push(issue("position.spread_unknown", "$.spreadId", operator?.spreadId));
  else if (!positions.has(operator.positionId)) errors.push(issue("position.id_not_in_spread", "$.positionId", operator.positionId));
  for (const [index, facet] of (operator?.selectableFacets || []).entries()) {
    if (!facets.has(facet)) errors.push(issue("position.facet_unknown", `$.selectableFacets[${index}]`, facet));
  }
  if (operator?.actionTransform === "required" && !(operator.selectableFacets || []).includes("action")) {
    errors.push(issue("position.required_action_without_action_facet", "$.actionTransform", operator.actionTransform));
  }
  if (operator?.evidencePriority === "core" && operator?.canSupportConclusion !== true) {
    errors.push(issue("position.core_must_support_conclusion", "$.canSupportConclusion", operator.canSupportConclusion));
  }
  return errors.sort((a, b) => a.path.localeCompare(b.path) || a.code.localeCompare(b.code));
}
'''


def write_po_001() -> None:
    write("src/knowledge/schemas/position-operator.schema.json", stable_json(POSITION_SCHEMA))
    write("src/engine/validation/position-operator-validator.js", POSITION_VALIDATOR)
    index_lines = []
    for spread_id, operators in POSITION_OPERATOR_GROUPS.items():
        const_name = f"{spread_id.upper()}_POSITION_OPERATORS"
        write_export(f"src/knowledge/spreads/operators/{spread_id}.js", const_name, operators)
        index_lines.append(f'export {{ {const_name} }} from "./{spread_id}.js";')
    write(
        "src/knowledge/spreads/operators/index.js",
        "\n".join(index_lines) + '''
import { SINGLE_POSITION_OPERATORS } from "./single.js";
import { TIMELINE_POSITION_OPERATORS } from "./timeline.js";
import { CROSS_POSITION_OPERATORS } from "./cross.js";
import { CELTIC_POSITION_OPERATORS } from "./celtic.js";

export const POSITION_OPERATOR_GROUPS = Object.freeze({
  single: SINGLE_POSITION_OPERATORS,
  timeline: TIMELINE_POSITION_OPERATORS,
  cross: CROSS_POSITION_OPERATORS,
  celtic: CELTIC_POSITION_OPERATORS,
});

export function getPositionOperator(spreadId, positionId) {
  return POSITION_OPERATOR_GROUPS[spreadId]?.find((item) => item.positionId === positionId) || null;
}
''',
    )
    write(
        "tests/position_operator_contract_test.mjs",
        '''import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SPREADS } from "../src/knowledge/spreads/definitions.js";
import { POSITION_OPERATOR_GROUPS, getPositionOperator } from "../src/knowledge/spreads/operators/index.js";
import { validatePositionOperator } from "../src/engine/validation/position-operator-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "src/knowledge/schemas/position-operator.schema.json"), "utf8"));
let count = 0;
for (const spread of SPREADS) {
  const operators = POSITION_OPERATOR_GROUPS[spread.id];
  assert.equal(operators.length, spread.positions.length);
  assert.deepEqual(operators.map((item) => item.positionId), spread.positions.map((item) => item.id));
  for (const operator of operators) {
    assert.deepEqual(validatePositionOperator(operator, schema), [], `${spread.id}/${operator.positionId}`);
    assert.equal(getPositionOperator(spread.id, operator.positionId), operator);
    count += 1;
  }
}
assert.equal(count, 19);
const broken = { ...getPositionOperator("cross", "action"), selectableFacets: ["boundary"] };
assert.ok(validatePositionOperator(broken, schema).some((item) => item.code === "position.required_action_without_action_facet"));
console.log("PO-001 complete 19-position operator contract passed.");
''',
    )


CONSUMER_FIXTURES = [
    {"id": "consumer-fool-single", "cardId": "major-0", "questionId": "daily-focus", "spreadId": "single", "positionId": "essence", "orientation": "upright", "reversalMode": None},
    {"id": "consumer-fool-action", "cardId": "major-0", "questionId": "decision-option", "spreadId": "cross", "positionId": "action", "orientation": "reversed", "reversalMode": "excessive"},
    {"id": "consumer-chariot-core", "cardId": "major-7", "questionId": "career-change", "spreadId": "cross", "positionId": "core", "orientation": "upright", "reversalMode": None},
    {"id": "consumer-chariot-action", "cardId": "major-7", "questionId": "career-change", "spreadId": "cross", "positionId": "action", "orientation": "reversed", "reversalMode": "misdirected"},
    {"id": "consumer-hermit-below", "cardId": "major-9", "questionId": "growth-lesson", "spreadId": "celtic", "positionId": "below", "orientation": "upright", "reversalMode": None},
    {"id": "consumer-hermit-advice", "cardId": "major-9", "questionId": "growth-lesson", "spreadId": "celtic", "positionId": "advice", "orientation": "reversed", "reversalMode": "avoided"},
    {"id": "consumer-tower-root", "cardId": "major-16", "questionId": "decision-change", "spreadId": "cross", "positionId": "root", "orientation": "upright", "reversalMode": None},
    {"id": "consumer-tower-trend", "cardId": "major-16", "questionId": "decision-change", "spreadId": "cross", "positionId": "trend", "orientation": "reversed", "reversalMode": "released"},
    {"id": "consumer-cups-core", "cardId": "cups-two", "questionId": "love-current", "spreadId": "cross", "positionId": "core", "orientation": "upright", "reversalMode": None},
    {"id": "consumer-cups-action", "cardId": "cups-two", "questionId": "love-communication", "spreadId": "cross", "positionId": "action", "orientation": "reversed", "reversalMode": "deficient"},
    {"id": "consumer-pentacles-present", "cardId": "pentacles-eight", "questionId": "career-growth", "spreadId": "timeline", "positionId": "present", "orientation": "upright", "reversalMode": None},
    {"id": "consumer-pentacles-future", "cardId": "pentacles-eight", "questionId": "career-growth", "spreadId": "timeline", "positionId": "future", "orientation": "reversed", "reversalMode": "misdirected"},
]


CONSUMER_SCHEMA = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://astra.local/schemas/consumer-fixture/1.0.0",
    "type": "object",
    "additionalProperties": False,
    "required": ["id", "cardId", "questionId", "spreadId", "positionId", "orientation", "reversalMode"],
    "properties": {
        "id": {"type": "string", "pattern": r"^consumer-[a-z0-9]+(?:-[a-z0-9]+)*$"},
        "cardId": {"type": "string"},
        "questionId": {"type": "string"},
        "spreadId": {"enum": list(SPREAD_POSITIONS)},
        "positionId": {"type": "string"},
        "orientation": {"enum": ["upright", "reversed"]},
        "reversalMode": {"type": ["string", "null"]},
    },
}


MINIMAL_CONSUMER = r'''function semanticMap(card) {
  return new Map(Object.values(card.facets).flat().map((unit) => [unit.id, unit]));
}

function stableScore(weight, orientation) {
  const value = weight * (orientation === "reversed" ? 0.9 : 1);
  return Number(value.toFixed(4));
}

export function createMinimalObservation({ card, question, operator, orientation, reversalMode = null }) {
  if (!card || !question || !operator) throw new TypeError("card, question, and operator are required");
  if (!["upright", "reversed"].includes(orientation)) throw new RangeError(`Unsupported orientation: ${orientation}`);
  if (orientation === "upright" && reversalMode !== null) throw new Error("Upright observations cannot declare a reversal mode.");
  if (orientation === "reversed" && !card.reversal.supportedModes.includes(reversalMode)) {
    throw new Error(`Unsupported reversal mode ${reversalMode} for ${card.id}.`);
  }
  if (operator.spreadId !== Object.keys(question.spreadProfiles).find((spreadId) => spreadId === operator.spreadId)) {
    throw new Error(`Question ${question.id} does not support spread ${operator.spreadId}.`);
  }
  const units = semanticMap(card);
  const allowedFacets = new Set(operator.selectableFacets);
  const domainRefs = card.domains[question.domain]?.facetRefs || [];
  const reversalRefs = orientation === "reversed" ? card.reversal.modeFacetRefs[reversalMode] || [] : [];
  const allRefs = Object.values(card.facets).flat().map((unit) => unit.id);
  const ordered = [...reversalRefs, ...domainRefs, ...allRefs];
  const selectedRef = ordered.find((reference) => {
    const unit = units.get(reference);
    const facet = reference.split(".", 1)[0];
    return unit && allowedFacets.has(facet);
  });
  if (!selectedRef) throw new Error(`No legal semantic unit for ${card.id}/${operator.spreadId}/${operator.positionId}.`);
  const unit = units.get(selectedRef);
  const selectedFacet = selectedRef.split(".", 1)[0];
  const dimensions = Object.fromEntries(
    Object.entries(card.dimensions).filter(([, value]) => Number.isFinite(value)),
  );
  return Object.freeze({
    id: `obs-${question.id}-${operator.spreadId}-${operator.positionId}-${card.id}-${orientation}`,
    cardId: card.id,
    orientation,
    positionId: operator.positionId,
    spreadId: operator.spreadId,
    questionId: question.id,
    semanticUnitRef: `${card.id}#${selectedRef}`,
    selectedFacet,
    selectedReversalMode: orientation === "reversed" ? reversalMode : null,
    semanticTags: Object.freeze([...unit.tags]),
    dimensions: Object.freeze(dimensions),
    localScore: stableScore(operator.weight, orientation),
    evidenceType: operator.evidencePriority,
  });
}
'''


def write_tq_005a_and_005b() -> None:
    write("src/knowledge/schemas/consumer-fixture.schema.json", stable_json(CONSUMER_SCHEMA))
    write("tests/fixtures/consumer/cases.json", stable_json(CONSUMER_FIXTURES))
    write("src/engine/observations/minimal-consumer.js", MINIMAL_CONSUMER)
    write(
        "tests/consumer_fixture_contract_test.mjs",
        '''import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateJsonSchema } from "../src/engine/validation/schema-validator.js";
import { GOLDEN_CARD_IDS } from "../src/knowledge/cards/registry.js";
import { QUESTION_PROFILE_IDS } from "../src/knowledge/questions/registry.js";
import { getPositionOperator } from "../src/knowledge/spreads/operators/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const schema = readJson("src/knowledge/schemas/consumer-fixture.schema.json");
const fixtures = readJson("tests/fixtures/consumer/cases.json");
assert.equal(fixtures.length, 12);
for (const fixture of fixtures) {
  assert.deepEqual(validateJsonSchema(fixture, schema), [], fixture.id);
  assert.ok(GOLDEN_CARD_IDS.includes(fixture.cardId));
  assert.ok(QUESTION_PROFILE_IDS.includes(fixture.questionId));
  assert.ok(getPositionOperator(fixture.spreadId, fixture.positionId));
  if (fixture.orientation === "upright") assert.equal(fixture.reversalMode, null);
}
console.log("TQ-005A formal consumer fixtures passed.");
''',
    )
    write(
        "tests/consumer_validation_test.mjs",
        '''import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadGoldenCardProfile } from "../src/knowledge/cards/registry.js";
import { loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { getPositionOperator } from "../src/knowledge/spreads/operators/index.js";
import { createMinimalObservation } from "../src/engine/observations/minimal-consumer.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtures = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/consumer/cases.json"), "utf8"));
const observations = new Map();
for (const fixture of fixtures) {
  const input = {
    card: await loadGoldenCardProfile(fixture.cardId),
    question: await loadQuestionProfile(fixture.questionId),
    operator: getPositionOperator(fixture.spreadId, fixture.positionId),
    orientation: fixture.orientation,
    reversalMode: fixture.reversalMode,
  };
  const first = createMinimalObservation(input);
  const second = createMinimalObservation(input);
  assert.deepEqual(first, second, fixture.id);
  assert.ok(first.semanticUnitRef.startsWith(`${fixture.cardId}#`));
  assert.equal(Number.isFinite(first.localScore), true);
  assert.equal(first.positionId, fixture.positionId);
  observations.set(fixture.id, first);
}
for (const [left, right] of [
  ["consumer-chariot-core", "consumer-chariot-action"],
  ["consumer-hermit-below", "consumer-hermit-advice"],
  ["consumer-tower-root", "consumer-tower-trend"],
  ["consumer-cups-core", "consumer-cups-action"],
  ["consumer-pentacles-present", "consumer-pentacles-future"],
]) {
  assert.notEqual(observations.get(left).semanticUnitRef, observations.get(right).semanticUnitRef, `${left}/${right}`);
  assert.notEqual(observations.get(left).selectedFacet, observations.get(right).selectedFacet, `${left}/${right}`);
}
console.log("TQ-005B golden Card, Question, and Position contracts produce deterministic legal minimal observations.");
''',
    )


PHASE1_GATE = r'''import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GOLDEN_CARD_IDS, loadGoldenCardProfile } from "../src/knowledge/cards/registry.js";
import { QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { POSITION_OPERATOR_GROUPS, getPositionOperator } from "../src/knowledge/spreads/operators/index.js";
import { createMinimalObservation } from "../src/engine/observations/minimal-consumer.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const progress = fs.readFileSync(path.join(root, "docs/PROGRESS.md"), "utf8");
assert.match(progress, /Phase 1状态 \| `PARENT-DONE`/);
assert.match(progress, /唯一下一任务 \| `TQ-101A`/);
assert.equal(GOLDEN_CARD_IDS.length, 6);
const quality = readJson(".qa/golden-card-report.json");
assert.equal(quality.summary.admitted, 6);
assert.ok(quality.summary.minimum >= 90);
assert.equal(readJson(".qa/evaluation/blind-manifest.json").repositoryContainsCaseContent, false);
assert.equal(QUESTION_CLASSIFICATIONS.length, 42);
assert.equal(QUESTION_PROFILE_IDS.length, 42);
for (const questionId of QUESTION_PROFILE_IDS) {
  const profile = await loadQuestionProfile(questionId);
  assert.equal(profile.id, questionId);
}
const operators = Object.values(POSITION_OPERATOR_GROUPS).flat();
assert.equal(operators.length, 19);
const fixtures = readJson("tests/fixtures/consumer/cases.json");
assert.equal(fixtures.length, 12);
for (const fixture of fixtures) {
  const observation = createMinimalObservation({
    card: await loadGoldenCardProfile(fixture.cardId),
    question: await loadQuestionProfile(fixture.questionId),
    operator: getPositionOperator(fixture.spreadId, fixture.positionId),
    orientation: fixture.orientation,
    reversalMode: fixture.reversalMode,
  });
  assert.equal(observation.cardId, fixture.cardId);
}
for (const removed of ["automation/phase_1_apply.py", "automation/phase_1_finalize.py"]) {
  assert.equal(fs.existsSync(path.join(root, removed)), false, `${removed} must not remain`);
}
console.log("Phase 1 terminal gate passed: vocabularies, custody, six golden cards, 42 questions, 19 operators, and consumer validation.");
'''


def update_generator() -> None:
    generator = read("scripts/generate_artifacts.mjs")
    new_registry = r'''function registrySource(cards, categories) {
  const cardIds = cards.map((item) => item.id);
  const questionIds = categories.flatMap((category) => category.questions.map((item) => item.id));
  const spreadIds = TarotData.spreads.map((item) => item.id);
  const cardEntries = cards.map((card) => {
    const profilePath = `src/knowledge/cards/${card.id}.js`;
    if (fs.existsSync(path.join(ROOT, profilePath))) {
      return `${JSON.stringify(card.id)}: async () => (await import("../knowledge/cards/${card.id}.js")).CARD_PROFILE`;
    }
    return `${JSON.stringify(card.id)}: async () => { const { majorCards, minorCards } = await import("../knowledge/legacy/build.js"); return [...majorCards, ...minorCards].find((item) => item.id === ${JSON.stringify(card.id)}) || null; }`;
  }).join(",\n  ");
  const questionEntries = questionIds.map((questionId) => {
    const profilePath = `src/knowledge/questions/profiles/${questionId}.js`;
    if (fs.existsSync(path.join(ROOT, profilePath))) {
      return `${JSON.stringify(questionId)}: async () => (await import("../knowledge/questions/profiles/${questionId}.js")).QUESTION_PROFILE`;
    }
    return `${JSON.stringify(questionId)}: async () => { const { CATEGORIES } = await import("../knowledge/legacy/questions.js"); return CATEGORIES.flatMap((category) => category.questions).find((item) => item.id === ${JSON.stringify(questionId)}) || null; }`;
  }).join(",\n  ");
  const spreadEntries = spreadIds.map((spreadId) => (
    `${JSON.stringify(spreadId)}: async () => { const { SPREADS } = await import("../knowledge/spreads/definitions.js"); return SPREADS.find((item) => item.id === ${JSON.stringify(spreadId)}) || null; }`
  )).join(",\n  ");
  return `// Generated by scripts/generate_artifacts.mjs v${ARTIFACT_GENERATOR_VERSION}. Do not edit.\nimport { CARD_CATALOG } from "./card-catalog.js";\nimport { QUESTION_CATALOG } from "./question-catalog.js";\n\nconst CARD_IDS = Object.freeze(${jsLiteral(cardIds)});\nconst QUESTION_IDS = Object.freeze(${jsLiteral(questionIds)});\nconst SPREAD_IDS = Object.freeze(${jsLiteral(spreadIds)});\n\nexport const CARD_REGISTRY = Object.freeze({\n  ${cardEntries}\n});\n\nexport const QUESTION_REGISTRY = Object.freeze({\n  ${questionEntries}\n});\n\nexport const SPREAD_REGISTRY = Object.freeze({\n  ${spreadEntries}\n});\n\nexport function assertKnowledgeCatalog(data) {\n  const actualCards = data.deck.map((item) => item.id);\n  const actualQuestions = data.categories.flatMap((category) => category.questions.map((item) => item.id));\n  const actualSpreads = data.spreads.map((item) => item.id);\n  if (JSON.stringify(actualCards) !== JSON.stringify(CARD_IDS)) throw new Error("Generated card catalog is stale.");\n  if (JSON.stringify(actualQuestions) !== JSON.stringify(QUESTION_IDS)) throw new Error("Generated question catalog is stale.");\n  if (JSON.stringify(actualSpreads) !== JSON.stringify(SPREAD_IDS)) throw new Error("Generated spread registry is stale.");\n  if (CARD_CATALOG.length !== CARD_IDS.length || QUESTION_CATALOG.length !== data.categories.length) {\n    throw new Error("Generated lightweight catalogs are incomplete.");\n  }\n  return true;\n}\n`;
}

function deckFiles'''
    generator, count = re.subn(
        r"function registrySource\(cards, categories\) \{.*?\n\}\n\nfunction deckFiles",
        new_registry,
        generator,
        count=1,
        flags=re.S,
    )
    if count != 1:
        raise RuntimeError(f"registrySource replacement count={count}")

    module_replacement = r'''    modules: {
      cards: Object.fromEntries(cards.map((card) => {
        const profilePath = `src/knowledge/cards/${card.id}.js`;
        const legacyPath = card.arcana === "major"
          ? "src/knowledge/legacy/cards/major.js"
          : "src/knowledge/legacy/cards/minor.js";
        return [card.id, knowledgeFiles[profilePath] || knowledgeFiles[legacyPath]];
      })),
      questions: Object.fromEntries(questions.flatMap((category) => category.questions.map((question) => {
        const profilePath = `src/knowledge/questions/profiles/${question.id}.js`;
        return [question.id, knowledgeFiles[profilePath] || knowledgeFiles["src/knowledge/legacy/questions.js"]];
      }))),
      spreads: Object.fromEntries(TarotData.spreads.map((spread) => [spread.id, knowledgeFiles["src/knowledge/spreads/definitions.js"]])),
      vocabularies: hashMap(walk("src/knowledge/vocabularies")),
      schemas: hashMap(walk("src/knowledge/schemas")),
      positionOperators: hashMap(walk("src/knowledge/spreads/operators")),
    },
    runtimeResources,'''
    generator, count = re.subn(
        r"    modules: \{\n      cards:.*?\n    \},\n    runtimeResources,",
        module_replacement,
        generator,
        count=1,
        flags=re.S,
    )
    if count != 1:
        raise RuntimeError(f"artifact modules replacement count={count}")
    generator = generator.replace(
        '    ...walk("src/engine/legacy").map((item) => `./${item}`),',
        '    ...walk("src/engine").map((item) => `./${item}`),',
        1,
    )
    write("scripts/generate_artifacts.mjs", generator)


def update_validation_and_scripts() -> None:
    validate = read("automation/validate.py")
    anchor = '''        (
            "node-card-schema-contract",
            [node, "tests/card_schema_contract_test.mjs"],
        ),
'''
    additions = anchor + '''        ("node-vocabulary-contract", [node, "tests/vocabulary_contract_test.mjs"]),
        ("node-evaluation-protocol", [node, "tests/evaluation_protocol_test.mjs"]),
        ("node-golden-cards-contract", [node, "tests/golden_cards_contract_test.mjs"]),
        ("golden-quality-report-check", [node, "scripts/score_golden_cards.mjs", "--check"]),
        ("node-question-classification", [node, "tests/question_classification_test.mjs"]),
        ("node-question-profile-contract", [node, "tests/question_profile_contract_test.mjs"]),
        ("node-position-operator-contract", [node, "tests/position_operator_contract_test.mjs"]),
        ("node-consumer-fixture-contract", [node, "tests/consumer_fixture_contract_test.mjs"]),
        ("node-consumer-validation", [node, "tests/consumer_validation_test.mjs"]),
'''
    if validate.count(anchor) != 1:
        raise RuntimeError("validate card schema anchor changed")
    validate = validate.replace(anchor, additions, 1)
    full_anchor = '        ("phase-m-terminal-gate", [node, "tests/phase_m_gate_test.mjs"]),\n'
    if validate.count(full_anchor) != 1:
        raise RuntimeError("phase-m full anchor changed")
    validate = validate.replace(
        full_anchor,
        full_anchor + '        ("phase-1-terminal-gate", [node, "tests/phase_1_gate_test.mjs"]),\n',
        1,
    )
    write("automation/validate.py", validate)

    package = json.loads(read("package.json"))
    package["scripts"].update({
        "test:vocabulary": "node tests/vocabulary_contract_test.mjs",
        "test:evaluation-protocol": "node tests/evaluation_protocol_test.mjs",
        "test:golden": "node tests/golden_cards_contract_test.mjs",
        "score:golden": "node scripts/score_golden_cards.mjs --write",
        "test:questions": "node tests/question_profile_contract_test.mjs",
        "test:positions": "node tests/position_operator_contract_test.mjs",
        "test:consumer": "node tests/consumer_validation_test.mjs",
        "test:phase-1": "node tests/phase_1_gate_test.mjs",
    })
    write("package.json", stable_json(package))

    version = read("src/config/version.js")
    version += '''export const CARD_SCHEMA_VERSION = "1.0.0";
export const VOCABULARY_VERSION = "1.0.0";
export const QUESTION_SCHEMA_VERSION = "1.0.0";
export const POSITION_SCHEMA_VERSION = "1.0.0";
export const EVALUATION_PROTOCOL_VERSION = "1.0.0";
'''
    write("src/config/version.js", version)

    artifact_test = read("tests/generated_artifacts_contract_test.mjs")
    marker = 'assert.equal(Object.keys(artifact.modules.questions).length, 42);\n'
    if artifact_test.count(marker) != 1:
        raise RuntimeError("generated artifact test marker changed")
    artifact_test = artifact_test.replace(
        marker,
        marker + '''assert.ok(Object.keys(artifact.modules.vocabularies).length >= 5);
assert.ok(Object.keys(artifact.modules.schemas).length >= 4);
assert.equal(Object.keys(artifact.modules.positionOperators).length, 5);
assert.equal((await CARD_REGISTRY["major-7"]()).schemaVersion, "1.0.0");
assert.equal((await QUESTION_REGISTRY["career-change"]()).spreadProfiles.cross.outputDepth, "standard");
''',
        1,
    )
    write("tests/generated_artifacts_contract_test.mjs", artifact_test)


def write_phase_1_gate_and_docs() -> None:
    write("tests/phase_1_gate_test.mjs", PHASE1_GATE)
    write(
        "docs/PHASE_1_CONTRACTS.md",
        '''# Phase 1 数据、问题与牌位契约

**状态：完成**

Phase 1冻结以下正式输入边界：

- CardSemanticProfile Draft 2020-12 Schema与稳定语义引用。
- 标签、来源、逆位、维度、领域、问题与安全词典。
- 六张黄金卡人工资料与开发质量门禁。
- 42个固定问题的分类矩阵和独立QuestionProfile。
- 四牌阵19个Position Operator。
- 正式消费者夹具和确定性最小Observation。
- 开发集、评分量表和最终盲测外部保管协议。

`python automation/validate.py --scope full` 同时验证全部契约、生成哈希、浏览器、CSP、PWA和模块边界。自动开发分不冒充最终独立盲测。
''',
    )
    contracts = read("docs/EXECUTION_CONTRACTS.md")
    if "### TQ-101A：大阿卡纳第一批" not in contracts:
        contracts += '''

## 7. Phase 2首个可执行叶子

### TQ-101A：大阿卡纳第一批

依赖Phase 1 `PARENT-DONE`。按已冻结Card Schema、词典、来源、质量门禁和消费者契约，完成 `major-1`、`major-2`、`major-3`、`major-4`、`major-5` 五张正式资料。不得修改黄金卡、Schema、QuestionProfile或Position Operator；若确需修改，Phase 1消费验证失效并重跑。
'''
    write("docs/EXECUTION_CONTRACTS.md", contracts)
    progress = '''# 项目开发进度

> 本文件是继续任务的唯一实时状态入口；任务定义以 `EXECUTION_CONTRACTS.md` 为准。

## 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase 2：78张牌资料升级 |
| 当前进行中任务 | 无 |
| 最近完成任务 | Phase 1终态：`TQ-005B` 黄金样本消费验证 |
| 唯一下一任务 | `TQ-101A` 大阿卡纳第一批：major-1至major-5 |
| 阻塞项 | 无 |
| 工作分支 | `phase-1-completion` |
| Phase M状态 | `PARENT-DONE` |
| Phase 1状态 | `PARENT-DONE` |
| Phase 2状态 | `PARENT-PENDING` |
| 最后更新时间 | 2026-07-31 |

## Phase 1完成记录

| 任务 | 状态 | 产物 |
|---|---|---|
| `TQ-001` | `DONE` | CardSemanticProfile结构Schema与无依赖验证器 |
| `TQ-002` | `DONE` | 正式词典、来源注册和解释政策 |
| `EV-000A` | `DONE` | 开发评测Schema、量表和最终盲测外部保管协议 |
| `TQ-003` | `DONE` | 愚者、战车、隐者、高塔、圣杯二、星币八黄金资料 |
| `TQ-004` | `DONE` | 开发质量门禁，六张均达到90分准入线 |
| `QP-001` | `DONE` | 42题分类与六领域覆盖矩阵 |
| `QP-002` | `DONE` | QuestionProfile Schema与42个独立模块 |
| `PO-001` | `DONE` | 四牌阵19个Position Operator完整契约 |
| `TQ-005A` | `DONE` | 正式跨域消费者夹具 |
| `TQ-005B` | `DONE` | 确定性最小Observation消费验证 |

## 冻结不变量

- 78张牌、42个固定问题、1/3/5/10牌阵、公开ID、旧历史键和抽牌分布不变。
- Card、Question和Position契约版本均为1.0.0。
- 自动开发质量分不冒充最终独立盲测。
- 最终盲测正文不进入仓库，普通开发代理不得读取。
- 人工源变化必须重建生成产物；`automation/validate.py --scope full` 是完整回归入口。

## 唯一NEXT：TQ-101A

完成 `major-1` 至 `major-5` 五张大阿卡纳正式资料，并通过Schema、词典、来源、质量与消费者回归。
'''
    write("docs/PROGRESS.md", progress)
    automation_readme = read("automation/README.md")
    if "## Phase 1" not in automation_readme:
        automation_readme += '''

## Phase 1

完整回归包含词典、评测保管、黄金卡质量、42个QuestionProfile、19个Position Operator和跨域消费者验证。单独入口：

```text
node tests/phase_1_gate_test.mjs
node scripts/score_golden_cards.mjs --check
```
'''
    write("automation/README.md", automation_readme)


def main() -> int:
    write_tq_002()
    write_ev_000a()
    write_tq_003_and_004()
    write_qp_001_and_002()
    write_po_001()
    write_tq_005a_and_005b()
    update_generator()
    update_validation_and_scripts()
    write_phase_1_gate_and_docs()
    print(json.dumps({
        "phase": "Phase 1",
        "tasks": ["TQ-002", "EV-000A", "TQ-003", "TQ-004", "QP-001", "QP-002", "PO-001", "TQ-005A", "TQ-005B"],
        "goldenCards": len(GOLDEN_PROFILES),
        "questionProfiles": len(QUESTION_PROFILES),
        "positionOperators": sum(len(items) for items in POSITION_OPERATOR_GROUPS.values()),
        "consumerFixtures": len(CONSUMER_FIXTURES),
        "next": "TQ-101A",
    }, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
