# Platform Vision — Enterprise AI Developer Stack

## What We Are Building

A re-engineered, cloneable AI developer platform for small teams. Not a reorganization of existing files — an engineering effort that draws on a curated library of skills, agents, and prior architecture to produce something coherent and deployable.

## Who It Is For

Small development teams (initially 3 developers: one AI/data science expert, one data science quick-study, one PM/engineer with strong AI coding skills) doing complex, high-stakes technical work. The first use case is a SAS-to-Python/Java migration in pharma QC — but the platform is generic first.

## The Core Promise

A developer describes what they want to do in plain language. The platform figures out which skills and agents apply, notifies the user before invoking anything, and does the work — tracking cost and building a personalized model of how that developer works over time.

No skill names required to get started.

## Three Surfaces, One Library

| Surface | Component | Role |
|---|---|---|
| Terminal | `hypoc` | OpenCode CLI environment — primary for developer-native users |
| Browser | `hypoc-face` | Web UI — same capabilities, adds cost dashboard and session visualization |
| Plugin | TBD | IDE integration for developers who stay in their editor |

`enterprise-toolkit` packages all three for a new team to install as a unit.

## Model Routing — Four Tiers, Cheapest Capable First

1. **Local** — Ollama. Free, private, fast. Default for simple tasks and privacy-sensitive code.
2. **Self-hosted** — Team-hosted larger model. Free at point of use.
3. **GitHub Copilot** — $150/month client allocation. Used when local and self-hosted are insufficient.
4. **Premium hosted** — More powerful model, provider TBD.

Custom router built on OpenAI-compatible SDK (covers Ollama, Copilot, self-hosted) + Anthropic SDK. No LiteLLM.

Cost consumption tracked per session and surfaced visibly in the browser UI. This is the "wow moment" — the team sees their spend and controls it.

## Knowledge Architecture — Four Layers

- **PostgreSQL** — primary persistent memory: user profiles, session metadata, cross-session learning, shadow profiles.
- **Git** — code history + documentation corpus: specs, ADRs, session transcripts, assets. Primary RAG retrieval source.
- **SQLite** — local embedded: on-device session state, fast local queries.
- **Cloud storage (S3 or equivalent)** — TBD, for binary assets and large blobs.

## Skills and Agents

**Skills** = suggestion mode. AI proposes, developer decides. Triggered by intent, not slash commands.

**Agents** = execution mode. AI executes, developer reviews. Multi-step, autonomous.

Teams start with skills, graduate to agents as trust grows. Both modes coexist with no friction between them.

### Implicit Invocation

Intent-driven. The system detects what the user is trying to do and recruits relevant skills automatically. Before invoking, it presents a consent prompt:

> Skill detected: **[skill name]** — [one-line description]
> `[Accept]` `[Review skill]` `[Revise skill]` `[Decline]`

Explicit slash commands always available. Never the required path.

## User Shadow Profile

Each developer accumulates a personal configuration over time — the skills and agents most relevant to their work pattern, learned by observation rather than manual curation. Stored in PostgreSQL. Shapes what gets recruited and suggested on the next session.

## Recurring Developer Tasks the Platform Accelerates

- Codebase inventory and function cataloging
- Data type recommendations
- Execution optimization
- Replication / duplication detection
- Task and subtask management
- Code review
- Documentation generation
- Security review
- Test coverage analysis

## Second Pass — SAS Migration Overlay

Once the generic platform is stable, a domain overlay adds:
- SAS-to-Python/Java migration workflow
- Audit checkpoint extraction and mapping
- Operational fidelity verification (not byte-for-bit parity)
- Effort tracking per program for cost re-estimation across 33 remaining programs
- Pharma QC domain glossary (CONTEXT.md extension)

## What This Is Not

- A simple reorganization of existing files
- A wrapper around LiteLLM
- A system that requires users to learn skill names
- A formal GxP-validated system (though it must be buildable toward that)
