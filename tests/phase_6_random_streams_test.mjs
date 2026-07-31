import assert from "node:assert/strict";
import { createDeterministicStreams, STREAM_NAMES } from "../src/core/random/deterministic-streams.js";

assert.deepEqual(STREAM_NAMES, ["draw", "orientation", "rendering"]);
const first = createDeterministicStreams("reading-seed-001");
const second = createDeterministicStreams("reading-seed-001");
assert.deepEqual(
  Array.from({ length: 8 }, () => first.streams.draw.nextUint32()),
  Array.from({ length: 8 }, () => second.streams.draw.nextUint32()),
);

const isolatedA = createDeterministicStreams("independence-seed");
const isolatedB = createDeterministicStreams("independence-seed");
for (let index = 0; index < 100; index += 1) isolatedA.streams.draw.nextUnit();
assert.deepEqual(
  Array.from({ length: 12 }, () => isolatedA.streams.rendering.nextUint32()),
  Array.from({ length: 12 }, () => isolatedB.streams.rendering.nextUint32()),
);
assert.notEqual(first.streams.draw.derivedSeed, first.streams.orientation.derivedSeed);
assert.deepEqual(
  createDeterministicStreams("shuffle").streams.draw.shuffle([1, 2, 3, 4, 5]),
  createDeterministicStreams("shuffle").streams.draw.shuffle([1, 2, 3, 4, 5]),
);
console.log("AU-001A deterministic root derivation and independent streams passed.");
