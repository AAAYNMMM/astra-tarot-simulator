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
from typing import Iterable, Sequence


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
        choices=("baseline", "full"),
        default="baseline",
        help="Validation scope implemented by the current project phase.",
    )
    parser.add_argument(
        "--summary-file",
        type=Path,
        help="Optional path for the JSON summary. Omit to keep validation read-only.",
    )
    return parser.parse_args()


def unique_paths(values: Iterable[str | Path | None]) -> list[Path]:
    result: list[Path] = []
    seen: set[str] = set()
    for value in values:
        if not value:
            continue
        path = Path(value).expanduser()
        key = os.path.normcase(str(path))
        if key in seen:
            continue
        seen.add(key)
        result.append(path)
    return result


def find_node_executable() -> tuple[str | None, list[str]]:
    """Locate Node without assuming the isolated Runner inherits the user PATH."""

    program_files = os.environ.get("PROGRAMFILES")
    program_files_x86 = os.environ.get("PROGRAMFILES(X86)")
    local_app_data = os.environ.get("LOCALAPPDATA")
    app_data = os.environ.get("APPDATA")
    user_profile = os.environ.get("USERPROFILE")

    direct_candidates = unique_paths(
        [
            shutil.which("node"),
            os.environ.get("NODE_EXE"),
            Path(program_files) / "nodejs" / "node.exe" if program_files else None,
            Path(program_files_x86) / "nodejs" / "node.exe" if program_files_x86 else None,
            Path(local_app_data) / "Programs" / "nodejs" / "node.exe"
            if local_app_data
            else None,
            Path(local_app_data) / "Microsoft" / "WinGet" / "Links" / "node.exe"
            if local_app_data
            else None,
            Path(local_app_data) / "Microsoft" / "WindowsApps" / "node.exe"
            if local_app_data
            else None,
            Path(user_profile) / "scoop" / "apps" / "nodejs" / "current" / "node.exe"
            if user_profile
            else None,
            Path(user_profile) / "scoop" / "apps" / "nodejs-lts" / "current" / "node.exe"
            if user_profile
            else None,
            Path(user_profile) / ".volta" / "bin" / "node.exe" if user_profile else None,
        ]
    )

    discovered_candidates: list[Path] = []
    glob_roots: list[tuple[Path, str]] = []
    if local_app_data:
        glob_roots.extend(
            [
                (Path(local_app_data), "fnm_multishells/*/node.exe"),
                (Path(local_app_data), "Microsoft/WinGet/Packages/**/node.exe"),
            ]
        )
    if user_profile:
        glob_roots.append((Path(user_profile), ".volta/tools/image/node/*/node.exe"))
    if app_data:
        glob_roots.append((Path(app_data), "nvm/*/node.exe"))

    for root, pattern in glob_roots:
        try:
            discovered_candidates.extend(sorted(root.glob(pattern), reverse=True))
        except OSError:
            continue

    candidates = unique_paths([*direct_candidates, *discovered_candidates])
    checked = [str(path) for path in candidates]
    for path in candidates:
        try:
            if path.is_file():
                return str(path.resolve()), checked
        except OSError:
            continue
    return None, checked


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
            "node-foundation-contract",
            [node, "tests/foundation_contract_test.mjs"],
        ),
        (
            "node-ui-contract",
            [node, "tests/ui_contract_test.mjs"],
        ),
        (
            "node-knowledge-contract",
            [node, "tests/knowledge_contract_test.mjs"],
        ),
        (
            "node-card-schema-contract",
            [node, "tests/card_schema_contract_test.mjs"],
        ),
        ("node-vocabulary-contract", [node, "tests/vocabulary_contract_test.mjs"]),
        ("phase-1-reports-check", [node, "scripts/generate_phase_1_reports.mjs", "--check"]),
        ("node-evaluation-protocol", [node, "tests/evaluation_protocol_test.mjs"]),
        ("node-golden-cards-contract", [node, "tests/golden_cards_contract_test.mjs"]),
        ("golden-quality-report-check", [node, "scripts/score_golden_cards.mjs", "--check"]),
        ("node-question-classification", [node, "tests/question_classification_test.mjs"]),
        ("node-question-profile-contract", [node, "tests/question_profile_contract_test.mjs"]),
        ("node-position-operator-contract", [node, "tests/position_operator_contract_test.mjs"]),
        ("node-consumer-fixture-contract", [node, "tests/consumer_fixture_contract_test.mjs"]),
        ("node-consumer-validation", [node, "tests/consumer_validation_test.mjs"]),
        ("phase-2-card-report-check", [node, "scripts/score_all_cards.mjs", "--check"]),
        ("legacy-fingerprint-check", [node, "scripts/generate_legacy_fingerprint.mjs", "--check"]),
        ("phase-3-question-report-check", [node, "scripts/score_question_library.mjs", "--check"]),
        ("node-phase-3-question-library", [node, "tests/phase_3_question_library_test.mjs"]),
        ("node-phase-3-spread-adaptation", [node, "tests/phase_3_spread_adaptation_test.mjs"]),
        ("phase-4-observation-report-check", [node, "scripts/score_observation_engine.mjs", "--check"]),
        ("node-phase-4-spread-graphs", [node, "tests/phase_4_spread_graph_test.mjs"]),
        ("node-observation-schema", [node, "tests/observation_schema_contract_test.mjs"]),
        ("node-observation-engine", [node, "tests/observation_engine_test.mjs"]),
        ("node-phase-5-structural-relations", [node, "tests/phase_5_structural_relation_candidates_test.mjs"]),
        ("node-phase-5-question-position", [node, "tests/phase_5_question_position_relation_test.mjs"]),
        ("node-phase-5-semantic-relations", [node, "tests/phase_5_semantic_relation_test.mjs"]),
        ("node-phase-5-auxiliary-relations", [node, "tests/phase_5_auxiliary_relation_test.mjs"]),
        ("node-phase-5-terminal-gate", [node, "tests/phase_5_gate_test.mjs"]),
        ("node-phase-6-claim-candidates", [node, "tests/phase_6_claim_candidate_test.mjs"]),
        ("node-phase-6-claim-scoring-conflicts", [node, "tests/phase_6_claim_scoring_conflict_test.mjs"]),
        ("node-phase-6-claim-validation", [node, "tests/phase_6_claim_validation_test.mjs"]),
        ("node-phase-6-random-streams", [node, "tests/phase_6_random_streams_test.mjs"]),
        ("node-phase-6-text-rendering", [node, "tests/phase_6_text_rendering_test.mjs"]),
        ("node-phase-6-terminal-gate", [node, "tests/phase_6_gate_test.mjs"]),
        ("node-phase-2-golden-freeze", [node, "tests/phase_2_golden_freeze_test.mjs"]),
        ("node-phase-2-card-profiles", [node, "tests/phase_2_card_profiles_test.mjs"]),
        (
            "node-application-contract",
            [node, "tests/application_contract_test.mjs"],
        ),
        (
            "generated-artifacts-check",
            [node, "scripts/generate_artifacts.mjs", "--check"],
        ),
        (
            "node-generated-artifacts-contract",
            [node, "tests/generated_artifacts_contract_test.mjs"],
        ),
        (
            "node-pwa-contract",
            [node, "tests/pwa_contract_test.mjs"],
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


def full_steps(node: str) -> list[tuple[str, list[str]]]:
    python = sys.executable
    return [
        ("phase-m-terminal-gate", [node, "tests/phase_m_gate_test.mjs"]),
        ("phase-1-terminal-gate", [node, "tests/phase_1_gate_test.mjs"]),
        ("phase-2-terminal-gate", [node, "tests/phase_2_gate_test.mjs"]),
        ("phase-3-terminal-gate", [node, "tests/phase_3_gate_test.mjs"]),
        ("phase-4-terminal-gate", [node, "tests/phase_4_gate_test.mjs"]),
        ("browser-harness", [python, "tests/browser_harness.py"]),
        (
            "module-size-strict",
            [python, "scripts/check_module_size.py", "--mode", "strict", "--format", "json"],
        ),
    ]


def main() -> int:
    args = parse_args()
    node, checked_node_paths = find_node_executable()
    if node is None:
        checked = "\n".join(f"  - {path}" for path in checked_node_paths)
        message = "Node.js executable was not found in PATH or common Windows locations."
        if checked:
            message += f"\nChecked:\n{checked}"
        print(message, file=sys.stderr)
        return 127

    env = os.environ.copy()
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    env.setdefault("PYTHONUTF8", "1")

    started_at = datetime.now(timezone.utc)
    results: list[StepResult] = []
    selected_steps = baseline_steps(node)
    if args.scope == "full":
        selected_steps.extend(full_steps(node))
    for name, command in selected_steps:
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
        "nodeSearchPaths": checked_node_paths,
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
