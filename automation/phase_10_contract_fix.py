#!/usr/bin/env python3
"""Migrate historical UI contracts to the Phase 10 Worker-backed decisive interface."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write_lf(path: Path, content: str) -> None:
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content.rstrip() + "\n")


python_test_path = ROOT / "tests" / "test_app_contract.py"
python_test = python_test_path.read_text(encoding="utf-8")
old_expectations = '''        for expected in ('id: "cross"', 'name: "五牌十字"', 'id: "celtic"', 'name: "凯尔特十字"', 'name: "希望与恐惧"', "createSpreadNarrative", "createConnections", "牌与牌之间如何对话", "牌型与正逆位"):
            self.assertIn(expected, knowledge + read_many(APPLICATION_FILES))'''
new_expectations = '''        application = read_many(APPLICATION_FILES)
        for expected in (
            'id: "cross"', 'name: "五牌十字"', 'id: "celtic"',
            'name: "凯尔特十字"', 'name: "希望与恐惧"',
            "createDecisiveInterpretation", "最终判断", "走势依据", "决定性牌位", "改判条件",
        ):
            self.assertIn(expected, knowledge + application)
        for removed in ("createSpreadNarrative", "createConnections", "牌与牌之间如何对话", "接下来的三步"):
            self.assertNotIn(removed, application)'''
if old_expectations not in python_test:
    raise RuntimeError("Legacy spread interpretation contract marker not found.")
python_test = python_test.replace(old_expectations, new_expectations, 1)
write_lf(python_test_path, python_test)

ui_test_path = ROOT / "tests" / "phase_8_accessibility_ui_test.mjs"
ui_test = ui_test_path.read_text(encoding="utf-8")
import_marker = 'import { createEngineSynthesis } from "../src/app/controllers/engine-synthesis.js";\n'
new_imports = import_marker + 'import { executeDecisiveReading } from "../src/engine/decisive/reading.js";\n'
if 'executeDecisiveReading' not in ui_test:
    if import_marker not in ui_test:
        raise RuntimeError("Phase 8 synthesis import marker not found.")
    ui_test = ui_test.replace(import_marker, new_imports, 1)
old_block = '''const synthesis = await createEngineSynthesis(reading);
assert.equal(synthesis.engineResult.claim.validation.status, "valid");
assert.equal(synthesis.engineResult.rendered.plainText.length > 0, true);
const structured = createStructuredHistorySummary(synthesis.engineResult);
assert.equal(structured.status, "available");
assert.equal(structured.evidenceCount, synthesis.engineResult.claim.evidenceRefs.length);'''
new_block = '''const synthesizeReading = createEngineSynthesis({
  workerClient: { synthesize: executeDecisiveReading },
});
const synthesis = await synthesizeReading(reading);
assert.equal(synthesis.engineResult.claim.validation.status, "valid");
assert.equal(synthesis.engineResult.rendered.plainText.length > 0, true);
assert.notEqual(synthesis.synthesis.verdict.code, "indeterminate");
const structured = createStructuredHistorySummary(synthesis.engineResult);
assert.equal(structured.status, "available");
assert.equal(structured.evidenceCount, synthesis.engineResult.claim.evidenceRefs.length);'''
if old_block not in ui_test:
    raise RuntimeError("Phase 8 direct synthesis test marker not found.")
ui_test = ui_test.replace(old_block, new_block, 1)
ui_test = ui_test.replace('headline: synthesis.headline,', 'headline: synthesis.synthesis.judgment,', 1)
write_lf(ui_test_path, ui_test)

print("Phase 10 historical spread and accessibility contracts migrated.")
