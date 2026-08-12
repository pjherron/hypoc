// Auto warm-start plugin (T3). The immediacy surface: recall fires unsummoned.
// Timing resolves the cold-start truth — nothing exists to query at literal
// session start, so recall fires once the FIRST user message exists, using that
// content as the query, and injects the top-n relevant distilled artifacts
// (with their `source-session` links) into the system prompt before the user
// knows they exist.
//
// Wiring:
//   - `chat.message` starts the recall when the first user message arrives and
//     caches the in-flight promise per session (no re-recall on later messages).
//   - `experimental.chat.system.transform` awaits that promise on the first LLM
//     request of the session and appends the block to the system prompt exactly
//     once. Because the recall promise is already in flight by then, the added
//     latency is the await of work already started.
//
// `/recall` (T4) remains the manual escape hatch; this is the primary surface.

import { loadConfig } from "../lib/config.js";
import { buildWarmContext } from "../lib/warmstart.js";

// sessionID -> { promise, injected }
const pending = new Map();

// Tolerant extraction: parts may be objects ({ type, text, content }) or plain
// strings, and some hosts pass a single part object rather than an array.
function messageText(parts) {
  if (typeof parts === "string") return parts.trim();
  const list = Array.isArray(parts) ? parts : [parts];
  return list
    .map((part) => {
      if (typeof part === "string") return part;
      if (part && typeof part === "object") {
        return part.text ?? part.content ?? "";
      }
      return "";
    })
    .join("\n")
    .trim();
}

async function recallFor(text) {
  try {
    const config = await loadConfig();
    return await buildWarmContext(config, text, config.brain.n_recall);
  } catch (error) {
    // Never crash a session's first request on a recall failure, but surface it
    // loudly instead of silently returning "" (a silent failure would look like
    // "nothing relevant" forever). Retryable: the pending slot is dropped so the
    // next user message re-attempts recall.
    console.error(`[memory] warm-start recall failed: ${error?.message ?? error}`);
    throw error;
  }
}

export default async function warmstartPlugin() {
  return {
    "chat.message": async ({ sessionID }, { parts }) => {
      if (!sessionID || pending.has(sessionID)) return;
      const text = messageText(parts);
      if (!text) return;
      const promise = recallFor(text);
      // Guard against an unhandled-rejection report: the promise may reject
      // before the transform attaches its handler. The no-op catch keeps the
      // runtime quiet; the transform still observes the failure and retries.
      promise.catch(() => {});
      pending.set(sessionID, { promise, injected: false });
    },

    "experimental.chat.system.transform": async ({ sessionID }, { system }) => {
      if (!sessionID) return;
      const entry = pending.get(sessionID);
      if (!entry || entry.injected) return;
      try {
        const block = await entry.promise;
        if (!block) {
          // Success but empty (nothing recalled): mark injected so we do not
          // re-await the same resolved promise on every transform.
          entry.injected = true;
          return;
        }
        system.push(`\n${block}\n`);
        // Only mark injected after the block is actually pushed. A failure to
        // await leaves the slot open so a later message retries the recall.
        entry.injected = true;
      } catch {
        // Recall failed: drop the slot so the next message re-attempts rather
        // than permanently burning this session's warm-start.
        pending.delete(sessionID);
      }
    },
  };
}
