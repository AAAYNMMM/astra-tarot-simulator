#!/usr/bin/env python3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = (root / "automation/phase_3_apply.py").read_text(encoding="utf-8")
old = "base_ids = json.loads(ids_match.group(1))"
new = "base_ids = re.findall(r'\"([^\"]+)\"', ids_match.group(1))"
if source.count(old) != 1:
    raise RuntimeError("Phase 3 base ID parser anchor mismatch")
source = source.replace(old, new, 1)
code = compile(source, "automation/phase_3_apply.py", "exec")
exec(code, {"__name__": "__main__", "__file__": str(root / "automation/phase_3_apply.py")})
