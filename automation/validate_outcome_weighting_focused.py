#!/usr/bin/env python3
"""Run focused validation for outcome-dominant structural grading."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from automation.validate import find_node_executable  # noqa: E402

TESTS = (
    "tests/outcome_weighting_test.mjs",
    "tests/spread_reading_v3_test.mjs",
    "tests/reading_v3_end_to_end_test.mjs",
    "tests/reading_record_v3_compat_test.mjs",
    "tests/module_contract_test.mjs",
)


def main() -> int:
    node, checked = find_node_executable()
    if node is None:
        raise RuntimeError("Node.js not found: " + ", ".join(checked))
    completed = []
    for test in TESTS:
        result = subprocess.run([node, test], cwd=ROOT, check=False)
        completed.append({"test": test, "exit_code": result.returncode})
        if result.returncode:
            print("CWAPI_REPORT_JSON:" + json.dumps({
                "schema": "astra.outcome-weighting-focused.v1",
                "status": "failed",
                "tests": completed,
            }, sort_keys=True))
            return result.returncode
    print("CWAPI_REPORT_JSON:" + json.dumps({
        "schema": "astra.outcome-weighting-focused.v1",
        "status": "passed",
        "outcome_weight": 0.6,
        "tests": completed,
    }, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
