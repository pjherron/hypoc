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

function messageText(parts) {
  return (parts ?? [])
    .filter((part) => part?.type === "text")
    .map((part) => part.text ?? "")
    .join("\n")
    .trim();
}

async function recallFor(text) {
  try {
    const config = await loadConfig();
    return await buildWarmContext(config, text, config.brain.n_recall);
  } catch (error) {
    return "";
  }
}

export default async function warmstartPlugin() {
  return {
    "chat.message": async ({ sessionID }, { parts }) => {
      if (!sessionID || pending.has(sessionID)) return;
      const text = messageText(parts);
      if (!text) return;
      pending.set(sessionID, { promise: recallFor(text), injected: false });
    },

    "experimental.chat.system.transform": async ({ sessionID }, { system }) => {
      if (!sessionID) return;
      const entry = pending.get(sessionID);
      if (!entry || entry.injected) return;
      const block = await entry.promise;
      if (block) {
        system.push(`\n${block}\n`);
      }
      entry.injected = true;
    },
  };
}
