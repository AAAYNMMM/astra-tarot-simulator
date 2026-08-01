#!/usr/bin/env python3
"""Regenerate and export tracked release artifacts for GitHub handoff."""

from __future__ import annotations

import base64
import json
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from automation.validate import find_node_executable  # noqa: E402


COMMANDS = (
    ("generate-artifacts", "scripts/generate_artifacts.mjs"),
    ("measure-release", "scripts/measure_release.mjs"),
    ("release-acceptance", "scripts/release_acceptance.mjs"),
    ("generate-release-manifest", "scripts/generate_release_manifest.mjs"),
)

EXPORT_PATHS = (
    "src/generated/card-catalog.js",
    "src/generated/question-catalog.js",
    "src/generated/knowledge-registry.js",
    "src/generated/knowledge-manifest.json",
    "src/generated/artifact-manifest.json",
    "src/generated/precache-manifest.js",
    ".qa/release/performance-report.json",
    ".qa/release/release-acceptance.json",
)


def main() -> int:
    node, checked_paths = find_node_executable()
    if node is None:
        checked = "\n".join(f"  - {path}" for path in checked_paths)
        raise RuntimeError(f"Node.js executable was not found.\nChecked:\n{checked}")

    for name, relative_script in COMMANDS:
        completed = subprocess.run(
            [node, relative_script],
            cwd=ROOT,
            check=False,
        )
        if completed.returncode != 0:
            print(
                f"CWAPI_RELEASE_EXPORT_ERROR:{json.dumps({'step': name, 'exit_code': completed.returncode}, sort_keys=True)}"
            )
            return completed.returncode

    files = {}
    for relative_path in EXPORT_PATHS:
        data = (ROOT / relative_path).read_bytes()
        files[relative_path] = {
            "size": len(data),
            "base64": base64.b64encode(data).decode("ascii"),
        }

    payload = {
        "schema": "astra.release-artifact-export.v1",
        "files": files,
    }
    print(f"CWAPI_RELEASE_ARTIFACTS_JSON:{json.dumps(payload, sort_keys=True)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
