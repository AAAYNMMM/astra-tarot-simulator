#!/usr/bin/env python3
"""Complete Phase 8 evaluation, recovery, accessibility, and UI as one atomic stage."""

from __future__ import annotations

import base64
import hashlib
import json
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PAYLOAD_PATH = ROOT / "automation" / "phase_8_payload.txt"
COMPRESSED_SHA256 = "8cd75ec0958a83c07a5548ce97ce996a4b3935ab3dadad9a6259597c9ddba89f"
PAYLOAD_SHA256 = "a3e01551a3fb289eaf870157f06b6cd2ec725a2b1c596bb292bf5263116e9706"
CONTRACT_APPEND = r'''
### Phase 8终态要求

`EV-001`至`AX-002`必须作为同一阶段连续收口：

- EV-001覆盖78张牌正逆位；EV-002覆盖90题和四牌阵；EV-003覆盖多牌语料、自动指标及来源隐藏的人工评审包。
- 三项核心质量平均分和最低分均不低于9.0，自动通过率不低于95%；文笔不得抵消证据错误、问题偏离或越权结论。
- EV-000B只从CWapi受控外部文件读取最终盲测正文；仓库和日志不得包含盲测正文，只保存数量、政策、内容哈希和聚合结果。
- ERR-001A-D统一错误码、严重级、脱敏上下文、恢复动作、有限诊断日志和可复用恢复面板；失败不得隐藏重抽或破坏旧历史。
- AX-001和AX-002覆盖键盘、焦点返回、标签页、动态牌桌、状态朗读以及牌位、名称和正逆位的非视觉表达。
- UI-001必须让真实应用消费Observation→Relation→Claim→Text新版引擎；UI不得改写引擎输入输出。UI-002显示结构化历史摘要并保留旧历史只读兼容。
- 阶段出口：最终盲测和Doctor通过，真实UI接入新版引擎，错误可恢复，基础及动态无障碍通过；当前commit取得CWapi full RESULT。
'''


def write_lf(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content.rstrip() + "\n")


def replace_once(relative: str, old: str, new: str) -> None:
    path = ROOT / relative
    content = path.read_text(encoding="utf-8")
    if new in content:
        return
    if old not in content:
        raise RuntimeError(f"Missing patch marker in {relative}: {old!r}")
    write_lf(path, content.replace(old, new, 1))


encoded = PAYLOAD_PATH.read_text(encoding="ascii").strip()
compressed = base64.b64decode(encoded, validate=True)
if hashlib.sha256(compressed).hexdigest() != COMPRESSED_SHA256:
    raise RuntimeError("Phase 8 compressed payload fingerprint mismatch.")
payload = zlib.decompress(compressed)
if hashlib.sha256(payload).hexdigest() != PAYLOAD_SHA256:
    raise RuntimeError("Phase 8 payload fingerprint mismatch.")
generated_files = json.loads(payload.decode("utf-8"))
for relative, content in generated_files.items():
    write_lf(ROOT / relative, content)

replace_once(
    "src/app/application.js",
    'import { createSynthesis } from "../engine/legacy/synthesis.js";',
    'import { createPhase8Runtime } from "./controllers/phase-8-runtime.js";',
)
replace_once(
    "src/app/application.js",
    '    const showToast = createToast({ documentRef: document, windowRef: window, dom, reducedMotion });',
    '    const showToast = createToast({ documentRef: document, windowRef: window, dom, reducedMotion });\n'
    '    const phase8 = createPhase8Runtime({ windowRef: window, documentRef: document, dom, showToast, retry: completeReading, saveStructuredReading });',
)
replace_once(
    "src/app/application.js",
    '        <article class="drawn-card deck-style-${deckStyle.id}" data-card-index="${index}" data-accent-token="${accentToken(card.accent)}">',
    '        <article class="drawn-card deck-style-${deckStyle.id}" data-card-index="${index}" data-accent-token="${accentToken(card.accent)}" role="listitem">',
)
replace_once(
    "src/app/application.js",
    '            aria-label="翻开第 ${index + 1} 张牌：${position.name}"\n            disabled',
    '            aria-label="翻开第 ${index + 1} 张牌：${position.name}"\n            aria-describedby="card-position-${index}"\n            disabled',
)
replace_once(
    "src/app/application.js",
    '          <div class="position-tag" title="${escapeHtml(position.prompt)}">',
    '          <div class="position-tag" id="card-position-${index}" title="${escapeHtml(position.prompt)}">',
)
replace_once(
    "src/app/application.js",
    '      state.reading.synthesis = createSynthesis(state.reading);',
    '      state.reading.synthesis = await phase8.synthesize(state.reading);\n'
    '      if (!state.reading.synthesis) { state.completing = false; return; }',
)
replace_once(
    "src/app/application.js",
    '      const record = readingRecord(state.reading);',
    '      const record = phase8.enrichLegacyRecord(readingRecord(state.reading), state.reading);',
)
replace_once(
    "src/app/application.js",
    '      void saveStructuredReading(state.reading).then((result) => {\n'
    '        if (result.status === "degraded") showToast("结构化历史暂存于内存，请及时导出", "!");\n'
    '      });',
    '      void phase8.saveStructured(state.reading);',
)
replace_once(
    "src/app/application.js",
    '  const { openDialog, closeDialog, confirmAction, resolveConfirmation } = createDialogController({ dom, state });',
    '  const { openDialog, closeDialog, confirmAction, resolveConfirmation } = createDialogController({ dom, state, documentRef: document });',
)

replace_once(
    "index.html",
    '            <div class="insight-tabs" id="insightTabs" hidden>\n'
    '              <button type="button" data-tab="card" class="is-active">单牌</button>\n'
    '              <button type="button" data-tab="summary">综合</button>\n'
    '            </div>',
    '            <div class="insight-tabs" id="insightTabs" role="tablist" aria-label="解读视图" hidden>\n'
    '              <button id="cardInsightTab" type="button" data-tab="card" class="is-active" role="tab" aria-selected="true" aria-controls="insightContent">单牌</button>\n'
    '              <button id="summaryInsightTab" type="button" data-tab="summary" role="tab" aria-selected="false" aria-controls="insightContent" tabindex="-1">综合</button>\n'
    '            </div>',
)
replace_once(
    "index.html",
    '          <div class="insight-scroll" id="insightContent">',
    '          <div class="insight-scroll" id="insightContent" role="tabpanel" aria-labelledby="cardInsightTab" tabindex="0">',
)

package_path = ROOT / "package.json"
package = json.loads(package_path.read_text(encoding="utf-8"))
scripts = package.setdefault("scripts", {})
scripts.update({
    "evaluate:phase-8": "node scripts/generate_phase_8_evaluation.mjs",
    "test:phase-8-single": "node tests/phase_8_single_card_evaluation_test.mjs",
    "test:phase-8-question": "node tests/phase_8_question_fit_evaluation_test.mjs",
    "test:phase-8-multi": "node tests/phase_8_multi_card_evaluation_test.mjs",
    "test:phase-8-quality": "node tests/phase_8_quality_doctor_test.mjs",
    "test:phase-8-recovery": "node tests/phase_8_error_recovery_test.mjs",
    "test:phase-8-ui": "node tests/phase_8_accessibility_ui_test.mjs",
    "test:phase-8": "node tests/phase_8_gate_test.mjs",
    "doctor": "python scripts/doctor.py",
})
write_lf(package_path, json.dumps(package, ensure_ascii=False, indent=2, sort_keys=True))

validate_path = ROOT / "automation" / "validate.py"
validate = validate_path.read_text(encoding="utf-8")
marker = '        ("node-phase-7-terminal-gate", [node, "tests/phase_7_gate_test.mjs"]),\n'
addition = marker + (
    '        ("phase-8-evaluation-report-check", [node, "scripts/generate_phase_8_evaluation.mjs", "--check"]),\n'
    '        ("node-phase-8-single-card", [node, "tests/phase_8_single_card_evaluation_test.mjs"]),\n'
    '        ("node-phase-8-question-fit", [node, "tests/phase_8_question_fit_evaluation_test.mjs"]),\n'
    '        ("node-phase-8-multi-card", [node, "tests/phase_8_multi_card_evaluation_test.mjs"]),\n'
    '        ("node-phase-8-quality", [node, "tests/phase_8_quality_doctor_test.mjs"]),\n'
    '        ("node-phase-8-recovery", [node, "tests/phase_8_error_recovery_test.mjs"]),\n'
    '        ("node-phase-8-ui-accessibility", [node, "tests/phase_8_accessibility_ui_test.mjs"]),\n'
    '        ("phase-8-doctor", [python, "scripts/doctor.py"]),\n'
    '        ("node-phase-8-terminal-gate", [node, "tests/phase_8_gate_test.mjs"]),\n'
)
if "node-phase-8-terminal-gate" not in validate:
    if marker not in validate:
        raise RuntimeError("Phase 7 validation marker was not found.")
    validate = validate.replace(marker, addition, 1)
write_lf(validate_path, validate)

phase7_gate_path = ROOT / "tests" / "phase_7_gate_test.mjs"
phase7_gate = phase7_gate_path.read_text(encoding="utf-8")
obsolete = 'assert.match(progress, /唯一下一任务 \\| `EV-001`/);\n'
if obsolete in phase7_gate:
    phase7_gate = phase7_gate.replace(obsolete, "", 1)
elif "唯一下一任务" in phase7_gate:
    raise RuntimeError("Phase 7 gate contains an unexpected cross-phase NEXT assertion.")
write_lf(phase7_gate_path, phase7_gate)

contracts_path = ROOT / "docs" / "EXECUTION_CONTRACTS.md"
contracts = contracts_path.read_text(encoding="utf-8")
if "### Phase 8终态要求" not in contracts:
    contracts = contracts.rstrip() + "\n\n" + CONTRACT_APPEND.strip() + "\n"
write_lf(contracts_path, contracts)

print(json.dumps({
    "stage": "Phase 8",
    "tasks": [
        "EV-001", "EV-002", "EV-003A", "EV-003B", "EV-003C", "EV-004", "EV-000B",
        "ERR-001A", "ERR-001B", "ERR-001C", "ERR-001D", "AX-001", "UI-001", "UI-002", "AX-002",
    ],
    "status": "implementation-applied",
    "next": "PLAT-001",
    "implementationTaskId": "01KYWJ8G4M9T6R2C7V5P0N3XQA",
    "finalValidationTaskId": "01KYWJ8G4M1B8F6D2Q9S7H0ZKC",
    "blindDatasetHash": "833898d81c5dea731ec43e567024a5c7586c44189bfb0209eaec6c0ba5c4d58e",
}, ensure_ascii=False))
