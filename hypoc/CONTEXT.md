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
- **brain** — AgentDB, the vector store for semantic recall. Distinct from `archive` (history) and `interface` (human-readable).
- **interface** — MEMORY.md, the human-authored timeline that tools read and update.