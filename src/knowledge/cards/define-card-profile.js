function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  for (const item of Object.values(value)) deepFreeze(item);
  return Object.freeze(value);
}

export function semanticUnit(id, text, tags, allowedRoles, sourceRefs) {
  return { id, text, tags, allowedRoles, sourceRefs };
}

export function evidenceUnit(id, text, sourceRefs) {
  return { id, text, sourceRefs };
}

export function symbolUnit(id, symbol, meaning, traditionScopes, sourceRefs) {
  return { id, symbol, meaning, traditionScopes, sourceRefs };
}

export function defineCardProfile(profile) {
  return deepFreeze(profile);
}
