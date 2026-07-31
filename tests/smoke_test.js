import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(testDirectory, "..");
const source = fs.readFileSync(path.join(root, "data.js"), "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(source, sandbox, { filename: "data.js" });

const data = sandbox.window.TarotData;
if (!data) throw new Error("TarotData was not initialized");
if (data.deck.length !== 78) {
  throw new Error(`Expected 78 cards, received ${data.deck.length}`);
}
if (new Set(data.deck.map((card) => card.id)).size !== 78) {
  throw new Error("Card IDs must be unique");
}
if (data.deck.filter((card) => card.arcana === "major").length !== 22) {
  throw new Error("Expected 22 major arcana cards");
}
if (data.deck.filter((card) => card.arcana === "minor").length !== 56) {
  throw new Error("Expected 56 minor arcana cards");
}
if (data.categories.length !== 6) {
  throw new Error("Expected six question categories");
}
if (data.categories.some((category) => category.questions.length !== 7)) {
  throw new Error("Expected seven preset questions in every category");
}
if (data.categories.reduce((sum, category) => sum + category.questions.length, 0) !== 42) {
  throw new Error("Expected 42 preset questions");
}
if (data.spreads.length !== 4) {
  throw new Error("Expected four spreads");
}
const spreadCounts = data.spreads.map((spread) => spread.positions.length).join(",");
if (spreadCounts !== "1,3,5,10") {
  throw new Error(`Expected distinct mainstream spread sizes 1,3,5,10; received ${spreadCounts}`);
}
const cross = data.spreads.find((spread) => spread.id === "cross");
if (!cross || cross.positions.map((position) => position.id).join(",") !== "core,root,trend,influence,action") {
  throw new Error("Expected a five-card cross with coherent spatial positions");
}
const celtic = data.spreads.find((spread) => spread.id === "celtic");
if (
  !celtic ||
  celtic.positions.map((position) => position.id).join(",") !==
    "present,challenge,past,future,above,below,advice,external,hopes,outcome"
) {
  throw new Error("Expected a classic ten-position Celtic Cross");
}
for (const card of data.deck) {
  for (const field of ["name", "en", "upright", "reversed", "advice"]) {
    if (!card[field]) throw new Error(`${card.id} is missing ${field}`);
  }
}

console.log("Tarot data smoke test passed: ESM runner, 78 cards, 42 questions, and 1/3/5/10-card mainstream spreads.");
