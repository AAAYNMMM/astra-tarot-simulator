const STREAM_NAMES = Object.freeze(["draw", "orientation", "rendering"]);

function hashSeed(value) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;
  return hash >>> 0;
}

function createGenerator(seed) {
  let state = seed >>> 0;
  return function nextUint32() {
    state = (state + 0x6D2B79F5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return (value ^ (value >>> 14)) >>> 0;
  };
}

function createStream({ rootSeed, version, name }) {
  const derivedSeed = hashSeed(`${version}\u0000${rootSeed}\u0000${name}`);
  const nextUint32 = createGenerator(derivedSeed);
  return Object.freeze({
    name,
    version,
    derivedSeed,
    nextUint32,
    nextUnit() {
      return nextUint32() / 4294967296;
    },
    nextInt(maxExclusive) {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) throw new RangeError("maxExclusive must be a positive integer.");
      return Math.floor(this.nextUnit() * maxExclusive);
    },
    pick(items) {
      if (!Array.isArray(items) || items.length === 0) throw new RangeError("pick requires a non-empty array.");
      return items[this.nextInt(items.length)];
    },
    shuffle(items) {
      const result = [...items];
      for (let index = result.length - 1; index > 0; index -= 1) {
        const target = this.nextInt(index + 1);
        [result[index], result[target]] = [result[target], result[index]];
      }
      return result;
    },
  });
}

export function createDeterministicStreams(rootSeed, { version = "astra-prng-v1" } = {}) {
  if (typeof rootSeed !== "string" || rootSeed.length === 0) throw new TypeError("rootSeed must be a non-empty string.");
  if (typeof version !== "string" || version.length === 0) throw new TypeError("version must be a non-empty string.");
  const streams = Object.fromEntries(STREAM_NAMES.map((name) => [
    name,
    createStream({ rootSeed, version, name }),
  ]));
  return Object.freeze({
    schemaVersion: "1.0.0",
    algorithm: "fnv1a-mulberry32",
    version,
    rootSeed,
    streams: Object.freeze(streams),
    derive(name) {
      if (typeof name !== "string" || name.length === 0) throw new TypeError("Stream name must be a non-empty string.");
      return createStream({ rootSeed, version, name });
    },
  });
}

export { STREAM_NAMES };
