# ADR 0003 — Multi-Layer Knowledge Architecture

## Status
Accepted

## Context
The platform needs to remember everything: session history, project knowledge, user behavior patterns, documentation, code, and assets. No single storage technology serves all these needs well. Git alone is insufficient for structured queries. A database alone loses the audit trail and document corpus that Git provides. A cloud object store alone has no relational capability.

## Decision
Four knowledge layers, each owning what it does best:

| Layer | Technology | Owns |
|---|---|---|
| Structured memory | **PostgreSQL** | User shadow profiles, session metadata, cross-session learning, relational queries, shadow profile evolution |
| Document corpus | **Git** | Code history, specs, ADRs, documentation, committed session transcripts, assets. Primary RAG retrieval source — checkout history is the timeline. |
| Local state | **SQLite** | On-device session state, fast local queries without a network hop. Existing opencode.db pattern. |
| Binary / large assets | **Cloud storage (S3 or equivalent)** | TBD. Not required for initial build. |

All four layers are queried together to answer "what do we know about X?" No layer is authoritative alone.

## Consequences
- PostgreSQL is a required service dependency (already present in `hypoc-face-core`).
- Git commits become a knowledge management action, not just a code management action. Documentation and session transcripts that should be retrievable must be committed.
- SQLite continues its existing role from OpenCode — no migration needed for local state.
- Cloud storage is deferred; the architecture must not assume it is present.
- RAG retrieval reads from Git working tree and history — no separate vector database required at MVP, though `agentdb-vector-search` is available for a future upgrade path.
