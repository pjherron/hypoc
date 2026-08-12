// Auto warm-start (T3): the immediacy surface. Recall fires unsummoned — the
// session's first user message is the query, and the top-n relevant distilled
// artifacts (with their source-session links) are injected into context before
// the user knows they exist. This module holds the testable seam; the opencode
// plugin wires it to the first user message.

import { embedTextSchemes } from "./pipeline.js";
import { screenVectors } from "./screen.js";
import { search } from "./brain.js";

export function formatRecallBlock(results, limit) {
  if (results.length === 0) {
    return `## Recalled decisions (0/${limit})\n\nNo matching decisions in the memory brain.`;
  }
  const lines = results.map((result) => {
    const artifact = result.artifact_path ?? "(no artifact)";
    const session = result.source_session ?? "(no source-session)";
    const title = result.title ?? "";
    return `- ${artifact} | source-session: ${session} | ${title}`;
  });
  return `## Recalled decisions (${results.length}/${limit})\n\n${lines.join("\n")}`;
}

// Query the brain with the first message's content; returns the results.
export async function warmRecall(config, query, limit) {
  const schemes = await embedTextSchemes(config, query);
  const { vectors } = await screenVectors(config, schemes);
  return search(config, vectors, limit);
}

// The full warm-start seam: given the first user message, return the context
// block to inject (or an empty block when nothing is recalled).
export async function buildWarmContext(config, query, limit) {
  const results = await warmRecall(config, query, limit);
  return formatRecallBlock(results, limit);
}
