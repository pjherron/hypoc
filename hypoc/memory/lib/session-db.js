// Read real session records from the opencode session SQLite DB (T2).
// The DB is treated as a read-only input; nothing here writes to it. A session
// record is returned in the documented fixture shape so the exact same
// distill -> artifact -> embed pipeline consumes it.

import os from "node:os";
import path from "node:path";
import { Database } from "bun:sqlite";

export function defaultDbPath() {
  const fromEnv = process.env.OPENCODE_DB;
  if (fromEnv) return fromEnv;
  return path.join(os.homedir(), ".local", "share", "opencode", "opencode.db");
}

export function openSessionDb(dbPath) {
  return new Database(dbPath, { readonly: true });
}

export function listSessions(db) {
  return db
    .query(
      `SELECT id, parent_id, directory, title, time_created, time_updated, time_archived
       FROM session ORDER BY time_updated ASC`,
    )
    .all();
}

// A session is "closed" when it is not currently active and either archived or
// last updated outside the staleness window. Deterministic and configurable.
export function isClosedSession(row, { now = Date.now(), closedAfterMs = 60 * 60 * 1000, activeIds = new Set() } = {}) {
  if (activeIds.has(row.id)) return false;
  if (row.time_archived) return true;
  const updated = Number(row.time_updated ?? row.time_created ?? 0);
  return now - updated >= closedAfterMs;
}

function isoDate(ms) {
  return ms ? new Date(Number(ms)).toISOString() : "";
}

function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// Map one part row (data JSON) to a short text line for the transcript.
function partToText(partData) {
  let data;
  try {
    data = JSON.parse(partData);
  } catch {
    return "";
  }
  switch (data.type) {
    case "text":
    case "reasoning":
      return (data.text ?? "").trim();
    case "tool":
    case "tool-invocation": {
      const name = data.tool ?? data.invocation?.tool ?? "tool";
      const input = data.state?.input ?? data.input ?? data.invocation?.input;
      if (input === undefined) return `[${name}]`;
      const json = typeof input === "string" ? input : JSON.stringify(input);
      return `[${name}] ${truncate(json, 240)}`;
    }
    default:
      return "";
  }
}

// Assemble the full transcript of a session into the fixture-record shape:
// { session: { id, title, directory, time_created, time_updated }, messages }.
export function sessionRecord(db, sessionId) {
  const rows = db
    .query(
      `SELECT p.data AS part_data, m.data AS message_data
       FROM part p JOIN message m ON p.message_id = m.id
       WHERE p.session_id = ?
       ORDER BY m.time_created, m.id, p.time_created, p.id`,
    )
    .all(sessionId);

  const messages = [];
  for (const row of rows) {
    let messageData;
    try {
      messageData = JSON.parse(row.message_data);
    } catch {
      continue;
    }
    const text = partToText(row.part_data);
    if (!text) continue;
    const role = messageData.role ?? "unknown";
    const last = messages[messages.length - 1];
    if (last && last.role === role) {
      last.parts.push({ type: "text", text });
    } else {
      messages.push({ role, parts: [{ type: "text", text }] });
    }
  }

  const row = db
    .query(`SELECT id, title, directory, time_created, time_updated FROM session WHERE id = ?`)
    .get(sessionId);

  return {
    session: {
      id: sessionId,
      title: row?.title ?? sessionId,
      directory: row?.directory ?? "",
      time_created: isoDate(row?.time_created),
      time_updated: isoDate(row?.time_updated),
    },
    messages,
  };
}
