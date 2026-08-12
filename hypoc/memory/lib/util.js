// Reused mechanics from the RAG prototype (opencode-rag-local/lib/utils.js):
// fetchWithRetry, uuidV5, stableStringify. Ported unchanged in behavior.

import { createHash } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504]);

function isRetryableStatus(status) {
  return RETRYABLE_STATUS.has(status);
}

// A hung upstream (Ollama/Qdrant) must never block the sweep or a session's
// first request forever. When retry.timeout_ms > 0 every attempt is bounded;
// a caller-provided signal is respected and not overridden.
export async function fetchWithRetry(url, options, context) {
  const { retry, operation } = context;
  const retryEnabled = retry.enabled;
  const timeoutMs = Number.isFinite(retry.timeout_ms) ? retry.timeout_ms : 0;
  let attempt = 0;

  while (true) {
    attempt += 1;
    const init = timeoutMs > 0 && !options.signal
      ? { ...options, signal: AbortSignal.timeout(timeoutMs) }
      : options;
    try {
      const res = await fetch(url, init);
      if (
        !retryEnabled ||
        res.ok ||
        !isRetryableStatus(res.status) ||
        attempt >= retry.max_attempts
      ) {
        return res;
      }
    } catch (error) {
      if (!retryEnabled || attempt >= retry.max_attempts) {
        throw error;
      }
    }

    if (retryEnabled && retry.backoff_ms > 0) {
      await delay(retry.backoff_ms * attempt);
    }
  }
}

function uuidToBytes(uuid) {
  const hex = uuid.replace(/-/g, "");
  const bytes = Buffer.from(hex, "hex");
  if (bytes.length !== 16) {
    throw new Error("Invalid UUID length.");
  }
  return bytes;
}

function bytesToUuid(bytes) {
  const hex = Buffer.from(bytes).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function uuidV5(name, namespaceUuid) {
  const namespaceBytes = uuidToBytes(namespaceUuid);
  const hash = createHash("sha1");
  hash.update(Buffer.from(namespaceBytes));
  hash.update(name);
  const bytes = hash.digest();
  bytes[6] = (bytes[6] & 0x0f) | 0x50;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytesToUuid(bytes);
}

export function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  const entries = keys.map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
  return `{${entries.join(",")}}`;
}
