#!/usr/bin/env python3
"""Run the repository's hash-bound validation scopes without modifying source files."""

from __future__ import annotations

import argparse
import json
import os
import platform
import shutil
import subprocess
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Sequence


ROOT = Path(__file__).resolve().parents[1]


@dataclass
class StepResult:
    name: str
    command: list[str]
    returncode: int
    duration_ms: int
    stdout: str
    stderr: str
    status: str
    parsed_summary: dict[str, object] | None = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--scope",
        choices=("baseline",),
        default="baseline",
        help="Validation scope implemented by the current project phase.",
    )
    parser.add_argument(
        "--summary-file",
        type=Path,
        help="Optional path for the JSON summary. Omit to keep validation read-only.",
    )
    return parser.parse_args()


def run_step(name: str, command: Sequence[str], env: dict[str, str]) -> StepResult:
    started = time.perf_counter()
    completed = subprocess.run(
        list(command),
        cwd=ROOT,
        env=env,
        text=True,
        encoding="utf-8",
        errors="replace",
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    duration_ms = round((time.perf_counter() - started) * 1000)
    parsed_summary = None
    stripped = completed.stdout.strip()
    if stripped.startswith("{") and stripped.endswith("}"):
        try:
            payload = json.loads(stripped)
            if isinstance(payload, dict):
                summary = payload.get("summary")
                if isinstance(summary, dict):
                    parsed_summary = summary
        except json.JSONDecodeError:
            parsed_summary = None

    return StepResult(
        name=name,
        command=list(command),
        returncode=completed.returncode,
        duration_ms=duration_ms,
        stdout=completed.stdout,
        stderr=completed.stderr,
        status="PASS" if completed.returncode == 0 else "FAIL",
        parsed_summary=parsed_summary,
    )


def print_step(result: StepResult) -> None:
    print(f"\n=== {result.name} ===")
    print("$ " + " ".join(result.command))
    if result.stdout:
        print(result.stdout.rstrip())
    if result.stderr:
        print(result.stderr.rstrip(), file=sys.stderr)
    print(
        f"[{result.status}] returncode={result.returncode} "
        f"duration_ms={result.duration_ms}"
    )


def baseline_steps(node: str) -> list[tuple[str, list[str]]]:
    python = sys.executable
    return [
        (
            "python-unittest",
            [python, "-m", "unittest", "discover", "-s", "tests", "-v"],
        ),
        (
            "node-smoke",
            [node, "tests/smoke_test.js"],
        ),
        (
            "node-module-contract",
            [node, "tests/module_contract_test.mjs"],
        ),
        (
            "module-size",
            [
                python,
                "scripts/check_module_size.py",
                "--mode",
                "baseline",
                "--format",
                "json",
            ],
        ),
        (
            "import-boundaries",
            [
                python,
                "scripts/check_import_boundaries.py",
                "--format",
                "json",
            ],
        ),
    ]


def main() -> int:
    args = parse_args()
    node = shutil.which("node")
    if node is None:
        print("Node.js executable was not found in PATH.", file=sys.stderr)
        return 127

    env = os.environ.copy()
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    env.setdefault("PYTHONUTF8", "1")

    started_at = datetime.now(timezone.utc)
    results: list[StepResult] = []
    for name, command in baseline_steps(node):
        result = run_step(name, command, env)
        results.append(result)
        print_step(result)

    overall_status = "PASS" if all(item.returncode == 0 for item in results) else "FAIL"
    warning_count = 0
    for result in results:
        summary = result.parsed_summary or {}
        warning_count += int(summary.get("WARN", 0))

    summary = {
        "schemaVersion": 1,
        "scope": args.scope,
        "overallStatus": overall_status,
        "startedAt": started_at.isoformat(),
        "finishedAt": datetime.now(timezone.utc).isoformat(),
        "platform": platform.platform(),
        "python": sys.version.split()[0],
        "node": node,
        "warningCount": warning_count,
        "steps": [
            {
                "name": item.name,
                "command": item.command,
                "returncode": item.returncode,
                "durationMs": item.duration_ms,
                "status": item.status,
                "parsedSummary": item.parsed_summary,
            }
            for item in results
        ],
    }

    encoded = json.dumps(summary, ensure_ascii=False, sort_keys=True)
    print("\nASTRA_VALIDATION_SUMMARY=" + encoded)

    if args.summary_file:
        summary_path = args.summary_file
        if not summary_path.is_absolute():
            summary_path = Path.cwd() / summary_path
        summary_path.parent.mkdir(parents=True, exist_ok=True)
        summary_path.write_text(
            json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    return 0 if overall_status == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
