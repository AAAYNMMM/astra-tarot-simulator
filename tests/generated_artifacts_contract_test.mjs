import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { TarotData } from "../src/knowledge/legacy/index.js";
import { CARD_CATALOG } from "../src/generated/card-catalog.js";
import { QUESTION_CATALOG } from "../src/generated/question-catalog.js";
import { CARD_REGISTRY, QUESTION_REGISTRY, SPREAD_REGISTRY, assertKnowledgeCatalog } from "../src/generated/knowledge-registry.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
assert.equal(assertKnowledgeCatalog(TarotData), true);
assert.equal(CARD_CATALOG.length, 78);
assert.equal(QUESTION_CATALOG.reduce((sum, item) => sum + item.questions.length, 0), 42);
assert.equal(Object.keys(CARD_REGISTRY).length, 78);
assert.equal(Object.keys(QUESTION_REGISTRY).length, 42);
assert.equal(Object.keys(SPREAD_REGISTRY).length, 4);
assert.equal((await CARD_REGISTRY["major-0"]()).id, "major-0");
assert.equal((await QUESTION_REGISTRY[TarotData.categories[0].questions[0].id]()).id, TarotData.categories[0].questions[0].id);
assert.equal((await SPREAD_REGISTRY.single()).id, "single");

const artifactText = read("src/generated/artifact-manifest.json");
const artifact = JSON.parse(artifactText);
const knowledgeText = read("src/generated/knowledge-manifest.json");
assert.equal(artifact.knowledgeManifestHash, hash(knowledgeText.replace(/\r\n?/g, "\n")));
for (const forbidden of ["finalCommit", "commit", "precacheManifestHash", "artifactManifestHash"]) {
  assert.equal(Object.hasOwn(artifact, forbidden), false, `artifact manifest must not contain ${forbidden}`);
}
assert.equal(artifact.generatorVersion, "1.0.0");
assert.equal(Object.keys(artifact.modules.cards).length, 78);
assert.equal(Object.keys(artifact.modules.questions).length, 42);
assert.ok(Object.keys(artifact.modules.vocabularies).length >= 5);
assert.ok(Object.keys(artifact.modules.schemas).length >= 4);
assert.equal(Object.keys(artifact.modules.positionOperators).length, 5);
assert.equal((await CARD_REGISTRY["major-7"]()).schemaVersion, "1.0.0");
assert.equal((await QUESTION_REGISTRY["career-change"]()).spreadProfiles.cross.outputDepth, "standard");

const sandbox = { self: {}, ServiceWorkerGlobalScope: class ServiceWorkerGlobalScope {} };
sandbox.self = new sandbox.ServiceWorkerGlobalScope();
vm.createContext(sandbox);
vm.runInContext(read("src/generated/precache-manifest.js"), sandbox);
const precache = sandbox.self.__ASTRA_PRECACHE_MANIFEST__;
assert.ok(precache.releaseId.startsWith("2.0.0-dev-"));
assert.equal(precache.artifactManifestHash, hash(artifactText.replace(/\r\n?/g, "\n")));
assert.equal(precache.optionalDecks.rws.length, 79);
assert.equal(precache.optionalDecks.arnoult.length, 79);
assert.equal(precache.optionalDecks.swiss.length, 79);
assert.equal(precache.optionalDecks.piedmont.length, 79);
assert.equal("__ASTRA_PRECACHE_MANIFEST__" in globalThis, false);
console.log("MOD-006B generated artifact contract passed: catalogs, registries, DAG hashes, and classic precache manifest are deterministic.");
