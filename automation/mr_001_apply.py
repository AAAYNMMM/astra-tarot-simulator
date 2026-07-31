#!/usr/bin/env python3
"""Implement MR-001 structural Relation candidates from frozen spread edges."""

from __future__ import annotations

import base64
import json
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TASK_ID = "01KYG9PH5M01"
PAYLOAD = "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"


def replace_once(relative: str, old: str, new: str) -> None:
    path = ROOT / relative
    content = path.read_text(encoding="utf-8")
    if new in content:
        return
    if old not in content:
        raise RuntimeError(f"Missing patch marker in {relative}: {old!r}")
    path.write_text(content.replace(old, new, 1), encoding="utf-8", newline="\n")


files = json.loads(zlib.decompress(base64.b64decode(PAYLOAD)).decode("utf-8"))
for relative, content in files.items():
    path = ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8", newline="\n")

package_path = ROOT / "package.json"
package = json.loads(package_path.read_text(encoding="utf-8"))
package.setdefault("scripts", {})["test:phase-5-structure"] = "node tests/phase_5_structural_relation_candidates_test.mjs"
package_path.write_text(
    json.dumps(package, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
    encoding="utf-8",
    newline="\n",
)

replace_once(
    "automation/validate.py",
    '        ("node-observation-engine", [node, "tests/observation_engine_test.mjs"]),\n',
    '        ("node-observation-engine", [node, "tests/observation_engine_test.mjs"]),\n'
    '        ("node-phase-5-structural-relations", [node, "tests/phase_5_structural_relation_candidates_test.mjs"]),\n',
)

contracts = ROOT / "docs/EXECUTION_CONTRACTS.md"
contract_text = contracts.read_text(encoding="utf-8")
section = '\n\n## 19. Phase 5：Relation Graph\n\n固定顺序：\n\n```text\nMR-001固定结构边转Relation候选\n→ MR-002问题维度与牌位职责\n→ MR-003语义、状态、行动与逆位关系\n→ MR-004元素、数字、宫廷与阶段辅助关系\n→ MR-005Relation全量测试与终态门禁\n```\n\n`MR-001`只把Phase 4冻结的结构边映射为有限候选。每条结构边恰好对应一个候选；single为零；输出按图边顺序确定。候选不得提前确定最终Relation类型、强度或语义成立，也不得建立非结构边或凯尔特十字全量两两组合。\n\nCard、Question、Position、Observation或固定结构图变化会使Phase 5相关验证失效并重跑。\n'
if "## 19. Phase 5：Relation Graph" not in contract_text:
    contracts.write_text(
        contract_text.rstrip() + section.rstrip() + "\n",
        encoding="utf-8",
        newline="\n",
    )

print(json.dumps({
    "task": "MR-001",
    "structuralCandidates": 21,
    "singleCandidates": 0,
    "next": "MR-002",
    "cwapiTaskId": TASK_ID,
}, ensure_ascii=False))
