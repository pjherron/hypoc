# Hypoc — OpenCode Enterprise AI Platform

"The best way to predict the future is to invent it." — Alan Kay

Named after Alan Kay, computer scientist and pioneer of object-oriented programming, graphical window interfaces, Smalltalk, and early notebook/tablet computing at Xerox PARC (Turing Award, 2003).

---

Hypoc is a shareable OpenCode configuration that ships a batteries-included AI development environment: skills, agents, memory, and a router — provider-agnostic and runnable locally via Ollama or against any cloud model.

## Architecture

Hypoc is **self-contained**: clone it and everything the workspace config references — skills, agents, instructions — is in the repo. The only external dependencies are two public plugins (`ecc-universal` from npm, `superpowers` from GitHub) that opencode fetches automatically at startup.

```
hypoc/
├── .opencode/
│   ├── opencode.json         # Workspace config (permissions, model, skills)
│   └── instructions/         # Consolidated operating instructions
├── skills/                   # 69 skills (61 library + 8 vendored ECC skills)
├── agents/                   # 73 agent definitions (see AGENTS.md)
├── scripts/                  # Operational utilities
│   └── sync-ollama-models.sh # Sync local Ollama models into ~/.config/opencode/opencode.json
├── AGENTS.md                 # Agent library documentation
├── CONTRIBUTING.md           # Skill/agent contribution guidelines
├── hypoc-face/               # Enterprise multi-tenant platform (uses hypoc as submodule)
│   ├── hypoc-face-core/      # FastAPI backend
│   └── hypoc-face-router/    # Request router
└── docker-compose.yml        # Local stack (postgres, core, router)
```

## Prerequisites

- [opencode](https://opencode.ai) 1.18+
- [Ollama](https://ollama.ai) (for local models)
- Docker + Docker Compose (for the hypoc-face stack)
- Python 3.11+ (for hypoc-face-core)

## Quick Start

```bash
git clone git@github.com:pjherron/hypoc.git
cd hypoc
opencode
```

opencode picks up `.opencode/opencode.json` automatically. No further setup required.

### Local Model Setup

Model registration is user config — not part of this repo. After pulling models via Ollama:

```bash
# Pull a model
ollama pull llama3.3:70b-instruct-q4_K_M

# Sync all local Ollama models into your opencode global config
./scripts/sync-ollama-models.sh
```

The sync script:
- Queries the live Ollama API
- Excludes tool-incompatible models (llama2, mistral, mixtral, deepseek-r1)
- Shows file sizes in parens next to each model name
- Writes `~/.config/opencode/opencode.json` provider.ollama.models

### Running the hypoc-face Stack

```bash
docker compose up -d
```

Services:
- `postgres` — port 5433
- `hypoc-face-core` — port 8002
- `hypoc-face-router` — port 8001

The stack uses `host.docker.internal` to reach Ollama on the host machine.

## opencode Configuration

### Workspace (`.opencode/opencode.json`)

Sets the default model, permissions (allow-all for autonomous operation), and loads skills. Model IDs here should be updated to match whatever models you have registered globally.

### Global (`~/.config/opencode/opencode.json`)

Managed by the user (or `sync-ollama-models.sh`). Registers provider credentials and model lists. Not committed to this repo — provider-specific and machine-specific.

## Skills

Skills live in `skills/` and are available as slash commands in opencode. The workspace config loads a bootstrap set at startup; additional skills are discovered and recruited automatically.

## Notes

- opencode's `opencode web` replaces any separate browser UI — no additional frontend needed
- The `hypoc-face-ui` package was removed as redundant
- All Bedrock GovCloud references have been removed; the platform is provider-agnostic
- pydantic-settings v2: `extra = "ignore"` is set in hypoc-face-core config to avoid ValidationError on unknown env vars
