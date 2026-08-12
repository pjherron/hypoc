// Seed the sweep-test fixture session DB (fixtures/session-db.sqlite3) in the
// real opencode session-DB schema. Deterministic and regenerable: delete the
// checked-in file and run `bun scripts/seed-session-db.js`.
//
// Contains two closed sessions:
//   ses_jun_rate_0009   a real decision ("API rate limiting") that must distill
//   ses_jun_garbage_0010  a no-decision transcript that must be skipped

import { rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Database } from "bun:sqlite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "..", "fixtures", "session-db.sqlite3");

rmSync(DB_PATH, { force: true });
const db = new Database(DB_PATH);

db.run(`
  CREATE TABLE project (
    id text PRIMARY KEY,
    worktree text NOT NULL,
    vcs text,
    name text,
    time_created integer NOT NULL,
    time_updated integer NOT NULL,
    sandboxes text NOT NULL
  );
  CREATE TABLE session (
    id text PRIMARY KEY,
    project_id text NOT NULL,
    parent_id text,
    slug text NOT NULL,
    directory text NOT NULL,
    title text NOT NULL,
    version text NOT NULL,
    time_created integer NOT NULL,
    time_updated integer NOT NULL,
    time_archived integer,
    agent text,
    model text,
    cost real DEFAULT 0 NOT NULL,
    tokens_input integer DEFAULT 0 NOT NULL,
    tokens_output integer DEFAULT 0 NOT NULL
  );
  CREATE TABLE message (
    id text PRIMARY KEY,
    session_id text NOT NULL,
    time_created integer NOT NULL,
    time_updated integer NOT NULL,
    data text NOT NULL
  );
  CREATE TABLE part (
    id text PRIMARY KEY,
    message_id text NOT NULL,
    session_id text NOT NULL,
    time_created integer NOT NULL,
    time_updated integer NOT NULL,
    data text NOT NULL
  );
  CREATE INDEX message_session_time_created_id_idx ON message (session_id, time_created, id);
`);

const PROJECT = "prj_fixture";
db.run(`INSERT INTO project (id, worktree, vcs, name, time_created, time_updated, sandboxes)
        VALUES (?, 'memory/fixtures', 'git', 'memory fixture', 1, 1, '[]')`, [PROJECT]);

function insertSession(id, title, startIso, endIso) {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  db.run(
    `INSERT INTO session (id, project_id, slug, directory, title, version, time_created, time_updated)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, PROJECT, id, "/Users/pjherron17/dev/example-service", title, "0.1.0", start, end],
  );
}

function insertMessage(messageId, sessionId, role, ms) {
  db.run(
    `INSERT INTO message (id, session_id, time_created, time_updated, data)
     VALUES (?, ?, ?, ?, ?)`,
    [messageId, sessionId, ms, ms, JSON.stringify({ role, time: { created: ms } })],
  );
}

function insertPart(partId, messageId, sessionId, ms, data) {
  db.run(
    `INSERT INTO part (id, message_id, session_id, time_created, time_updated, data)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [partId, messageId, sessionId, ms, ms, JSON.stringify(data)],
  );
}

// --- Session 1: a real decision -------------------------------------------------
insertSession("ses_jun_rate_0009", "API rate limiting strategy", "2026-06-20T12:00:00Z", "2026-06-20T12:45:00Z");

insertMessage("msg_0901", "ses_jun_rate_0009", "user", Date.parse("2026-06-20T12:00:00Z"));
insertPart("prt_0901", "msg_0901", "ses_jun_rate_0009", Date.parse("2026-06-20T12:00:00Z"), {
  type: "text",
  text: "We need a rate limiting strategy for the public API. Options: fixed window counters, sliding window logs, token bucket, and per-IP versus per-tenant limits.",
});

insertMessage("msg_0902", "ses_jun_rate_0009", "assistant", Date.parse("2026-06-20T12:20:00Z"));
insertPart("prt_0902", "msg_0902", "ses_jun_rate_0009", Date.parse("2026-06-20T12:20:00Z"), {
  type: "text",
  text: "The team decided to ship a token bucket rate limiter scoped per tenant, with a small shared burst pool for the API as a whole. Rationale: the bucket smooths traffic bursts without penalizing long-running tenants, per-tenant quotas stay cheap and predictable to reason about, and refill math is trivial. Alternatives considered: fixed window counters (bursty at window edges), sliding window logs (memory heavy), and global per-IP limits (false positives behind shared NAT).",
});

// --- Session 2: a no-decision transcript ----------------------------------------
insertSession("ses_jun_garbage_0010", "gibberish", "2026-06-25T09:00:00Z", "2026-06-25T09:05:00Z");

insertMessage("msg_1001", "ses_jun_garbage_0010", "user", Date.parse("2026-06-25T09:00:00Z"));
insertPart("prt_1001", "msg_1001", "ses_jun_garbage_0010", Date.parse("2026-06-25T09:00:00Z"), {
  type: "text",
  text: "qzx plork vamut 88413 nertle",
});

insertMessage("msg_1002", "ses_jun_garbage_0010", "assistant", Date.parse("2026-06-25T09:02:00Z"));
insertPart("prt_1002", "msg_1002", "ses_jun_garbage_0010", Date.parse("2026-06-25T09:02:00Z"), {
  type: "text",
  text: "I have no idea what any of that was about.",
});

// --- Session 3: another real decision (distilled fresh by the sweep) -----------
insertSession("ses_jul_cache_0011", "API response caching strategy", "2026-07-05T14:00:00Z", "2026-07-05T14:40:00Z");

insertMessage("msg_1101", "ses_jul_cache_0011", "user", Date.parse("2026-07-05T14:00:00Z"));
insertPart("prt_1101", "msg_1101", "ses_jul_cache_0011", Date.parse("2026-07-05T14:00:00Z"), {
  type: "text",
  text: "How should we cache API responses? Options: client-side caching only, a reverse proxy cache, or an application-level write-through cache with TTLs.",
});

insertMessage("msg_1102", "ses_jul_cache_0011", "assistant", Date.parse("2026-07-05T14:25:00Z"));
insertPart("prt_1102", "msg_1102", "ses_jul_cache_0011", Date.parse("2026-07-05T14:25:00Z"), {
  type: "text",
  text: "The team decided to ship an application-level write-through cache with per-resource TTLs and a small stamped lock to absorb cache stampedes. Rationale: gives us exact invalidation on writes, bounded staleness per resource, and the stampede lock keeps thundering herds from hitting the origin. Alternatives considered: relying on a reverse proxy cache (opaque invalidation) and pure client-side caching (no server control).",
});

db.close();
console.log(`Seeded ${DB_PATH}`);
