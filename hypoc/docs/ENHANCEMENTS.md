# Hypoc: OpenCode with Memory

OpenCode agents that remember.

Most AI coding sessions start from zero. Every time. You explain the context, the patterns, the decisions you made last week. Again.

Hypoc fixes that.

## The Problem

Your AI agent has no memory:

- "We solved this auth bug before" → agent does not remember
- "Use the pattern from last sprint" → agent asks which pattern
- "Why did we choose postgres?" → agent has no context

Every session is groundhog day.

## The Solution

Hypoc adds persistent, intelligent memory to OpenCode. Three complementary layers work together:

### 1. Git — The Archive

Every decision, milestone, and pattern is a commit. Immutable. Versioned. Auditable.

```bash
git log --grep="auth" --all --oneline
# Shows every auth-related decision across all branches
```

**What it does:** Stores everything. Forever. With full history.

### 2. AgentDB — The Brain

HNSW vector database. Semantic search that finds related memories by meaning, not keywords.

```bash
agentdb.search("how we fixed authentication bugs")
# Returns semantically similar past solutions
```

**What it does:** Finds relevant context instantly once the embedding pipeline exists. Currently: schema designed, `.swarm/memory.db`, 384-dim HNSW — documented in `SESSION_MEMORY_GUIDE.md`, not yet running.

### 3. MEMORY.md — The Interface

Human-readable timeline. You write here; tools read and update automatically.

```markdown
## 2026-08-06
- Fixed authentication token expiry bug
- Decision: Use JWT with 24h refresh window
- Pattern: Always validate tokens server-side
```

**What it does:** Makes memory accessible to humans and agents. The capture CLI exists; the convention is documented, no live MEMORY.md files yet.

### Why All Three?

| Alone | Problem |
|---|---|
| Git only | Slow search. No semantic understanding. |
| AgentDB only | No version history. No audit trail. |
| MEMORY.md only | Manual. No automation. No search. |

Together: fast semantic search + immutable history + human interface.

## What This Means

Your agent remembers:

- "We debugged this before" → retrieves past solution automatically
- "Similar architecture decision" → finds related context from 3 months ago
- "That pattern we used" → applies learned approach without re-explaining

You stop repeating yourself. The agent learns.

---

## Memory as a Brain

The memory stack is built to work like a human brain, not a stateless API.

| Brain function | Enhancement | Status |
|---|---|---|
| **Episodic** (what happened) | `session-recruitment` — recalls past sessions from opencode's DB | ✅ Working |
| **Semantic** (facts & language) | `domain-modeling` + `CONTEXT.md` glossaries, ADRs | ✅ Working |
| **Declarative** (structured notes) | Memory guide + `MEMORY.md` timeline | 🔶 Capture CLI ✅, live files not yet |
| **Procedural** (how to do things) | 70-skill library, `continuous-learning` | ✅ Working |
| **Working** (what's loaded now) | `bootstrap` — ~4 always-loaded skills, rest recruited per task | ✅ Working |
| **Retrieval** (recall) | `skill-recruitment`, `memory-retrieval` | ✅ Working |
| **User model** (knows you) | `shadow-profile` — learns accept/decline patterns | 🔶 Schema in Postgres, needs backend |
| **Hippocampus** (deep associative recall) | ADR 0003 multi-layer knowledge + RAG/Qdrant | ❌ Backlog |

---

## Features

### Implemented and Working

**Memory capture**
- `memory-manager.mjs`: CLI for capture / search / recent / milestone / deployment / files-changed / skill-added / commit / debug
- Git commit extraction: automatic from `git log`
- File change classification: infers context from paths
- Memory guide (`MEMORY.md` convention + capture workflow)

**Memory search**
- Recent entries: `memory-manager.mjs recent 10`
- Keyword search: `memory-manager.mjs search "authentication"`
- Git history search: full commit-log integration

**Skills and agents**
- 4 always-loaded skills (bootstrap, skill-invoke, session-recruitment, skill-recruitment)
- 70 total skills available, recruited on demand
- 73 agent definitions with command routing
- Strategic compaction for context management

**Infrastructure**
- AgentDB database design (384-dim HNSW ready, `.swarm/memory.db`)
- `auto-memory-hook.mjs`, hook-handler, guidance/statusline hooks
- PostToolUse hook wiring for git activity monitoring

### In Progress

**SessionStart/SessionEnd hooks**
- Scripts exist (`auto-memory-hook.mjs`, hook-handler), need opencode-native configuration
- Auto-load memory context on session start
- Auto-commit memory state on session end

**AgentDB semantic search**
- Database schema ready
- Need embedding generation pipeline
- Need git → embedding workflow

**Git–AgentDB integration**
- Automatic: extract meaning from git commits → index in AgentDB
- Hybrid search: combine git history with semantic similarity

### Planned

**Memory intelligence**
- Pattern learning from repeated solutions
- Automatic milestone detection
- Decision impact tracking
- Context recommendation ("you solved this 3 weeks ago")

**Advanced search**
- Hybrid: keyword + semantic + temporal
- Cross-session pattern matching
- "Show me all authentication decisions"
- Timeline visualization

**Memory management**
- Branch-specific memory streams
- Memory compression (archive old, keep summaries)
- Multi-project memory federation
- Conflict-free merge strategies

**Workflow automation**
- Auto-capture deployment events
- Auto-tag by file paths and content
- Smart context loading (only relevant memories)
- Memory-driven code suggestions

**Team features**
- Shared team memory (opt-in)
- Memory permissions (public / private / team)
- Memory handoff between agents
- Collaborative learning

---

## Non-memory roadmap (reference)

- **Model router (ADR 0002)** — custom 2-tier Ollama routing with failover (built); Tier 3 remote provider (backlog)
- **`/tokens`** — per-session token/cost visibility with `token-cost-tracker.sh` (built)
- **IVAN platform phases 1–5** — auth + `hypoc-face-core`, RAG service, cost router, multi-tenant (RabbitMQ), monitoring (Prometheus/K8s) — all backlog, none running
- **`install-global.sh`** — one-clone skills/agents access from any project (built)

---

## The Vision

An agent that learns from your codebase and your history. Not just answering questions — remembering solutions, recognizing patterns, building institutional knowledge that survives session boundaries.

You work with an agent that gets smarter over time. Not because the model improved. Because it remembers.

## Current Status

- **Working:** core memory capture, git integration, keyword search, 70 skills, 73 agents, 2-tier router
- **In progress:** session-start/end hooks, semantic search + embedding pipeline, git→AgentDB indexing
- **Planned:** memory intelligence layer, hybrid search, team features
- **Honest note:** AgentDB is designed but not yet queryable; "227 skills" and "14 always-loaded" are aspirational — the real numbers are 70 and 4.