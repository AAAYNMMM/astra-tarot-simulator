#!/usr/bin/env python3
"""Validate Phase 8 evaluation, recovery, accessibility, and UI readiness."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read_json(relative: str) -> dict:
    return json.loads((ROOT / relative).read_text(encoding="utf-8"))


checks: list[dict[str, object]] = []


def check(name: str, condition: bool, detail: str) -> None:
    checks.append({"name": name, "status": "PASS" if condition else "FAIL", "detail": detail})


report = read_json(".qa/evaluation/phase-8-evaluation-report.json")
blind_manifest = read_json(".qa/evaluation/blind-manifest.json")
blind_result = read_json(".qa/evaluation/blind-result.json")
review_packet = read_json(".qa/evaluation/human-review-packet.json")

core_scores = report.get("coreScores", {})
check(
    "core-quality",
    bool(core_scores) and all(float(value) >= 9 for value in core_scores.values()),
    f"core scores={core_scores}",
)
check(
    "evaluation-suites",
    report.get("summary", {}).get("status") == "PASS",
    f"total cases={report.get('summary', {}).get('totalCases')}",
)
check(
    "blind-custody",
    blind_manifest.get("repositoryContainsCaseContent") is False
    and blind_manifest.get("status") == "completed"
    and blind_result.get("datasetHash") == blind_manifest.get("contentHash"),
    f"blind hash={blind_manifest.get('contentHash')}",
)
check(
    "blind-quality",
    blind_result.get("status") == "PASS"
    and float(blind_result.get("averageScore", 0)) >= 9
    and float(blind_result.get("minimumScore", 0)) >= 9,
    f"blind score={blind_result.get('averageScore')}",
)
check(
    "human-review",
    review_packet.get("sourceIdentityHidden") is True
    and int(review_packet.get("caseCount", 0)) >= 12,
    f"review cases={review_packet.get('caseCount')}",
)

required = [
    "src/core/errors/app-error.js",
    "src/app/recovery/recovery-coordinator.js",
    "src/ui/components/recovery-panel.js",
    "src/ui/accessibility/controller.js",
    "src/app/controllers/engine-synthesis.js",
    "src/engine/runtime/reading-engine.js",
]
for relative in required:
    check(f"file:{relative}", (ROOT / relative).is_file(), "required Phase 8 runtime module")

for path in ROOT.rglob("*"):
    if path.is_file() and "blind" in path.name.lower() and any(
        token in path.name.lower() for token in ("cases", "content", "dataset")
    ):
        check("blind-content-absence", False, str(path.relative_to(ROOT)))
        break
else:
    check("blind-content-absence", True, "no blind case content committed")

status = "PASS" if all(item["status"] == "PASS" for item in checks) else "FAIL"
payload = {
    "schemaVersion": "1.0.0",
    "doctor": "phase-8",
    "status": status,
    "checks": checks,
}
print(json.dumps(payload, ensure_ascii=False))
sys.exit(0 if status == "PASS" else 1)
