#!/usr/bin/env bun
// Warm-start probe: print the context block that would be injected for a given
// first user message. This is the seam the opencode plugin consumes and the
// CLI surface the tests drive.
//
//   usage: bun bin/warmstart.js "<first user message>" [--limit N]

import { loadConfig } from "../lib/config.js";
import { buildWarmContext } from "../lib/warmstart.js";

const args = process.argv.slice(2);
const positional = [];
let limit;
for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === "--limit") {
    i += 1;
    limit = Number(args[i]);
  } else if (arg.startsWith("--limit=")) {
    limit = Number(arg.slice("--limit=".length));
  } else {
    positional.push(arg);
  }
}
const query = positional.join(" ");
if (!query) {
  console.error("usage: bun bin/warmstart.js \"<first user message>\" [--limit N]");
  process.exit(2);
}

const config = await loadConfig();
const resolved = Number.isInteger(limit) && limit > 0 ? Math.min(limit, config.brain.n_recall_max) : config.brain.n_recall;
const block = await buildWarmContext(config, query, resolved);
console.log(block);
