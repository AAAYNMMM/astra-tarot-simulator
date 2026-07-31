#!/usr/bin/env python3
"""Track Phase 8 aggregate evidence so a fresh worktree can run the terminal gate."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FINAL_TASK = "01KYWP3H7M1B8F6D2Q9S7V0ZKC"
OLD_TASK = "01KYWJ8G4M1B8F6D2Q9S7H0ZKC"


def write_lf(path: Path, content: str) -> None:
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content.rstrip() + "\n")


gitignore_path = ROOT / ".gitignore"
gitignore = gitignore_path.read_text(encoding="utf-8")
for exception in [
    "!.qa/evaluation/phase-8-evaluation-report.json",
    "!.qa/evaluation/blind-result.json",
]:
    if exception not in gitignore:
        gitignore = gitignore.rstrip() + "\n" + exception + "\n"
write_lf(gitignore_path, gitignore)

for relative in ["docs/PROGRESS.md", "docs/PHASE_8_QUALITY_UI.md"]:
    path = ROOT / relative
    content = path.read_text(encoding="utf-8")
    if OLD_TASK in content:
        content = content.replace(OLD_TASK, FINAL_TASK)
    elif FINAL_TASK not in content:
        raise RuntimeError(f"Final validation task marker missing in {relative}.")
    write_lf(path, content)

print("Phase 8 aggregate evidence tracking and final validation metadata repaired.")
