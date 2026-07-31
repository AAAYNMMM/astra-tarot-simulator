#!/usr/bin/env python3
"""Complete Phase 7 random, history, and audit as one atomic stage."""

from __future__ import annotations

import base64
import hashlib
import json
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARTS = [ROOT / "automation" / f"phase_7_payload_{index:02d}.txt" for index in range(12)]
COMPRESSED_SHA256 = "548b3c0949e32cc8e07e594e164c55f1097ef675eb585265813263957814ba4a"
PAYLOAD_SHA256 = "c03412f956d9ace3e61dbc87db6b949a35780fef151ec0a978dba75784df5b89"
CONTRACT_APPEND = '\n### Phase 7终态要求\n\n`AU-001B`至`AU-003C`必须作为同一阶段连续收口：\n\n- 生产抽牌、正逆位和渲染从同一版本化根种子派生独立流；消费任一流不得改变其他流。\n- Reading保存根种子、算法、版本、熵来源和派生流信息，相同输入必须可重放。\n- ReadingRecord 2.0保存抽牌、结构化证据槽位和本次artifact消费指纹，不写最终Git commit。\n- IndexedDB包含readings与meta存储；旧localStorage迁移幂等，失败不删除旧数据或写完成标记。\n- 导出包必须带稳定校验和；导入在写入前完成Schema、重复ID、校验和和冲突策略验证。\n- 容量与配额达到阈值时给出可执行提醒；IndexedDB或配额失败时保留内存待导出副本，不静默截断或删除记录。\n- 阶段出口：生产随机可重放、结构化历史可保存、迁移幂等、导入导出可验证、容量降级无静默丢失；当前commit取得CWapi full RESULT。\n'


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


encoded = "".join(path.read_text(encoding="ascii").strip() for path in PARTS)
compressed = base64.b64decode(encoded, validate=True)
if hashlib.sha256(compressed).hexdigest() != COMPRESSED_SHA256:
    raise RuntimeError("Phase 7 compressed payload fingerprint mismatch.")
payload = zlib.decompress(compressed)
if hashlib.sha256(payload).hexdigest() != PAYLOAD_SHA256:
    raise RuntimeError("Phase 7 payload fingerprint mismatch.")
generated_files = json.loads(payload.decode("utf-8"))
for relative, content in generated_files.items():
    write_lf(ROOT / relative, content)

replace_once("src/app/application.js", '  const {\n    randomUnit, secureShuffle, registerServiceWorker, registerLocalLifecycle,\n    loadSettings, saveSettings, loadHistory,\n    writeHistory: writeHistoryToStorage, readingRecord, offlineStatus,\n  } = createRuntimeServices(window);', '  const {\n    createReadingRandomContext, registerServiceWorker, registerLocalLifecycle,\n    loadSettings, saveSettings, loadHistory,\n    writeHistory: writeHistoryToStorage, readingRecord, offlineStatus,\n    initializeStructuredHistory, saveStructuredReading,\n  } = createRuntimeServices(window);')
replace_once(
    "src/app/application.js",
    "    const createReading = createReadingFactory({ deck, selectors, secureShuffle, randomUnit });",
    "    const createReading = createReadingFactory({ deck, selectors, createRandomContext: createReadingRandomContext });",
)
replace_once("src/app/application.js", '      writeHistory(records);\n    }\n  const { openDialog, closeDialog, confirmAction, resolveConfirmation } = createDialogController({ dom, state });', '      writeHistory(records);\n      void saveStructuredReading(state.reading).then((result) => {\n        if (result.status === "degraded") showToast("结构化历史暂存于内存，请及时导出", "!");\n      });\n    }\n  const { openDialog, closeDialog, confirmAction, resolveConfirmation } = createDialogController({ dom, state });')
replace_once("src/app/application.js", '      void registerServiceWorker().then(() => offlineStatus.start({ selectedDeckId: initialDeckStyle }));\n      registerLocalLifecycle();', '      void initializeStructuredHistory();\n      void registerServiceWorker().then(() => offlineStatus.start({ selectedDeckId: initialDeckStyle }));\n      registerLocalLifecycle();')

package_path = ROOT / "package.json"
package = json.loads(package_path.read_text(encoding="utf-8"))
scripts = package.setdefault("scripts", {})
scripts.update({
    "test:phase-7-random": "node tests/phase_7_production_random_test.mjs",
    "test:phase-7-record": "node tests/phase_7_reading_record_indexeddb_test.mjs",
    "test:phase-7-migration": "node tests/phase_7_migration_test.mjs",
    "test:phase-7-transfer": "node tests/phase_7_transfer_test.mjs",
    "test:phase-7-capacity": "node tests/phase_7_capacity_degradation_test.mjs",
    "test:phase-7": "node tests/phase_7_gate_test.mjs",
})
write_lf(package_path, json.dumps(package, ensure_ascii=False, indent=2, sort_keys=True))

validate_path = ROOT / "automation" / "validate.py"
validate = validate_path.read_text(encoding="utf-8")
marker = '        ("node-phase-6-terminal-gate", [node, "tests/phase_6_gate_test.mjs"]),\n'
addition = marker + (
    '        ("node-phase-7-production-random", [node, "tests/phase_7_production_random_test.mjs"]),\n'
    '        ("node-phase-7-reading-record", [node, "tests/phase_7_reading_record_indexeddb_test.mjs"]),\n'
    '        ("node-phase-7-migration", [node, "tests/phase_7_migration_test.mjs"]),\n'
    '        ("node-phase-7-transfer", [node, "tests/phase_7_transfer_test.mjs"]),\n'
    '        ("node-phase-7-capacity", [node, "tests/phase_7_capacity_degradation_test.mjs"]),\n'
    '        ("node-phase-7-terminal-gate", [node, "tests/phase_7_gate_test.mjs"]),\n'
)
if "node-phase-7-terminal-gate" not in validate:
    if marker not in validate:
        raise RuntimeError("Phase 6 validation marker was not found.")
    validate = validate.replace(marker, addition, 1)
write_lf(validate_path, validate)

phase6_gate_path = ROOT / "tests" / "phase_6_gate_test.mjs"
phase6_gate = phase6_gate_path.read_text(encoding="utf-8")
obsolete = 'assert.match(progress, /唯一下一任务 \\| `AU-001B`/);\n'
if obsolete in phase6_gate:
    phase6_gate = phase6_gate.replace(obsolete, "", 1)
elif "唯一下一任务" in phase6_gate:
    raise RuntimeError("Phase 6 gate contains an unexpected cross-phase NEXT assertion.")
write_lf(phase6_gate_path, phase6_gate)

contracts_path = ROOT / "docs" / "EXECUTION_CONTRACTS.md"
contracts = contracts_path.read_text(encoding="utf-8")
if "### Phase 7终态要求" not in contracts:
    contracts = contracts.rstrip() + "\n\n" + CONTRACT_APPEND.strip() + "\n"
write_lf(contracts_path, contracts)

print(json.dumps({
    "stage": "Phase 7",
    "tasks": ["AU-001B", "AU-002", "AU-003A", "AU-003B", "AU-003C"],
    "status": "implementation-applied",
    "next": "EV-001",
    "implementationTaskId": "01KYWGAFBNKMRAH9YE8G0NGYBN",
    "finalValidationTaskId": "01KYWGAFBN7P4JT89VTE1FNESB",
}, ensure_ascii=False))
