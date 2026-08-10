# Hypoc — OpenCode with Memory

OpenCode agents that remember.

"The best way to predict the future is to invent it." — Alan Kay

Named after Alan Kay, computer scientist and Turing Award laureate (2003), pioneer of object-oriented programming, graphical window interfaces, and Smalltalk at Xerox PARC.

---

Most AI coding sessions start from zero. Every time. You explain the context, the patterns, the decisions you made last week. Again. Hypoc fixes that.

- "We solved this auth bug before" → the agent does not remember
- "Use the pattern from last sprint" → the agent asks which pattern
- "Why did we choose postgres?" → no context

Every session is groundhog day — until now.

## The Memory System

Three complementary layers work together:

### 1. Git — The Archive

Every decision, milestone, and pattern is a commit. Immutable. Versioned. Auditable.

```bash
git log --grep="auth" --all --oneline   # every auth decision, all branches
```

**What it does:** stores everything, forever, with full history.

### 2. AgentDB — The Brain

HNSW vector database. Semantic search finds related memories by meaning, not keywords.

**What it does:** finds relevant context instantly. **Status:** schema designed, `.swarm/memory.db`, 384-dim HNSW — documented in `.opencode/SESSION_MEMORY_GUIDE.md`; embedding pipeline not yet running.

### 3. MEMORY.md — The Interface

Human-readable timeline. You write here; tools read and update automatically.

```markdown
## 2026-08-06
- Fixed authentication token expiry bug
- Decision: Use JWT with 24h refresh window
- Pattern: Always validate tokens server-side
```

**What it does:** makes memory accessible to humans and agents. Capture CLI works; the convention is documented, no live files yet.

### Why All Three?

| Alone | Problem |
|---|---|
| Git only | Slow search. No semantic understanding. |
| AgentDB only | No version history. No audit trail. |
| MEMORY.md only | Manual. No automation. No search. |

Together: fast semantic search + immutable history + human interface.

## Memory as a Brain

The stack is built to work like a human brain, not a stateless API.

| Brain function | Enhancement | Status |
|---|---|---|
| Episodic (what happened) | `session-recruitment` recalls past sessions from opencode's DB | ✅ Working |
| Semantic (facts & language) | `domain-modeling` + `CONTEXT.md` glossaries, ADRs | ✅ Working |
| Declarative (structured notes) | Memory guide + `MEMORY.md` timeline | 🔶 Capture CLI ✅, live files not yet |
| Procedural (how to do things) | 70-skill library, `continuous-learning`, `knowledge-ops` | ✅ Working |
| Working (what's loaded now) | `bootstrap` — 4 always-loaded skills, rest recruited per task (~5K tokens) | ✅ Working |
| Retrieval (recall) | `skill-recruitment`, `memory-retrieval` | ✅ Working |
| User model (knows you) | `shadow-profile` learns accept/decline patterns | 🔶 Schema in Postgres, needs backend |
| Hippocampus (associative recall) | ADR 0003 multi-layer knowledge + RAG/Qdrant | ❌ Backlog |

## What This Means

Your agent remembers:

- "We debugged this before" → retrieves the past solution automatically
- "Similar architecture decision" → finds related context from 3 months ago
- "That pattern we used" → applies the learned approach without re-explaining

You stop repeating yourself. The agent learns.

---

## Features

### Implemented and Working

**Memory capture**
- `memory-manager.mjs`: CLI for capture / search / recent / milestone / deployment / files-changed / skill-added / commit / debug
- Git commit extraction (automatic from `git log`); file-change classification by path
- Memory capture workflow documented in `.opencode/CONTEXT_MEMORY_GUIDE.md`

**Memory search**
- `memory-manager.mjs recent 10`, `memory-manager.mjs search "authentication"`
- Full `git log` integration

**Skills and agents**
- 4 always-loaded skills (bootstrap, skill-invoke, session-recruitment, skill-recruitment)
- 70 total skills, recruited on demand
- 73 agent definitions with command routing
- Strategic compaction for context management

**Model routing**
- Dynamic per-task model routing via vendored `opencode-model-router` plugin (ADR 0002)
- Task taxonomy routes each task to fast/medium/heavy tier; cross-provider fallback on failure
- Presets for all providers: anthropic, openai, openrouter, google, github-copilot, ollama, hybrid
- One-command switching: `/preset <provider>` / `/budget <mode>` / `/tiers` / `/annotate-plan`
- Config versioned in `plugins/opencode-model-router/tiers.json`

**Infrastructure**
- AgentDB database design (384-dim HNSW ready)
- Hook scripts (`auto-memory-hook.mjs`, hook-handler, guidance/statusline)
- PostToolUse hook wiring for git activity monitoring

### In Progress

- **SessionStart/SessionEnd hooks** — scripts exist, need opencode-native config; auto-load memory on start, auto-commit on end
- **AgentDB semantic search** — schema ready; need embedding generation pipeline and git→embedding workflow
- **Git–AgentDB integration** — extract meaning from commits into the index; hybrid keyword+semantic search

### Planned

- **Memory intelligence** — pattern learning, milestone detection, decision-impact tracking, context recommendations
- **Advanced search** — hybrid keyword+semantic+temporal, cross-session matching, timeline visualization
- **Memory management** — branch-specific streams, compression/archival, multi-project federation, conflict-free merges
- **Workflow automation** — auto-capture deployments, auto-tagging, smart context loading, memory-driven suggestions
- **Team features** — shared memory (opt-in), permissions, handoff, collaborative learning

### Non-memory roadmap (reference)

- IVAN platform phases 1–5 — auth + `hypoc-face-core`, RAG service, cost router, multi-tenant (RabbitMQ), monitoring (Prometheus/K8s/Terraform) — all backlog, none running

---

## Architecture

Hypoc is **self-contained**: clone it and everything the workspace config references — skills, agents, instructions — is in the repo. The only external dependencies are two public plugins (`ecc-universal` from npm, `superpowers` from GitHub) that opencode fetches automatically at startup, plus the vendored `opencode-model-router` (GPL-3.0) at `plugins/`.

```
hypoc/
├── .opencode/
│   ├── .hypoc.json           # Workspace config (permissions, model, skills, tiers)
│   └── instructions/         # Consolidated operating instructions
├── plugins/
│   └── opencode-model-router # Vendored model router (tiers.json versioned here)
├── skills/                   # 70 skills, recruited on demand
├── agents/                   # 73 agent definitions (see AGENTS.md)
├── scripts/                  # Operational utilities
│   ├── install-global.sh     # Wire hypoc into global opencode config
│   └── sync-ollama-models.sh # Sync local Ollama models into global config
├── AGENTS.md                 # Agent library documentation
├── CONTRIBUTING.md           # Skill/agent contribution guidelines
```

## Prerequisites

- [opencode](https://opencode.ai) 1.18+
- [Ollama](https://ollama.ai) (for local models)

## Quick Start

```bash
git clone git@github.com:pjherron/hypoc.git
cd hypoc/hypoc
./scripts/install-global.sh    # wire hypoc into your global opencode config
```

Then use opencode **from any project directory**:

```bash
cd /any/project
opencode          # or: opencode web
```

Describe what you want in plain English; the bootstrap skill recruits the right skills from the hypoc library on demand. Only the 4 recruitment skills (~5K tokens) are always-loaded — pattern skills load per task, keeping local-model context lean.

Re-run `install-global.sh` if you move the hypoc checkout.

### Local Model Setup

Model registration is user config — not part of this repo:

```bash
ollama pull llama3.3:70b-instruct-q4_K_M          # pull a model
./scripts/sync-ollama-models.sh                   # sync into global config
```

The sync script queries the live Ollama API, excludes tool-incompatible models, and writes `provider.ollama.models` to `~/.config/opencode/opencode.json`.

## Notes

- opencode's `opencode web` replaces any separate browser UI — no additional frontend needed
- The platform is provider-agnostic; local (Ollama) or any cloud model

## Current Status

- **Working:** core memory capture, git integration, keyword search, 70 skills, 73 agents, model router (vendored plugin)
- **In progress:** session-start/end hooks, semantic search + embedding pipeline, git→AgentDB indexing
- **Planned:** memory intelligence layer, hybrid search, team features
- **Honest note:** AgentDB is designed but not yet queryable; "227 skills" and "14 always-loaded" are aspirational — the real numbers are 70 and 4.

## The Vision

An agent that learns from your codebase and your history. Not just answering questions — remembering solutions, recognizing patterns, building institutional knowledge that survives session boundaries.

You work with an agent that gets smarter over time. Not because the model improved. Because it remembers.