# Hypoc Domain Glossary

Canonical terms for the hypoc platform. Keep this a glossary only — no specs, no implementation detail.

## Model Routing

- **preset** — a named binding of the tier set (`fast`/`medium`/`heavy`) to concrete models. The only thing `/preset` switches. A preset may span multiple providers (e.g. `hybrid`).
- **tier** — one of `fast`, `medium`, `heavy`. The task-cost bucket; determines which model handles a task.
- **provider** — the actual model service (Anthropic, OpenAI, Google, OpenRouter, Ollama, GitHub Copilot). Distinct from a preset: a single preset may route tiers across several providers.
- **routing** — the assignment of a task to a tier, decided from the `taskPatterns` taxonomy rather than hard-coded per task.
- **fallback** — re-dispatching a task through another preset's chain when the active provider fails.
- **delegation** — the orchestrator handing a subtask to a tiered subagent (`Task('fast'|'medium'|'heavy')`).

## Memory

- **archive** — Git as the immutable, versioned record of decisions and their history.
- **brain** — AgentDB, the vector store for semantic recall. The *store*. Distinct from `archive` (history) and `interface` (human-readable).
- **interface** — MEMORY.md, the human-authored timeline that tools read and update.
- **decision artifact** — a markdown document in git that materializes a decision: ADRs, `CONTEXT.md`, `MEMORY.md`, `docs/`. Markdown is the platform's lingua franca for materialized decisions.
- **session record** — the conversation stored in the opencode session DB: the *what* (rationale, dead-ends, context). Complementary to decision artifacts.
- **decision distillation** — the algorithm that reduces a session record to only what was **decided and agreed**, excluding missteps and pre-complete thoughts so they don't get equal footing in retrieval. The thing that makes a transcript a memory. Implemented as prompt-based extraction on a cheap router tier; rule-based extraction is explicitly *not* the mechanism (decades of rule-loyalty failure), though rule grains remain an ungeneralized future refinement. Its output is itself a markdown **decision artifact**, committed to git with a `source-session` link — distillation is a decision-materialization step. **Embedding is local** (CPU-runnable, so it doesn't compete for GPU with the loaded model), with a free-tier cloud embedder as a switchable alternative.
- **consolidation** — the periodic batch in which distilled decision artifacts are embedded and indexed into the brain. Mirrors the human brain's nightly memory consolidation ("memory palace"): a batched job, not per-utterance. Runs as a sweep over the artifacts directory (on-demand or scheduled), decoupled from git commits and session lifecycle.
- **recall** — the retrieval surface: a `/recall` slash command that queries hippocampus and returns matching distilled artifacts with their `source-session` links. Name chosen over `/remember` because "remember" is ambiguous between store and retrieve; `recall` is unambiguously retrieval (store-side verbs stay distinct). Automatic warm-start priming is a consciously deferred refinement, not part of the centerline.
- **distill trigger** — how distillation is initiated: **(1)** per-session-close distillation (session-end hook), **(2)** explicit `/distill` command, and **(3)** distill-on-consolidate (the periodic sweep distills any closed session lacking an artifact, then embeds). All three coexist; consolidate is the backstop that guarantees nothing is left undistilled.
- **hippocampus** — the associative-recall capability (ADR 0003): the RAG pipeline (chunk → embed → index → retrieve) that the `brain` store backs. One coin, two faces: brain is the store, hippocampus is the retrieval.
- **retrieval** — the act of pulling relevant memory/knowledge into working context, via `skill-recruitment`, `memory-retrieval`, or the hippocampus RAG layer.

## Program Scope

- **hypoc core** — the in-motion platform: memory layers, skill library, agent library, model routing. The current spec/ticket target.
- **hypoc-face** — the separate enterprise program (auth, multi-tenant, SSO, RBAC, monitoring). Fully planned in docs, zero code running; out of the current spec cycle.
- **knowledge source** — a document store that the hippocampus RAG layer indexes (skills, docs, commit history, MEMORY.md).
- **intelligence** — the primary outcome of the platform, for a code-support toolkit. Two co-equal faces:
  - **associational intelligence** — relating the current task to stored knowledge (retrieval, hippocampus RAG, model routing).
  - **mnemonic intelligence** — remembering across sessions (archive/brain/interface memory layers).
- **capability mechanism** — a how-do-we-get-there element (e.g. skills-on-demand), not an outcome in itself.
- **cold start** — a session with no prior context to draw from (first-ever session, or a fresh session before the user primes it). Resilience to cold start is the reason recall of prior history — not session priming — is the mnemonic centerline.
- **mnemonic centerline** — the primary delivery spine for mnemonic intelligence: capture → semantic recall (the AgentDB embedding pipeline + hippocampus retrieval), proven by retrieving a past decision without re-explaining. Session start/end automation consumes it later.
- **adopted external infrastructure** — a capability provided by a third-party tool, accepted into the platform as-is for now (the model router via `opencode-model-router`). In-scope for reference and verification, not for rebuilding.