# Enterprise AI Developer Platform

A re-engineered AI developer stack for small teams. Cloneable, day-one productive.

## Structure

```
platform/
├── hypoc/                  Canonical self-contained package — clone-and-go
│   ├── skills/             69 curated skills (61 library + 7 vendored ECC + project-tracking)
│   ├── agents/             73 agent definitions (see hypoc/AGENTS.md)
│   ├── scripts/            sync-ollama-models.sh, container lifecycle, monitoring, security
│   └── .opencode/          Workspace config, instructions, skill-discovery plugin
├── hypoc-face/             DEPRECATED — opencode web is built in; not being developed
├── enterprise-toolkit/     One-command installer and packaging (own skills/, independent)
├── docs/adr/               Architectural decision records
├── VISION.md               Full platform vision
├── CONTEXT.md              Domain glossary
└── TODO.md                 Remaining work
```

> Skills and agents live **inside `hypoc/`** — the package is self-contained. A git clone
> includes everything the opencode config references; the only external dependencies are
> two public plugins (`ecc-universal` via npm, `superpowers` via GitHub) that opencode
> fetches automatically.

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

First-pass engineering **shipped 2026-07-16**: provider-agnostic (Bedrock removed), local-first
via Ollama, self-contained hypoc package, hypoc-face deprecated in favor of built-in
`opencode web`. Cloud model tiers and the SAS migration domain overlay (pharma QC) are
separate projects. See [TODO.md](TODO.md).
