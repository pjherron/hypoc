// Config loading + strict validation. YAML-first, fails fast on any missing
// or malformed key. Reuses the RAG prototype's validation approach.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_PATH = path.join(__dirname, "..", "config.yaml");

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_DISTANCES = new Set(["Cosine", "Euclid", "Dot"]);
const ALLOWED_DATATYPES = new Set(["float32", "uint8", "float16", "turbo4"]);
const ALLOWED_EMBEDDER_TYPES = new Set(["ollama", "http"]);
const ALLOWED_SCREEN_RULES = new Set(["energy", "variance", "none"]);
const ALLOWED_SCHEME_SOURCES = new Set(["embedder", "lexical"]);
const ALLOWED_DISTILL_TYPES = new Set(["ollama", "http"]);

function requireObject(value, name) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Config ${name} must be an object.`);
  }
  return value;
}

function requireString(value, name) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Config ${name} must be a non-empty string.`);
  }
  return value;
}

function requireBoolean(value, name) {
  if (typeof value !== "boolean") {
    throw new Error(`Config ${name} must be a boolean.`);
  }
  return value;
}

function requireInt(value, name, { min, max } = {}) {
  if (!Number.isInteger(value)) {
    throw new Error(`Config ${name} must be an integer.`);
  }
  if (min !== undefined && value < min) {
    throw new Error(`Config ${name} must be >= ${min}.`);
  }
  if (max !== undefined && value > max) {
    throw new Error(`Config ${name} must be <= ${max}.`);
  }
  return value;
}

function requireUrl(value, name) {
  const url = requireString(value, name);
  try {
    new URL(url);
  } catch {
    throw new Error(`Config ${name} must be a valid URL.`);
  }
  return url;
}

function requireUuid(value, name) {
  const uuid = requireString(value, name).toLowerCase();
  if (!UUID_REGEX.test(uuid)) {
    throw new Error(`Config ${name} must be a valid UUID.`);
  }
  return uuid;
}

function requireIntFraction(value, name) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0 || value > 1) {
    throw new Error(`Config ${name} must be a number in (0, 1].`);
  }
  return value;
}

function ensureKey(obj, key, pathName) {
  if (!Object.prototype.hasOwnProperty.call(obj, key)) {
    throw new Error(`Config ${pathName} is required.`);
  }
  return obj[key];
}

export function validateConfig(raw) {
  const root = requireObject(raw, "root");

  const brain = requireObject(ensureKey(root, "brain", "brain"), "brain");
  const qdrantUrl = requireUrl(ensureKey(brain, "qdrant_url", "brain.qdrant_url"), "brain.qdrant_url");
  const collection = requireString(ensureKey(brain, "collection", "brain.collection"), "brain.collection");
  const nRecall = requireInt(ensureKey(brain, "n_recall", "brain.n_recall"), "brain.n_recall", { min: 1 });
  const nRecallMax = requireInt(
    ensureKey(brain, "n_recall_max", "brain.n_recall_max"),
    "brain.n_recall_max",
    { min: 1 },
  );
  if (nRecall > nRecallMax) {
    throw new Error("Config brain.n_recall must be <= brain.n_recall_max.");
  }

  const vectors = ensureKey(brain, "vectors", "brain.vectors");
  if (!Array.isArray(vectors) || vectors.length < 1) {
    throw new Error("Config brain.vectors must be a non-empty array of named-vector schemes.");
  }
  const vectorSchemes = [];
  const seenNames = new Set();
  for (const [index, vector] of vectors.entries()) {
    const prefix = `brain.vectors[${index}]`;
    const entry = requireObject(vector, prefix);
    const name = requireString(ensureKey(entry, "name", `${prefix}.name`), `${prefix}.name`);
    if (seenNames.has(name)) {
      throw new Error(`Config brain.vectors has duplicate scheme name "${name}".`);
    }
    seenNames.add(name);
    const size = requireInt(ensureKey(entry, "size", `${prefix}.size`), `${prefix}.size`, { min: 1 });
    const distance = requireString(ensureKey(entry, "distance", `${prefix}.distance`), `${prefix}.distance`);
    if (!ALLOWED_DISTANCES.has(distance)) {
      throw new Error(`Config ${prefix}.distance must be one of: ${Array.from(ALLOWED_DISTANCES).join(", ")}.`);
    }
    const datatype = requireString(ensureKey(entry, "datatype", `${prefix}.datatype`), `${prefix}.datatype`);
    if (!ALLOWED_DATATYPES.has(datatype)) {
      throw new Error(`Config ${prefix}.datatype must be one of: ${Array.from(ALLOWED_DATATYPES).join(", ")}.`);
    }
    const source = requireString(ensureKey(entry, "source", `${prefix}.source`), `${prefix}.source`);
    if (!ALLOWED_SCHEME_SOURCES.has(source)) {
      throw new Error(`Config ${prefix}.source must be one of: ${Array.from(ALLOWED_SCHEME_SOURCES).join(", ")}.`);
    }
    const onDisk = requireBoolean(ensureKey(entry, "on_disk", `${prefix}.on_disk`), `${prefix}.on_disk`);
    const screen = requireBoolean(ensureKey(entry, "screen", `${prefix}.screen`), `${prefix}.screen`);
    vectorSchemes.push({ name, size, distance, datatype, source, on_disk: onDisk, screen });
  }

  const screen = requireObject(ensureKey(brain, "screen", "brain.screen"), "brain.screen");
  const screenEnabled = requireBoolean(ensureKey(screen, "enabled", "brain.screen.enabled"), "brain.screen.enabled");
  const screenRule = requireString(ensureKey(screen, "rule", "brain.screen.rule"), "brain.screen.rule");
  if (!ALLOWED_SCREEN_RULES.has(screenRule)) {
    throw new Error(`Config brain.screen.rule must be one of: ${Array.from(ALLOWED_SCREEN_RULES).join(", ")}.`);
  }
  const keepFraction = requireIntFraction(
    ensureKey(screen, "keep_fraction", "brain.screen.keep_fraction"),
    "brain.screen.keep_fraction",
  );
  const screenRecalibrate = requireBoolean(
    ensureKey(screen, "recalibrate", "brain.screen.recalibrate"),
    "brain.screen.recalibrate",
  );
  const maskPath = requireString(ensureKey(screen, "mask_path", "brain.screen.mask_path"), "brain.screen.mask_path");

  const embedder = requireObject(ensureKey(root, "embedder", "embedder"), "embedder");
  const embedderType = requireString(ensureKey(embedder, "type", "embedder.type"), "embedder.type");
  if (!ALLOWED_EMBEDDER_TYPES.has(embedderType)) {
    throw new Error(`Config embedder.type must be one of: ${Array.from(ALLOWED_EMBEDDER_TYPES).join(", ")}.`);
  }
  const embedderUrl = requireUrl(ensureKey(embedder, "url", "embedder.url"), "embedder.url");
  const embedderModel = requireString(ensureKey(embedder, "model", "embedder.model"), "embedder.model");

  const distill = requireObject(ensureKey(root, "distill", "distill"), "distill");
  const distillType = requireString(ensureKey(distill, "type", "distill.type"), "distill.type");
  if (!ALLOWED_DISTILL_TYPES.has(distillType)) {
    throw new Error(`Config distill.type must be one of: ${Array.from(ALLOWED_DISTILL_TYPES).join(", ")}.`);
  }
  const distillUrl = requireUrl(ensureKey(distill, "url", "distill.url"), "distill.url");
  const distillModel = requireString(ensureKey(distill, "model", "distill.model"), "distill.model");
  const temperature = requireInt(ensureKey(distill, "temperature", "distill.temperature"), "distill.temperature", { min: 0 });
  const maxTokens = requireInt(ensureKey(distill, "max_tokens", "distill.max_tokens"), "distill.max_tokens", { min: 1 });

  const retry = requireObject(ensureKey(root, "retry", "retry"), "retry");
  const retryEnabled = requireBoolean(ensureKey(retry, "enabled", "retry.enabled"), "retry.enabled");
  const maxAttempts = requireInt(ensureKey(retry, "max_attempts", "retry.max_attempts"), "retry.max_attempts", { min: 1 });
  const backoffMs = requireInt(ensureKey(retry, "backoff_ms", "retry.backoff_ms"), "retry.backoff_ms", { min: 0 });
  const timeoutMs = requireInt(ensureKey(retry, "timeout_ms", "retry.timeout_ms"), "retry.timeout_ms", { min: 0 });

  const ids = requireObject(ensureKey(root, "ids", "ids"), "ids");
  const namespaceUuid = requireUuid(ensureKey(ids, "namespace_uuid", "ids.namespace_uuid"), "ids.namespace_uuid");

  const sweep = requireObject(ensureKey(root, "sweep", "sweep"), "sweep");
  const sweepDbPathRaw = ensureKey(sweep, "db_path", "sweep.db_path");
  if (typeof sweepDbPathRaw !== "string") {
    throw new Error("Config sweep.db_path must be a string (may be empty to use the default).");
  }
  const sweepDbPath = sweepDbPathRaw;
  const closedAfterMs = requireInt(
    ensureKey(sweep, "closed_after_ms", "sweep.closed_after_ms"),
    "sweep.closed_after_ms",
    { min: 0 },
  );
  const sweepStatePath = requireString(
    ensureKey(sweep, "state_path", "sweep.state_path"),
    "sweep.state_path",
  );

  const logging = requireObject(ensureKey(root, "logging", "logging"), "logging");
  const logLevel = requireString(ensureKey(logging, "level", "logging.level"), "logging.level");

  return {
    brain: {
      qdrant_url: qdrantUrl,
      collection,
      n_recall: nRecall,
      n_recall_max: nRecallMax,
      vectors: vectorSchemes,
      screen: {
        enabled: screenEnabled,
        rule: screenRule,
        keep_fraction: keepFraction,
        recalibrate: screenRecalibrate,
        mask_path: maskPath,
      },
    },
    embedder: {
      type: embedderType,
      url: embedderUrl,
      model: embedderModel,
    },
    distill: {
      type: distillType,
      url: distillUrl,
      model: distillModel,
      temperature,
      max_tokens: maxTokens,
    },
    retry: {
      enabled: retryEnabled,
      max_attempts: maxAttempts,
      backoff_ms: backoffMs,
      timeout_ms: timeoutMs,
    },
    ids: {
      namespace_uuid: namespaceUuid,
    },
    sweep: {
      db_path: sweepDbPath,
      closed_after_ms: closedAfterMs,
      state_path: sweepStatePath,
    },
    logging: {
      level: logLevel,
    },
  };
}

export async function loadConfig() {
  let contents;
  try {
    contents = await readFile(CONFIG_PATH, "utf-8");
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`Missing config file at ${CONFIG_PATH}: ${message}`);
  }

  let raw;
  try {
    raw = parse(contents);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    throw new Error(`Failed to parse YAML config at ${CONFIG_PATH}: ${message}`);
  }

  const config = validateConfig(raw);

  // Test hermeticity: allow the brain collection to be overridden so the test
  // suite never touches the production store. Only the collection name is
  // overridable — everything else stays validated.
  const override = process.env.HYPOC_MEMORY_COLLECTION;
  if (override) {
    config.brain.collection = override;
  }

  return config;
}
