import {
  CLAIM_TEMPLATES,
  humanConclusionLabel,
  humanConditionLabel,
} from "../../knowledge/templates/claim-templates.js";
import { createReadingLayout } from "./reading-layout.js";
import { validateRenderedReading } from "./text-validator.js";

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

function cleanSeed(value) {
  return String(value || "")
    .replace(/一定会|必然会|肯定会|绝对会/g, "可能")
    .replace(/保证|注定|百分之百/g, "不宜作确定判断")
    .replace(/\s+/g, " ")
    .replace(/[。；;]+$/g, "")
    .trim();
}

function choose(stream, choices) {
  return stream ? choices[stream.nextInt(choices.length)] : choices[0];
}

function candidateSummary(candidate) {
  const seeds = (candidate.semanticSeeds || []).map(cleanSeed).filter(Boolean);
  if (seeds.length === 0) return "现有证据指向一个需要继续观察的主题";
  if (seeds.length === 1) return seeds[0];
  return `${seeds[0]}，同时${seeds[1]}`;
}

function paragraph(id, role, text, candidates) {
  return {
    id,
    role,
    text,
    candidateIds: [...new Set(candidates.map((item) => item.id))],
    evidenceRefs: [...new Set(candidates.flatMap((item) => item.evidenceRefs || []))],
  };
}

export function renderReadingText({
  claim,
  candidateBatch,
  observations,
  renderingStream = null,
}) {
  if (claim?.validation?.status !== "valid") {
    throw new Error("Only a validated structured Claim may enter the template layer.");
  }
  const candidatesById = new Map(candidateBatch.candidates.map((item) => [item.id, item]));
  const activeCandidates = claim.candidateIds.map((id) => candidatesById.get(id)).filter(Boolean);
  const layout = createReadingLayout({
    spreadId: claim.spreadId,
    observations,
    candidateBatch,
  });
  const sections = layout.sections.map((section) => {
    const candidates = activeCandidates.filter((candidate) => (
      candidate.positionIds.some((positionId) => section.positionIds.includes(positionId))
    ));
    if (!candidates.length) {
      return {
        id: section.id,
        title: section.title,
        paragraphs: [],
      };
    }
    const representative = [...candidates].sort((left, right) => (
      (right.score || 0) - (left.score || 0) || left.sourceOrder - right.sourceOrder
    ))[0];
    const opener = choose(renderingStream, CLAIM_TEMPLATES.sectionOpeners);
    return {
      id: section.id,
      title: section.title,
      paragraphs: [
        paragraph(
          `paragraph-${section.id}`,
          "evidence",
          `${opener}${candidateSummary(representative)}。`,
          candidates,
        ),
      ],
    };
  });

  const conclusionCandidates = activeCandidates;
  const conclusionText = `${choose(renderingStream, CLAIM_TEMPLATES.conclusionOpeners)}${humanConclusionLabel(claim.conclusionType)}。`;
  const conclusionParagraphs = [
    paragraph("paragraph-conclusion", "conclusion", conclusionText, conclusionCandidates),
  ];
  if (claim.conditions.length) {
    conclusionParagraphs.push(paragraph(
      "paragraph-conditions",
      "conditions",
      `${choose(renderingStream, CLAIM_TEMPLATES.conditionOpeners)}${claim.conditions.map(humanConditionLabel).join("；")}。`,
      conclusionCandidates,
    ));
  }
  if (claim.conflicts.length) {
    conclusionParagraphs.push(paragraph(
      "paragraph-conflicts",
      "conflict",
      CLAIM_TEMPLATES.conflictText,
      conclusionCandidates,
    ));
  }
  if (claim.coverageGaps.length) {
    conclusionParagraphs.push(paragraph(
      "paragraph-gaps",
      "coverage-gap",
      CLAIM_TEMPLATES.gapText,
      conclusionCandidates,
    ));
  }
  sections.push({
    id: layout.conclusionSection.id,
    title: layout.conclusionSection.title,
    paragraphs: conclusionParagraphs,
  });

  const paragraphs = sections.flatMap((section) => section.paragraphs);
  const rendered = {
    schemaVersion: "1.0.0",
    ...(claim.questionId ? { questionId: claim.questionId } : {}),
    spreadId: claim.spreadId,
    conclusionType: claim.conclusionType,
    sections,
    plainText: paragraphs.map((item) => item.text).join("\n\n"),
    provenance: {
      claimId: claim.id,
      candidateCount: claim.candidateIds.length,
      evidenceCount: claim.evidenceRefs.length,
      rendererVersion: "1.0.0",
    },
  };
  const errors = validateRenderedReading({ rendered, claim, candidateBatch });
  if (errors.length) throw new Error(errors.join("; "));
  return deepFreeze(rendered);
}
