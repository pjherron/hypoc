# Enterprise AI Developer Platform

A re-engineered AI developer stack for small teams. Cloneable, day-one productive.

## Structure

```
platform/
├── hypoc/                  OpenCode CLI environment
│   ├── scripts/            Container lifecycle, monitoring, security tooling
│   └── .opencode/          ECC plugin + skill-discovery, bootstrap on startup
├── hypoc-face/             Browser UI and backend services
│   ├── hypoc-face-core     FastAPI backend (PostgreSQL, Redis, auth) — implemented
│   ├── hypoc-face-router   Custom 4-tier model router — FastAPI skeleton implemented
│   ├── hypoc-face-rag      RAG service — stub (Phase 2)
│   ├── hypoc-face-agent    Agent coordination — stub (Phase 4)
│   └── hypoc-face-workspace  Workspace isolation — stub (Phase 4)
├── enterprise-toolkit/     One-command installer and packaging
├── skills/                 ~60 curated skills (see below)
├── agents/                 Focused agent library
├── docs/adr/               Architectural decision records
├── VISION.md               Full platform vision
└── CONTEXT.md              Domain glossary
```

## Core Principles

1. **No skill names required** — describe what you want. The platform recruits the right skill and asks before running it.
2. **Cheapest capable model** — four-tier routing, cost visible in the UI.
3. **Everything remembered** — PostgreSQL (profiles), Git (corpus), SQLite (local state).
4. **Suggestion and execution modes** — skills propose, agents act. Teams graduate naturally.
5. **Shadow profiles** — the platform learns each developer's patterns over time.

## Skills Library

**Stack infrastructure** — session-recruitment, skill-recruitment, continuous-learning-v2, agentdb-memory-patterns, agentdb-vector-search, cost-aware-llm-pipeline, token-budget-advisor, context-budget, knowledge-ops, autonomous-agent-harness, enterprise-agent-ops, hooks-automation, workspace-surface-audit, configure-ecc, skill-comply, skill-stocktake, skill-builder, ai-first-engineering, agentic-engineering, codebase-onboarding, agent-introspection-debugging

**Planning pipeline** — grill-me, grill-with-docs, domain-modeling, to-spec, to-tickets, triage, planning-pipeline

**Developer productivity** — git-workflow, github-ops, github-code-review, tdd-workflow, code-tour, security-review, security-scan, observability-monitoring, deep-research, api-design, api-contract-testing, database-design, database-migrations, postgres-patterns, python-patterns, python-testing, fastapi-patterns, docker-patterns, kubernetes-patterns, deployment-patterns, verification-loop, verification-quality, pair-programming

**Platform-native (new)** — bootstrap, skill-invoke

## ADRs

- [0001 — Implicit skill invocation](docs/adr/0001-implicit-skill-invocation.md)
- [0002 — Custom model router, no LiteLLM](docs/adr/0002-model-router-no-litellm.md)
- [0003 — Multi-layer knowledge architecture](docs/adr/0003-knowledge-layers.md)
- [0004 — Suggestion and execution modes](docs/adr/0004-suggestion-and-execution-modes.md)

## Status

First-pass engineering. Second pass will overlay the SAS migration domain (pharma QC).
