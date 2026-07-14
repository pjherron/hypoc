<!-- Configuration variables referenced in this document:
  PROJECT_DIR               Local project root directory  (e.g. /Users/pherron6/dev/opencode)
-->

# Hypoc-Face ↔ Hypoc Integration Guide

**Last Updated:** April 20, 2026  
**Status:** Active Development

---

## Overview

**Hypoc** and **Hypoc-Face** work together as a unified system:

- **Hypoc** = Content Library (187 skills, 50 agents, 34 commands, security tools)
- **Hypoc-Face** = Enterprise Platform (auth, multi-tenancy, RAG, model routing, RBAC)

**Metaphor:** Hypoc is the "knowledge and tools", Hypoc-Face is the "delivery system with enterprise features"

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Users (SSO)                     │
└────────────────┬────────────────────────────┘
                 ↓
         ┌───────────────┐
         │  Hypoc-Face Platform │
         │  - Auth/RBAC   │
         │  - RAG Engine  │
         │  - Model Router│
         │  - Multi-tenant│
         └───────┬────────┘
                 ↓
      ┌──────────────────────┐
      │ Hypoc Resource Adapter │  ← Integration Layer
      └──────────┬────────────┘
                 ↓
    ┌────────────────────────────┐
    │     Hypoc Resources         │
    │  - 187 Skills (read-only)  │
    │  - 50 Agents (read-only)   │
    │  - 34 Commands (read-only) │
    │  - Security Tools          │
    └────────────────────────────┘
```

---

## Repository Structure

```
${PROJECT_DIR}/  (Main repo: "hypoc")
│
├── hypoc/                        # Hypoc: Original resources
│   ├── skills/                  # 187 skills
│   ├── agents/                  # 50 agents
│   ├── .opencode/              # ECC configuration
│   │   ├── commands/           # 34 commands
│   │   ├── plugins/            # Plugin system
│   │   └── prompts/            # Prompt templates
│   ├── scripts/
│   │   ├── security/           # Security tools
│   │   └── desktop/            # (deprecated VNC)
│   └── README.md
│
├── hypoc-face/                        # Hypoc-Face: Enterprise platform
│   ├── core/                    # FastAPI backend
│   │   ├── app/
│   │   │   ├── api/            # REST endpoints
│   │   │   ├── services/       # Business logic
│   │   │   ├── models/         # Data models
│   │   │   └── main.py
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   ├── rag/                     # RAG service
│   │   ├── app/
│   │   └── Dockerfile
│   │
│   ├── router/                  # Model router service
│   │   ├── app/
│   │   └── Dockerfile
│   │
│   ├── frontend/                # OpenCode Web (enhanced)
│   │   ├── Dockerfile.web
│   │   └── config/
│   │
│   ├── infra/                   # Infrastructure as Code
│   │   ├── docker-compose.dev.yml
│   │   ├── docker-compose.prod.yml
│   │   ├── k8s/                # Kubernetes manifests
│   │   └── terraform/          # Terraform configs
│   │
│   ├── docs/                    # Hypoc-Face-specific docs
│   │   ├── API.md
│   │   ├── DEPLOYMENT.md
│   │   └── ARCHITECTURE.md
│   │
│   └── README.md
│
├── shared/                      # Integration layer
│   ├── adapters/
│   │   ├── hypoc_loader.py       # Load Hypoc resources
│   │   ├── skill_indexer.py     # Index into RAG
│   │   └── agent_registry.py    # Register agents
│   ├── config/
│   │   └── hypoc-face-hypoc-map.yaml   # Resource mapping
│   └── tests/
│       └── test_integration.py
│
├── docs/                        # Top-level documentation
│   ├── PROJECT_HYPOC-FACE_PLAN.md    # Master plan
│   ├── INTEGRATION_GUIDE.md    # This file
│   ├── GETTING_STARTED.md
│   └── SECURITY-*.md            # Security docs
│
├── .gitignore
├── README.md                    # Overview of entire system
└── docker-compose.yml           # Quick-start compose file
```

---

## How It Works

### 1. Startup Sequence

```python
# When Hypoc-Face starts:

1. Hypoc-Face Core API boots
   ↓
2. Detects Hypoc resources at /shared/hypoc/
   ↓
3. Loads HypocResourceAdapter
   ↓
4. Adapter scans:
   - hypoc/skills/*.md      → Parses 187 skills
   - hypoc/agents/*.md      → Parses 50 agents  
   - hypoc/.opencode/commands/*.md → Parses 34 commands
   ↓
5. Indexes skills into Qdrant (RAG)
   ↓
6. Registers agents in AgentRegistry
   ↓
7. Maps commands to REST endpoints
   ↓
8. ✅ Hypoc-Face ready, Hypoc resources accessible
```

### 2. User Interaction Flow

**Example: User asks "How do I write FastAPI tests?"**

```
User Query
   ↓
Hypoc-Face Core API (receives request)
   ↓
RAG Service (searches Qdrant)
   ↓
Finds: hypoc/skills/fastapi-patterns/SKILL.md (indexed)
   ↓
Retrieves top 5 relevant chunks
   ↓
Model Router (selects best model based on user role, budget)
   ↓
LLM generates response with Hypoc skill context
   ↓
Response returned to user
```

**Example: User invokes agent `/invoke security-reviewer`**

```
User Command
   ↓
Hypoc-Face Core API (parses command)
   ↓
Agent Service (looks up in registry)
   ↓
Finds: hypoc/agents/security-reviewer.md (registered)
   ↓
Checks RBAC (user has permission?)
   ↓
Builds prompt from agent template
   ↓
Model Router (selects model)
   ↓
Invokes agent, tracks cost
   ↓
Agent output returned to user
```

### 3. Resource Updates

**Scenario: Developer updates a skill**

```bash
# Developer edits hypoc/skills/fastapi-patterns/SKILL.md
vim hypoc/skills/fastapi-patterns/SKILL.md

# Git commit
git add hypoc/skills/fastapi-patterns/SKILL.md
git commit -m "Update FastAPI testing patterns"

# Hypoc-Face detects change (file watcher)
# → Auto-reindexes skill into RAG
# → Users immediately see updated content

# OR manual reindex:
curl -X POST http://localhost:8000/api/v1/admin/reindex
```

---

## Configuration

### Hypoc → Hypoc-Face Resource Mapping

```yaml
# shared/config/hypoc-face-hypoc-map.yaml

skills:
  source: /shared/hypoc/skills
  index_strategy: on_startup_and_watch  # Auto-reindex on file change
  rag_collection: hypoc_skills
  chunk_size: 512
  overlap: 50
  rbac:
    default_access: all_users
    restricted: []

agents:
  source: /shared/hypoc/agents
  registry_location: hypoc-face_core
  default_model: sonnet
  rbac:
    standard_user:
      - code-reviewer
      - build-error-resolver
      - tdd-guide
      - e2e-runner
      - doc-updater
    power_user:
      - security-reviewer
      - architect
      - planner
      - "*-reviewer"
    admin:
      - "*"  # All agents

commands:
  source: /shared/hypoc/.opencode/commands
  prefix: /
  rbac:
    standard_user:
      - plan
      - code-review
      - tdd
      - e2e
      - verify
    power_user:
      - security
      - orchestrate
      - eval
      - "*"
    admin:
      - "*"

plugins:
  source: /shared/hypoc/.opencode/plugins
  sandboxed: true
  timeout: 30s
  rbac:
    install: power_user
    use: standard_user
```

### Environment Variables

```bash
# .env

# Hypoc Integration
HYPOC_RESOURCES_PATH=/shared/hypoc
SKILLS_AUTO_INDEX=true
AGENTS_AUTO_REGISTER=true
HYPOC_WATCH_FILES=true

# Hypoc-Face Core
HYPOC-FACE_ENV=development
HYPOC-FACE_LOG_LEVEL=info
DATABASE_URL=postgresql://hypoc-face:password@postgres:5432/hypoc-face
REDIS_URL=redis://redis:6379/0
QDRANT_URL=http://qdrant:6333

# Authentication
KEYCLOAK_URL=http://keycloak:8080
KEYCLOAK_REALM=hypoc-face
KEYCLOAK_CLIENT_ID=hypoc-face-core

# AI Providers
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx
```

---

## Development Workflow

### Quick Start (Local)

```bash
# 1. Navigate to repo
cd ${PROJECT_DIR}

# 2. Start Hypoc-Face + Hypoc integrated stack
docker compose -f hypoc-face/infra/docker-compose.dev.yml up -d

# 3. Wait for startup (check logs)
docker compose logs -f hypoc-face-core

# 4. Open browser
open http://localhost:8080

# 5. Login with test user
# (Keycloak creates default admin/admin)
```

### Adding a New Skill (Hypoc)

```bash
# 1. Create skill directory
mkdir -p hypoc/skills/my-new-skill

# 2. Create SKILL.md
cat > hypoc/skills/my-new-skill/SKILL.md << 'EOF'
---
name: my-new-skill
description: Description of what this skill does
origin: custom
---

# My New Skill

Content here...
EOF

# 3. Commit to Git
git add hypoc/skills/my-new-skill/
git commit -m "Add my-new-skill"

# 4. Hypoc-Face auto-detects and indexes
# (OR manually trigger: POST /api/v1/admin/reindex)

# 5. Skill immediately searchable
curl -X POST http://localhost:8000/api/v1/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query": "my new skill"}'
```

### Adding a New Agent (Hypoc)

```bash
# 1. Create agent definition
cat > hypoc/agents/my-agent.md << 'EOF'
---
name: my-agent
description: What this agent does
capabilities: [code-review, security]
model: sonnet
required_role: standard
---

# My Agent

Agent prompt template...
EOF

# 2. Commit
git add hypoc/agents/my-agent.md
git commit -m "Add my-agent"

# 3. Restart Hypoc-Face (or hot-reload if implemented)
docker compose restart hypoc-face-core

# 4. Agent available
curl http://localhost:8000/api/v1/agents
# → Includes my-agent
```

### Testing Integration

```bash
# Test Hypoc resources are loaded
pytest shared/tests/test_integration.py

# Test skills indexed
pytest hypoc-face/core/tests/test_rag_service.py

# Test agents registered
pytest hypoc-face/core/tests/test_agent_registry.py
```

---

## Benefits of This Integration

| Benefit | Description |
|---------|-------------|
| **Clean Separation** | Hypoc = content, Hypoc-Face = delivery. Clear boundaries. |
| **Independent Updates** | Update skills without touching Hypoc-Face code. |
| **Versioned Together** | Git tracks both, easy to correlate changes. |
| **Testable** | Test Hypoc and Hypoc-Face independently, plus integration. |
| **Scalable** | Hypoc resources read-only, Hypoc-Face services stateless. |
| **Portable** | Hypoc resources usable outside Hypoc-Face if needed. |

---

## Migration from Current Setup

### Current State (What We Have)

```
${PROJECT_DIR}/
├── skills/                    # 187 skills
├── agents/                    # 50 agents
├── .opencode/                 # ECC config
├── scripts/security/          # Security tools
├── Dockerfile.web             # OpenCode web (single-user)
└── docker-compose.yml         # Basic stack
```

### Migration Steps

**Step 1: Reorganize into hypoc/ and hypoc-face/**

```bash
cd ${PROJECT_DIR}

# Create new structure
mkdir -p hypoc hypoc-face shared

# Move existing resources to hypoc/
git mv skills hypoc/
git mv agents hypoc/
git mv .opencode hypoc/
git mv scripts hypoc/

# Move Docker configs to hypoc-face/
mkdir -p hypoc-face/frontend
git mv Dockerfile.web hypoc-face/frontend/
mkdir -p hypoc-face/infra
git mv docker-compose.yml hypoc-face/infra/docker-compose.simple.yml

git commit -m "Reorganize: separate hypoc (resources) and hypoc-face (platform)"
```

**Step 2: Create Adapter**

```bash
# Create shared adapter
mkdir -p shared/adapters
# (We'll implement hypoc_loader.py next)
```

**Step 3: Build Hypoc-Face Core**

```bash
# Create Hypoc-Face Core API structure
mkdir -p hypoc-face/core/{app,tests}
# (Start implementing FastAPI service)
```

---

## API: Hypoc Resource Adapter

### Python Interface

```python
from shared.adapters.hypoc_loader import HypocResourceLoader

# Initialize
loader = HypocResourceLoader(hypoc_root=Path("/shared/hypoc"))

# Load skills
skills = loader.load_skills()
# Returns: List[Dict] with keys: id, name, description, content, path, category

# Load agents
agents = loader.load_agents()
# Returns: List[Dict] with keys: id, name, description, capabilities, model, prompt_template

# Load commands
commands = loader.load_commands()
# Returns: List[Dict] with keys: id, name, description, handler

# Watch for changes
loader.watch_skills(callback=on_skill_updated)
# Callback invoked when skill file modified
```

---

## Troubleshooting

### Skills Not Appearing in RAG

```bash
# 1. Check Hypoc-Face can see Hypoc resources
docker exec hypoc-face-core ls /shared/hypoc/skills
# Should show skill directories

# 2. Check RAG indexing logs
docker logs hypoc-face-core | grep "Indexing skills"

# 3. Manually trigger reindex
curl -X POST http://localhost:8000/api/v1/admin/reindex

# 4. Query Qdrant directly
curl http://localhost:6333/collections/hypoc_skills
```

### Agents Not Registered

```bash
# 1. Check agent files loaded
docker exec hypoc-face-core ls /shared/hypoc/agents
# Should show .md files

# 2. Check agent registry
curl http://localhost:8000/api/v1/agents
# Should list all agents

# 3. Check logs for parsing errors
docker logs hypoc-face-core | grep "ERROR.*agent"
```

### RBAC Issues

```bash
# 1. Check user role
curl http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"

# 2. Check resource permissions
curl http://localhost:8000/api/v1/admin/rbac/check \
  -d '{"user_id": "xxx", "resource": "agent:security-reviewer"}'

# 3. Update role mapping if needed
# Edit shared/config/hypoc-face-hypoc-map.yaml
```

---

## Next Steps

1. ✅ Implement `HypocResourceLoader` adapter
2. ✅ Set up Hypoc-Face Core API skeleton
3. ✅ Add RAG indexing for Hypoc skills
4. ✅ Register Hypoc agents in AgentRegistry
5. ✅ Map Hypoc commands to REST endpoints
6. ✅ Add file watching for auto-updates
7. ✅ Write integration tests

---

**The integration is designed for elegance and maintainability. Hypoc and Hypoc-Face work together seamlessly!** 🚀
