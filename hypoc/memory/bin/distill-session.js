#!/usr/bin/env bun
// Distill a named closed session from the session DB into a committed decision
// artifact now (the explicit /distill escape hatch). Same contract as
// bin/distill.js but for a session record read from the real DB.
//
//   usage: bun bin/distill-session.js <session-id> [--db <path>]

import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadConfig } from "../lib/config.js";
import { openSessionDb, sessionRecord, defaultDbPath } from "../lib/session-db.js";
import { processRecord } from "../lib/pipeline.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sessionId = process.argv[2];
if (!sessionId) {
  console.error("usage: bun bin/distill-session.js <session-id> [--db <path>]");
  process.exit(2);
}

let dbPath;
const dbFlagIndex = process.argv.indexOf("--db");
if (dbFlagIndex >= 0 && process.argv[dbFlagIndex + 1]) {
  dbPath = process.argv[dbFlagIndex + 1];
}

const config = await loadConfig();
const resolvedDb = dbPath ?? (config.sweep.db_path || defaultDbPath());
const db = openSessionDb(resolvedDb);
const record = sessionRecord(db, sessionId);
if (record.messages.length === 0) {
  console.error(`Session ${sessionId} has no message content in ${resolvedDb}`);
  process.exit(1);
}

const result = await processRecord(config, record);
if (result.status === "no_decision") {
  console.log(`NO_DECISION ${result.reason}`);
} else {
  console.log(`DISTILLED ${result.artifact_path} (source-session ${result.source_session})`);
}
