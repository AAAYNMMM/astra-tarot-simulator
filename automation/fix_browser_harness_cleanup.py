#!/usr/bin/env python3
"""Make browser harness process-tree shutdown and profile cleanup reliable on Windows."""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
path = ROOT / "tests" / "browser_harness.py"
source = path.read_text(encoding="utf-8")
if "import shutil\n" not in source:
    source = source.replace("import pathlib\n", "import pathlib\nimport shutil\n", 1)
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
if source.count(old) != 1:
    raise RuntimeError("Browser harness cleanup anchor changed")
path.write_text(source.replace(old, new, 1), encoding="utf-8", newline="\n")
print("browser_harness_cleanup_hardened")
