#!/usr/bin/env bun
// Consolidate: the periodic "memory palace" sweep over REAL session records.
// Reads the opencode session DB, selects closed sessions that lack a distilled
// artifact, runs the distill -> committed artifact -> embed pipeline on each,
// and tracks what it has processed so nothing is distilled twice. Decoupled
// from git commit lifecycle and session start/end hooks — run on demand or
// schedule.
//
//   --db <path>         session DB (default: config sweep.db_path, else
//                       $OPENCODE_DB, else the standard opencode DB)
//   --state <path>      sweep progress file (default: config sweep.state_path)
//   --closed-after <ms> staleness window for "closed" (default: config)
//   --limit <n>         process at most n sessions this run
//   --dry-run           list what would be processed without processing

import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../lib/config.js";
import { openSessionDb, listSessions, isClosedSession, sessionRecord, defaultDbPath } from "../lib/session-db.js";
import { loadState, saveState, recordProcessed, defaultStatePath } from "../lib/sweep-state.js";
import { processRecord, artifactForSession, indexArtifactFile } from "../lib/pipeline.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--db" || arg === "--state" || arg === "--closed-after" || arg === "--limit") {
      i += 1;
      args[arg.slice(2)] = argv[i];
    } else if (arg.startsWith("--db=")) {
      args.db = arg.slice("--db=".length);
    } else if (arg.startsWith("--state=")) {
      args.state = arg.slice("--state=".length);
    } else if (arg.startsWith("--closed-after=")) {
      args["closed-after"] = arg.slice("--closed-after=".length);
    } else if (arg.startsWith("--limit=")) {
      args.limit = arg.slice("--limit=".length);
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    }
  }
  return args;
}

const config = await loadConfig();
const args = parseArgs(process.argv.slice(2));

const dbPath = args.db ?? (config.sweep.db_path || defaultDbPath());
const statePath = args.state ?? defaultStatePath(config);
const limitFlag = args.limit;
const closedAfterFlag = args["closed-after"];
const closedAfterMs = closedAfterFlag !== undefined ? Number(closedAfterFlag) : config.sweep.closed_after_ms;
const limit = limitFlag !== undefined ? Number(limitFlag) : Infinity;

if (!Number.isFinite(closedAfterMs) || closedAfterMs < 0) {
  console.error("usage: --closed-after must be a non-negative number");
  process.exit(2);
}
if (limitFlag !== undefined && (!Number.isFinite(limit) || limit < 0)) {
  console.error("usage: --limit must be a non-negative number");
  process.exit(2);
}

const activeIds = new Set((process.env.OPENCODE_SESSION_ID ?? "").split(",").filter(Boolean));
const db = openSessionDb(dbPath);
const sessions = listSessions(db);
const now = Date.now();
const state = loadState(statePath);

const candidates = sessions.filter((row) => {
  if (state[row.id]) return false;
  if (!isClosedSession(row, { now, closedAfterMs, activeIds })) return false;
  return true;
});

let indexed = 0;
let noDecision = 0;
let existing = 0;
let failed = 0;

if (args.dryRun) {
  for (const row of candidates.slice(0, limit)) {
    console.log(`WOULD_PROCESS ${row.id} | ${row.title}`);
  }
  console.log(`# Dry run: ${candidates.length} closed sessions awaiting distillation`);
  process.exit(0);
}

const batch = candidates.slice(0, limit);
for (const row of batch) {
  // Per-session isolation: one poison session (Ollama error, malformed
  // transcript, git hook rejection) must not abort the whole sweep. It is
  // recorded as failed and left un-processed so it is re-attempted next run.
  try {
    // Guard against sessions that already have a committed artifact (e.g. from a
    // manual /distill) even if the state file was lost. The backstop still makes
    // them recallable: ensure the artifact is embedded and indexed.
    const existingArtifact = await artifactForSession(row.id);
    if (existingArtifact) {
      await indexArtifactFile(config, existingArtifact);
      existing += 1;
      recordProcessed(state, row.id, {
        status: "existing",
        artifact_path: path.relative(path.join(__dirname, "..", ".."), existingArtifact),
      });
      console.log(
        `INDEXED ${row.id} -> ${path.relative(path.join(__dirname, "..", ".."), existingArtifact)} (existing artifact)`,
      );
      saveState(statePath, state);
      continue;
    }
    const record = sessionRecord(db, row.id);
    const result = await processRecord(config, record);
    if (result.status === "no_decision") {
      noDecision += 1;
      recordProcessed(state, row.id, result);
      console.log(`NO_DECISION ${row.id}: ${result.reason}`);
    } else if (result.status === "failed") {
      // Retryable: a model/parse failure, not a determination. Not persisted
      // as processed, so the session is re-attempted on a later run.
      failed += 1;
      console.warn(`FAILED ${row.id}: ${result.reason}`);
    } else {
      indexed += 1;
      recordProcessed(state, row.id, result);
      console.log(`DISTILLED ${row.id} -> ${result.artifact_path} (source-session ${result.source_session})`);
    }
    saveState(statePath, state);
  } catch (error) {
    failed += 1;
    console.warn(`FAILED ${row.id}: ${error?.message ?? error}`);
  }
}

console.log(
  `# Sweep complete: ${indexed} distilled, ${noDecision} no-decision, ${existing} existing, ` +
    `${failed} failed, ${candidates.length} candidates, ${Object.keys(state).length} tracked`,
);
