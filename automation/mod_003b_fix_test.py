#!/usr/bin/env python3
"""Restore the lifecycle contract as a discoverable unittest method."""

from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
TEST_FILE = ROOT / "tests" / "test_app_contract.py"
source = TEST_FILE.read_text(encoding="utf-8")
old = '''        def test_page_lifecycle_stream_is_wired_end_to_end(self) -> None:
            app_source = (ROOT / "app.js").read_text(encoding="utf-8")
            lifecycle_source = (ROOT / "src/platform/lifecycle-client.js").read_text(encoding="utf-8")
            entropy_source = (ROOT / "src/platform/entropy.js").read_text(encoding="utf-8")
            launcher_source = (ROOT / "run.py").read_text(encoding="utf-8")
            worker_source = (ROOT / "sw.js").read_text(encoding="utf-8")
            self.assertIn("registerLocalLifecycle", app_source)
            self.assertIn("new EventSourceCtor", lifecycle_source)
            self.assertNotIn("Math.random", lifecycle_source)
            self.assertNotIn("Math.random", entropy_source)
            self.assertIn("/__astra/events", launcher_source)
            self.assertIn('startsWith("/__astra/")', worker_source)
'''
new = '''    def test_page_lifecycle_stream_is_wired_end_to_end(self) -> None:
        app_source = (ROOT / "app.js").read_text(encoding="utf-8")
        lifecycle_source = (ROOT / "src/platform/lifecycle-client.js").read_text(encoding="utf-8")
        entropy_source = (ROOT / "src/platform/entropy.js").read_text(encoding="utf-8")
        launcher_source = (ROOT / "run.py").read_text(encoding="utf-8")
        worker_source = (ROOT / "sw.js").read_text(encoding="utf-8")
        self.assertIn("registerLocalLifecycle", app_source)
        self.assertIn("new EventSourceCtor", lifecycle_source)
        self.assertNotIn("Math.random", lifecycle_source)
        self.assertNotIn("Math.random", entropy_source)
        self.assertIn("/__astra/events", launcher_source)
        self.assertIn('startsWith("/__astra/")', worker_source)
'''
if source.count(old) != 1:
    raise RuntimeError(f"Expected one nested lifecycle contract, found {source.count(old)}")
TEST_FILE.write_text(source.replace(old, new, 1), encoding="utf-8", newline="\n")
print("mod_003b_lifecycle_contract_restored")
