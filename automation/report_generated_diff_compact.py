#!/usr/bin/env python3
"""Report compact semantic diffs for generated release artifacts."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from automation.validate import find_node_executable  # noqa: E402


def differences(left, right, path="$", out=None):
    out = [] if out is None else out
    if isinstance(left, dict) and isinstance(right, dict):
        for key in sorted(set(left) | set(right)):
            if key not in left or key not in right:
                out.append({"path": f"{path}.{key}", "missing": "left" if key not in left else "right"})
            else:
                differences(left[key], right[key], f"{path}.{key}", out)
    elif isinstance(left, list) and isinstance(right, list):
        if left != right:
            out.append({"path": path, "left_length": len(left), "right_length": len(right)})
    elif left != right:
        out.append({"path": path, "left": left, "right": right})
    return out


def parse_precache(text: str):
    match = re.search(r"value: Object\.freeze\((\{.*\})\),\n\s*writable:", text, re.S)
    if not match:
        raise RuntimeError("Unable to locate precache manifest JSON payload.")
    return json.loads(match.group(1))


def main() -> int:
    artifact_path = ROOT / "src" / "generated" / "artifact-manifest.json"
    precache_path = ROOT / "src" / "generated" / "precache-manifest.js"
    old_artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
    old_precache = parse_precache(precache_path.read_text(encoding="utf-8"))
    node, checked = find_node_executable()
    if node is None:
        raise RuntimeError("Node.js not found: " + ", ".join(checked))
    completed = subprocess.run([node, "scripts/generate_artifacts.mjs"], cwd=ROOT, check=False)
    if completed.returncode:
        return completed.returncode
    new_artifact = json.loads(artifact_path.read_text(encoding="utf-8"))
    new_precache = parse_precache(precache_path.read_text(encoding="utf-8"))
    artifact_diff = differences(old_artifact, new_artifact)
    precache_diff = differences(old_precache, new_precache)
    report = {
        "schema": "astra.generated-diff-compact.v1",
        "artifact_difference_count": len(artifact_diff),
        "artifact_differences": artifact_diff,
        "precache_difference_count": len(precache_diff),
        "precache_differences": precache_diff,
    }
    print("CWAPI_REPORT_JSON:" + json.dumps(report, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
