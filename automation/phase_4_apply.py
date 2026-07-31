#!/usr/bin/env python3
"""Finish Phase 4 wiring before generated reports and full validation."""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def replace_once(relative: str, old: str, new: str) -> None:
    path = ROOT / relative
    content = path.read_text(encoding="utf-8")
    if new in content:
        return
    if old not in content:
        raise RuntimeError(f"Missing patch marker in {relative}: {old!r}")
    path.write_text(content.replace(old, new, 1), encoding="utf-8", newline="\n")


contracts = ROOT / "docs/EXECUTION_CONTRACTS.md"
contract_text = contracts.read_text(encoding="utf-8")
section = """

## 18. Phase 4：固定结构图与Observation Engine

固定顺序：

```text
PO-002A single与timeline固定结构图
→ PO-002B cross固定结构图
→ PO-002C celtic固定结构图
→ PO-002D 四牌阵图验证与冻结
→ PO-003A Observation Schema和模型
→ PO-003B 问题维度、牌位职责与语义选择
→ PO-003C 逆位机制、有限评分与稳定排序
→ PO-003D 完整牌阵Observation消费
→ PO-003E 全矩阵报告和终态门禁
```

边界：

- `PO-002`只冻结四牌阵节点、固定结构边和2–4条主线，不生成Relation。
- `PO-003`只生成局部Observation，不生成Claim、最终结论或渲染文本。
- 每个Observation必须保存真实`semanticUnitRef`、来源、问题职责、牌位角色、逆位模式、有限维度和分数分解。
- `createMinimalObservation`保留兼容入口，但不得维护第二套选择算法。
- 同输入必须确定性一致；业务排序不得依赖对象遍历、本地化字符串或随机数。
- Card、Question、Position或固定图变化会使Phase 4报告失效并重跑。

阶段出口：4图19节点21固定边合法；90题×19牌位及78牌×19牌位的正逆位场景Schema、确定性和真实引用通过率100%；同牌不同牌位路径差异通过率100%；当前commit取得CWapi full RESULT。
"""
if "## 18. Phase 4：固定结构图与Observation Engine" not in contract_text:
    contracts.write_text(
        contract_text.rstrip() + section.rstrip() + "\n",
        encoding="utf-8",
        newline="\n",
    )

gitignore = ROOT / ".gitignore"
gitignore_text = gitignore.read_text(encoding="utf-8")
if "!.qa/observation-engine-report.json" not in gitignore_text:
    gitignore.write_text(gitignore_text.rstrip() + "\n!.qa/observation-engine-report.json\n", encoding="utf-8", newline="\n")

package_path = ROOT / "package.json"
package = json.loads(package_path.read_text(encoding="utf-8"))
package.setdefault("scripts", {}).update({
    "score:observations": "node scripts/score_observation_engine.mjs --write",
    "check:observations": "node scripts/score_observation_engine.mjs --check",
    "test:phase-4-graphs": "node tests/phase_4_spread_graph_test.mjs",
    "test:observation-schema": "node tests/observation_schema_contract_test.mjs",
    "test:observation-engine": "node tests/observation_engine_test.mjs",
    "test:phase-4": "node tests/phase_4_gate_test.mjs",
})
package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2, sort_keys=True) + "\n", encoding="utf-8", newline="\n")

replace_once(
    "automation/validate.py",
    '        ("node-phase-3-spread-adaptation", [node, "tests/phase_3_spread_adaptation_test.mjs"]),\n',
    '        ("node-phase-3-spread-adaptation", [node, "tests/phase_3_spread_adaptation_test.mjs"]),\n'
    '        ("phase-4-observation-report-check", [node, "scripts/score_observation_engine.mjs", "--check"]),\n'
    '        ("node-phase-4-spread-graphs", [node, "tests/phase_4_spread_graph_test.mjs"]),\n'
    '        ("node-observation-schema", [node, "tests/observation_schema_contract_test.mjs"]),\n'
    '        ("node-observation-engine", [node, "tests/observation_engine_test.mjs"]),\n',
)
replace_once(
    "automation/validate.py",
    '        ("phase-3-terminal-gate", [node, "tests/phase_3_gate_test.mjs"]),\n',
    '        ("phase-3-terminal-gate", [node, "tests/phase_3_gate_test.mjs"]),\n'
    '        ("phase-4-terminal-gate", [node, "tests/phase_4_gate_test.mjs"]),\n',
)

print(json.dumps({"phase": "Phase 4", "graphs": 4, "nodes": 19, "edges": 21, "next": "MR-001"}, ensure_ascii=False))
