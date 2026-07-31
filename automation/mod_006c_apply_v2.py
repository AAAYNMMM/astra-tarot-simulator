#!/usr/bin/env python3
"""Apply MOD-006C with complete shell UI resources and linked message ports."""

from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ORIGINAL = ROOT / "automation" / "mod_006c_apply.py"

spec = importlib.util.spec_from_file_location("mod_006c_original", ORIGINAL)
if spec is None or spec.loader is None:
    raise RuntimeError("cannot load MOD-006C migration")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

old_channel = '''class FakeMessageChannel {
  constructor() {
    this.port1 = {};
    this.port2 = {};
  }
}'''
new_channel = '''class FakeMessageChannel {
  constructor() {
    this.port1 = {};
    this.port2 = {
      postMessage: (data) => queueMicrotask(() => this.port1.onmessage?.({ data })),
    };
  }
}'''
old_worker = '''    queueMicrotask(() => ports[0].onmessage?.({ data: message.type === "ASTRA_CACHE_DECK" ? { ready: true, status: { releaseId: "test", states } } : { releaseId: "test", states } }));'''
new_worker = '''    ports[0].postMessage(message.type === "ASTRA_CACHE_DECK" ? { ready: true, status: { releaseId: "test", states } } : { releaseId: "test", states });'''
for old, new, label in (
    (old_channel, new_channel, "linked fake message channel"),
    (old_worker, new_worker, "fake worker port response"),
):
    if module.PWA_TEST.count(old) != 1:
        raise RuntimeError(f"{label} anchor changed")
    module.PWA_TEST = module.PWA_TEST.replace(old, new, 1)

module.main()

generator_path = ROOT / "scripts" / "generate_artifacts.mjs"
generator = generator_path.read_text(encoding="utf-8")
old = '    ...walk("src/platform").map((item) => `./${item}`),\n    ...walk("src/storage").map((item) => `./${item}`),'
new = '    ...walk("src/platform").map((item) => `./${item}`),\n    ...walk("src/storage").map((item) => `./${item}`),\n    ...walk("src/ui").map((item) => `./${item}`),'
if generator.count(old) != 1:
    raise RuntimeError("required shell UI resource anchor changed")
generator_path.write_text(generator.replace(old, new, 1), encoding="utf-8", newline="\n")
