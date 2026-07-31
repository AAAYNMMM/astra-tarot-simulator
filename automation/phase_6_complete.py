#!/usr/bin/env python3
"""Complete Phase 6 Claim and text pipeline as one atomic stage."""

from __future__ import annotations

import base64
import hashlib
import json
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PARTS = [ROOT / "automation" / f"phase_6_payload_{index:02d}.txt" for index in range(10)]
COMPRESSED_SHA256 = "b545cf50294e61bdcb0402f2b9a377cfa890f4f1d8888355f07d0c298290133c"
PAYLOAD_SHA256 = "0d9ec4d8f1e82b3d5e426471746f54c7467b3b2df4491649d272f70ec1e03def"
CONTRACT_APPEND = '\n### Phase 6终态要求\n\n`CL-001`至`TX-003`必须作为同一阶段连续收口：\n\n- ClaimCandidate只能来自当前Observation与合法Relation，并按冻结节点和边顺序稳定生成。\n- 评分限制在0到1；平局顺序稳定；冲突不得静默删除。\n- 最终结论只允许使用QuestionProfile的`allowedConclusionTypes`，禁止结论和未覆盖维度必须在模板前拦截。\n- `AU-001A`建立版本化根种子派生以及draw、orientation、rendering独立流，不切换生产抽牌。\n- 模板只表达已经通过CL-005的结构化Claim。\n- 四牌阵输出层级固定；TX-003检查文本矛盾说明、禁止措辞、引用丢失、重复和格式。\n- 阶段出口：90题×4牌阵×正逆位均可生成合法Claim与文本；非法Claim不能进入模板；当前commit取得CWapi full RESULT。\n'


def write_lf(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content.rstrip() + "\n")


encoded = "".join(path.read_text(encoding="ascii").strip() for path in PARTS)
compressed = base64.b64decode(encoded, validate=True)
if hashlib.sha256(compressed).hexdigest() != COMPRESSED_SHA256:
    raise RuntimeError("Phase 6 compressed payload fingerprint mismatch.")
payload = zlib.decompress(compressed)
if hashlib.sha256(payload).hexdigest() != PAYLOAD_SHA256:
    raise RuntimeError("Phase 6 payload fingerprint mismatch.")
files = json.loads(payload.decode("utf-8"))
for relative, content in files.items():
    write_lf(ROOT / relative, content)

package_path = ROOT / "package.json"
package = json.loads(package_path.read_text(encoding="utf-8"))
scripts = package.setdefault("scripts", {})
scripts.update({
    "test:phase-6-candidates": "node tests/phase_6_claim_candidate_test.mjs",
    "test:phase-6-claims": "node tests/phase_6_claim_scoring_conflict_test.mjs",
    "test:phase-6-validation": "node tests/phase_6_claim_validation_test.mjs",
    "test:phase-6-random": "node tests/phase_6_random_streams_test.mjs",
    "test:phase-6-text": "node tests/phase_6_text_rendering_test.mjs",
    "test:phase-6": "node tests/phase_6_gate_test.mjs",
})
write_lf(package_path, json.dumps(package, ensure_ascii=False, indent=2, sort_keys=True))

validate_path = ROOT / "automation" / "validate.py"
validate = validate_path.read_text(encoding="utf-8")
marker = '        ("node-phase-5-terminal-gate", [node, "tests/phase_5_gate_test.mjs"]),\n'
addition = marker + (
    '        ("node-phase-6-claim-candidates", [node, "tests/phase_6_claim_candidate_test.mjs"]),\n'
    '        ("node-phase-6-claim-scoring-conflicts", [node, "tests/phase_6_claim_scoring_conflict_test.mjs"]),\n'
    '        ("node-phase-6-claim-validation", [node, "tests/phase_6_claim_validation_test.mjs"]),\n'
    '        ("node-phase-6-random-streams", [node, "tests/phase_6_random_streams_test.mjs"]),\n'
    '        ("node-phase-6-text-rendering", [node, "tests/phase_6_text_rendering_test.mjs"]),\n'
    '        ("node-phase-6-terminal-gate", [node, "tests/phase_6_gate_test.mjs"]),\n'
)
if "node-phase-6-terminal-gate" not in validate:
    if marker not in validate:
        raise RuntimeError("Phase 5 validation marker was not found.")
    validate = validate.replace(marker, addition, 1)
write_lf(validate_path, validate)

contracts_path = ROOT / "docs" / "EXECUTION_CONTRACTS.md"
contracts = contracts_path.read_text(encoding="utf-8")
if "### Phase 6终态要求" not in contracts:
    contracts = contracts.rstrip() + "\n\n" + CONTRACT_APPEND.strip() + "\n"
write_lf(contracts_path, contracts)

print(json.dumps({
    "stage": "Phase 6",
    "tasks": ["CL-001", "CL-002", "CL-003", "CL-004", "CL-005", "AU-001A", "TX-001", "TX-002", "TX-003"],
    "status": "implementation-applied",
    "next": "AU-001B",
    "implementationTaskId": "01KYWE82GS4FC0MG416SWKAARN",
    "finalValidationTaskId": "01KYWE82GSCJW6YSVC0Q2VWZSW",
}, ensure_ascii=False))
