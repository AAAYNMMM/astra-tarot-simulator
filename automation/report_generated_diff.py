#!/usr/bin/env python3
"""Report compact semantic/text diffs for generated release artifacts."""

from __future__ import annotations

import difflib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from automation.validate import find_node_executable  # noqa: E402


def json_differences(left, right, path="$", out=None):
    out = [] if out is None else out
    if isinstance(left, dict) and isinstance(right, dict):
        for key in sorted(set(left) | set(right)):
            if key not in left or key not in right:
                out.append({"path": f"{path}.{key}", "missing": "left" if key not in left else "right"})
            else:
                json_differences(left[key], right[key], f"{path}.{key}", out)
    elif isinstance(left, list) and isinstance(right, list):
        if left != right:
            out.append({"path": path, "left": left, "right": right})
    elif left != right:
        out.append({"path": path, "left": left, "right": right})
    return out


def main() -> int:
    artifact_path = ROOT / "src" / "generated" / "artifact-manifest.json"
    precache_path = ROOT / "src" / "generated" / "precache-manifest.js"
    old_artifact_text = artifact_path.read_text(encoding="utf-8")
    old_precache_text = precache_path.read_text(encoding="utf-8")
    node, checked = find_node_executable()
    if node is None:
        raise RuntimeError("Node.js not found: " + ", ".join(checked))
    completed = subprocess.run([node, "scripts/generate_artifacts.mjs"], cwd=ROOT, check=False)
    if completed.returncode:
        return completed.returncode
    new_artifact_text = artifact_path.read_text(encoding="utf-8")
    new_precache_text = precache_path.read_text(encoding="utf-8")
    artifact_diff = json_differences(json.loads(old_artifact_text), json.loads(new_artifact_text))
    precache_diff = list(difflib.unified_diff(
        old_precache_text.splitlines(), new_precache_text.splitlines(),
        fromfile="old", tofile="new", lineterm="", n=1,
    ))
    report = {
        "schema": "astra.generated-diff-report.v1",
        "artifact_differences": artifact_diff,
        "precache_unified_diff": precache_diff,
        "precache_diff_line_count": len(precache_diff),
    }
    print("CWAPI_REPORT_JSON:" + json.dumps(report, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
