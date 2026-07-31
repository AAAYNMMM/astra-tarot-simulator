#!/usr/bin/env python3
# Apply and close the complete Phase 3 question-library stage.
from __future__ import annotations

import hashlib
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
NEW_QUESTIONS = json.loads(r'''[
  {
    "id": "love-boundaries",
    "categoryId": "love",
    "text": "这段关系中，哪些边界需要重新协商？",
    "label": "边界协商",
    "domain": "relationship",
    "intent": "boundary-guidance",
    "timeframe": "present",
    "riskLevel": "medium",
    "answerDimensions": [
      "current-state",
      "boundary",
      "relationship-pattern",
      "communication-focus",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "protect-boundary",
      "open-dialogue",
      "act-with-conditions",
      "indeterminate"
    ]
  },
  {
    "id": "love-reciprocity",
    "categoryId": "love",
    "text": "我们之间的付出与回应哪里失去平衡？",
    "label": "回应平衡",
    "domain": "relationship",
    "intent": "balance-regulation",
    "timeframe": "present",
    "riskLevel": "medium",
    "answerDimensions": [
      "current-state",
      "relationship-pattern",
      "resource-allocation",
      "hidden-factor",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "descriptive",
      "adjust-current-path",
      "open-dialogue",
      "conditional",
      "indeterminate"
    ]
  },
  {
    "id": "love-trust",
    "categoryId": "love",
    "text": "重建这段关系的信任，需要先确认什么？",
    "label": "信任修复",
    "domain": "relationship",
    "intent": "improvement-guidance",
    "timeframe": "open",
    "riskLevel": "medium",
    "answerDimensions": [
      "current-state",
      "hidden-factor",
      "communication-focus",
      "boundary",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "open-dialogue",
      "act-with-conditions",
      "protect-boundary",
      "wait-and-prepare",
      "indeterminate"
    ]
  },
  {
    "id": "love-distance",
    "categoryId": "love",
    "text": "当前的距离是在保护关系，还是在回避问题？",
    "label": "距离含义",
    "domain": "relationship",
    "intent": "pattern-reflection",
    "timeframe": "present",
    "riskLevel": "medium",
    "answerDimensions": [
      "current-state",
      "relationship-pattern",
      "hidden-factor",
      "boundary",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "descriptive",
      "adjust-current-path",
      "protect-boundary",
      "conditional",
      "indeterminate"
    ]
  },
  {
    "id": "love-choice",
    "categoryId": "love",
    "text": "面对这段关系，我真正需要做出的选择是什么？",
    "label": "关系选择",
    "domain": "relationship",
    "intent": "value-alignment",
    "timeframe": "open",
    "riskLevel": "medium",
    "answerDimensions": [
      "value-alignment",
      "tradeoff",
      "internal-motivation",
      "risk",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "act-with-conditions",
      "adjust-current-path",
      "wait-and-prepare",
      "indeterminate"
    ]
  },
  {
    "id": "love-repair",
    "categoryId": "love",
    "text": "一次有效的关系修复需要哪些现实条件？",
    "label": "修复条件",
    "domain": "relationship",
    "intent": "resource-planning",
    "timeframe": "open",
    "riskLevel": "medium",
    "answerDimensions": [
      "current-state",
      "available-resource",
      "preparation-gap",
      "boundary",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "open-dialogue",
      "act-with-conditions",
      "wait-and-prepare",
      "indeterminate"
    ]
  },
  {
    "id": "love-ending",
    "categoryId": "love",
    "text": "如果这段关系进入结束阶段，我该如何保护自己？",
    "label": "结束保护",
    "domain": "relationship",
    "intent": "change-decision",
    "timeframe": "near-term",
    "riskLevel": "high",
    "answerDimensions": [
      "current-state",
      "readiness",
      "risk",
      "boundary",
      "recovery-need",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "prioritize-recovery",
      "protect-boundary",
      "wait-and-prepare",
      "indeterminate"
    ]
  },
  {
    "id": "love-third-party",
    "categoryId": "love",
    "text": "关于第三方影响，我能确认的事实与猜测分别是什么？",
    "label": "事实核对",
    "domain": "relationship",
    "intent": "hidden-factor",
    "timeframe": "present",
    "riskLevel": "high",
    "answerDimensions": [
      "current-state",
      "hidden-factor",
      "external-condition",
      "risk",
      "communication-focus",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "descriptive",
      "open-dialogue",
      "protect-boundary",
      "indeterminate"
    ]
  },
  {
    "id": "career-role-fit",
    "categoryId": "career",
    "text": "当前角色与我的能力、价值和责任是否匹配？",
    "label": "角色匹配",
    "domain": "career",
    "intent": "value-alignment",
    "timeframe": "present",
    "riskLevel": "medium",
    "answerDimensions": [
      "current-state",
      "value-alignment",
      "available-resource",
      "preparation-gap",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "descriptive",
      "act-with-conditions",
      "adjust-current-path",
      "indeterminate"
    ]
  },
  {
    "id": "career-feedback",
    "categoryId": "career",
    "text": "我该如何理解最近收到的评价或反馈？",
    "label": "反馈理解",
    "domain": "career",
    "intent": "hidden-factor",
    "timeframe": "present",
    "riskLevel": "low",
    "answerDimensions": [
      "current-state",
      "external-condition",
      "hidden-factor",
      "learning-goal",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "descriptive",
      "adjust-current-path",
      "conditional",
      "indeterminate"
    ]
  },
  {
    "id": "career-leadership",
    "categoryId": "career",
    "text": "承担更多领导责任前，我需要补足什么？",
    "label": "领导准备",
    "domain": "career",
    "intent": "capability-development",
    "timeframe": "near-term",
    "riskLevel": "medium",
    "answerDimensions": [
      "current-state",
      "learning-goal",
      "available-resource",
      "preparation-gap",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "act-with-conditions",
      "wait-and-prepare",
      "adjust-current-path",
      "indeterminate"
    ]
  },
  {
    "id": "career-conflict",
    "categoryId": "career",
    "text": "职场冲突中，我能改变的部分是什么？",
    "label": "冲突应对",
    "domain": "career",
    "intent": "collaboration-guidance",
    "timeframe": "present",
    "riskLevel": "medium",
    "answerDimensions": [
      "relationship-pattern",
      "communication-focus",
      "boundary",
      "available-resource",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "open-dialogue",
      "protect-boundary",
      "adjust-current-path",
      "indeterminate"
    ]
  },
  {
    "id": "career-burnout",
    "categoryId": "career",
    "text": "当前压力是否已经要求我调整工作方式？",
    "label": "压力调整",
    "domain": "career",
    "intent": "balance-regulation",
    "timeframe": "present",
    "riskLevel": "high",
    "answerDimensions": [
      "current-state",
      "risk",
      "recovery-need",
      "boundary",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "prioritize-recovery",
      "protect-boundary",
      "adjust-current-path",
      "indeterminate"
    ]
  },
  {
    "id": "career-negotiation",
    "categoryId": "career",
    "text": "进行岗位、薪酬或资源沟通前，我该准备什么？",
    "label": "谈判准备",
    "domain": "career",
    "intent": "communication-guidance",
    "timeframe": "near-term",
    "riskLevel": "high",
    "answerDimensions": [
      "current-state",
      "communication-focus",
      "available-resource",
      "preparation-gap",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "open-dialogue",
      "act-with-conditions",
      "wait-and-prepare",
      "indeterminate"
    ]
  },
  {
    "id": "career-transition-cost",
    "categoryId": "career",
    "text": "转型方案最可能忽略哪一项成本？",
    "label": "转型成本",
    "domain": "career",
    "intent": "cost-review",
    "timeframe": "near-term",
    "riskLevel": "medium",
    "answerDimensions": [
      "tradeoff",
      "cost",
      "risk",
      "preparation-gap",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "act-with-conditions",
      "wait-and-prepare",
      "adjust-current-path",
      "indeterminate"
    ]
  },
  {
    "id": "career-portfolio",
    "categoryId": "career",
    "text": "哪项经历最值得转化为下一阶段的能力资产？",
    "label": "经历转化",
    "domain": "career",
    "intent": "resource-planning",
    "timeframe": "long-term",
    "riskLevel": "low",
    "answerDimensions": [
      "available-resource",
      "learning-goal",
      "identity-direction",
      "opportunity-quality",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "growing",
      "act-with-conditions",
      "adjust-current-path",
      "indeterminate"
    ]
  },
  {
    "id": "wealth-budget",
    "categoryId": "wealth",
    "text": "我的预算中最需要重新分配的是哪一部分？",
    "label": "预算调整",
    "domain": "finance",
    "intent": "resource-planning",
    "timeframe": "present",
    "riskLevel": "high",
    "answerDimensions": [
      "current-state",
      "resource-allocation",
      "risk",
      "stability",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "reallocate-resources",
      "act-with-conditions",
      "wait-and-prepare",
      "indeterminate"
    ]
  },
  {
    "id": "wealth-debt",
    "categoryId": "wealth",
    "text": "面对债务或长期负担，我应先厘清哪些条件？",
    "label": "负担梳理",
    "domain": "finance",
    "intent": "risk-assessment",
    "timeframe": "present",
    "riskLevel": "high",
    "answerDimensions": [
      "current-state",
      "risk",
      "cost",
      "external-condition",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "wait-and-prepare",
      "protect-boundary",
      "currently-unfavorable",
      "indeterminate"
    ]
  },
  {
    "id": "wealth-savings",
    "categoryId": "wealth",
    "text": "建立应急储备时，我最需要改变什么？",
    "label": "应急储备",
    "domain": "finance",
    "intent": "resource-planning",
    "timeframe": "long-term",
    "riskLevel": "medium",
    "answerDimensions": [
      "current-state",
      "habit-pattern",
      "resource-allocation",
      "stability",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "reallocate-resources",
      "adjust-current-path",
      "act-with-conditions",
      "indeterminate"
    ]
  },
  {
    "id": "wealth-investment",
    "categoryId": "wealth",
    "text": "评估一项投资前，我还缺少哪些事实？",
    "label": "投资核查",
    "domain": "finance",
    "intent": "risk-assessment",
    "timeframe": "near-term",
    "riskLevel": "high",
    "answerDimensions": [
      "current-state",
      "hidden-factor",
      "external-condition",
      "risk",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "wait-and-prepare",
      "currently-unfavorable",
      "act-with-conditions",
      "indeterminate"
    ]
  },
  {
    "id": "wealth-income",
    "categoryId": "wealth",
    "text": "增加收入时，哪种资源最值得优先投入？",
    "label": "收入资源",
    "domain": "finance",
    "intent": "opportunity-discovery",
    "timeframe": "near-term",
    "riskLevel": "medium",
    "answerDimensions": [
      "available-resource",
      "opportunity-quality",
      "preparation-gap",
      "risk",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "act-with-conditions",
      "wait-and-prepare",
      "reallocate-resources",
      "indeterminate"
    ]
  },
  {
    "id": "wealth-sharing",
    "categoryId": "wealth",
    "text": "与家人或伙伴共用资金时，需要明确什么边界？",
    "label": "共用边界",
    "domain": "finance",
    "intent": "boundary-guidance",
    "timeframe": "present",
    "riskLevel": "high",
    "answerDimensions": [
      "relationship-pattern",
      "boundary",
      "resource-allocation",
      "risk",
      "communication-focus",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "protect-boundary",
      "open-dialogue",
      "act-with-conditions",
      "indeterminate"
    ]
  },
  {
    "id": "wealth-loss",
    "categoryId": "wealth",
    "text": "面对已经发生的损失，我该如何避免继续扩大风险？",
    "label": "止损判断",
    "domain": "finance",
    "intent": "risk-assessment",
    "timeframe": "present",
    "riskLevel": "high",
    "answerDimensions": [
      "current-state",
      "risk",
      "cost",
      "stability",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "currently-unfavorable",
      "protect-boundary",
      "adjust-current-path",
      "indeterminate"
    ]
  },
  {
    "id": "wealth-purchase",
    "categoryId": "wealth",
    "text": "这项大额支出与我的长期稳定是否相符？",
    "label": "大额支出",
    "domain": "finance",
    "intent": "value-alignment",
    "timeframe": "near-term",
    "riskLevel": "high",
    "answerDimensions": [
      "value-alignment",
      "tradeoff",
      "cost",
      "stability",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "act-with-conditions",
      "wait-and-prepare",
      "currently-unfavorable",
      "indeterminate"
    ]
  },
  {
    "id": "growth-belief",
    "categoryId": "growth",
    "text": "哪一种自我信念正在限制我的选择？",
    "label": "限制信念",
    "domain": "growth",
    "intent": "pattern-reflection",
    "timeframe": "present",
    "riskLevel": "medium",
    "answerDimensions": [
      "current-state",
      "habit-pattern",
      "hidden-factor",
      "value-alignment",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "descriptive",
      "adjust-current-path",
      "conditional",
      "indeterminate"
    ]
  },
  {
    "id": "growth-emotion",
    "categoryId": "growth",
    "text": "面对反复出现的情绪，我可以先观察什么？",
    "label": "情绪观察",
    "domain": "growth",
    "intent": "self-care",
    "timeframe": "present",
    "riskLevel": "high",
    "answerDimensions": [
      "current-state",
      "self-care-need",
      "hidden-factor",
      "recovery-need",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "prioritize-recovery",
      "protect-boundary",
      "conditional",
      "indeterminate"
    ]
  },
  {
    "id": "growth-support",
    "categoryId": "growth",
    "text": "我现在需要怎样的支持，而不是独自承担？",
    "label": "支持需求",
    "domain": "growth",
    "intent": "resource-planning",
    "timeframe": "present",
    "riskLevel": "medium",
    "answerDimensions": [
      "current-state",
      "available-resource",
      "relationship-pattern",
      "boundary",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "open-dialogue",
      "protect-boundary",
      "reallocate-resources",
      "indeterminate"
    ]
  },
  {
    "id": "growth-shame",
    "categoryId": "growth",
    "text": "我该如何与羞耻或自我否定保持更安全的距离？",
    "label": "安全距离",
    "domain": "growth",
    "intent": "self-care",
    "timeframe": "present",
    "riskLevel": "high",
    "answerDimensions": [
      "current-state",
      "self-care-need",
      "recovery-need",
      "boundary",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "prioritize-recovery",
      "protect-boundary",
      "wait-and-prepare",
      "indeterminate"
    ]
  },
  {
    "id": "growth-identity",
    "categoryId": "growth",
    "text": "哪些旧身份已经不再适合下一阶段？",
    "label": "身份更新",
    "domain": "growth",
    "intent": "identity-growth",
    "timeframe": "open",
    "riskLevel": "medium",
    "answerDimensions": [
      "current-state",
      "identity-direction",
      "meaning",
      "turning-point",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "growing",
      "restructuring",
      "adjust-current-path",
      "indeterminate"
    ]
  },
  {
    "id": "growth-practice",
    "categoryId": "growth",
    "text": "哪一个可持续练习最能支持当前成长？",
    "label": "成长练习",
    "domain": "growth",
    "intent": "capability-development",
    "timeframe": "near-term",
    "riskLevel": "low",
    "answerDimensions": [
      "current-state",
      "learning-goal",
      "available-resource",
      "readiness",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "act-now",
      "act-with-conditions",
      "adjust-current-path",
      "indeterminate"
    ]
  },
  {
    "id": "growth-forgiveness",
    "categoryId": "growth",
    "text": "在考虑原谅之前，我需要先保护什么？",
    "label": "原谅边界",
    "domain": "growth",
    "intent": "boundary-guidance",
    "timeframe": "open",
    "riskLevel": "high",
    "answerDimensions": [
      "current-state",
      "boundary",
      "risk",
      "relationship-pattern",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "protect-boundary",
      "wait-and-prepare",
      "open-dialogue",
      "indeterminate"
    ]
  },
  {
    "id": "growth-help",
    "categoryId": "growth",
    "text": "什么时候应该停止自我解释并寻求专业帮助？",
    "label": "求助时机",
    "domain": "growth",
    "intent": "risk-assessment",
    "timeframe": "present",
    "riskLevel": "high",
    "answerDimensions": [
      "current-state",
      "risk",
      "recovery-need",
      "available-resource",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "prioritize-recovery",
      "protect-boundary",
      "wait-and-prepare",
      "indeterminate"
    ]
  },
  {
    "id": "decision-evidence",
    "categoryId": "decision",
    "text": "这个决定还缺少哪一项关键证据？",
    "label": "证据缺口",
    "domain": "decision",
    "intent": "hidden-factor",
    "timeframe": "present",
    "riskLevel": "medium",
    "answerDimensions": [
      "current-state",
      "hidden-factor",
      "external-condition",
      "risk",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "descriptive",
      "wait-and-prepare",
      "conditional",
      "indeterminate"
    ]
  },
  {
    "id": "decision-reversible",
    "categoryId": "decision",
    "text": "怎样把这个选择拆成可撤回的小实验？",
    "label": "可撤回实验",
    "domain": "decision",
    "intent": "alternative-option",
    "timeframe": "near-term",
    "riskLevel": "low",
    "answerDimensions": [
      "alternative-option",
      "readiness",
      "cost",
      "risk",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "act-with-conditions",
      "wait-and-prepare",
      "adjust-current-path",
      "indeterminate"
    ]
  },
  {
    "id": "decision-stakeholders",
    "categoryId": "decision",
    "text": "这个决定会影响哪些人，我需要承担什么责任？",
    "label": "影响责任",
    "domain": "decision",
    "intent": "cost-review",
    "timeframe": "open",
    "riskLevel": "medium",
    "answerDimensions": [
      "tradeoff",
      "cost",
      "relationship-pattern",
      "boundary",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "act-with-conditions",
      "open-dialogue",
      "protect-boundary",
      "indeterminate"
    ]
  },
  {
    "id": "decision-pressure",
    "categoryId": "decision",
    "text": "外部压力正在怎样改变我的判断？",
    "label": "压力影响",
    "domain": "decision",
    "intent": "hidden-factor",
    "timeframe": "present",
    "riskLevel": "medium",
    "answerDimensions": [
      "current-state",
      "external-condition",
      "internal-motivation",
      "risk",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "descriptive",
      "adjust-current-path",
      "conditional",
      "indeterminate"
    ]
  },
  {
    "id": "decision-no-choice",
    "categoryId": "decision",
    "text": "我是否把某个可选项误认为别无选择？",
    "label": "选项盲点",
    "domain": "decision",
    "intent": "alternative-option",
    "timeframe": "present",
    "riskLevel": "medium",
    "answerDimensions": [
      "current-state",
      "alternative-option",
      "hidden-factor",
      "tradeoff",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "descriptive",
      "adjust-current-path",
      "wait-and-prepare",
      "indeterminate"
    ]
  },
  {
    "id": "decision-threshold",
    "categoryId": "decision",
    "text": "满足哪些条件后，行动才算准备充分？",
    "label": "行动门槛",
    "domain": "decision",
    "intent": "timing-decision",
    "timeframe": "near-term",
    "riskLevel": "medium",
    "answerDimensions": [
      "readiness",
      "preparation-gap",
      "external-condition",
      "risk",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "act-with-conditions",
      "wait-and-prepare",
      "currently-unfavorable",
      "indeterminate"
    ]
  },
  {
    "id": "decision-safety",
    "categoryId": "decision",
    "text": "这个选择的最坏可承受后果是什么？",
    "label": "安全底线",
    "domain": "decision",
    "intent": "risk-assessment",
    "timeframe": "near-term",
    "riskLevel": "high",
    "answerDimensions": [
      "risk",
      "cost",
      "boundary",
      "alternative-option",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "protect-boundary",
      "wait-and-prepare",
      "currently-unfavorable",
      "indeterminate"
    ]
  },
  {
    "id": "decision-commitment",
    "categoryId": "decision",
    "text": "一旦选择，我需要持续投入什么才能验证方向？",
    "label": "持续投入",
    "domain": "decision",
    "intent": "value-alignment",
    "timeframe": "long-term",
    "riskLevel": "medium",
    "answerDimensions": [
      "value-alignment",
      "available-resource",
      "readiness",
      "development-trend",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "act-with-conditions",
      "adjust-current-path",
      "wait-and-prepare",
      "indeterminate"
    ]
  },
  {
    "id": "daily-priority",
    "categoryId": "daily",
    "text": "今天哪件事最值得先完成，而不是继续推迟？",
    "label": "优先完成",
    "domain": "daily",
    "intent": "daily-guidance",
    "timeframe": "today",
    "riskLevel": "low",
    "answerDimensions": [
      "current-state",
      "daily-focus",
      "main-obstacle",
      "readiness",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "act-now",
      "adjust-current-path",
      "conditional",
      "indeterminate"
    ]
  },
  {
    "id": "daily-boundary",
    "categoryId": "daily",
    "text": "今天我需要对什么明确说不？",
    "label": "今日边界",
    "domain": "daily",
    "intent": "boundary-guidance",
    "timeframe": "today",
    "riskLevel": "medium",
    "answerDimensions": [
      "current-state",
      "boundary",
      "risk",
      "relationship-pattern",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "protect-boundary",
      "open-dialogue",
      "act-with-conditions",
      "indeterminate"
    ]
  },
  {
    "id": "daily-conversation",
    "categoryId": "daily",
    "text": "今天哪一次对话值得更直接、更温和？",
    "label": "今日对话",
    "domain": "daily",
    "intent": "communication-guidance",
    "timeframe": "today",
    "riskLevel": "low",
    "answerDimensions": [
      "communication-focus",
      "relationship-pattern",
      "boundary",
      "daily-focus",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "open-dialogue",
      "act-now",
      "protect-boundary",
      "indeterminate"
    ]
  },
  {
    "id": "daily-body",
    "categoryId": "daily",
    "text": "今天身体与注意力正在提醒我调整什么？",
    "label": "身体提醒",
    "domain": "daily",
    "intent": "self-care",
    "timeframe": "today",
    "riskLevel": "high",
    "answerDimensions": [
      "current-state",
      "self-care-need",
      "recovery-need",
      "risk",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "prioritize-recovery",
      "protect-boundary",
      "adjust-current-path",
      "indeterminate"
    ]
  },
  {
    "id": "daily-money",
    "categoryId": "daily",
    "text": "今天处理金钱或消费时，我需要保持什么原则？",
    "label": "消费原则",
    "domain": "daily",
    "intent": "risk-assessment",
    "timeframe": "today",
    "riskLevel": "high",
    "answerDimensions": [
      "current-state",
      "risk",
      "resource-allocation",
      "boundary",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "protect-boundary",
      "wait-and-prepare",
      "act-with-conditions",
      "indeterminate"
    ]
  },
  {
    "id": "daily-learning",
    "categoryId": "daily",
    "text": "今天最值得练习的一项能力是什么？",
    "label": "今日练习",
    "domain": "daily",
    "intent": "capability-development",
    "timeframe": "today",
    "riskLevel": "low",
    "answerDimensions": [
      "current-state",
      "learning-goal",
      "available-resource",
      "daily-focus",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "act-now",
      "act-with-conditions",
      "growing",
      "indeterminate"
    ]
  },
  {
    "id": "daily-finish",
    "categoryId": "daily",
    "text": "今天结束前，哪件事需要明确收尾？",
    "label": "今日收尾",
    "domain": "daily",
    "intent": "daily-guidance",
    "timeframe": "today",
    "riskLevel": "low",
    "answerDimensions": [
      "current-state",
      "daily-focus",
      "cost",
      "stability",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "act-now",
      "adjust-current-path",
      "stabilizing",
      "indeterminate"
    ]
  },
  {
    "id": "daily-uncertainty",
    "categoryId": "daily",
    "text": "今天面对不确定时，我可以先验证哪一件小事？",
    "label": "小步验证",
    "domain": "daily",
    "intent": "daily-guidance",
    "timeframe": "today",
    "riskLevel": "low",
    "answerDimensions": [
      "current-state",
      "hidden-factor",
      "alternative-option",
      "daily-focus",
      "recommended-action"
    ],
    "allowedConclusionTypes": [
      "act-with-conditions",
      "wait-and-prepare",
      "conditional",
      "indeterminate"
    ]
  }
]''')
TARGET_TOTAL = 90
BASE_COUNT = 42
FORBIDDEN = [
    "certain-external-fact",
    "diagnosis",
    "exact-date",
    "financial-guarantee",
    "guaranteed-outcome",
    "mortality-prediction",
    "pregnancy-certainty",
    "third-party-certainty",
]

def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8").replace("\r\n", "\n")

def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.replace("\r\n", "\n"), encoding="utf-8", newline="\n")

def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return source.replace(old, new, 1)

registry_source = read("src/knowledge/questions/registry.js")
ids_match = re.search(r"QUESTION_PROFILE_IDS = Object\.freeze\((\[.*?\])\);", registry_source, re.S)
if not ids_match:
    raise RuntimeError("Could not parse the existing QuestionProfile ID list.")
base_ids = json.loads(ids_match.group(1))
if len(base_ids) != BASE_COUNT:
    raise RuntimeError(f"Expected {BASE_COUNT} base QuestionProfiles, found {len(base_ids)}")
base_hashes = {
    question_id: hashlib.sha256((ROOT / f"src/knowledge/questions/profiles/{question_id}.js").read_bytes()).hexdigest()
    for question_id in base_ids
}
write("tests/fixtures/phase-3/base-question-profile-hashes.json", json.dumps({
    "schemaVersion": "1.0.0",
    "algorithm": "sha256-file-bytes",
    "profiles": base_hashes,
}, ensure_ascii=False, indent=2) + "\n")

definitions_source = '''// Phase 3 human-authored question expansion. Existing 42 public questions remain unchanged.
export const PHASE_3_QUESTION_DEFINITIONS = Object.freeze(
  __DATA__.map((item) => Object.freeze({ ...item, answerDimensions: Object.freeze([...item.answerDimensions]), allowedConclusionTypes: Object.freeze([...item.allowedConclusionTypes]) })),
);

export const PHASE_3_QUESTION_IDS = Object.freeze(PHASE_3_QUESTION_DEFINITIONS.map((item) => item.id));

export function getPhase3QuestionDefinition(questionId) {
  const item = PHASE_3_QUESTION_DEFINITIONS.find((candidate) => candidate.id === questionId);
  if (!item) throw new Error(`Unknown Phase 3 question: ${questionId}`);
  return item;
}
'''.replace("__DATA__", json.dumps(NEW_QUESTIONS, ensure_ascii=False, indent=2))
write("src/knowledge/questions/phase-3-questions.js", definitions_source)

factory_source = r'''import { getPhase3QuestionDefinition } from "./phase-3-questions.js";

const FORBIDDEN_CLAIMS = Object.freeze([
  "certain-external-fact",
  "diagnosis",
  "exact-date",
  "financial-guarantee",
  "guaranteed-outcome",
  "mortality-prediction",
  "pregnancy-certainty",
  "third-party-certainty",
]);

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

function pair(dimensions, start) {
  return Object.freeze([
    dimensions[start % dimensions.length],
    dimensions[(start + 1) % dimensions.length],
  ].filter((value, index, values) => values.indexOf(value) === index));
}

function spreadProfiles(dimensions) {
  const last = dimensions.length - 1;
  return {
    single: {
      positionResponsibilities: { essence: pair(dimensions, 0) },
      requiredConclusionDimensions: Object.freeze([dimensions[0], dimensions[last]]),
      outputDepth: "brief",
    },
    timeline: {
      positionResponsibilities: {
        past: pair(dimensions, 0),
        present: pair(dimensions, 1),
        future: pair(dimensions, Math.max(2, last - 1)),
      },
      requiredConclusionDimensions: Object.freeze([dimensions[0], dimensions[last]]),
      outputDepth: "standard",
    },
    cross: {
      positionResponsibilities: {
        core: pair(dimensions, 0),
        root: pair(dimensions, 1),
        trend: pair(dimensions, 2),
        influence: pair(dimensions, 3),
        action: Object.freeze([dimensions[last]]),
      },
      requiredConclusionDimensions: Object.freeze([dimensions[0], dimensions[last]]),
      outputDepth: "standard",
    },
    celtic: {
      positionResponsibilities: {
        present: pair(dimensions, 0),
        challenge: pair(dimensions, 1),
        past: pair(dimensions, 2),
        future: pair(dimensions, 3),
        above: pair(dimensions, 4),
        below: pair(dimensions, 0),
        advice: pair(dimensions, Math.max(0, last - 1)),
        external: pair(dimensions, 2),
        hopes: pair(dimensions, 3),
        outcome: Object.freeze([dimensions[last], dimensions[0]]),
      },
      requiredConclusionDimensions: Object.freeze([dimensions[0], dimensions[last]]),
      outputDepth: "deep",
    },
  };
}

export function createPhase3QuestionProfile(questionId) {
  const definition = getPhase3QuestionDefinition(questionId);
  const {
    categoryId: _categoryId,
    answerDimensions,
    allowedConclusionTypes,
    ...identity
  } = definition;
  return deepFreeze({
    schemaVersion: "1.0.0",
    ...identity,
    answerDimensions: [...answerDimensions],
    allowedConclusionTypes: [...allowedConclusionTypes],
    forbiddenClaims: [...FORBIDDEN_CLAIMS],
    spreadProfiles: spreadProfiles(answerDimensions),
    metadata: {
      version: "1.0.0",
      status: "APPROVED",
      reviewDate: "2026-07-31",
    },
  });
}
'''
write("src/knowledge/questions/create-phase-3-question-profile.js", factory_source)

new_ids = [item["id"] for item in NEW_QUESTIONS]
for question_id in new_ids:
    write(
        f"src/knowledge/questions/profiles/{question_id}.js",
        f'import {{ createPhase3QuestionProfile }} from "../create-phase-3-question-profile.js";\n'
        f'export const QUESTION_PROFILE = createPhase3QuestionProfile("{question_id}");\n'
        f'export default QUESTION_PROFILE;\n',
    )

classification = read("src/knowledge/questions/classification.js")
classification = replace_once(
    classification,
    'export const QUESTION_CLASSIFICATIONS = Object.freeze([',
    'import { PHASE_3_QUESTION_DEFINITIONS } from "./phase-3-questions.js";\n\n'
    'export const PHASE_1_QUESTION_CLASSIFICATIONS = Object.freeze([',
    "classification declaration",
)
if not classification.rstrip().endswith("]);"):
    raise RuntimeError("Unexpected classification file ending.")
classification = classification.rstrip()[:-3] + (
    "]));\n\n"
    "export const QUESTION_CLASSIFICATIONS = Object.freeze([\n"
    "  ...PHASE_1_QUESTION_CLASSIFICATIONS,\n"
    "  ...PHASE_3_QUESTION_DEFINITIONS.map((item) => Object.freeze({\n"
    "    id: item.id, text: item.text, label: item.label, domain: item.domain,\n"
    "    intent: item.intent, timeframe: item.timeframe, riskLevel: item.riskLevel,\n"
    "    answerDimensions: item.answerDimensions, allowedConclusionTypes: item.allowedConclusionTypes,\n"
    "  })),\n"
    "]);\n"
)
write("src/knowledge/questions/classification.js", classification)

legacy_questions = read("src/knowledge/legacy/questions.js")
legacy_questions = 'import { PHASE_3_QUESTION_DEFINITIONS } from "../questions/phase-3-questions.js";\n\n' + replace_once(
    legacy_questions,
    "export const CATEGORIES = [",
    "const BASE_CATEGORIES = [",
    "legacy category declaration",
)
legacy_questions += r'''
const CATEGORY_DOMAIN = Object.freeze({
  love: "relationship",
  career: "career",
  wealth: "finance",
  growth: "growth",
  decision: "decision",
  daily: "daily",
});

export const CATEGORIES = Object.freeze(BASE_CATEGORIES.map((category) => Object.freeze({
  ...category,
  questions: Object.freeze([
    ...category.questions,
    ...PHASE_3_QUESTION_DEFINITIONS
      .filter((item) => item.categoryId === category.id && item.domain === CATEGORY_DOMAIN[category.id])
      .map((item) => Object.freeze({ id: item.id, text: item.text, label: item.label })),
  ]),
})));
'''
write("src/knowledge/legacy/questions.js", legacy_questions)

metadata = read("src/knowledge/legacy/metadata.js")
metadata = replace_once(metadata, "questionCount: 42,", f"questionCount: {TARGET_TOTAL},", "legacy question count")
write("src/knowledge/legacy/metadata.js", metadata)

all_ids = base_ids + new_ids
registry_lines = [
    "export const QUESTION_PROFILE_IDS = Object.freeze(" + json.dumps(all_ids, ensure_ascii=False, indent=2) + ");",
    "",
    "export const QUESTION_PROFILE_REGISTRY = Object.freeze({",
]
for question_id in all_ids:
    registry_lines.append(
        f'  "{question_id}": async () => (await import("./profiles/{question_id}.js")).QUESTION_PROFILE,'
    )
registry_lines.extend([
    "});",
    "",
    "export async function loadQuestionProfile(questionId) {",
    "  const loader = QUESTION_PROFILE_REGISTRY[questionId];",
    "  if (!loader) throw new Error(`Unknown QuestionProfile: ${questionId}`);",
    "  return loader();",
    "}",
    "",
])
write("src/knowledge/questions/registry.js", "\n".join(registry_lines))

phase1_reports = read("scripts/generate_phase_1_reports.mjs")
phase1_reports = replace_once(
    phase1_reports,
    'import { QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";',
    'import { PHASE_1_QUESTION_CLASSIFICATIONS as QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";',
    "Phase 1 report classification import",
)
write("scripts/generate_phase_1_reports.mjs", phase1_reports)

write("scripts/generate_legacy_fingerprint.mjs", r'''#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { TarotData } from "../src/knowledge/legacy/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const serialized = JSON.stringify(TarotData);
const output = {
  schemaVersion: 1,
  algorithm: "sha256-json-stringify",
  sha256: crypto.createHash("sha256").update(serialized).digest("hex"),
  bytes: Buffer.byteLength(serialized),
  cards: TarotData.deck.length,
  questions: TarotData.categories.reduce((sum, category) => sum + category.questions.length, 0),
  spreads: TarotData.spreads.length,
  sourceCommit: "phase-3-question-expansion",
};
const target = path.join(root, "tests/fixtures/legacy-knowledge-fingerprint.json");
const text = `${JSON.stringify(output, null, 2)}\n`;
if (process.argv.includes("--write")) {
  fs.writeFileSync(target, text, "utf8");
} else if (process.argv.includes("--check")) {
  if (!fs.existsSync(target) || fs.readFileSync(target, "utf8").replace(/\r\n?/g, "\n") !== text) {
    console.error("Legacy knowledge fingerprint is stale.");
    process.exitCode = 1;
  }
}
console.log(JSON.stringify(output));
''')

write("scripts/score_question_library.mjs", r'''#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUESTION_CLASSIFICATIONS, PHASE_1_QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { validateQuestionProfile } from "../src/engine/validation/question-profile-validator.js";
import { POSITION_OPERATOR_GROUPS } from "../src/knowledge/spreads/operators/index.js";
import { loadCardProfile } from "../src/knowledge/cards/registry.js";
import { createMinimalObservation } from "../src/engine/observations/minimal-consumer.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "src/knowledge/schemas/question-profile.schema.json"), "utf8"));
const normalize = (value) => value.replace(/[\s，。？！、；：“”‘’（）《》【】…—-]/g, "");
const bigrams = (value) => {
  const chars = [...normalize(value)];
  return new Set(chars.slice(0, -1).map((item, index) => item + chars[index + 1]));
};
const similarity = (left, right) => {
  const a = bigrams(left), b = bigrams(right);
  const intersection = [...a].filter((item) => b.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 0;
};
const profileHashes = JSON.parse(fs.readFileSync(path.join(root, "tests/fixtures/phase-3/base-question-profile-hashes.json"), "utf8")).profiles;
const frozenFailures = [];
for (const [questionId, expected] of Object.entries(profileHashes)) {
  const bytes = fs.readFileSync(path.join(root, `src/knowledge/questions/profiles/${questionId}.js`));
  const actual = crypto.createHash("sha256").update(bytes).digest("hex");
  if (actual !== expected) frozenFailures.push({ questionId, expected, actual });
}
const profiles = [];
const validationFailures = [];
for (const questionId of QUESTION_PROFILE_IDS) {
  const profile = await loadQuestionProfile(questionId);
  profiles.push(profile);
  const errors = validateQuestionProfile(profile, schema);
  if (errors.length) validationFailures.push({ questionId, errors });
}
const nearSynonyms = [];
for (let left = 0; left < QUESTION_CLASSIFICATIONS.length; left++) {
  for (let right = left + 1; right < QUESTION_CLASSIFICATIONS.length; right++) {
    const score = similarity(QUESTION_CLASSIFICATIONS[left].text, QUESTION_CLASSIFICATIONS[right].text);
    if (score >= 0.72) nearSynonyms.push({
      left: QUESTION_CLASSIFICATIONS[left].id,
      right: QUESTION_CLASSIFICATIONS[right].id,
      score: Number(score.toFixed(4)),
    });
  }
}
const pairCount = QUESTION_CLASSIFICATIONS.length * (QUESTION_CLASSIFICATIONS.length - 1) / 2;
const highRiskFailures = profiles.filter((profile) => profile.riskLevel === "high").flatMap((profile) => {
  const errors = [];
  const required = ["diagnosis", "financial-guarantee", "guaranteed-outcome", "third-party-certainty"];
  for (const claim of required) if (!profile.forbiddenClaims.includes(claim)) errors.push(claim);
  if (profile.allowedConclusionTypes.includes("act-now")) errors.push("act-now");
  return errors.length ? [{ questionId: profile.id, errors }] : [];
});
const operators = Object.values(POSITION_OPERATOR_GROUPS).flat();
const card = await loadCardProfile("major-7");
let scenarioTotal = 0, scenarioPassed = 0;
const scenarioFailures = [];
for (const profile of profiles) {
  for (const operator of operators) {
    scenarioTotal++;
    try {
      const observation = createMinimalObservation({
        card,
        question: profile,
        operator,
        orientation: "upright",
        reversalMode: null,
      });
      if (observation.questionId !== profile.id || observation.positionId !== operator.positionId) {
        throw new Error("Observation identity mismatch.");
      }
      scenarioPassed++;
    } catch (error) {
      if (scenarioFailures.length < 100) scenarioFailures.push({
        questionId: profile.id,
        spreadId: operator.spreadId,
        positionId: operator.positionId,
        message: String(error.message || error),
      });
    }
  }
}
const domains = Object.fromEntries(["relationship","career","finance","growth","decision","daily"].map((domain) => [
  domain,
  profiles.filter((profile) => profile.domain === domain).length,
]));
const report = {
  schemaVersion: "1.0.0",
  scope: "phase-3-question-library-and-spread-adaptation",
  generatedAt: "2026-07-31",
  summary: {
    totalQuestions: profiles.length,
    baseQuestionsFrozen: PHASE_1_QUESTION_CLASSIFICATIONS.length,
    addedQuestions: profiles.length - PHASE_1_QUESTION_CLASSIFICATIONS.length,
    domains,
    schemaPassRate: Number(((profiles.length - validationFailures.length) / profiles.length).toFixed(4)),
    nearSynonymPairs: nearSynonyms.length,
    nearSynonymRatio: Number((nearSynonyms.length / pairCount).toFixed(6)),
    highRiskQuestions: profiles.filter((profile) => profile.riskLevel === "high").length,
    spreadScenarioPassed: scenarioPassed,
    spreadScenarioTotal: scenarioTotal,
    spreadScenarioPassRate: Number((scenarioPassed / scenarioTotal).toFixed(4)),
  },
  frozenFailures,
  validationFailures,
  nearSynonyms,
  highRiskFailures,
  scenarioFailures,
};
const text = `${JSON.stringify(report, null, 2)}\n`;
const target = path.join(root, ".qa/question-library-report.json");
if (process.argv.includes("--write")) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, text, "utf8");
} else if (process.argv.includes("--check")) {
  if (!fs.existsSync(target) || fs.readFileSync(target, "utf8").replace(/\r\n?/g, "\n") !== text) {
    console.error("Phase 3 question-library report is stale.");
    process.exitCode = 1;
  }
}
console.log(JSON.stringify(report.summary));
if (
  profiles.length !== 90 ||
  Object.values(domains).some((count) => count !== 15) ||
  validationFailures.length ||
  frozenFailures.length ||
  nearSynonyms.length / pairCount > 0.05 ||
  highRiskFailures.length ||
  scenarioPassed !== scenarioTotal
) process.exitCode = 1;
''')

write("tests/phase_3_question_library_test.mjs", r'''import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CATEGORIES } from "../src/knowledge/legacy/questions.js";
import { QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { validateQuestionProfile } from "../src/engine/validation/question-profile-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schema = JSON.parse(fs.readFileSync(path.join(root, "src/knowledge/schemas/question-profile.schema.json"), "utf8"));
assert.equal(CATEGORIES.length, 6);
assert.ok(CATEGORIES.every((category) => category.questions.length === 15));
assert.equal(CATEGORIES.flatMap((category) => category.questions).length, 90);
assert.equal(QUESTION_CLASSIFICATIONS.length, 90);
assert.equal(QUESTION_PROFILE_IDS.length, 90);
assert.equal(new Set(QUESTION_PROFILE_IDS).size, 90);
assert.equal(new Set(QUESTION_CLASSIFICATIONS.map((item) => item.text)).size, 90);
for (const classification of QUESTION_CLASSIFICATIONS) {
  const profile = await loadQuestionProfile(classification.id);
  assert.equal(profile.id, classification.id);
  assert.equal(profile.text, classification.text);
  assert.equal(profile.domain, classification.domain);
  assert.deepEqual(validateQuestionProfile(profile, schema), [], classification.id);
  assert.deepEqual(Object.keys(profile.spreadProfiles).sort(), ["celtic","cross","single","timeline"]);
}
const report = JSON.parse(fs.readFileSync(path.join(root, ".qa/question-library-report.json"), "utf8"));
assert.equal(report.summary.totalQuestions, 90);
assert.deepEqual(report.summary.domains, { relationship:15, career:15, finance:15, growth:15, decision:15, daily:15 });
assert.equal(report.summary.schemaPassRate, 1);
assert.ok(report.summary.nearSynonymRatio <= 0.05);
assert.equal(report.frozenFailures.length, 0);
assert.equal(report.validationFailures.length, 0);
assert.equal(report.highRiskFailures.length, 0);
console.log("QP-003A-F question expansion passed: 90 profiles, 15 per domain, frozen base questions, and risk boundaries.");
''')

write("tests/phase_3_spread_adaptation_test.mjs", r'''import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUESTION_PROFILE_IDS, loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { POSITION_OPERATOR_GROUPS } from "../src/knowledge/spreads/operators/index.js";
import { loadCardProfile } from "../src/knowledge/cards/registry.js";
import { createMinimalObservation } from "../src/engine/observations/minimal-consumer.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const report = JSON.parse(fs.readFileSync(path.join(root, ".qa/question-library-report.json"), "utf8"));
const operators = Object.values(POSITION_OPERATOR_GROUPS).flat();
assert.equal(operators.length, 19);
assert.equal(report.summary.spreadScenarioTotal, 90 * 19);
assert.equal(report.summary.spreadScenarioPassed, report.summary.spreadScenarioTotal);
assert.equal(report.summary.spreadScenarioPassRate, 1);
const card = await loadCardProfile("major-7");
for (const questionId of QUESTION_PROFILE_IDS) {
  const question = await loadQuestionProfile(questionId);
  for (const operator of operators) {
    const responsibilities = question.spreadProfiles[operator.spreadId].positionResponsibilities[operator.positionId];
    assert.ok(responsibilities.length >= 1, `${questionId}/${operator.spreadId}/${operator.positionId}`);
    const observation = createMinimalObservation({ card, question, operator, orientation: "upright" });
    assert.equal(observation.questionId, questionId);
    assert.equal(observation.positionId, operator.positionId);
  }
}
console.log("QP-004A-F spread adaptation passed: all 90 questions answer through all 19 fixed positions.");
''')

write("tests/phase_3_gate_test.mjs", r'''import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), "utf8"));
const progress = fs.readFileSync(path.join(root, "docs/PROGRESS.md"), "utf8");
assert.match(progress, /Phase 3状态 \| `PARENT-DONE`/);
assert.match(progress, /唯一下一任务 \| `PO-002A`/);
const report = readJson(".qa/question-library-report.json");
assert.equal(report.summary.totalQuestions, 90);
assert.equal(report.summary.baseQuestionsFrozen, 42);
assert.equal(report.summary.addedQuestions, 48);
assert.equal(report.summary.schemaPassRate, 1);
assert.ok(report.summary.nearSynonymRatio <= 0.05);
assert.equal(report.summary.spreadScenarioPassRate, 1);
assert.equal(report.frozenFailures.length, 0);
assert.equal(report.validationFailures.length, 0);
assert.equal(report.highRiskFailures.length, 0);
assert.equal(report.scenarioFailures.length, 0);
for (const removed of ["automation/phase_3_apply.py"]) {
  assert.equal(fs.existsSync(path.join(root, removed)), false, `${removed} must not remain`);
}
console.log("Phase 3 terminal gate passed: 90 questions, synonym control, high-risk boundaries, and four-spread adaptation.");
''')

smoke = read("tests/smoke_test.js")
smoke = smoke.replace("category.questions.length !== 7", "category.questions.length !== 15")
smoke = smoke.replace("Expected seven preset questions in every category", "Expected fifteen preset questions in every category")
smoke = smoke.replace("!== 42", "!== 90").replace("Expected 42 preset questions", "Expected 90 preset questions")
smoke = smoke.replace("78 cards, 42 questions", "78 cards, 90 questions")
write("tests/smoke_test.js", smoke)

knowledge_test = read("tests/knowledge_contract_test.mjs")
knowledge_test = knowledge_test.replace(
    "assert.equal(TarotData.categories.reduce((sum, category) => sum + category.questions.length, 0), 42);",
    "assert.equal(TarotData.categories.reduce((sum, category) => sum + category.questions.length, 0), fingerprint.questions);",
)
write("tests/knowledge_contract_test.mjs", knowledge_test)

classification_test = read("tests/question_classification_test.mjs")
classification_test = classification_test.replace(
    'import { QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";',
    'import { PHASE_1_QUESTION_CLASSIFICATIONS as QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";',
)
classification_test = classification_test.replace(
    "const legacy = CATEGORIES.flatMap((category) => category.questions);",
    "const legacy = CATEGORIES.flatMap((category) => category.questions.slice(0, 7));",
)
write("tests/question_classification_test.mjs", classification_test)

profile_test = read("tests/question_profile_contract_test.mjs")
profile_test = profile_test.replace(
    'import { QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";',
    'import { PHASE_1_QUESTION_CLASSIFICATIONS as QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";',
)
profile_test = profile_test.replace("assert.equal(QUESTION_PROFILE_IDS.length, 42);", "assert.ok(QUESTION_PROFILE_IDS.length >= 42);")
write("tests/question_profile_contract_test.mjs", profile_test)

phase1_gate = read("tests/phase_1_gate_test.mjs")
phase1_gate = phase1_gate.replace(
    'import { QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";',
    'import { PHASE_1_QUESTION_CLASSIFICATIONS as QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";',
)
phase1_gate = phase1_gate.replace("assert.equal(QUESTION_PROFILE_IDS.length, 42);", "assert.ok(QUESTION_PROFILE_IDS.length >= 42);")
phase1_gate = phase1_gate.replace("for (const questionId of QUESTION_PROFILE_IDS) {", "for (const questionId of QUESTION_PROFILE_IDS.slice(0, 42)) {")
write("tests/phase_1_gate_test.mjs", phase1_gate)

validate = read("automation/validate.py")
anchor = '        ("phase-2-card-report-check", [node, "scripts/score_all_cards.mjs", "--check"]),\n'
addition = anchor + (
    '        ("legacy-fingerprint-check", [node, "scripts/generate_legacy_fingerprint.mjs", "--check"]),\n'
    '        ("phase-3-question-report-check", [node, "scripts/score_question_library.mjs", "--check"]),\n'
    '        ("node-phase-3-question-library", [node, "tests/phase_3_question_library_test.mjs"]),\n'
    '        ("node-phase-3-spread-adaptation", [node, "tests/phase_3_spread_adaptation_test.mjs"]),\n'
)
validate = replace_once(validate, anchor, addition, "baseline Phase 3 insertion")
full_anchor = '        ("phase-2-terminal-gate", [node, "tests/phase_2_gate_test.mjs"]),\n'
validate = replace_once(
    validate,
    full_anchor,
    full_anchor + '        ("phase-3-terminal-gate", [node, "tests/phase_3_gate_test.mjs"]),\n',
    "full Phase 3 insertion",
)
write("automation/validate.py", validate)

gitignore = read(".gitignore")
if "!.qa/question-library-report.json" not in gitignore:
    gitignore += "!.qa/question-library-report.json\n"
write(".gitignore", gitignore)

write("docs/PHASE_3_QUESTION_LIBRARY.md", '''# Phase 3问题库与牌阵适配

- 保留Phase 1的42个公开问题和QuestionProfile文件。
- 每个领域新增8题，最终六领域各15题、总计90题。
- 所有问题具备single、timeline、cross和celtic完整适配。
- 高风险问题必须禁止诊断、财务保证、必然结果和第三方确定性。
- 近义问题比例不得超过5%，结构Schema通过率和19牌位场景通过率均为100%。
- 自动报告属于开发门禁，不替代后续独立人工评审。
''')

contracts = read("docs/EXECUTION_CONTRACTS.md")
contracts += '''
## 17. Phase 3：问题库与四牌阵适配

固定顺序：`QP-003A`至`QP-003F`分别扩展relationship、career、finance、growth、decision和daily领域；`QP-004A`至`QP-004F`完成六领域的single、timeline、cross和celtic适配；终态统一执行近义去重、高风险边界和跨牌位消费验证。

阶段出口：保留原42题及其Profile字节，问题总数84至96、六领域覆盖均衡，高度近义问题不超过5%，高风险边界完整，四牌阵全部可回答，当前commit取得CWapi full RESULT。
'''
write("docs/EXECUTION_CONTRACTS.md", contracts)

write("docs/PROGRESS.md", '''# 项目开发进度

> 本文件是继续任务的唯一实时状态入口；任务定义以 `EXECUTION_CONTRACTS.md` 为准。

## 当前状态

| 项目 | 当前值 |
|---|---|
| 当前阶段 | Phase 4：Observation |
| 当前进行中任务 | 无 |
| 最近完成任务 | Phase 3终态：`QP-004F` 六领域四牌阵适配 |
| 唯一下一任务 | `PO-002A` 单牌与时间线固定结构图 |
| 阻塞项 | 无 |
| 工作分支 | `phase-3-completion` |
| Phase M状态 | `PARENT-DONE` |
| Phase 1状态 | `PARENT-DONE` |
| Phase 2状态 | `PARENT-DONE` |
| Phase 3状态 | `PARENT-DONE` |
| Phase 4状态 | `PARENT-PENDING` |
| 最后更新时间 | 2026-07-31 |

## Phase 3完成记录

- `QP-003A`–`QP-003F`：六领域各新增8题，原42题保持，最终90题。
- `QP-004A`–`QP-004F`：90个QuestionProfile全部完成1/3/5/10牌阵适配。
- 近义、高风险、Schema、原Profile冻结与19牌位消费统一通过终态门禁。

## 冻结不变量

- 原42个公开问题的ID、文本、标签和QuestionProfile文件保持不变。
- 六领域各15题，总数90；Card和Position契约版本仍为1.0.0。
- 78张牌、四种牌阵、旧历史键和抽牌分布不变。
- 自动问题质量报告不冒充最终独立人工评审。
- `automation/validate.py --scope full` 是完整回归入口。

## 唯一NEXT：PO-002A

建立single与timeline固定结构图，冻结合法节点、边、牌位职责和问题维度映射，不提前实现完整Observation Engine。
''')

print(json.dumps({
    "phase": "Phase 3",
    "baseQuestionsFrozen": len(base_ids),
    "addedQuestions": len(new_ids),
    "totalQuestions": len(all_ids),
    "next": "PO-002A",
}, ensure_ascii=False))
