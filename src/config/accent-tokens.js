const TOKENS = Object.freeze({
  "#62a3bd": "accent-0",
  "#79b5a5": "accent-1",
  "#7fa9d8": "accent-2",
  "#8d9db7": "accent-3",
  "#93a0cf": "accent-4",
  "#a58ad4": "accent-5",
  "#b89a59": "accent-6",
  "#c8a66a": "accent-7",
  "#d1aa62": "accent-8",
  "#d6815f": "accent-9",
  "#d77f95": "accent-10",
  "#d8bb7a": "accent-11"
});

export const DEFAULT_ACCENT_TOKEN = TOKENS["#d8bb7a"] || "accent-0";

export function accentToken(value) {
  const normalized = String(value ?? "").toLowerCase();
  return TOKENS[normalized] || DEFAULT_ACCENT_TOKEN;
}

export const ACCENT_VALUES = Object.freeze({ ...TOKENS });
