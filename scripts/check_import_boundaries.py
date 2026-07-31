#!/usr/bin/env python3
"""Validate native ES Module dependency direction and cycles under src/."""

from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
MODULE_SUFFIXES = {".js", ".mjs"}
IMPORT_PATTERNS = (
    re.compile(r"""(?:import|export)\s+(?:[^\"'()]+?\s+from\s+)?[\"']([^\"']+)[\"']"""),
    re.compile(r"""import\s*\(\s*[\"']([^\"']+)[\"']\s*\)"""),
)
FORBIDDEN_GLOBALS = {
    "engine": (
        "document",
        "window",
        "localStorage",
        "sessionStorage",
        "indexedDB",
        "navigator",
    ),
    "knowledge": (
        "document",
        "window",
        "localStorage",
        "sessionStorage",
        "indexedDB",
        "navigator",
    ),
}
ALLOWED_DEPENDENCIES = {
    "config": {"config"},
    "core": {"core", "config"},
    "knowledge": {"knowledge", "core", "config"},
    "engine": {"engine", "knowledge", "core", "config"},
    "storage": {"storage", "core", "config"},
    "platform": {"platform", "core", "config"},
    "ui": {"ui", "core", "config"},
    "generated": {"generated", "knowledge", "config"},
    "app": {
        "app",
        "ui",
        "engine",
        "knowledge",
        "storage",
        "platform",
        "core",
        "config",
        "generated",
    },
}


@dataclass(frozen=True)
class Finding:
    status: str
    code: str
    path: str
    message: str
    target: str | None = None


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--format",
        choices=("text", "json"),
        default="text",
        dest="output_format",
    )
    return parser.parse_args()


def source_files() -> list[Path]:
    if not SRC.exists():
        return []
    return sorted(
        path
        for path in SRC.rglob("*")
        if path.is_file() and path.suffix.lower() in MODULE_SUFFIXES
    )


def normalized(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def layer_for(path: Path) -> str | None:
    relative = path.relative_to(SRC)
    return relative.parts[0] if len(relative.parts) > 1 else None


def import_specifiers(text: str) -> Iterable[str]:
    seen: set[tuple[int, str]] = set()
    for pattern in IMPORT_PATTERNS:
        for match in pattern.finditer(text):
            key = (match.start(), match.group(1))
            if key in seen:
                continue
            seen.add(key)
            yield match.group(1)


def resolve_relative(source: Path, specifier: str) -> Path | None:
    candidate = (source.parent / specifier).resolve()
    options = [candidate]
    if candidate.suffix == "":
        options.extend(
            [
                candidate.with_suffix(".js"),
                candidate.with_suffix(".mjs"),
                candidate / "index.js",
                candidate / "index.mjs",
            ]
        )
    return next((option for option in options if option.is_file()), None)


def find_cycle(graph: dict[Path, set[Path]]) -> list[Path] | None:
    visiting: set[Path] = set()
    visited: set[Path] = set()
    stack: list[Path] = []

    def visit(node: Path) -> list[Path] | None:
        if node in visiting:
            start = stack.index(node)
            return stack[start:] + [node]
        if node in visited:
            return None
        visiting.add(node)
        stack.append(node)
        for target in sorted(graph.get(node, set())):
            cycle = visit(target)
            if cycle:
                return cycle
        stack.pop()
        visiting.remove(node)
        visited.add(node)
        return None

    for node in sorted(graph):
        cycle = visit(node)
        if cycle:
            return cycle
    return None


def collect_findings() -> list[Finding]:
    findings: list[Finding] = []
    files = source_files()
    graph: dict[Path, set[Path]] = {path: set() for path in files}

    for source in files:
        source_layer = layer_for(source)
        source_name = normalized(source)
        if source_layer not in ALLOWED_DEPENDENCIES:
            findings.append(
                Finding(
                    "FAIL",
                    "UNKNOWN_LAYER",
                    source_name,
                    "module must live in a registered src/<layer>/ directory",
                )
            )
            continue

        text = source.read_text(encoding="utf-8")
        for token in FORBIDDEN_GLOBALS.get(source_layer, ()):
            if re.search(rf"\b{re.escape(token)}\b", text):
                findings.append(
                    Finding(
                        "FAIL",
                        "FORBIDDEN_GLOBAL",
                        source_name,
                        f"{source_layer} modules must not access browser/storage global {token}",
                    )
                )

        for specifier in import_specifiers(text):
            if not specifier.startswith("."):
                findings.append(
                    Finding(
                        "FAIL",
                        "BARE_IMPORT",
                        source_name,
                        f"runtime source may not use bare or remote import {specifier!r}",
                        specifier,
                    )
                )
                continue

            target = resolve_relative(source, specifier)
            if target is None:
                findings.append(
                    Finding(
                        "FAIL",
                        "UNRESOLVED_IMPORT",
                        source_name,
                        f"relative import cannot be resolved: {specifier}",
                        specifier,
                    )
                )
                continue

            try:
                target.relative_to(SRC)
            except ValueError:
                findings.append(
                    Finding(
                        "FAIL",
                        "IMPORT_OUTSIDE_SRC",
                        source_name,
                        "runtime modules must not import files outside src/",
                        normalized(target) if target.is_relative_to(ROOT) else str(target),
                    )
                )
                continue

            target_layer = layer_for(target)
            if target_layer not in ALLOWED_DEPENDENCIES:
                findings.append(
                    Finding(
                        "FAIL",
                        "UNKNOWN_TARGET_LAYER",
                        source_name,
                        "import target is not in a registered src layer",
                        normalized(target),
                    )
                )
                continue

            if target_layer not in ALLOWED_DEPENDENCIES[source_layer]:
                findings.append(
                    Finding(
                        "FAIL",
                        "FORBIDDEN_DEPENDENCY",
                        source_name,
                        f"{source_layer} may not depend on {target_layer}",
                        normalized(target),
                    )
                )
                continue

            graph[source].add(target)

    cycle = find_cycle(graph)
    if cycle:
        cycle_text = " -> ".join(normalized(path) for path in cycle)
        findings.append(
            Finding("FAIL", "IMPORT_CYCLE", normalized(cycle[0]), cycle_text)
        )

    if not findings:
        findings.append(
            Finding(
                "PASS",
                "IMPORT_BOUNDARIES_OK",
                "src/",
                f"checked {len(files)} JavaScript module(s); dependency direction and cycles are valid",
            )
        )
    return findings


def render_text(findings: list[Finding]) -> str:
    lines = []
    for finding in findings:
        target = f" -> {finding.target}" if finding.target else ""
        lines.append(
            f"{finding.status:4} {finding.code} {finding.path}{target}: {finding.message}"
        )
    failures = sum(item.status == "FAIL" for item in findings)
    lines.append(f"summary FAIL={failures}")
    return "\n".join(lines)


def main() -> int:
    findings = collect_findings()
    failures = sum(item.status == "FAIL" for item in findings)
    payload = {
        "schemaVersion": 1,
        "check": "import-boundaries",
        "summary": {
            "PASS": sum(item.status == "PASS" for item in findings),
            "FAIL": failures,
        },
        "findings": [asdict(item) for item in findings],
    }
    args = parse_args()
    if args.output_format == "json":
        print(json.dumps(payload, ensure_ascii=False, sort_keys=True))
    else:
        print(render_text(findings))
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
