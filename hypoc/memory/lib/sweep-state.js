// Sweep progress tracking: a small JSON state file records which sessions the
// consolidate sweep has already processed, so nothing is distilled twice and no
// closed session is ever left unrecollectable. Decoupled from git and session
// lifecycle — the file is the only authority. Writes are atomic (temp + rename)
// so a killed run never leaves a truncated file that silently resets tracking.

import { mkdirSync, readFileSync, writeFileSync, renameSync, copyFileSync } from "node:fs";
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
  } catch (error) {
    const missing = error?.code === "ENOENT";
    if (!missing) {
      // A corrupt/unreadable state file silently resetting to {} would re-queue
      // every session (re-distillation) with no warning. Back it up and say so.
      try {
        copyFileSync(statePath, `${statePath}.corrupt-${Date.now()}`);
      } catch {
        // ignore backup failure; the warning below is what matters
      }
      console.warn(`[memory] sweep state ${statePath} is unreadable; backed up and tracking reset.`);
    }
    return {};
  }
}

export function saveState(statePath, state) {
  const dir = path.dirname(statePath);
  mkdirSync(dir, { recursive: true });
  const tmp = path.join(dir, `.${path.basename(statePath)}.tmp-${process.pid}`);
  writeFileSync(tmp, JSON.stringify(state, null, 2), "utf-8");
  renameSync(tmp, statePath);
}

export function recordProcessed(state, sessionId, result) {
  state[sessionId] = {
    status: result.status,
    artifact_path: result.artifact_path ?? null,
    reason: result.reason ?? null,
    processed_at: new Date().toISOString(),
  };
}
