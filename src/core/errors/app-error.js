const CONTEXT_KEYS = Object.freeze([
  "operation",
  "moduleId",
  "spreadId",
  "stage",
  "storageMode",
  "resourceType",
  "status",
  "attempt",
]);

export const ERROR_CODES = Object.freeze({
  KNOWLEDGE_LOAD_FAILED: "ASTRA-KNOWLEDGE-LOAD",
  ENGINE_EXECUTION_FAILED: "ASTRA-ENGINE-EXECUTION",
  PWA_RESOURCE_FAILED: "ASTRA-PWA-RESOURCE",
  STORAGE_UNAVAILABLE: "ASTRA-STORAGE-UNAVAILABLE",
  STORAGE_QUOTA: "ASTRA-STORAGE-QUOTA",
  MIGRATION_FAILED: "ASTRA-MIGRATION",
  IMPORT_INVALID: "ASTRA-IMPORT-INVALID",
  DIAGNOSTIC_EXPORT_FAILED: "ASTRA-DIAGNOSTIC-EXPORT",
  UNKNOWN: "ASTRA-UNKNOWN",
});

const DEFAULTS = Object.freeze({
  [ERROR_CODES.KNOWLEDGE_LOAD_FAILED]: {
    severity: "error",
    userMessage: "牌义资料暂时无法读取，已保留当前牌面。",
    recoveryActions: ["retry", "export-diagnostics"],
  },
  [ERROR_CODES.ENGINE_EXECUTION_FAILED]: {
    severity: "error",
    userMessage: "结构化解读暂时无法完成，当前抽牌不会改变。",
    recoveryActions: ["retry", "export-diagnostics"],
  },
  [ERROR_CODES.PWA_RESOURCE_FAILED]: {
    severity: "warning",
    userMessage: "部分离线资源不可用，可以联网重试。",
    recoveryActions: ["retry", "continue-online"],
  },
  [ERROR_CODES.STORAGE_UNAVAILABLE]: {
    severity: "warning",
    userMessage: "浏览器存储不可用，本次记录已保留在内存中。",
    recoveryActions: ["export-history", "export-diagnostics"],
  },
  [ERROR_CODES.STORAGE_QUOTA]: {
    severity: "warning",
    userMessage: "浏览器存储空间不足，本次记录没有被静默删除。",
    recoveryActions: ["export-history", "manage-storage"],
  },
  [ERROR_CODES.MIGRATION_FAILED]: {
    severity: "warning",
    userMessage: "旧记录迁移未完成，原记录仍然保留。",
    recoveryActions: ["retry", "export-diagnostics"],
  },
  [ERROR_CODES.IMPORT_INVALID]: {
    severity: "error",
    userMessage: "导入文件未通过完整性验证，现有记录没有改变。",
    recoveryActions: ["choose-file", "export-diagnostics"],
  },
  [ERROR_CODES.DIAGNOSTIC_EXPORT_FAILED]: {
    severity: "warning",
    userMessage: "诊断信息暂时无法导出。",
    recoveryActions: ["retry"],
  },
  [ERROR_CODES.UNKNOWN]: {
    severity: "error",
    userMessage: "发生了未分类错误，当前操作已安全停止。",
    recoveryActions: ["retry", "export-diagnostics"],
  },
});

function safeContext(context = {}) {
  const output = {};
  for (const key of CONTEXT_KEYS) {
    const value = context[key];
    if (["string", "number", "boolean"].includes(typeof value)) output[key] = value;
  }
  return Object.freeze(output);
}

export class AppError extends Error {
  constructor(code, {
    message = null,
    severity = null,
    userMessage = null,
    recoveryActions = null,
    context = {},
    cause = null,
  } = {}) {
    const normalizedCode = DEFAULTS[code] ? code : ERROR_CODES.UNKNOWN;
    const defaults = DEFAULTS[normalizedCode];
    super(message || normalizedCode, cause ? { cause } : undefined);
    this.name = "AppError";
    this.code = normalizedCode;
    this.severity = severity || defaults.severity;
    this.userMessage = userMessage || defaults.userMessage;
    this.recoveryActions = Object.freeze([...(recoveryActions || defaults.recoveryActions)]);
    this.context = safeContext(context);
    if (cause) Object.defineProperty(this, "localCause", { value: cause, enumerable: false });
    Object.freeze(this);
  }
}

export function normalizeAppError(error, code = ERROR_CODES.UNKNOWN, context = {}) {
  if (error instanceof AppError) return error;
  return new AppError(code, {
    message: error instanceof Error ? error.message : String(error),
    context,
    cause: error instanceof Error ? error : null,
  });
}

export function serializeAppError(error) {
  const normalized = normalizeAppError(error);
  return Object.freeze({
    name: normalized.name,
    code: normalized.code,
    severity: normalized.severity,
    userMessage: normalized.userMessage,
    recoveryActions: [...normalized.recoveryActions],
    context: { ...normalized.context },
  });
}
