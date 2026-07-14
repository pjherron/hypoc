# Domain Glossary

## Operational Fidelity
The acceptance criterion for a migrated program. The migrated system must do the same job in production — reports are correct, QC checkpoints produce trustworthy outputs. Does **not** mean bit-for-bit numerical parity with SAS output (SAS and Python handle data differently and exact parity is not required).

## Conclusionary Report
A terminal, manager-facing output produced by a SAS program. One of two categories of SAS output.

## Audit Checkpoint
An intermediate output extracted at a specific point in a SAS program's execution, used to QC the system being monitored. One of two categories of SAS output. Many checkpoints may exist in a single program.

## Pilot Migration
The migration of 3 SAS programs, completed as real working migrations, serving dual purpose: (1) proving the AI-assisted migration workflow, (2) generating effort/complexity data to re-estimate the cost of migrating the remaining 33 SAS programs.

## Model Routing Tiers
Three-tier cost routing strategy, cheapest-capable first:
1. **Local** — Ollama / local models. Free, private, fast. Default for simple tasks and privacy-sensitive code.
2. **Self-hosted LLM** — Team-hosted larger model. Free at point of use (infrastructure cost is separate).
3. **GitHub Copilot** — $150/month client allocation. Used when local and self-hosted are insufficient.

4. **Premium hosted** — A more powerful model above Copilot tier, provider TBD. Router must be extensible to slot this in without redesign.

Cost consumption must be tracked and visible inside the application UI.

## Suggestion Mode vs Execution Mode
Two operating modes the stack must support, matching team adoption maturity:
- **Suggestion mode** — AI proposes, developer decides. Maps to skills (triggered, constrained, predictable).
- **Execution mode** — AI executes, developer reviews after. Maps to agents (autonomous, multi-step).
Teams transition from suggestion → execution as trust grows. Both modes must coexist.

## Implicit Skill Invocation
Users must never need to know a skill's name to benefit from it. The system observes intent from natural language and recruits relevant skills automatically. Before invoking, it notifies the user with a consent prompt offering four choices: **accept** / **review skill** / **revise skill** / **decline**. Explicit slash commands are always available for power users but are never the required entry point. This is the bootstrapping principle — the first interaction must work with zero prior knowledge of the skill library.

## UX Surface
Three delivery surfaces, all supported:
- **CLI** (`hypoc`) — OpenCode terminal environment, primary for developer-native users.
- **Browser UI** (`hypoc-face`) — web-based interface for the same capabilities.
- **Plugin** — IDE or tool plugin for those who prefer to stay in their editor.
`enterprise-toolkit` is the packaging layer that bundles all three for a new team to install as a unit.

## Knowledge Repository
Multi-layer persistent knowledge — no single store owns everything:
- **PostgreSQL** — primary persistent memory: structured data, user shadow profiles, session metadata, cross-session learning, relational queries.
- **Git** — code history and documentation corpus: assets, specs, ADRs, session transcripts committed to repo. Serves as the RAG retrieval source for project knowledge.
- **SQLite** — local embedded store: on-device session state, fast local queries (OpenCode already uses this pattern via opencode.db).
- **Cloud storage (S3 or equivalent)** — TBD; possible future layer for binary assets, large blobs.
All layers are queried together to answer "what do we know about X?" — no layer is authoritative alone.

## User Shadow Profile
Each developer accumulates a personal profile over time: the skills and agents most relevant to their work patterns get assembled into a per-user model. The profile evolves as the user works — it is not manually curated upfront. Purpose: personalized AI configuration that reflects how that person actually works.

## Migration Target
The set of programs to be migrated: primarily SAS→Python, some SAS→Java, some KSH→a replacement language (TBD), and new Postgres data handling/serving work. All pharma QC domain.
