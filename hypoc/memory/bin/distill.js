#!/usr/bin/env bun
// Distill one session fixture through the full spine:
// distill (cheap router tier) -> committed decision artifact -> embed -> index.

import { loadConfig } from "../lib/config.js";
import { processFixture } from "../lib/pipeline.js";

const config = await loadConfig();
const fixturePath = process.argv[2];
if (!fixturePath) {
  console.error("usage: bun bin/distill.js <fixture.json>");
  process.exit(2);
}

const result = await processFixture(config, fixturePath);
if (result.status === "no_decision") {
  console.log(`NO_DECISION ${result.reason}`);
} else {
  console.log(`DISTILLED ${result.artifact_path} (source-session ${result.source_session})`);
}
