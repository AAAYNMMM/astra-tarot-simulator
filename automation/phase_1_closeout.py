#!/usr/bin/env python3
"""Close Phase 1 by making QA evidence reproducible and browser cleanup reliable."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, content: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(content.replace("\r\n", "\n"), encoding="utf-8", newline="\n")


def replace_once(source: str, old: str, new: str, label: str) -> str:
    count = source.count(old)
    if count != 1:
        raise RuntimeError(f"{label}: expected one match, found {count}")
    return source.replace(old, new, 1)


GITIGNORE = """__pycache__/
*.py[cod]
.DS_Store
.qa/*
!.qa/evaluation/
.qa/evaluation/*
!.qa/evaluation/blind-manifest.json
!.qa/evaluation/rubric.json
!.qa/golden-card-report.json
!.qa/question-coverage.json
design-qa.md
"""
write(".gitignore", GITIGNORE)

REPORT_GENERATOR = r'''#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { QUESTION_CLASSIFICATIONS } from "../src/knowledge/questions/classification.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const stable = (value) => Array.isArray(value)
  ? value.map(stable)
  : value && typeof value === "object"
    ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]))
    : value;
const serialize = (value) => `${JSON.stringify(stable(value), null, 2)}\n`;

const rubric = {
  version: "1.0.0",
  total: 100,
  dimensions: {
    traditionalAccuracy: 16,
    semanticCoverage: 18,
    reversalQuality: 14,
    positionCompatibility: 10,
    questionCompatibility: 10,
    relationComputability: 10,
    dimensionConsistency: 6,
    actionability: 6,
    languageDistinctiveness: 5,
    dataIntegrity: 5,
  },
};
const blind = {
  schemaVersion: "1.0.0",
  status: "not-created",
  caseCount: 0,
  contentHash: null,
  custody: "CWapi-controlled external storage",
  repositoryContainsCaseContent: false,
  invalidatedBy: [
    "card-profile", "question-profile", "position-operator", "engine-rule",
    "weight", "template", "adapter",
  ],
};
const countBy = (key) => Object.fromEntries(
  [...new Set(QUESTION_CLASSIFICATIONS.map((item) => item[key]))]
    .sort()
    .map((value) => [value, QUESTION_CLASSIFICATIONS.filter((item) => item[key] === value).length]),
);
const coverage = {
  schemaVersion: "1.0.0",
  totalQuestions: QUESTION_CLASSIFICATIONS.length,
  domains: countBy("domain"),
  intents: countBy("intent"),
  timeframes: countBy("timeframe"),
  highRisk: QUESTION_CLASSIFICATIONS.filter((item) => item.riskLevel === "high").map((item) => item.id),
};
const outputs = new Map([
  [".qa/evaluation/rubric.json", serialize(rubric)],
  [".qa/evaluation/blind-manifest.json", serialize(blind)],
  [".qa/question-coverage.json", serialize(coverage)],
]);
const check = process.argv.includes("--check");
let failed = false;
for (const [relative, expected] of outputs) {
  const absolute = path.join(root, relative);
  if (check) {
    if (!fs.existsSync(absolute)) {
      console.error(`${relative}: missing`);
      failed = true;
    } else if (fs.readFileSync(absolute, "utf8").replace(/\r\n?/g, "\n") !== expected) {
      console.error(`${relative}: stale`);
      failed = true;
    }
  } else {
    fs.mkdirSync(path.dirname(absolute), { recursive: true });
    fs.writeFileSync(absolute, expected, "utf8");
  }
}
console.log(JSON.stringify({
  mode: check ? "check" : "write",
  outputs: outputs.size,
  questions: QUESTION_CLASSIFICATIONS.length,
}));
if (failed) process.exitCode = 1;
'''
write("scripts/generate_phase_1_reports.mjs", REPORT_GENERATOR)

validate = read("automation/validate.py")
anchor = '''        ("node-vocabulary-contract", [node, "tests/vocabulary_contract_test.mjs"]),
        ("node-evaluation-protocol", [node, "tests/evaluation_protocol_test.mjs"]),
'''
replacement = '''        ("node-vocabulary-contract", [node, "tests/vocabulary_contract_test.mjs"]),
        ("phase-1-reports-check", [node, "scripts/generate_phase_1_reports.mjs", "--check"]),
        ("node-evaluation-protocol", [node, "tests/evaluation_protocol_test.mjs"]),
'''
validate = replace_once(validate, anchor, replacement, "Phase 1 report gate")
write("automation/validate.py", validate)

package = json.loads(read("package.json"))
scripts = package.setdefault("scripts", {})
scripts["generate:phase-1-reports"] = "node scripts/generate_phase_1_reports.mjs"
scripts["check:phase-1-reports"] = "node scripts/generate_phase_1_reports.mjs --check"
write("package.json", json.dumps(package, ensure_ascii=False, indent=2, sort_keys=True) + "\n")

harness = read("tests/browser_harness.py")
if "import shutil\n" not in harness:
    harness = replace_once(harness, "import pathlib\n", "import pathlib\nimport shutil\n", "browser shutil import")
old = '''def run_browser(target: BrowserTarget, base_url: str) -> dict[str, object]:
    HarnessHandler.result_event.clear()
    HarnessHandler.result_payload = None
    with tempfile.TemporaryDirectory(prefix=f"astra-{target.name}-") as profile_text:
        profile = pathlib.Path(profile_text)
        url = f"{base_url}?browser={urllib.parse.quote(target.name)}"
        process = subprocess.Popen(
            command(target, profile, url),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        try:
            if not HarnessHandler.result_event.wait(25):
                return {"browser": target.name, "engine": target.engine, "passed": False, "error": "timeout"}
            payload = HarnessHandler.result_payload or {}
            return {"engine": target.engine, **payload}
        finally:
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
'''
new = '''def stop_process_tree(process: subprocess.Popen[bytes]) -> None:
    if process.poll() is not None:
        return
    if os.name == "nt":
        subprocess.run(
            ["taskkill", "/PID", str(process.pid), "/T", "/F"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    else:
        process.terminate()
    try:
        process.wait(timeout=8)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)


def remove_profile(profile: pathlib.Path) -> None:
    for attempt in range(20):
        try:
            shutil.rmtree(profile)
            return
        except FileNotFoundError:
            return
        except PermissionError:
            if attempt == 19:
                raise
            time.sleep(0.25)


def run_browser(target: BrowserTarget, base_url: str) -> dict[str, object]:
    HarnessHandler.result_event.clear()
    HarnessHandler.result_payload = None
    profile = pathlib.Path(tempfile.mkdtemp(prefix=f"astra-{target.name}-"))
    url = f"{base_url}?browser={urllib.parse.quote(target.name)}"
    process = subprocess.Popen(
        command(target, profile, url),
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        if not HarnessHandler.result_event.wait(25):
            return {"browser": target.name, "engine": target.engine, "passed": False, "error": "timeout"}
        payload = HarnessHandler.result_payload or {}
        return {"engine": target.engine, **payload}
    finally:
        stop_process_tree(process)
        remove_profile(profile)
'''
if old in harness:
    harness = harness.replace(old, new, 1)
elif "def stop_process_tree(" not in harness:
    raise RuntimeError("Browser harness cleanup anchor changed")
write("tests/browser_harness.py", harness)

print("phase_1_closeout_applied reports=4 browser_cleanup=process-tree next=TQ-101A")
