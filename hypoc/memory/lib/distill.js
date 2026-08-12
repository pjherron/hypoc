// Decision distillation: prompt-based extraction on the cheap tier of the
// adopted model router (Ollama in this environment). Rules are not used as the
// mechanism — extraction is an LLM call. Output is a structured decision
// object, or `no_decision` for transcripts with no decision.

import { readFile } from "node:fs/promises";
import { fetchWithRetry } from "./util.js";

const DISTILL_SYSTEM = `You are a decision distiller for a personal knowledge system.
Extract the decision made in the given session transcript.

Respond with ONLY a single JSON object. No markdown fences, no commentary.
Schema:
{
  "title": string,
  "decision": string,
  "rationale": string,
  "alternatives": string[],
  "topics": string[]
}

Rules:
- "decision" is one or two sentences stating what was decided.
- "alternatives" are the options that were considered and not chosen.
- "topics" are 2-4 short domain keywords.
- If the transcript contains NO decision, respond with exactly:
  {"no_decision": true, "reason": "..."}`;

export async function readFixture(fixturePath) {
  const raw = await readFile(fixturePath, "utf-8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Fixture ${fixturePath} is not valid JSON: ${error.message}`);
  }
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Fixture ${fixturePath} must be a JSON object.`);
  }
  return parsed;
}

export function fixtureTranscript(fixture) {
  const messages = fixture.messages ?? [];
  return messages
    .map((message) => {
      const parts = Array.isArray(message.parts)
        ? message.parts
        : [{ type: "text", text: message.content ?? "" }];
      const text = parts
        .map((part) => part.text ?? part.content ?? "")
        .filter((part) => part && part.trim())
        .join("\n");
      return `${message.role ?? "?"}: ${text}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

function extractJson(content) {
  const trimmed = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(content.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

export function parseDecision(content, fixture) {
  const parsed = extractJson(content);
  if (!parsed || typeof parsed !== "object") {
    return { no_decision: true, reason: "unparseable distill output" };
  }
  if (parsed.no_decision) {
    return { no_decision: true, reason: parsed.reason ?? "model reported no decision" };
  }
  const title = (parsed.title ?? "").trim();
  const decision = (parsed.decision ?? "").trim();
  if (!title || !decision) {
    return { no_decision: true, reason: "distill output missing title or decision" };
  }
  return {
    title,
    decision,
    rationale: (parsed.rationale ?? "").trim(),
    alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives.filter((a) => typeof a === "string") : [],
    topics: Array.isArray(parsed.topics) ? parsed.topics.filter((t) => typeof t === "string") : [],
    // Authoritative: the source-session link comes from the fixture, never the model.
    source_session: fixture.session?.id ?? "unknown",
    date: (fixture.session?.time_created ?? "").slice(0, 10),
  };
}

export async function distillSession(config, fixture) {
  const transcript = fixtureTranscript(fixture);
  const sessionId = fixture.session?.id ?? "unknown";
  const res = await fetchWithRetry(
    `${config.distill.url}/chat/completions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: config.distill.model,
        messages: [
          { role: "system", content: DISTILL_SYSTEM },
          {
            role: "user",
            content: `Session id: ${sessionId}\n\nTranscript:\n${transcript}`,
          },
        ],
        temperature: config.distill.temperature,
        max_tokens: config.distill.max_tokens,
      }),
    },
    { retry: config.retry, operation: "distill" },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Distill error (${res.status}): ${text}`);
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? "";
  return parseDecision(content, fixture);
}
