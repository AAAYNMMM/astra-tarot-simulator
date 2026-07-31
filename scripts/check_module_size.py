#!/usr/bin/env python3
"""Check manually maintained JavaScript and CSS files against project size limits."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_BASELINE = ROOT / "automation" / "quality-baseline.json"


@dataclass(frozen=True)
class Finding:
    path: str
    kind: str
    lines: int
    limit: int
    status: str
    reason: str
    expires_after_task: str | None = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--baseline",
        type=Path,
        default=DEFAULT_BASELINE,
        help="Path to the machine-readable quality baseline.",
    )
    parser.add_argument(
        "--mode",
        choices=("baseline", "strict"),
        default="baseline",
        help="baseline permits registered legacy debt as WARN; strict permits no over-limit files.",
    )
    parser.add_argument(
        "--format",
        choices=("text", "json"),
        default="text",
        dest="output_format",
        help="Output format.",
    )
    return parser.parse_args()


def load_baseline(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise SystemExit(f"Baseline file not found: {path}") from error
    except json.JSONDecodeError as error:
        raise SystemExit(f"Invalid baseline JSON: {path}: {error}") from error

    if data.get("schemaVersion") != 1:
        raise SystemExit(f"Unsupported baseline schemaVersion: {data.get('schemaVersion')!r}")
    return data


def line_count(path: Path) -> int:
    with path.open("r", encoding="utf-8", newline=None) as handle:
        return sum(1 for _ in handle)


def is_excluded(relative_path: Path, excluded: set[str]) -> bool:
    parts = relative_path.as_posix().split("/")
    for candidate in excluded:
        candidate_parts = candidate.strip("/").split("/")
        if parts[: len(candidate_parts)] == candidate_parts:
            return True
    return False


def file_kind(path: Path) -> str | None:
    if path.suffix.lower() in {".js", ".mjs", ".cjs"}:
        return "javascript"
    if path.suffix.lower() == ".css":
        return "css"
    return None


def collect_findings(root: Path, baseline: dict[str, Any], mode: str) -> list[Finding]:
    limits = baseline["manualFileLimits"]
    excluded = set(baseline["scan"]["excludedDirectories"])
    extensions = set(baseline["scan"]["extensions"])
    debts = {item["path"]: item for item in baseline["knownDebt"]}
    findings: list[Finding] = []
    visited: set[str] = set()

    for relative_name, debt in sorted(debts.items()):
        relative_path = Path(relative_name)
        absolute_path = root / relative_path
        kind = debt["kind"]
        limit = int(debt.get("hardLimit", limits[kind]))
        expires_after = debt.get("expiresAfterTask")
        visited.add(relative_path.as_posix())

        if not absolute_path.is_file():
            findings.append(
                Finding(
                    path=relative_path.as_posix(),
                    kind=kind,
                    lines=0,
                    limit=limit,
                    status="PASS",
                    reason="registered legacy file is absent",
                    expires_after_task=expires_after,
                )
            )
            continue

        lines = line_count(absolute_path)
        if lines <= limit:
            status = "PASS"
            reason = "legacy debt is resolved"
        elif mode == "strict":
            status = "FAIL"
            reason = "strict mode rejects every over-limit manually maintained file"
        elif lines > int(debt["baselineLines"]):
            status = "FAIL"
            reason = f"registered legacy debt grew beyond baseline {debt['baselineLines']}"
        else:
            status = "WARN"
            reason = f"registered legacy debt must not grow and expires after {expires_after}"

        findings.append(
            Finding(
                path=relative_path.as_posix(),
                kind=kind,
                lines=lines,
                limit=limit,
                status=status,
                reason=reason,
                expires_after_task=expires_after,
            )
        )

    for absolute_path in sorted(root.rglob("*")):
        if not absolute_path.is_file() or absolute_path.suffix.lower() not in extensions:
            continue
        relative_path = absolute_path.relative_to(root)
        normalized = relative_path.as_posix()
        if normalized in visited or is_excluded(relative_path, excluded):
            continue

        kind = file_kind(relative_path)
        if kind is None:
            continue
        limit = int(limits[kind])
        lines = line_count(absolute_path)
        status = "FAIL" if lines > limit else "PASS"
        reason = "unregistered over-limit manually maintained file" if status == "FAIL" else "within limit"
        findings.append(
            Finding(
                path=normalized,
                kind=kind,
                lines=lines,
                limit=limit,
                status=status,
                reason=reason,
            )
        )

    return sorted(findings, key=lambda item: item.path)


def render_text(findings: list[Finding], mode: str) -> str:
    rows = [f"module-size mode={mode}"]
    for finding in findings:
        rows.append(
            f"{finding.status:4} {finding.path} "
            f"({finding.lines}/{finding.limit} lines): {finding.reason}"
        )
    counts = {
        status: sum(item.status == status for item in findings)
        for status in ("PASS", "WARN", "FAIL")
    }
    rows.append(
        f"summary PASS={counts['PASS']} WARN={counts['WARN']} FAIL={counts['FAIL']}"
    )
    return "\n".join(rows)


def main() -> int:
    args = parse_args()
    baseline_path = args.baseline
    if not baseline_path.is_absolute():
        baseline_path = ROOT / baseline_path

    baseline = load_baseline(baseline_path)
    findings = collect_findings(ROOT, baseline, args.mode)
    counts = {
        status: sum(item.status == status for item in findings)
        for status in ("PASS", "WARN", "FAIL")
    }
    payload = {
        "schemaVersion": 1,
        "check": "module-size",
        "mode": args.mode,
        "root": ".",
        "baseline": (
            baseline_path.relative_to(ROOT).as_posix()
            if baseline_path.is_relative_to(ROOT)
            else str(baseline_path)
        ),
        "summary": counts,
        "findings": [asdict(item) for item in findings],
    }

    if args.output_format == "json":
        print(json.dumps(payload, ensure_ascii=False, sort_keys=True))
    else:
        print(render_text(findings, args.mode))

    return 1 if counts["FAIL"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
