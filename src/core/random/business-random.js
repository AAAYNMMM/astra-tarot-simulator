const UINT32_RANGE = 4294967296;

function secureUnit(cryptoRef) {
  if (typeof cryptoRef?.getRandomValues !== "function") return null;
  const buffer = new Uint32Array(1);
  cryptoRef.getRandomValues(buffer);
  return buffer[0] / UINT32_RANGE;
}

function validateUnit(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric >= 1) {
    throw new RangeError("Business random source must return a finite value in [0, 1).");
  }
  return numeric;
}

export function createBusinessRandom({
  cryptoRef = globalThis.crypto,
  fallbackRandom = Math.random,
} = {}) {
  if (typeof fallbackRandom !== "function") {
    throw new TypeError("fallbackRandom must be a function.");
  }

  function randomUnit() {
    const secure = secureUnit(cryptoRef);
    return secure === null ? validateUnit(fallbackRandom()) : secure;
  }

  function secureShuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(randomUnit() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  return Object.freeze({ randomUnit, secureShuffle });
}
