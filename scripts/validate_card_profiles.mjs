#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { validateCardSemanticProfile } from "../src/engine/validation/card-profile-validator.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultSchema = path.join(root, "src/knowledge/schemas/card-semantic-profile.schema.json");

function parseArguments(argv) {
  const files = [];
  let schemaPath = defaultSchema;
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === "--schema") {
      schemaPath = path.resolve(argv[index + 1]);
      index += 1;
    } else {
      files.push(path.resolve(argv[index]));
    }
  }
  if (!files.length) throw new Error("Provide at least one CardSemanticProfile JSON file.");
  return { files, schemaPath };
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

try {
  const { files, schemaPath } = parseArguments(process.argv.slice(2));
  const schema = readJson(schemaPath);
  const results = files.map((filePath) => {
    try {
      const errors = validateCardSemanticProfile(readJson(filePath), schema);
      return { file: path.relative(root, filePath).replaceAll("\\", "/"), status: errors.length ? "FAIL" : "PASS", errors };
    } catch (error) {
      return {
        file: path.relative(root, filePath).replaceAll("\\", "/"),
        status: "FAIL",
        errors: [{ code: "json.parse", path: "$", keyword: "json", message: String(error.message || error) }],
      };
    }
  });
  const summary = {
    PASS: results.filter((item) => item.status === "PASS").length,
    FAIL: results.filter((item) => item.status === "FAIL").length,
  };
  console.log(JSON.stringify({ schema: path.relative(root, schemaPath).replaceAll("\\", "/"), results, summary }));
  if (summary.FAIL) process.exitCode = 1;
} catch (error) {
  console.error(String(error.message || error));
  process.exitCode = 2;
}
