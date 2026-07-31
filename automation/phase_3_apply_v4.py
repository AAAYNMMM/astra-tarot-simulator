#!/usr/bin/env python3
from pathlib import Path

root = Path(__file__).resolve().parents[1]
source = (root / "automation/phase_3_apply.py").read_text(encoding="utf-8")
fixes = [
    ("base_ids = json.loads(ids_match.group(1))", "base_ids = re.findall(r'\"([^\"]+)\"', ids_match.group(1))"),
    ('    "]));\\n\\n"', '    "]);\\n\\n"'),
    (
        "json.dumps(NEW_QUESTIONS, ensure_ascii=False, indent=2)",
        "'[\\n' + ',\\n'.join('  ' + json.dumps(item, ensure_ascii=False, separators=(',', ':')) for item in NEW_QUESTIONS) + '\\n]'",
    ),
]
for old, new in fixes:
    if source.count(old) != 1:
        raise RuntimeError(f"Phase 3 repair anchor mismatch: {old}")
    source = source.replace(old, new, 1)
code = compile(source, "automation/phase_3_apply.py", "exec")
exec(code, {"__name__": "__main__", "__file__": str(root / "automation/phase_3_apply.py")})
