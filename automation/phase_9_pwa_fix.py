#!/usr/bin/env python3
"""Make release cache names and activation results explicit for audit gates."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write_lf(path: Path, content: str) -> None:
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content.rstrip() + "\n")


sw_path = ROOT / "sw.js"
sw = sw_path.read_text(encoding="utf-8")
old_cache = '''function releaseCacheName(releaseId, kind, { staging = false } = {}) {
  return `astra-${staging ? "stage" : "release"}-${releaseId}-${kind}`;
}'''
new_cache = '''function releaseCacheName(releaseId, kind, { staging = false } = {}) {
  if (staging) return `astra-stage-${releaseId}-${kind}`;
  return `astra-release-${releaseId}-${kind}`;
}'''
if new_cache not in sw:
    if old_cache not in sw:
        raise RuntimeError("Release cache naming marker not found.")
    sw = sw.replace(old_cache, new_cache, 1)
write_lf(sw_path, sw)

coordinator_path = ROOT / "src" / "platform" / "pwa-update-coordinator.js"
coordinator = coordinator_path.read_text(encoding="utf-8")
old_activation = '''    const decision = activationDecision([...reports.values()], { force });
    if (!decision.allowed) return decision;
    sendWaiting({
      protocolVersion: RELEASE_PROTOCOL_VERSION,
      type: "ASTRA_ACTIVATE_RELEASE",
      releaseId: pendingReleaseId,
      requester: clientId,
      force,
    });
    return decision;'''
new_activation = '''    const decision = activationDecision([...reports.values()], { force });
    if (!decision.allowed) return Object.freeze({ ...decision, activated: false });
    sendWaiting({
      protocolVersion: RELEASE_PROTOCOL_VERSION,
      type: "ASTRA_ACTIVATE_RELEASE",
      releaseId: pendingReleaseId,
      requester: clientId,
      force,
    });
    return Object.freeze({ ...decision, activated: true });'''
if new_activation not in coordinator:
    if old_activation not in coordinator:
        raise RuntimeError("Controlled activation result marker not found.")
    coordinator = coordinator.replace(old_activation, new_activation, 1)
write_lf(coordinator_path, coordinator)

print("Phase 9 cache names and activation result are explicit for static and runtime verification.")
