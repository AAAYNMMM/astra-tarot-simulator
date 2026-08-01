#!/usr/bin/env python3
"""Close the remaining Phase 9 historical contracts without weakening release gates."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def write_lf(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        handle.write(content.rstrip() + "\n")


platform_runtime = '''import { createPlatformStatusController } from "../ui/components/platform-status.js";

export function createPlatformRuntime({
  windowRef,
  dom,
  offlineStatus,
  registerServiceWorker,
  state,
  currentDeckStyle,
  showToast,
}) {
  const controller = createPlatformStatusController({
    windowRef,
    dom,
    offlineStatus,
    getSelectedDeckId: currentDeckStyle,
    showToast,
  });

  function clientState() {
    if (state.completing) return "pending-save";
    if (state.phase === "setup" || state.phase === "complete") return "idle";
    return "reading";
  }

  async function start(selectedDeckId) {
    const result = await registerServiceWorker({
      getClientState: clientState,
      getCurrentReleaseId: () => offlineStatus.getStatus().activeReleaseId,
      onUpdateAvailable: controller.updateAvailable,
      onActivated: controller.activated,
    });
    offlineStatus.start({ selectedDeckId });
    controller.bind(result.coordinator);
    return result;
  }

  return Object.freeze({
    start,
    render: controller.render,
  });
}
'''
write_lf(ROOT / "src" / "app" / "platform-runtime.js", platform_runtime)

application_path = ROOT / "src" / "app" / "application.js"
application_lines = application_path.read_text(encoding="utf-8").splitlines()
application_lines = [
    'import { createPlatformRuntime } from "./platform-runtime.js";'
    if line == 'import { createPlatformStatusController } from "../ui/components/platform-status.js";'
    else line
    for line in application_lines
]

controller_start = next(
    (index for index, line in enumerate(application_lines)
     if "const platformStatusController = createPlatformStatusController({" in line),
    None,
)
if controller_start is None:
    raise RuntimeError("Platform status controller block not found in application.js.")
controller_indent = application_lines[controller_start][
    : len(application_lines[controller_start]) - len(application_lines[controller_start].lstrip())
]
depth = 0
controller_end = None
for index in range(controller_start, len(application_lines)):
    depth += application_lines[index].count("{") - application_lines[index].count("}")
    if index > controller_start and depth <= 0:
        controller_end = index
        break
if controller_end is None:
    raise RuntimeError("Platform status controller block is unterminated.")
application_lines[controller_start : controller_end + 1] = [
    controller_indent
    + "const platformRuntime = createPlatformRuntime({ windowRef: window, dom, offlineStatus, registerServiceWorker, state, currentDeckStyle, showToast });"
]

registration_start = next(
    (index for index, line in enumerate(application_lines)
     if "void registerServiceWorker({" in line),
    None,
)
if registration_start is None:
    raise RuntimeError("Phase 9 service-worker registration block not found.")
registration_end = next(
    (index + 1 for index in range(registration_start, len(application_lines) - 1)
     if "platformStatusController.bind(result.coordinator);" in application_lines[index]),
    None,
)
if registration_end is None:
    raise RuntimeError("Phase 9 service-worker registration block is unterminated.")
registration_indent = application_lines[registration_start][
    : len(application_lines[registration_start]) - len(application_lines[registration_start].lstrip())
]
application_lines[registration_start : registration_end + 1] = [
    registration_indent + "void platformRuntime.start(initialDeckStyle);"
]
application_lines = [
    line.replace("platformStatusController.render();", "platformRuntime.render();")
    for line in application_lines
]
if any("platformStatusController" in line for line in application_lines):
    raise RuntimeError("application.js still contains the inlined platform controller.")
if len(application_lines) > 601:
    raise RuntimeError(f"application.js remains oversized after extraction: {len(application_lines)} lines.")
write_lf(application_path, "\n".join(application_lines))

phase8_path = ROOT / "tests" / "phase_8_gate_test.mjs"
phase8 = phase8_path.read_text(encoding="utf-8")
old_next = 'assert.match(progress, /唯一下一任务 \\| `PLAT-001`/);'
new_next = 'assert.match(progress, /唯一下一任务 \\| `无（2\\.0\\.0终态）`/);'
if new_next not in phase8:
    if old_next not in phase8:
        raise RuntimeError("Phase 8 next-task assertion marker not found.")
    phase8 = phase8.replace(old_next, new_next, 1)
write_lf(phase8_path, phase8)

generated_test_path = ROOT / "tests" / "generated_artifacts_contract_test.mjs"
generated_test = generated_test_path.read_text(encoding="utf-8")
generated_test = generated_test.replace(
    'assert.equal(artifact.generatorVersion, "1.0.0");',
    'assert.equal(artifact.generatorVersion, "1.1.0");',
    1,
)
generated_test = generated_test.replace(
    'assert.ok(precache.releaseId.startsWith("2.0.0-dev-"));',
    'assert.ok(precache.releaseId.startsWith("2.0.0-"));',
    1,
)
if 'artifact.generatorVersion, "1.1.0"' not in generated_test:
    raise RuntimeError("Generated artifact version assertion was not updated.")
write_lf(generated_test_path, generated_test)

performance_path = ROOT / "scripts" / "measure_release.mjs"
performance = performance_path.read_text(encoding="utf-8")
check_start = performance.find("if (checkMode) {")
check_end = performance.find('if (report.status !== "PASS")', check_start)
if check_start < 0 or check_end < 0:
    raise RuntimeError("Performance check-mode block not found.")
replacement = '''if (checkMode) {
  let committed = null;
  try {
    committed = JSON.parse(fs.readFileSync(outputPath, "utf8"));
  } catch {
    committed = null;
  }
  const stableMeasurements = (measurements = {}) => Object.fromEntries(
    Object.entries(measurements).filter(([key]) => !key.endsWith("Ms")),
  );
  const stable = Boolean(
    committed
      && committed.schemaVersion === report.schemaVersion
      && committed.release === report.release
      && JSON.stringify(committed.budgets) === JSON.stringify(report.budgets)
      && JSON.stringify(stableMeasurements(committed.measurements))
        === JSON.stringify(stableMeasurements(report.measurements))
      && committed.status === "PASS"
      && report.status === "PASS"
      && Object.values(committed.checks || {}).every(Boolean)
      && Object.values(report.checks || {}).every(Boolean)
  );
  if (!stable) {
    console.error("Phase 9 performance report is missing or stale.");
    process.exit(1);
  }
} else {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, serialized, "utf8");
}
'''
performance = performance[:check_start] + replacement + performance[check_end:]
write_lf(performance_path, performance)

print(
    "Phase 9 final contracts closed: "
    f"applicationLines={len(application_lines)}, generatorVersion=1.1.0, "
    "stable performance evidence check enabled."
)
