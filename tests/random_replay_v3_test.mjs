import assert from "node:assert/strict";
import test from "node:test";

import {
  createReadingRandomContextFactory,
  replayReadingRandomContext,
} from "../src/core/random/production-random.js";

const ROOT_SEED = "v3-frozen-vector";

test("the frozen astra-prng-v1 replay vector remains unchanged", () => {
  const original = createReadingRandomContextFactory()({ rootSeed: ROOT_SEED });
  const replayed = replayReadingRandomContext(original.audit);
  assert.equal(replayed.audit.algorithm, "fnv1a-mulberry32");
  assert.equal(replayed.audit.version, "astra-prng-v1");
  assert.deepEqual(replayed.audit.streams, {
    draw: { name: "draw", derivedSeed: 2458196112 },
    orientation: { name: "orientation", derivedSeed: 1827005881 },
    rendering: { name: "rendering", derivedSeed: 2107862456 },
  });
  assert.deepEqual(
    Array.from({ length: 5 }, () => replayed.draw.nextUint32()),
    [1570460042, 3046893146, 4174597585, 1964124550, 690150203],
  );
  assert.deepEqual(
    Array.from({ length: 5 }, () => replayed.orientation.nextUnit()),
    [0.995482042664662, 0.8257032239343971, 0.019646788481622934, 0.638683867175132, 0.318536467384547],
  );
  assert.deepEqual(replayed.rendering.shuffle(["a", "b", "c", "d", "e"]), ["e", "a", "b", "c", "d"]);
});

test("replay rejects an unknown algorithm instead of silently substituting it", () => {
  const audit = createReadingRandomContextFactory()({ rootSeed: ROOT_SEED }).audit;
  assert.throws(() => replayReadingRandomContext({ ...audit, algorithm: "unknown-random-algorithm" }));
});

test("replay rejects an unknown random protocol version", () => {
  const audit = createReadingRandomContextFactory()({ rootSeed: ROOT_SEED }).audit;
  assert.throws(() => replayReadingRandomContext({ ...audit, version: "astra-prng-v999" }));
});
