# ADR 0005 — Spec Target: Hypoc Core (+ RAG)

**Status**: Accepted  
**Date**: 2026-08-10

## Context

The repo contains two very different trajectories: the **hypoc core** memory platform (in motion: Git/AgentDB/MEMORY.md, 70 skills, 73 agents, vendored model router) and the **hypoc-face** enterprise program (auth, multi-tenant, SSO, RBAC, RAG service, cost router — fully planned in `docs/`, zero code running). Before running `to-spec` → `to-tickets`, a decision is needed: which build gets spec'd and ticketed now.

## Decision

The current spec/ticket cycle targets **hypoc core** only, including RAG.

- RAG lives inside hypoc core as the **hippocampus** layer (ADR 0003 request: multi-layer knowledge + RAG/Qdrant), specified as part of the memory platform — not as a separate enterprise service.
- The standalone `opencode-rag-local` prototype (working, in `/Users/pjherron17/dev/code/opencode/rag/`) is treated as the **seed implementation** for the hippocampus layer, not its own spec target.
- hypoc-face (IVAN) stays out of this cycle; its existing plans in `docs/` remain the reference for a future, separately-resourced effort.

## Primary Outcome

opencode is a **code support toolkit**. The "so that" is **intelligence**, two co-equal faces:

1. **Associational intelligence** — relating the current task to stored knowledge (retrieval, hippocampus RAG, task-aware model routing).
2. **Mnemonic intelligence** — remembering across sessions (archive/brain/interface).

Zero-friction recall UX serves this but is not central. Skills-on-demand (the 70-skill recruitment library) is a **mechanism** — part of how we get there — not an outcome in itself. The memory gap (AgentDB designed but not queryable) is the actual incomplete promise of the platform and must be what the spec proves end-to-end.

## Adopted External Infrastructure

The model router is **adopted external infrastructure**: provided by the vendored `opencode-model-router` plugin and accepted as-is, for now. The spec references it (associational routing already delivers capability) but does not rebuild it; remaining router verification lives in a single in-situ ticket, not a centerline thread.

## Mnemonic Centerline

The mnemonic spine is **capture → semantic recall**: the AgentDB embedding pipeline plus hippocampus retrieval, proven by a "recall a past decision from months ago" story. Session start/end automation is deliberately *not* the centerline — every session has a **cold start** problem (nothing to prime from until the user writes), so prior-history recall is the only thing that can warm a session; it must exist before start/end hooks have anything to load.

## Memory Seam

Hermeneutically, memory is **two linked stores**:

- **decision artifacts** — the *how*: markdown documents versioned in git (ADRs, `CONTEXT.md`, `MEMORY.md`, `docs/`). Markdown is the lingua franca of materialized decisions.
- **session records** — the *what*: conversations in the opencode session DB (rationale, dead-ends, context not reconstructable from git).

Recall works across the link: a session's materialized decisions (git markdown) and the conversation that produced them (session DB). The linking key (session ↔ decision artifact) is what makes a past session recallable in full.

**Decision distillation mechanism:** prompt-based extraction (`(a)`), run on the cheap tier of the adopted router. Rule-based extraction (`(b)`) is rejected as the mechanism — generalized rules are the decades-long failure mode of pre-2016 AI. Rules hold "grains of truth" but are not yet generalizable; noted as an open refinement for a later cycle, not engineered prematurely. Optional hybrid refinement is deferred until false-positive rates are observed.

**Distillation output:** the distilled product is written as a markdown **decision artifact** and committed to git (option `(2)`). Distillation is itself a decision-materialization step, so its output is markdown — the platform's lingua franca. Each artifact carries a `source-session: <id>` line, making the session↔artifact link explicit in the file rather than inferred. The agent for embedding is the committed markdown; the brain indexes it; version history is free via git.

**Embedder:** local, run on CPU (does not compete with the GPU-resident model), with a free-tier cloud embedder as a switchable alternative. The embedder is a seam, not a lock-in.

**Consolidation:** recall freshness runs on a **periodic batching model** — mirroring the human brain's nightly memory consolidation. A sweep (on-demand or scheduled) ingests the `memory/decisions/` directory, embeds new distilled artifacts, and indexes them into AgentDB. It is decoupled from git commit lifecycle and from session start/end hooks; you run it when you want recall fresh. The mnemonic centerline is therefore: capture → distill → write markdown artifact → (git) → periodic consolidate → retrieve via hippocampus.

**Retrieval surface:** a `/recall` slash command. Name deliberately chosen over `/remember` because "remember" is ambiguous between store and retrieve (a user might mean "save this" or "bring it back"); `recall` is unambiguously retrieval. It queries hippocampus and returns matching distilled artifacts with their `source-session` links. Automatic warm-start priming at session start is consciously deferred — explicit recall must be proven first.

**Distill triggers:** all three coexist. **(1)** per-session-close distillation (session-end hook) for immediate artifacts; **(2)** an explicit `/distill` command for manual control; **(3)** distill-on-consolidate — the periodic sweep distills any closed session lacking an artifact before embedding, acting as the backstop so nothing is ever left undistilled. The mnemonic write-path is therefore a single batched job with multiple dwell points.

## Consequences

- One coherent, spec-sizeable target: the memory platform's retrieval/recall capabilities plus the router work already delivered.
- The prototype gives the RAG work a head start; formalizing rather than reinventing.
- hypoc-face documentation is preserved untouched (kept for history), just not spec'd here.

## Related

- ADR 0002 (model router) — part of core, already delivered
- ADR 0003 (multi-layer knowledge) — the hippocampus RAG layer, spec'd in this cycle