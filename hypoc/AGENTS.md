# Hypoc Agent Library

Agent definitions live in `agents/` — 70+ specialized agents shared across all surfaces (CLI, `opencode web`, plugin).

## Layout

```
agents/
├── *.md            # Individual agent definitions (frontmatter + system prompt)
├── analysis/       # Code and data analysis agents
├── architecture/   # System design and ADR agents
├── browser/        # Browser automation and QA agents
├── consensus/      # Multi-agent voting and verification
├── core/           # Foundational agents (build, plan, explore)
└── custom/         # Site-local agents (not upstreamed)
```

## Agent Definition Format

Each agent is a Markdown file with YAML frontmatter:

```markdown
---
description: One-line summary shown in agent pickers
mode: subagent          # primary | subagent
model: ollama/llama3.3:70b-instruct-q4_K_M   # optional override
tools:
  write: true
  edit: true
  bash: true
---

System prompt body goes here.
```

## Conventions

- **Model-agnostic by default.** Omit `model:` unless the agent genuinely requires a specific capability tier; agents inherit the workspace default.
- **Least-privilege tools.** Grant only the tools the agent needs — reviewers get `read`, not `write`.
- **Test locally, then promote.** Prove a new agent in your workspace before moving it into the shared `agents/` directory (see CLAUDE.md workspace discipline).

## Primary Agents

Defined in `.opencode/opencode.json` under `agent:`. The default is `build` — the primary coding agent with full tool access.
