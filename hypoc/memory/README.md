# hypoc memory

Mnemonic centerline for hypoc core (ADR 5): capture → distill → committed decision artifact → embed → recall. Decisions made in past sessions become recallable without being commanded — the brain surfaces them on its own.

## The seam

The single contract is the read path **`recall(query) → artifacts`** (with each artifact's `source-session` link), surfaced automatically on a session's first user message (**warm-start**, primary surface) and manually via `/recall` (escape hatch). A passing recall test is proof the whole write path ran — garbage distillation yields wrong-or-empty recall. Internals (store, embedder, dims, masks) are never asserted; tests drive the CLIs only.

## Pipeline

1. **Distill** — a session record is extracted by the cheap router tier (Ollama `qwen3.5:latest`, per bmxoc's roster). No decision → `NO_DECISION` (recorded, not retried forever).
2. **Committed artifact** — the decision is written as markdown with a `source-session:` line and committed to git.
3. **Embed every scheme** — each configured scheme is a named vector, ≤8-bit per dimension, full-precision copy dropped at storage:
   - `content` — stock embedder output (nomic-embed-text, `turbo4` 4-bit).
   - `lexical` — deterministic hashed char n-grams (`uint8`), a post-inference transform; **no new model is trained**.
   Schemes are optional named vectors in Qdrant, so appending one never rebuilds unrelated points.
4. **Screen** — a deterministic per-corpus rule (default: energy concentration) computes a mask per scheme and zeroes the non-information-bearing tail. The screened representation is the stored one. Rule is configurable and recalibratable per corpus via `bun bin/reindex.js --recalibrate`.
   - **Scope boundary:** screening here is a query-*independent*, corpus-derived mask — a deterministic stand-in for the technique's original form, first demonstrated in an internal white paper (Aon, 2021; P. Herron & C. Mirabzadeh). The cited published work is independent, later validation of the same core finding (DIME, Faggioli et al., SIGIR'24; TOIS 2025; "Unveiling DIME," SIGIR'25 — dimension pruning as a denoising mechanism that preserves ranking; EMNLP 2025 — removing ~50% of dims leaves retrieval largely intact). What this implementation proves is the seam: recall quality holds on screened vectors. It does not implement the stronger query-*aware* variants (DIME-style per-query masks).
5. **Index** — screened vectors upsert into the brain (Qdrant `hypoc_memory`).

## Commands

| Command | What it does |
|---|---|
| `bun bin/distill.js <fixture.json>` | Distill a session fixture (test seam) |
| `bun bin/distill-session.js <session-id> [--db path]` | Distill a named closed session from the DB now (`/distill`) |
| `bun bin/recall.js <query> [--limit N]` | Recall top-n artifacts (Miller default 5, ceiling 9) |
| `bun bin/warmstart.js "<first message>"` | Print the block the plugin would inject |
| `bun bin/sweep.js [--db path] [--state path] [--dry-run] [--closed-after ms]` | Periodic consolidate over the opencode session DB |
| `bun bin/consolidate.js` | (legacy) sweep over `fixtures/` |
| `bun bin/reindex.js [--recalibrate] [--scheme NAME]` | Re-embed committed artifacts; recalibrate masks |
| `bun bin/reset.js` | Drop the brain collection |

Opcodes: `hypoc-recall`, `hypoc-sweep`, `hypoc-distill-session`, `hypoc-warmstart`, `hypoc-reindex`, `hypoc-reset`.

## The sweep (T2)

`bin/sweep.js` reads **real** sessions from the opencode session DB (read-only), selects closed sessions lacking a distilled artifact, runs distill → commit → embed for each, and tracks progress in a state file (`sweep.state_path`) so nothing is distilled twice. Sessions that already have an artifact (e.g. via `/distill`) are still indexed (the distill-on-consolidate backstop) so no closed session is ever unrecollectable. Run on demand or schedule; decoupled from git and session lifecycle.

## Opencode integration

- Commands: `/recall` and `/distill` in `.opencode/commands/` — thin wrappers over the CLIs above.
- Warm-start plugin: `memory/plugin/` registers `chat.message` (start recall on the first user message) + `experimental.chat.system.transform` (inject the block once). Registered in `hypoc/.opencode/.hypoc.json` as `../memory/plugin`.

## Prerequisites

- Qdrant (default `http://localhost:6333`) and Ollama (`nomic-embed-text` + the distill model) running.
- `bun` (tests use `bun test`).

## Tests

`bun test` — seam-level, external behavior only. Seeds: `bun run seed:session-db` regenerates `fixtures/session-db.sqlite3` (the fixture DB for the sweep tests) in the real opencode schema.
