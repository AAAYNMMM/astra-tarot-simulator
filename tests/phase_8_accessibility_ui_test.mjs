import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createEngineSynthesis } from "../src/app/controllers/engine-synthesis.js";
import { executeDecisiveReading } from "../src/engine/decisive/reading.js";
import { moveRovingFocus } from "../src/ui/accessibility/controller.js";
import { createStructuredHistorySummary } from "../src/storage/history-summary.js";
import { historyRecordView } from "../src/ui/renderers/history.js";
import { loadCardProfile } from "../src/knowledge/cards/registry.js";
import { loadQuestionProfile } from "../src/knowledge/questions/registry.js";
import { LEGACY_SPREADS_V1 as SPREADS } from "../src/knowledge/spreads/definitions.js";
import { createDeterministicStreams } from "../src/core/random/deterministic-streams.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const card = await loadCardProfile("major-0");
const question = await loadQuestionProfile("daily-focus");
const spread = SPREADS.find((item) => item.id === "single");
const random = createDeterministicStreams("phase-8-ui-test");
const reading = {
  id: "reading-ui-test",
  createdAt: "2026-08-01T00:00:00.000Z",
  category: { id: "daily", name: "每日指引", icon: "✦", accent: "#ffffff" },
  question,
  spread,
  deckStyle: { id: "rws" },
  draws: [{ card, reversed: false, position: spread.positions[0], index: 0 }],
};
Object.defineProperty(reading, "renderingRandom", { value: random.streams.rendering, enumerable: false });
const synthesizeReading = createEngineSynthesis({
  workerClient: { synthesize: executeDecisiveReading },
});
const synthesis = await synthesizeReading(reading);
assert.equal(synthesis.engineResult.claim.validation.status, "valid");
assert.equal(synthesis.engineResult.rendered.plainText.length > 0, true);
assert.notEqual(synthesis.synthesis.verdict.code, "indeterminate");
const structured = createStructuredHistorySummary(synthesis.engineResult, synthesis.synthesis);
assert.equal(structured.status, "available");
assert.equal(structured.schemaVersion, "2.0.0");
assert.equal(structured.interpretationSchemaVersion, "4.0.0");
assert.equal(structured.verdictLabel, synthesis.synthesis.summary.verdictLabel);
assert.equal(structured.evidenceCount, synthesis.engineResult.claim.evidenceRefs.length);
const view = historyRecordView({
  id: reading.id,
  createdAt: reading.createdAt,
  question: question.text,
  categoryName: "每日指引",
  spreadName: spread.name,
  headline: synthesis.synthesis.judgment,
  structured,
  cards: [{ position: spread.positions[0].name, name: card.name, orientation: "正位" }],
}, (value) => value);
assert.equal(view.structured.status, "available");
assert.equal(view.verdictLabel, synthesis.synthesis.summary.verdictLabel);
assert.equal(view.meta.includes(structured.conclusionType), false);
assert.equal(moveRovingFocus([1, 2, 3], 0, "ArrowLeft"), 2);
assert.equal(moveRovingFocus([1, 2, 3], 1, "End"), 2);

const index = fs.readFileSync(path.join(root, "index.html"), "utf8");
const application = fs.readFileSync(path.join(root, "src/app/application.js"), "utf8");
const events = fs.readFileSync(path.join(root, "src/app/events.js"), "utf8");
assert.match(index, /role="tablist"/);
assert.match(index, /role="tabpanel"/);
assert.match(index, /aria-live="polite"/);
assert.match(application, /createPhase8Runtime/);
assert.match(application, /phase8\.saveStructured\(state\.reading\)/);
assert.match(events, /dialog\.addEventListener\("cancel"/);
assert.match(events, /closeDialog\(dialog\)/);
assert.match(fs.readFileSync(path.join(root, "src/app/controllers/phase-8-runtime.js"), "utf8"), /installAccessibility/);
console.log("AX-001/UI-001/UI-002/AX-002 engine UI and accessibility contracts passed.");
