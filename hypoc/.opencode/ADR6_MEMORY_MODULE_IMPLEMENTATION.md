# ADR 0006 — Memory Module Implementation (Mnemonic Centerline)

**Status**: Accepted
**Date**: 2026-08-11

## Context

ADR 0005 spec'd the mnemonic centerline for hypoc core: **capture → distill → write markdown decision artifact (git) → periodic consolidate → retrieve via hippocampus**, with the read-path contract `recall(query) → artifacts` surfaced as `/recall` as the platform's single seam, and automatic warm-start as the behavioral seam. The ticket set (T1–T5, issues #2–#6) was implemented. This ADR records the shape of that implementation so the decisions behind the shipped module are recoverable by a fresh context.

## Decision

The mnemonic centerline is implemented as a self-contained `hypoc/memory` module, test-driven from the CLI against external behavior only (no internals asserted), proven at the seam by recall tests.

### Architecture

- **Session record source**: the opencode session DB (SQLite, read-only). `lib/session-db.js` wraps open/session-list/closed-session classification; the standard DB path is resolved via config, `$OPENCODE_DB`, or the platform default.
- **Distillation**: prompt-based extraction (`lib/distill.js`) run against the adopt-model-router cheap tier (Ollama `phi4` by default in this environment). A session with no decision produces `NO_DECISION` — never a garbage artifact.
- **Decision artifact**: committed markdown with a `source-session: <id>` line, stored under `memory/decisions/`. Git versioning is free; the link is explicit in the file rather than inferred.
- **Embedding**: local CPU embedder (`nomic-embed-text` via Ollama), producing named vectors ≤8-bit per dim (`turbo4`), full-precision copy dropped.
- **Screening**: per-corpus, query-independent energy-concentration mask computed by `bin/reindex.js --recalibrate`; configurable, recalibratable, and never asserted internally. A deterministic stand-in for the concept's published form; the cited DIME/EMNLP line is independent validation.
- **Brain store**: Qdrant collection `hypoc_memory` (`lib/brain.js`), named vectors per scheme (content + lexical), Miller-bounded retrieval (default n≈5).
- **Write paths**: `bin/distill-session.js` (explicit `/distill`), `bin/sweep.js` (periodic consolidation — distill-on-consolidate backstop), `bin/consolidate.js` (legacy fixtures sweep).
- **Read paths**: `bin/recall.js` (`/recall`), `bin/warmstart.js` (first-message query), plus an opencode plugin (`memory/plugin/`) registered in `.hypoc.json` that fires `chat.message` + `experimental.chat.system.transform` to auto-inject the top-n artifacts unsummoned.

### Idempotency and state

- The sweep tracks processed sessions in a JSON state file (`config sweep.state_path`); nothing is distilled twice, no closed session is left unrecollectable.
- The existing-artifact backstop indexes a session's already-committed artifact and **persists state** for it, so confirmed-existing sessions are not re-candidates on later runs.
- Tests are rerun-safe: the suite passes on consecutive runs (fresh distill vs. confirmed-existing both accepted).

## Consequences

- The seam is proven: fixture-inspired queries recall artifacts with `source-session` links; garbage distillation yields wrong-or-empty recall; recall quality holds on screened vectors.
- 18 tests, all green on consecutive runs, driving the CLIs from outside — internals (store, embedder, dimensions, masks) never asserted.
- Sweep runs on demand or scheduled, decoupled from git and session lifecycle; real history is recallable once swept.

## Related

- ADR 0005 — Spec Target: Hypoc Core (+ RAG)
- ADR 0002 — model router (distillation cheap tier)
- ADR 0003 — multi-layer knowledge / hippocampus RAG layer
