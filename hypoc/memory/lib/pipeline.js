// The mnemonic spine: distill a session -> write a committed decision artifact
// (markdown, `source-session` line) -> embed every scheme (local CPU + post-
// inference transforms) -> screen to the information-bearing core -> index into
// the brain as named <=8-bit vectors.

import { mkdir, writeFile, readdir, readFile, unlink } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";
import { embed } from "./embedder.js";
import { indexArtifact } from "./brain.js";
import { lexicalVector } from "./vectors.js";
import { screenVectors, calibrateMasks, loadMasks, saveMasks } from "./screen.js";
import { distillSession, readFixture } from "./distill.js";

const execFileAsync = promisify(execFile);

export function repoRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
}

export function decisionsDir() {
  return path.join(repoRoot(), "memory", "decisions");
}

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "decision";
}

export function renderArtifact(decision) {
  const topics = decision.topics.length
    ? decision.topics.map((topic) => `"${topic.replace(/"/g, '\\"')}"`).join(", ")
    : "";
  const alternatives = decision.alternatives.length
    ? `\n## Alternatives considered\n\n${decision.alternatives.map((alt) => `- ${alt}`).join("\n")}`
    : "";
  return `---
type: decision
source-session: ${decision.source_session}
date: ${decision.date}
topics: [${topics}]
title: "${decision.title.replace(/"/g, '\\"')}"
---

# ${decision.title}

## Decision

${decision.decision}

## Rationale

${decision.rationale || "—"}${alternatives}
`;
}

async function gitAddCommit(artifactPath, message) {
  const root = repoRoot();
  const rel = path.relative(root, artifactPath);
  try {
    await execFileAsync("git", ["-C", root, "add", "--", rel]);
    const status = await execFileAsync("git", ["-C", root, "status", "--porcelain", "--", rel]);
    if (!status.stdout.trim()) {
      return { committed: false, reason: "unchanged" };
    }
    await execFileAsync("git", ["-C", root, "commit", "-m", message, "--", rel]);
    return { committed: true };
  } catch (error) {
    const detail = error?.stderr ?? error?.message ?? "unknown";
    throw new Error(`git commit failed for ${rel}: ${detail}`);
  }
}

// Compute every configured scheme's vector for a text. Embedder-backed schemes
// share the single stock-embedder output; lexical schemes are computed as a
// post-inference transform (no new model trained).
export async function embedTextSchemes(config, text) {
  const embedderSchemes = config.brain.vectors.filter((vector) => vector.source === "embedder");
  const lexicalSchemes = config.brain.vectors.filter((vector) => vector.source === "lexical");

  let embedderVector = null;
  if (embedderSchemes.length > 0) {
    [embedderVector] = await embed(config, [text]);
  }

  const schemes = {};
  for (const vector of embedderSchemes) {
    schemes[vector.name] = embedderVector;
  }
  for (const vector of lexicalSchemes) {
    schemes[vector.name] = lexicalVector(text, vector.size);
  }
  return schemes;
}

export async function embedDecision(config, decision) {
  const text = [decision.title, decision.decision, decision.rationale, ...decision.topics]
    .filter(Boolean)
    .join("\n\n");
  const schemes = await embedTextSchemes(config, text);
  return { text, schemes };
}

// Screen scheme vectors with the stored corpus masks (identity if uncalibrated).
export async function screenDecision(config, schemes) {
  const { vectors, calibrated } = await screenVectors(config, schemes);
  return { vectors, calibrated };
}

export function toRepoPath(artifactPath) {
  return path.relative(repoRoot(), artifactPath);
}

async function exists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function indexDecision(config, decision, artifactPath, { scheme } = {}) {
  const { text, schemes } = await embedDecision(config, decision);
  const targetSchemes = scheme
    ? { [scheme]: schemes[scheme] }
    : schemes;
  const { vectors, calibrated } = await screenVectors(config, targetSchemes);
  warnUncalibrated(config, calibrated);
  const id = await indexArtifact(config, {
    artifactPath: toRepoPath(artifactPath),
    title: decision.title,
    sourceSession: decision.source_session,
    date: decision.date,
    text,
    vectors,
  });
  return id;
}

// Index an already-committed artifact (the distill-on-consolidate backstop: a
// manually-distilled session still gets embedded and made recallable).
export async function indexArtifactFile(config, artifactPath) {
  const artifact = await readArtifact(artifactPath);
  const text = `${artifact.title}\n\n${artifact.body}`;
  const schemes = await embedTextSchemes(config, text);
  const { vectors, calibrated } = await screenVectors(config, schemes);
  warnUncalibrated(config, calibrated);
  const id = await indexArtifact(config, {
    artifactPath: toRepoPath(artifactPath),
    title: artifact.title,
    sourceSession: artifact.source_session,
    date: artifact.date,
    text,
    vectors,
  });
  return id;
}

// Screening silently degrading to identity is the dangerous case: stored
// vectors would be unscreened while everything claims screening is on. Surface
// it loudly rather than swallowing it.
function warnUncalibrated(config, calibrated) {
  if (calibrated) return;
  const masked = config.brain.vectors.some((vector) => vector.screen);
  if (masked) {
    console.warn(
      "[memory] screening is configured but NOT calibrated — vectors stored unscreened. " +
        "Run `bun bin/reindex.js --recalibrate` to compute corpus masks.",
    );
  }
}

// Read a committed decision artifact: parse frontmatter (title, source-session,
// topics, date) plus the markdown body.
export async function readArtifact(artifactPath) {
  const raw = await readFile(artifactPath, "utf-8");
  // Normalize CRLF -> LF: committed artifacts use LF, but Windows checkouts
  // with core.autocrlf=true rewrite them to CRLF, which the frontmatter
  // regex (anchored on literal \n) would otherwise fail to match.
  const text = raw.replace(/\r\n/g, "\n");
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`Artifact ${artifactPath} is missing frontmatter.`);
  }
  const frontmatter = parse(match[1]);
  return {
    title: frontmatter.title ?? "untitled",
    source_session: frontmatter["source-session"] ?? "unknown",
    date: frontmatter.date ?? "",
    topics: Array.isArray(frontmatter.topics) ? frontmatter.topics : [],
    body: match[2].trim(),
  };
}

// Committed artifacts: only files actually tracked in git. A file written but
// never committed (e.g. a commit failure) must NOT be treated as a committed
// artifact — otherwise the backstop would launder a failed commit into
// "existing" and never retry the commit.
export async function committedArtifacts() {
  const dir = decisionsDir();
  let tracked = [];
  try {
    const { stdout } = await execFileAsync("git", ["-C", repoRoot(), "ls-files", "--", "memory/decisions"]);
    tracked = stdout.split("\n").filter(Boolean);
  } catch {
    // Not a git checkout (unusual): fall back to a plain directory scan so the
    // module still works standalone.
    tracked = (await readdir(dir).catch(() => [])).filter((file) => file.endsWith(".md"));
  }
  return tracked.map((rel) => path.join(repoRoot(), rel));
}

// The artifact (if any) whose `source-session` link points at this session.
export async function artifactForSession(sessionId) {
  for (const file of await committedArtifacts()) {
    const artifact = await readArtifact(file);
    if (artifact.source_session === sessionId) return file;
  }
  return null;
}

// Recompute the per-scheme screening masks over the whole committed corpus.
// Returns { name: { size, rule, keep_fraction, mask } } for screened schemes.
export async function recalibrateScreen(config) {
  const artifacts = await committedArtifacts();
  const corpus = {};
  for (const vector of config.brain.vectors) {
    corpus[vector.name] = [];
  }
  for (const artifactPath of artifacts) {
    const artifact = await readArtifact(artifactPath);
    const text = `${artifact.title}\n\n${artifact.body}`;
    const schemes = await embedTextSchemes(config, text);
    for (const [name, vector] of Object.entries(schemes)) {
      corpus[name].push(vector);
    }
  }
  const masks = await calibrateMasks(config, corpus);
  await saveMasks(config, masks);
  return masks;
}

// Re-index committed decision artifacts without re-distilling. The artifacts
// stay authoritative; only the embedded representation is refreshed.
// - `recalibrate`: recompute the screening masks over the corpus first.
// - `scheme`: reindex only the named scheme (decoupled per-scheme operation).
export async function reindexCommitted(config, { recalibrate = false, scheme } = {}) {
  if (recalibrate || config.brain.screen.recalibrate) {
    await recalibrateScreen(config);
  }
  const masks = await loadMasks(config);
  const artifacts = await committedArtifacts();
  const results = [];
  for (const artifactPath of artifacts) {
    const artifact = await readArtifact(artifactPath);
    const text = `${artifact.title}\n\n${artifact.body}`;
    const schemes = await embedTextSchemes(config, text);
    const targetSchemes = scheme ? { [scheme]: schemes[scheme] } : schemes;
    const { vectors } = await screenVectors(config, targetSchemes);
    const rel = toRepoPath(artifactPath);
    const id = await indexArtifact(config, {
      artifactPath: rel,
      title: artifact.title,
      sourceSession: artifact.source_session,
      date: artifact.date,
      text,
      vectors,
    });
    results.push({
      artifact_path: rel,
      source_session: artifact.source_session,
      id,
    });
  }
  return { results, masks };
}

// Write + commit a decision artifact. The filename is date + slug(title); two
// sessions on the same date with the same normalized title must not silently
// overwrite each other — disambiguate with a numeric suffix. If the git commit
// fails, the file is removed so the backstop can never mistake it for a
// committed artifact.
export async function writeDecisionArtifact(config, decision) {
  const dir = decisionsDir();
  await mkdir(dir, { recursive: true });
  const baseName = `${decision.date}-${slugify(decision.title)}`;
  let artifactPath = path.join(dir, `${baseName}.md`);
  let suffix = 2;
  while (await exists(artifactPath)) {
    const existing = await readArtifact(artifactPath).catch(() => null);
    // Same source-session -> re-distillation of the same decision: overwrite.
    if (existing && existing.source_session === decision.source_session) break;
    artifactPath = path.join(dir, `${baseName}-${suffix}.md`);
    suffix += 1;
  }
  const markdown = renderArtifact(decision);
  await writeFile(artifactPath, markdown, "utf-8");
  try {
    await gitAddCommit(
      artifactPath,
      `decision: ${decision.title} (source-session ${decision.source_session})`,
    );
  } catch (error) {
    await unlink(artifactPath).catch(() => {});
    throw error;
  }
  return artifactPath;
}

// Distill a session record, write + commit the artifact, then embed and index.
// A record is { session: { id, time_created, ... }, messages: [...] } — the
// shape produced by the fixture reader or the session-DB reader. Returns
// { status: "indexed" }, { status: "no_decision", reason }, or
// { status: "failed", reason } for a retryable model/parse failure.
export async function processRecord(config, record) {
  const decision = await distillSession(config, record);
  if (decision.failed) {
    return { status: "failed", reason: decision.reason, source_session: record.session?.id ?? "unknown" };
  }
  if (decision.no_decision) {
    return { status: "no_decision", reason: decision.reason, source_session: record.session?.id ?? "unknown" };
  }
  const artifactPath = await writeDecisionArtifact(config, decision);
  await indexDecision(config, decision, artifactPath);
  return {
    status: "indexed",
    artifact_path: path.relative(repoRoot(), artifactPath),
    source_session: decision.source_session,
    title: decision.title,
  };
}

// Distill one fixture file (JSON session record) through the full spine.
export async function processFixture(config, fixturePath) {
  const fixture = await readFixture(fixturePath);
  return processRecord(config, fixture);
}
