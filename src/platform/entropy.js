function bytesToHex(bytes) {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

export function createPlatformClientId(cryptoRef = globalThis.crypto) {
  if (typeof cryptoRef?.randomUUID === "function") {
    return `astra-${cryptoRef.randomUUID()}`;
  }
  if (typeof cryptoRef?.getRandomValues === "function") {
    const bytes = new Uint8Array(16);
    cryptoRef.getRandomValues(bytes);
    return `astra-${bytesToHex(bytes)}`;
  }
  return null;
}
