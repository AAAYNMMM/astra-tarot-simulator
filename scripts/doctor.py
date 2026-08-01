#!/usr/bin/env python3
"""Validate Phase 8 quality and Phase 9 release readiness."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
APP_VERSION = "2.1.0"


def read_json(relative: str) -> dict:
    return json.loads((ROOT / relative).read_text(encoding="utf-8"))


checks: list[dict[str, object]] = []


def check(name: str, condition: bool, detail: str) -> None:
    checks.append({"name": name, "status": "PASS" if condition else "FAIL", "detail": detail})


report = read_json(".qa/evaluation/phase-8-evaluation-report.json")
blind_manifest = read_json(".qa/evaluation/blind-manifest.json")
blind_result = read_json(".qa/evaluation/blind-result.json")
review_packet = read_json(".qa/evaluation/human-review-packet.json")
performance = read_json(".qa/release/performance-report.json")
acceptance = read_json(".qa/release/release-acceptance.json")
release = read_json(f".qa/release/release-{APP_VERSION}.json")
compatibility = read_json("src/config/compatibility-matrix.json")

core_scores = report.get("coreScores", {})
check("core-quality", bool(core_scores) and all(float(value) >= 9 for value in core_scores.values()), f"core scores={core_scores}")
check("evaluation-suites", report.get("summary", {}).get("status") == "PASS", f"total cases={report.get('summary', {}).get('totalCases')}")
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
    review_packet.get("sourceIdentityHidden") is True and int(review_packet.get("caseCount", 0)) >= 12,
    f"review cases={review_packet.get('caseCount')}",
)
check("performance", performance.get("status") == "PASS", str(performance.get("measurements", {})))
check("release-acceptance", acceptance.get("status") == "PASS", str(acceptance.get("checks", {})))
check("release-manifest", release.get("status") == "RELEASED" and release.get("release") == APP_VERSION, str(release.get("releaseId")))
check("compatibility", compatibility.get("release") == APP_VERSION, str(compatibility.get("versions", {})))

required = [
    "src/core/errors/app-error.js",
    "src/app/recovery/recovery-coordinator.js",
    "src/ui/components/recovery-panel.js",
    "src/ui/accessibility/controller.js",
    "src/app/controllers/engine-synthesis.js",
    "src/engine/runtime/reading-engine.js",
    "src/platform/release-protocol.js",
    "src/platform/pwa-update-coordinator.js",
    "src/platform/release-compatibility.js",
    "LICENSE",
    "THIRD_PARTY_NOTICES.md",
    "icon-192.png",
    "icon-512.png",
    "icon-maskable-192.png",
    "icon-maskable-512.png",
]
for relative in required:
    check(f"file:{relative}", (ROOT / relative).is_file(), "required runtime or release artifact")

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
    "schemaVersion": "2.0.0",
    "doctor": f"release-{APP_VERSION}",
    "status": status,
    "checks": checks,
}
print(json.dumps(payload, ensure_ascii=False))
sys.exit(0 if status == "PASS" else 1)
