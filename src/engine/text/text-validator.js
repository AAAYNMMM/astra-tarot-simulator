const FORBIDDEN_CERTAINTY = Object.freeze([
  "一定会",
  "必然会",
  "保证",
  "注定",
  "百分之百",
  "肯定会",
  "绝对会",
]);

function unique(values) {
  return [...new Set(values)];
}

function normalized(value) {
  return String(value).replace(/\s+/g, "").replace(/[，。；：、“”‘’！？]/g, "");
}

export function validateRenderedReading({ rendered, claim, candidateBatch }) {
  const errors = [];
  if (!rendered || !claim || !candidateBatch) return ["Rendered reading validation inputs are incomplete."];
  if (claim.validation?.status !== "valid") errors.push("Unvalidated Claim entered the template layer.");
  const knownCandidates = new Set(candidateBatch.candidates.map((item) => item.id));
  const knownEvidence = new Set(candidateBatch.candidates.flatMap((item) => item.evidenceRefs || []));
  const citedCandidates = new Set();
  const citedEvidence = new Set();
  const seenText = new Set();
  const paragraphs = rendered.sections?.flatMap((section) => section.paragraphs || []) || [];
  if (!paragraphs.length) errors.push("Rendered reading has no paragraphs.");

  for (const paragraph of paragraphs) {
    const text = String(paragraph.text || "").trim();
    if (!text) errors.push(`Empty paragraph: ${paragraph.id || "<unknown>"}`);
    for (const phrase of FORBIDDEN_CERTAINTY) {
      if (text.includes(phrase)) errors.push(`Forbidden certainty phrase: ${phrase}`);
    }
    if (/\b(?:19|20)\d{2}[-/.年](?:0?[1-9]|1[0-2])[-/.月](?:0?[1-9]|[12]\d|3[01])日?\b/.test(text)) {
      errors.push("Exact date appeared in rendered text.");
    }
    if (/\b(?:obs|rel|claim-candidate)-[a-z0-9-]+\b/i.test(text)) errors.push("Internal evidence ID leaked into visible text.");
    const key = normalized(text);
    if (key && seenText.has(key)) errors.push(`Duplicate paragraph text: ${paragraph.id}`);
    seenText.add(key);
    if (!Array.isArray(paragraph.candidateIds) || !Array.isArray(paragraph.evidenceRefs)) {
      errors.push(`Paragraph citations are missing at ${paragraph.id}`);
      continue;
    }
    for (const id of paragraph.candidateIds) {
      if (!knownCandidates.has(id)) errors.push(`Unknown candidate citation: ${id}`);
      citedCandidates.add(id);
    }
    for (const ref of paragraph.evidenceRefs) {
      if (!knownEvidence.has(ref)) errors.push(`Unknown evidence citation: ${ref}`);
      citedEvidence.add(ref);
    }
  }
  for (const id of claim.candidateIds || []) {
    if (!citedCandidates.has(id)) errors.push(`ClaimCandidate citation lost during rendering: ${id}`);
  }
  for (const ref of claim.evidenceRefs || []) {
    if (!citedEvidence.has(ref)) errors.push(`Evidence citation lost during rendering: ${ref}`);
  }
  if (claim.conflicts?.length && !paragraphs.some((item) => item.role === "conflict")) {
    errors.push("Claim conflict was not explained in text.");
  }
  const expectedPlainText = paragraphs.map((item) => item.text).join("\n\n");
  if (rendered.plainText !== expectedPlainText) errors.push("plainText does not match structured paragraphs.");
  return unique(errors);
}

export { FORBIDDEN_CERTAINTY };
