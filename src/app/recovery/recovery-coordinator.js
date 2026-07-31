import {
  ERROR_CODES,
  normalizeAppError,
} from "../../core/errors/app-error.js";

const CODE_BY_OPERATION = Object.freeze({
  knowledge: ERROR_CODES.KNOWLEDGE_LOAD_FAILED,
  engine: ERROR_CODES.ENGINE_EXECUTION_FAILED,
  pwa: ERROR_CODES.PWA_RESOURCE_FAILED,
  storage: ERROR_CODES.STORAGE_UNAVAILABLE,
  quota: ERROR_CODES.STORAGE_QUOTA,
  migration: ERROR_CODES.MIGRATION_FAILED,
  import: ERROR_CODES.IMPORT_INVALID,
});

export function createRecoveryCoordinator({ diagnosticLog, onError = null } = {}) {
  const attempts = new Map();

  async function execute(operation, work, context = {}) {
    if (typeof work !== "function") throw new TypeError("Recovery work must be a function.");
    try {
      const value = await work();
      attempts.delete(operation);
      return Object.freeze({ status: "completed", value });
    } catch (cause) {
      const attempt = (attempts.get(operation) || 0) + 1;
      attempts.set(operation, attempt);
      const error = normalizeAppError(
        cause,
        CODE_BY_OPERATION[operation] || ERROR_CODES.UNKNOWN,
        { ...context, operation, attempt },
      );
      diagnosticLog?.capture(error);
      onError?.(error);
      return Object.freeze({ status: "failed", error });
    }
  }

  function reset(operation) {
    attempts.delete(operation);
  }

  return Object.freeze({ execute, reset });
}
