export const DEFAULT_CAPACITY_POLICY = Object.freeze({
  softRecordLimit: 400,
  hardRecordLimit: 500,
  quotaWarningRatio: 0.8,
});

export function isQuotaExceededError(error) {
  return Boolean(error) && (
    error.name === "QuotaExceededError"
    || error.code === 22
    || error.code === 1014
  );
}

export function evaluateCapacity({
  count = 0,
  estimate = null,
  policy = DEFAULT_CAPACITY_POLICY,
} = {}) {
  const usage = Number(estimate?.usage);
  const quota = Number(estimate?.quota);
  const quotaRatio = Number.isFinite(usage) && Number.isFinite(quota) && quota > 0 ? usage / quota : null;
  let level = "normal";
  const actions = [];
  if (count >= policy.hardRecordLimit) {
    level = "critical";
    actions.push("export-history", "review-old-records");
  } else if (count >= policy.softRecordLimit) {
    level = "warning";
    actions.push("export-history");
  }
  if (quotaRatio !== null && quotaRatio >= policy.quotaWarningRatio) {
    level = quotaRatio >= 0.95 ? "critical" : "warning";
    if (!actions.includes("export-history")) actions.push("export-history");
    actions.push("free-browser-storage");
  }
  return Object.freeze({
    level,
    count,
    softRecordLimit: policy.softRecordLimit,
    hardRecordLimit: policy.hardRecordLimit,
    usage: Number.isFinite(usage) ? usage : null,
    quota: Number.isFinite(quota) ? quota : null,
    quotaRatio: quotaRatio === null ? null : Number(quotaRatio.toFixed(4)),
    actions: Object.freeze([...new Set(actions)]),
  });
}
