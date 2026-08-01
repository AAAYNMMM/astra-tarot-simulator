#!/usr/bin/env python3
"""Validate outcome-dominant structural grading and run the repository full suite."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ASSESSOR = ROOT / "src" / "engine" / "assessment" / "structural-assessor.js"
sys.path.insert(0, str(ROOT))

from automation.validate import find_node_executable  # noqa: E402


def extract_weights(source: str, spread_id: str) -> dict[str, float]:
    match = re.search(
        rf"{spread_id}: Object\.freeze\(\{{(?P<body>[^}}]+)\}}\)",
        source,
    )
    if not match:
        raise RuntimeError(f"Missing weight map for {spread_id}.")
    pairs = re.findall(r"(\w+):\s*([0-9.]+)", match.group("body"))
    return {key: float(value) for key, value in pairs}


def generate_release_manifest() -> int:
    node, checked_paths = find_node_executable()
    if node is None:
        checked = "\n".join(f"  - {path}" for path in checked_paths)
        raise RuntimeError(f"Node.js executable was not found.\nChecked:\n{checked}")
    completed = subprocess.run(
        [node, "scripts/generate_release_manifest.mjs"],
        cwd=ROOT,
        check=False,
    )
    return completed.returncode


def main() -> int:
    source = ASSESSOR.read_text(encoding="utf-8")
    checked: dict[str, dict[str, float]] = {}
    for spread_id in ("timeline", "cross", "celtic"):
        weights = extract_weights(source, spread_id)
        if weights.get("outcome") != 0.6:
            raise RuntimeError(
                f"{spread_id} outcome weight must be 0.6, got {weights.get('outcome')!r}."
            )
        total = round(sum(weights.values()), 10)
        if total != 1.0:
            raise RuntimeError(f"{spread_id} weights must sum to 1.0, got {total}.")
        if any(
            weight >= weights["outcome"]
            for key, weight in weights.items()
            if key != "outcome"
        ):
            raise RuntimeError(f"{spread_id} outcome weight is not dominant.")
        checked[spread_id] = weights

    manifest_exit_code = generate_release_manifest()
    if manifest_exit_code != 0:
        return manifest_exit_code

    completed = subprocess.run(
        [sys.executable, "automation/validate.py", "--scope", "full"],
        cwd=ROOT,
        check=False,
    )
    report = {
        "schema": "astra.outcome-weighting-validation.v1",
        "outcome_weight": 0.6,
        "other_factors_total": 0.4,
        "spreads": sorted(checked),
        "release_manifest_exit_code": manifest_exit_code,
        "full_validation_exit_code": completed.returncode,
    }
    print(f"CWAPI_REPORT_JSON:{json.dumps(report, ensure_ascii=False, sort_keys=True)}")
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
