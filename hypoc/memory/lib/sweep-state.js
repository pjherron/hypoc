// Sweep progress tracking: a small JSON state file records which sessions the
// consolidate sweep has already processed, so nothing is distilled twice and no
// closed session is ever left unrecollectable. Decoupled from git and session
// lifecycle — the file is the only authority.

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const MEMORY_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export function defaultStatePath(config) {
  const configured = config.sweep.state_path;
  return path.isAbsolute(configured) ? configured : path.join(MEMORY_ROOT, configured);
}

export function loadState(statePath) {
  try {
    const parsed = JSON.parse(readFileSync(statePath, "utf-8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function saveState(statePath, state) {
  mkdirSync(path.dirname(statePath), { recursive: true });
  writeFileSync(statePath, JSON.stringify(state, null, 2), "utf-8");
}

export function recordProcessed(state, sessionId, result) {
  state[sessionId] = {
    status: result.status,
    artifact_path: result.artifact_path ?? null,
    reason: result.reason ?? null,
    processed_at: new Date().toISOString(),
  };
}
