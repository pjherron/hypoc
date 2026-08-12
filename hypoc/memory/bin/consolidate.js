#!/usr/bin/env bun
// Consolidate: the periodic "memory palace" sweep. Runs every fixture in
// memory/fixtures/ through the spine: distill -> committed artifact -> embed
// -> index. Decoupled from the git/session lifecycle.

import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../lib/config.js";
import { processFixture } from "../lib/pipeline.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, "..", "fixtures");

const config = await loadConfig();
const fixtureFiles = (await readdir(FIXTURES_DIR))
  .filter((file) => file.endsWith(".json") && !file.startsWith("."))
  .sort();

let indexed = 0;
let noDecision = 0;

for (const file of fixtureFiles) {
  const fixturePath = path.join(FIXTURES_DIR, file);
  const result = await processFixture(config, fixturePath);
  if (result.status === "no_decision") {
    noDecision += 1;
    console.log(`NO_DECISION ${file}: ${result.reason}`);
  } else {
    indexed += 1;
    console.log(`DISTILLED ${result.artifact_path} (source-session ${result.source_session})`);
  }
}

console.log(`# Consolidate complete: ${indexed} indexed, ${noDecision} no-decision, ${fixtureFiles.length} fixtures`);
