#!/usr/bin/env python3
"""Run Phase 1 migration and harden Windows browser-profile cleanup."""

from __future__ import annotations

from pathlib import Path

SCRIPT = Path(__file__).with_name("phase_1_apply.py")
source = SCRIPT.read_text(encoding="utf-8")
replacements = {
    "        new_registry,\n        generator,": "        lambda _match: new_registry,\n        generator,",
    "        module_replacement,\n        generator,": "        lambda _match: module_replacement,\n        generator,",
    '''    version = read("src/config/version.js")
    version += \'\'\'export const CARD_SCHEMA_VERSION = "1.0.0";
export const VOCABULARY_VERSION = "1.0.0";
export const QUESTION_SCHEMA_VERSION = "1.0.0";
export const POSITION_SCHEMA_VERSION = "1.0.0";
export const EVALUATION_PROTOCOL_VERSION = "1.0.0";
\'\'\'
    write("src/config/version.js", version)
''': '''    version = read("src/config/version.js")
    for name in (
        "CARD_SCHEMA_VERSION", "VOCABULARY_VERSION", "QUESTION_SCHEMA_VERSION",
        "POSITION_SCHEMA_VERSION", "EVALUATION_PROTOCOL_VERSION",
    ):
        declaration = f'export const {name} = "1.0.0";\\n'
        if declaration not in version:
            version += declaration
    write("src/config/version.js", version)
''',
}
for old, new in replacements.items():
    if source.count(old) != 1:
        raise RuntimeError(f"Phase 1 migration patch anchor changed: {old[:80]!r}")
    source = source.replace(old, new, 1)

namespace = {"__name__": "__main__", "__file__": str(SCRIPT)}
exec(compile(source, str(SCRIPT), "exec"), namespace)

harness_path = SCRIPT.parents[1] / "tests" / "browser_harness.py"
harness = harness_path.read_text(encoding="utf-8")
if "import shutil\n" not in harness:
    harness = harness.replace("import pathlib\n", "import pathlib\nimport shutil\n", 1)
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
if harness.count(old) != 1:
    raise RuntimeError("Browser harness cleanup anchor changed")
harness_path.write_text(harness.replace(old, new, 1), encoding="utf-8", newline="\n")
