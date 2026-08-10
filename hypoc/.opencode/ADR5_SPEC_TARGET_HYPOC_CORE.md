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

**Scheme-append embedding (the seam's core):** the brain's vectors follow a trade-secreted technique long used industrially: **append different vector schemes as named vectors, then discard non-information-bearing dimensions in a near-cost-free pruning step.** Appending is a first-class Qdrant capability (named vectors per point, each with its own size/distance/datatype); pruning is a post-append information-content pass. The actionable rule: **append breadth, then prune to the information-bearing core.** This supersedes "pick one embedder, dim follows" — the space is built by scheme-append, not chosen. Datatypes stay ≤8-bit per dim (`uint8`, with `turbo4` 4-bit as the documented lever if storage tightens); the full-precision copy is dropped. The embedder seam (local/CPU local, free-tier cloud as switchable alternative) remains as specified. The prototype seed used a single 384-dim float32 embedder; the brain supersedes it with the scheme-append design.

**No new model is trained.** Pruning is *post-inference*: a fast, deterministic transform on the stock embedder's outputs — no re-training, no gradient loop. This is what makes breadth-first appending industrially cheap: the technique sits after inference and operates at transform speed.

**Pruning is an empirical, metric-driven judgment** — not a derived static rule nor a fixed threshold. In its industrial origin, information-bearing dims were determined by subjecting the appended schemes to a suite of retrieval metrics across several outcomes (e.g., time-to-best-result on a needle-in-haystack task), using a proprietary retrieval metric (internally published) that corrects defects in mainstream retrieval yardsticks. The spec must treat the screening rule as **configurable and empirically recalibrated per corpus**, not hard-coded; whether the full metric suite can be rerun in the platform's context remains an open question, and the proprietary metric's specifics are out of scope for the spec (preserved, not over-exposed).

**The seam:** a *contract boundary* that is observable (a complete behavior is verified at it; internals never inspected) and replaceable (everything behind it — store, embedder, pruning rule, dims — is swappable as long as the contract holds). **The platform's single seam is the read-path contract `recall(query) → artifacts`, surfaced as `/recall`.** It is the highest point (consumes the whole mnemonic spine), crisp (deterministic observable success: the right artifact returns with its `source-session` link), and subsumes the write path — garbage distillation yields wrong/empty recall, so a passing recall test on a real session is proof the entire capture→distill→consolidate→embed→screen→retrieve pipeline ran correctly. The write path (`/distill`, consolidation) is the *input path* every recall test traverses, not a second seam. Acceptance criteria for the ticket set are written against recall behavior, never against internals.

**Immediation beats hypermediation (the retreat from manual recall).** Forcing the user to remember and issue `/recall` fails the primary outcome: a memory the user must command into existence is not intelligence — it is a glorified grep. From remediation theory (Bolter & Grusin), the platform must move from *hypermediation* (user over-experiences the interface) to *immediacy* (tool merges into the mind); it must never be thick for the user. Therefore the **behavioral seam is automatic warm-start**: after the user's first message, hippocampus auto-queries with that content and injects top-K relevant distilled artifacts into context — memory surfaces *unsummoned*, arriving as the user begins, before they know it exists. Timing resolves the cold-start truth (nothing to recall before the first message exists). `/recall` remains only a manual escape hatch, not the seam.

**Human-limited recall (Miller bound).** The number *n* of artifacts surfaced is a decision criterion **defined by human working-memory limits**, not by what the index can return. The register (Miller's magical number 7±2; the same Miller who built WordNet): people do well with **2, 3, 5** choices, some manage 7, and **9 is the hard ceiling** of the cognitive register. So n defaults toward the low end — never toward 9 — and the surface stays immediate, never thick. This is the 2004-originated, human-limits principle behind industrial scheme-appending, and the anti-Blei-et-al. stance — never hand the user a million topics to contend with.

**No topic modeling in this cycle.** The platform is explicitly **not** doing clustering/categorization now; that machinery is a *later* lever for RAG search and bootstrapping knowledge in larger collections. The assumption is **complete immediacy**: the user is never handed a taxonomy, cluster menu, or category list — recall surfaces only the relevant artifacts, in a human-limited handful.

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