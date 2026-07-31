#!/usr/bin/env python3
"""Finalize MOD-006D and push the Phase M terminal artifact commit."""

from __future__ import annotations

import importlib.util
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / "automation" / "mod_006d_apply_v2.py"

spec = importlib.util.spec_from_file_location("mod_006d_v2", MIGRATION)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot load MOD-006D migration")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


def run(*args: str) -> None:
    subprocess.run(args, cwd=ROOT, check=True)


def find_node() -> str:
    direct = shutil.which("node")
    if direct:
        return direct
    local = os.environ.get("LOCALAPPDATA")
    if local:
        matches = sorted(Path(local).glob("Microsoft/WinGet/Packages/**/node.exe"), reverse=True)
        if matches:
            return str(matches[0])
    raise RuntimeError("Node.js not found")


run(find_node(), "scripts/generate_artifacts.mjs")
run(sys.executable, "automation/validate.py", "--scope", "full")
for path in (ROOT / "automation").glob("mod_006d_*.py"):
    path.unlink()
run("git", "add", "-A")
run("git", "diff", "--cached", "--check")
run(
    "git", "-c", "user.name=AAAYNMMM",
    "-c", "user.email=96669024+AAAYNMMM@users.noreply.github.com",
    "commit", "-m", "test: close Phase M terminal validation",
)
run(
    "git", "-c", "remote.origin.mirror=false", "push", "origin",
    "HEAD:refs/heads/phase-m-completion",
)
run("git", "rev-parse", "HEAD")
