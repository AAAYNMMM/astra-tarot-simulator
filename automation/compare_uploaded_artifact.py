#!/usr/bin/env python3
"""Compare an uploaded artifact-manifest blob with freshly generated output."""

from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from automation.validate import find_node_executable  # noqa: E402


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def first_differences(left, right, path="$", result=None):
    result = [] if result is None else result
    if len(result) >= 20:
        return result
    if type(left) is not type(right):
        result.append({"path": path, "left_type": type(left).__name__, "right_type": type(right).__name__})
        return result
    if isinstance(left, dict):
        for key in sorted(set(left) | set(right)):
            if key not in left or key not in right:
                result.append({"path": f"{path}.{key}", "missing": "left" if key not in left else "right"})
            else:
                first_differences(left[key], right[key], f"{path}.{key}", result)
            if len(result) >= 20:
                break
    elif isinstance(left, list):
        if len(left) != len(right):
            result.append({"path": path, "left_length": len(left), "right_length": len(right)})
        for index, (a, b) in enumerate(zip(left, right)):
            first_differences(a, b, f"{path}[{index}]", result)
            if len(result) >= 20:
                break
    elif left != right:
        result.append({"path": path, "left": left, "right": right})
    return result


def main() -> int:
    uploaded_path = ROOT / "tmp" / "artifact-upload.json"
    uploaded_bytes = uploaded_path.read_bytes()
    try:
        uploaded = json.loads(uploaded_bytes)
    except Exception as error:
        print("CWAPI_REPORT_JSON:" + json.dumps({
            "schema": "astra.artifact-upload-compare.v1",
            "uploaded_valid_json": False,
            "uploaded_size": len(uploaded_bytes),
            "uploaded_sha256": sha256(uploaded_bytes),
            "error": str(error),
        }, sort_keys=True))
        return 0

    node, checked = find_node_executable()
    if node is None:
        raise RuntimeError("Node.js not found: " + ", ".join(checked))
    completed = subprocess.run([node, "scripts/generate_artifacts.mjs"], cwd=ROOT, check=False)
    if completed.returncode:
        return completed.returncode
    generated_path = ROOT / "src" / "generated" / "artifact-manifest.json"
    generated_bytes = generated_path.read_bytes()
    generated = json.loads(generated_bytes)
    report = {
        "schema": "astra.artifact-upload-compare.v1",
        "uploaded_valid_json": True,
        "semantic_equal": uploaded == generated,
        "byte_equal": uploaded_bytes == generated_bytes,
        "uploaded_size": len(uploaded_bytes),
        "generated_size": len(generated_bytes),
        "uploaded_sha256": sha256(uploaded_bytes),
        "generated_sha256": sha256(generated_bytes),
        "differences": first_differences(uploaded, generated),
    }
    print("CWAPI_REPORT_JSON:" + json.dumps(report, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
