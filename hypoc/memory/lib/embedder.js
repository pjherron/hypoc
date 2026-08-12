// Local CPU embedder, as a switchable seam. `type: ollama` is the default
// local runtime; `type: http` speaks the RAG prototype's FastAPI contract
// ({texts, normalize} -> {vectors}). Nothing else changes when switching.

import { fetchWithRetry } from "./util.js";

export async function embed(config, texts) {
  switch (config.embedder.type) {
    case "ollama":
      return embedOllama(config, texts);
    case "http":
      return embedHttp(config, texts);
    default:
      throw new Error(`Unsupported embedder type: ${config.embedder.type}`);
  }
}

async function embedOllama(config, texts) {
  const res = await fetchWithRetry(
    `${config.embedder.url}/api/embed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: config.embedder.model, input: texts }),
    },
    { retry: config.retry, operation: "embed" },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Embedder error (${res.status}): ${text}`);
  }
  const json = await res.json();
  const vectors = json.embeddings ?? json.vectors;
  if (!Array.isArray(vectors) || vectors.length !== texts.length) {
    throw new Error("Embedder returned an unexpected shape.");
  }
  return vectors;
}

async function embedHttp(config, texts) {
  const res = await fetchWithRetry(
    `${config.embedder.url}/embed`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts, normalize: true }),
    },
    { retry: config.retry, operation: "embed" },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Embedder error (${res.status}): ${text}`);
  }
  const json = await res.json();
  return json.vectors;
}
