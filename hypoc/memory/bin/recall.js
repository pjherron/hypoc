#!/usr/bin/env bun
// Recall: the seam. `recall(query)` returns decision artifacts plus their
// source-session links, unsummoned, count capped by the Miller register. The
// query goes through the same scheme embedding + screening as the stored
// vectors, so recall always runs against the screened representation.

import { loadConfig } from "../lib/config.js";
import { embedTextSchemes } from "../lib/pipeline.js";
import { screenVectors } from "../lib/screen.js";
import { search } from "../lib/brain.js";

function parseArgs(argv) {
  const positional = [];
  let limit;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--limit") {
      i += 1;
      limit = Number(argv[i]);
    } else if (arg.startsWith("--limit=")) {
      limit = Number(arg.slice("--limit=".length));
    } else {
      positional.push(arg);
    }
  }
  return { query: positional.join(" "), limit };
}

function resolveLimit(config, flag) {
  const max = config.brain.n_recall_max;
  const def = config.brain.n_recall;
  if (flag === undefined || Number.isNaN(flag)) {
    return Math.min(def, max);
  }
  if (!Number.isInteger(flag) || flag < 1) {
    throw new Error("--limit must be a positive integer.");
  }
  return Math.min(flag, max);
}

const config = await loadConfig();
const { query, limit } = parseArgs(process.argv.slice(2));
if (!query) {
  console.error("usage: bun bin/recall.js <query> [--limit N]");
  process.exit(2);
}

const resolved = resolveLimit(config, limit);
const schemes = await embedTextSchemes(config, query);
const { vectors } = await screenVectors(config, schemes);
const results = await search(config, vectors, resolved);

console.log(`# Recalled ${results.length} result(s) for "${query}"`);
for (const result of results) {
  const path = result.artifact_path ?? "(no artifact)";
  const session = result.source_session ?? "(no source-session)";
  const title = result.title ?? "";
  console.log(`- ${result.score.toFixed(4)} | ${path} | source-session: ${session} | ${title}`);
}
