#!/usr/bin/env bun
// Re-index committed decision artifacts without re-distilling. The artifacts
// stay authoritative; only the embedded representation is refreshed.
//   --recalibrate   recompute the per-corpus screening masks first
//   --scheme NAME   reindex only the named scheme (decoupled per-scheme op)

import { loadConfig } from "../lib/config.js";
import { reindexCommitted } from "../lib/pipeline.js";

function parseArgs(argv) {
  let scheme;
  let recalibrate = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--recalibrate") {
      recalibrate = true;
    } else if (arg === "--scheme") {
      i += 1;
      scheme = argv[i];
    } else if (arg.startsWith("--scheme=")) {
      scheme = arg.slice("--scheme=".length);
    }
  }
  return { scheme, recalibrate };
}

const config = await loadConfig();
const { scheme, recalibrate } = parseArgs(process.argv.slice(2));
const { results, masks } = await reindexCommitted(config, { recalibrate, scheme });

for (const [name, mask] of Object.entries(masks)) {
  const kept = mask.mask.filter(Boolean).length;
  console.log(`SCREENED ${name} kept ${kept}/${mask.size} dims (rule=${mask.rule} keep=${mask.keep_fraction})`);
}
for (const result of results) {
  console.log(`INDEXED ${result.artifact_path} (source-session ${result.source_session})`);
}
console.log(
  `# Reindex complete: ${results.length} artifacts${scheme ? ` (scheme=${scheme})` : ""}`,
);
