<!-- Configuration variables referenced in this document:
  PROJECT_DIR               Local project root directory  (e.g. /Users/pherron6/dev/opencode)
  PROJECT_OWNER_HOME        Home directory of the project owner  (e.g. /Users/pherron6)
-->

# 🎯 Project Hypoc-Face - Complete Implementation Plan
## Enterprise OpenCode Desktop Environment with RAG, Model Routing, Multi-tenancy, SSO, and RBAC

**Version:** 1.0  
**Date:** April 20, 2026  
**Status:** Planning → Implementation  
**Repository:** [Org] GitLab (hypoc repo → hypoc-face branch)

---

## Executive Summary

**Project Hypoc-Face** transforms OpenCode from a single-user development tool into an **enterprise-grade, multi-tenant AI development platform** featuring:

- **Intelligent RAG** for context-aware assistance across 187+ skills and user codebases
- **Smart Model Routing** with cost optimization and quality guarantees
- **Multi-tenant Architecture** with workspace isolation
- **SSO Authentication** with enterprise identity providers
- **Fine-grained RBAC** for security and cost control
- **Persistent Storage** for all resources, conversations, and artifacts
- **Production-ready Infrastructure** with monitoring, logging, and HA

**Timeline:** 12-16 weeks to production-ready  
**Technology Stack:** Modern, proven, and [Org]-compatible  
**Integration Strategy:** Hypoc-Face wraps and enhances Hypoc's existing resources

---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Technology Stack](#2-technology-stack)
3. [Special Features from Origin](#3-special-features-from-origin)
4. [Detailed Component Design](#4-detailed-component-design)
5. [Implementation Phases](#5-implementation-phases)
6. [Infrastructure & Deployment](#6-infrastructure--deployment)
7. [Security & Compliance](#7-security--compliance)
8. [Migration Path](#8-migration-path)
9. [Resource Requirements](#9-resource-requirements)
10. [Risk Analysis](#10-risk-analysis)
11. [Success Metrics](#11-success-metrics)
12. [Hypoc-Face ↔ Hypoc Integration](#12-hypoc-face--hypoc-integration)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Users (SSO)                              │
│                    ↓ Authentication                              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    Hypoc-Face Gateway (Nginx/Traefik)                  │
│                  ↓ TLS Termination, Rate Limiting                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
        ┌─────────────────────┴─────────────────────┐
        ↓                                           ↓
┌───────────────────┐                    ┌────────────────────┐
│  Auth Service     │                    │  OpenCode Web      │
│  (Keycloak/Auth0) │←──────────────────→│  (Frontend)        │
│  - SSO            │                    │  - User Interface  │
│  - RBAC           │                    │  - WebSocket       │
│  - User Mgmt      │                    │  - File Browser    │
└───────────────────┘                    └────────────────────┘
                                                   ↓
                              ┌────────────────────┴────────────────────┐
                              ↓                                         ↓
                    ┌──────────────────┐                    ┌─────────────────────┐
                    │  Hypoc-Face Core API   │                    │  Workspace Service  │
                    │  (FastAPI)       │                    │  (Container Mgmt)   │
                    │  - Model Routing │                    │  - User Isolation   │
                    │  - RAG Gateway   │                    │  - File Storage     │
                    │  - Cost Tracking │                    │  - Git Integration  │
                    └──────────────────┘                    └─────────────────────┘
                              ↓
        ┌─────────────────────┼──────────────────────┬────────────────────┐
        ↓                     ↓                      ↓                    ↓
┌──────────────┐    ┌─────────────────┐    ┌─────────────────┐  ┌──────────────┐
│ Model Router │    │   RAG Service   │    │  Agent Service  │  │  Monitoring  │
│ - Complexity │    │   (FastAPI)     │    │  - 50 Agents    │  │  - Metrics   │
│ - Cost       │    │   - Qdrant      │    │  - Swarm Coord  │  │  - Logging   │
│ - Latency    │    │   - Embeddings  │    │  - Eval Harness │  │  - Tracing   │
│ - Quality    │    │   - Reranking   │    │  - MCP Servers  │  │  - Alerts    │
└──────────────┘    └─────────────────┘    └─────────────────┘  └──────────────┘
        ↓                     ↓                      ↓
┌──────────────────────────────────────────────────────────┐
│              Model Provider Layer                         │
│  - Anthropic (Claude Opus, Sonnet, Haiku)               │
│  - OpenAI (GPT-4, GPT-3.5)                              │
│  - AWS Bedrock (for Gov compliance)                     │
│  - Local (Ollama for air-gapped)                        │
└──────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────┐
│                  Persistence Layer                        │
│  - PostgreSQL (users, auth, audit, metadata)            │
│  - Qdrant (vector embeddings)                           │
│  - S3/MinIO (artifacts, workspaces, backups)            │
│  - Redis (cache, sessions, rate limits)                 │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack

### 2.1 Core Components

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Frontend** | OpenCode Web (Node.js 22) | Already working, browser-native |
| **API Gateway** | Traefik or Nginx | Reverse proxy, TLS, rate limiting |
| **Backend API** | FastAPI (Python 3.12) | Fast, async, type-safe, great for AI |
| **Auth** | Keycloak (self-hosted) or Auth0 | Full SSO/OIDC/SAML, RBAC support |
| **Vector DB** | Qdrant | Fast, scalable, open-source, HNSW |
| **Primary DB** | PostgreSQL 16 | ACID, proven, pgvector for hybrid search |
| **Object Storage** | MinIO (dev) / S3 (prod) | Compatible, cost-effective |
| **Cache/Queue** | Redis 7 | Fast, reliable, multi-purpose |
| **Container Runtime** | Docker + Kubernetes | Standard, scalable |
| **Monitoring** | Grafana + Prometheus + Loki | Complete observability stack |
| **Secret Management** | Vault or AWS Secrets Manager | Secure credential storage |

### 2.2 AI/ML Components

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Embeddings** | OpenAI text-embedding-3-large | High quality, 3072 dimensions |
| **Vector Search** | Qdrant HNSW | 150x faster than brute force |
| **Reranking** | Cohere Rerank or Cross-Encoder | Improve retrieval precision |
| **Model Router** | Custom FastAPI service | Cost-aware, quality-based routing |
| **Agent Framework** | LangGraph or AutoGen | Multi-agent coordination |
| **Eval Framework** | LangSmith or Custom | Agent quality metrics |

---

## 3. Special Features from Origin (Hypoc)

### 3.1 Existing OpenCode Features to Preserve

#### **187 Skills Integration**
- **Storage Strategy:** Mount skills directory as read-only volume, index into RAG
- **Search:** Users can semantically search skills: "How do I implement TDD in Python?"
- **Auto-suggestion:** RAG recommends relevant skills based on current task context
- **Versioning:** Git-backed skill catalog with version control

#### **50 Custom Agents**
- **Agent Registry:** Database of available agents with capabilities, cost, performance
- **Agent Selection:** Smart routing to appropriate agent based on task
- **Agent Swarm:** Coordinate multiple agents for complex workflows
- **Agent Eval:** Continuous quality monitoring via eval harness

#### **34 Custom Commands**
- **Command Registry:** All commands available via `/` prefix in OpenCode
- **RBAC on Commands:** Admin can restrict certain commands per role
- **Command History:** Track usage, popularity, success rates
- **Custom Commands:** Users can create personal commands in their workspace

#### **ECC Plugin System**
- **Hook Integration:** Pre/post tool execution hooks for formatting, security, notifications
- **Plugin Marketplace:** Users can discover and install community plugins
- **Plugin Isolation:** Sandboxed execution for security
- **Plugin RBAC:** Control which users can install plugins

#### **Security Framework**
- **Pre-commit Hooks:** gitleaks, semgrep, npm audit run automatically
- **Security Audit Dashboard:** Real-time security posture visibility
- **Vulnerability Tracking:** Link findings to tickets, track remediation
- **Compliance Reports:** Generate audit reports for FISMA/FedRAMP

---

## 12. Hypoc-Face ↔ Hypoc Integration

### 12.1 Integration Architecture

**Concept:** Hypoc-Face is the **platform**, Hypoc is the **content library**

```
┌─────────────────────────────────────────────────────────────┐
│                      Project Hypoc-Face                            │
│                 (Enterprise Platform)                        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Hypoc-Face Services                                       │   │
│  │  - Authentication (SSO)                              │   │
│  │  - Multi-tenancy                                     │   │
│  │  - Model Routing                                     │   │
│  │  - RAG Engine                                        │   │
│  │  - Cost Tracking                                     │   │
│  │  - RBAC                                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Hypoc Resource Adapter                               │   │
│  │  - Skills Loader (187 skills)                        │   │
│  │  - Agent Registry (50 agents)                        │   │
│  │  - Command Mapper (34 commands)                      │   │
│  │  - Plugin Manager (ECC plugins)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                           ↓                                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Shared Resources (from Hypoc)                        │   │
│  │  /shared/hypoc/skills/          (read-only)          │   │
│  │  /shared/hypoc/agents/          (read-only)          │   │
│  │  /shared/hypoc/.opencode/       (read-only)          │   │
│  │  /shared/hypoc/scripts/security/ (executable)        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 12.2 Repository Structure

**Option A: Monorepo (Recommended)**

```
${PROJECT_DIR}/  (hypoc repo)
├── hypoc/                        # Original Hypoc resources
│   ├── skills/                  # 187 skills
│   ├── agents/                  # 50 agents
│   ├── .opencode/              # ECC config
│   └── scripts/                 # Utilities
│
├── hypoc-face/                        # New Hypoc-Face platform
│   ├── core/                    # Hypoc-Face Core API (FastAPI)
│   │   ├── app/
│   │   ├── tests/
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   ├── rag/                     # RAG Service
│   │   ├── app/
│   │   └── Dockerfile
│   ├── router/                  # Model Router
│   │   └── ...
│   ├── frontend/                # OpenCode Web (modified)
│   │   └── Dockerfile.web
│   ├── infra/                   # Infrastructure
│   │   ├── docker-compose.yml
│   │   ├── k8s/
│   │   └── terraform/
│   └── docs/                    # Hypoc-Face-specific docs
│
├── shared/                      # Integration layer
│   ├── adapters/
│   │   ├── hypoc_loader.py       # Load Hypoc resources
│   │   └── skill_indexer.py     # Index skills into RAG
│   └── config/
│       └── hypoc-face-hypoc-map.yaml   # Resource mapping config
│
├── docs/                        # Top-level docs
│   ├── PROJECT_HYPOC-FACE_PLAN.md    # This file
│   └── INTEGRATION_GUIDE.md    # How Hypoc-Face uses Hypoc
│
└── README.md                    # Updated to explain both
```

**Option B: Git Submodules**

```
${PROJECT_OWNER_HOME}/dev/
├── hypoc/                        # Original repo
│   ├── skills/
│   ├── agents/
│   └── ...
│
└── hypoc-face/                        # New repo
    ├── core/
    ├── rag/
    ├── infra/
    ├── hypoc/ → git submodule    # Points to hypoc repo
    └── docker-compose.yml       # Mounts ../hypoc/skills
```

**Recommendation:** Use **Option A (Monorepo)** because:
- Easier to version together
- Single source of truth
- Simpler CI/CD
- Hypoc resources naturally "graduate" into Hypoc-Face

### 12.3 Hypoc Resource Adapter

**Purpose:** Clean abstraction layer so Hypoc-Face consumes Hypoc resources elegantly

```python
# shared/adapters/hypoc_loader.py

from pathlib import Path
from typing import List, Dict
import yaml

class HypocResourceLoader:
    """
    Loads Hypoc's skills, agents, commands into Hypoc-Face's format
    """
    def __init__(self, hypoc_root: Path):
        self.hypoc_root = hypoc_root
        self.skills_dir = hypoc_root / "skills"
        self.agents_dir = hypoc_root / "agents"
        self.commands_dir = hypoc_root / ".opencode" / "commands"
    
    def load_skills(self) -> List[Dict]:
        """Load all 187 skills"""
        skills = []
        
        for skill_dir in self.skills_dir.iterdir():
            if skill_dir.is_dir():
                skill_file = skill_dir / "SKILL.md"
                if skill_file.exists():
                    skill = self.parse_skill(skill_file)
                    skills.append(skill)
        
        return skills
    
    def parse_skill(self, path: Path) -> Dict:
        """Parse skill markdown with frontmatter"""
        content = path.read_text()
        
        # Extract YAML frontmatter
        if content.startswith("---"):
            parts = content.split("---", 2)
            frontmatter = yaml.safe_load(parts[1])
            body = parts[2].strip()
        else:
            frontmatter = {}
            body = content
        
        return {
            "id": frontmatter.get("name", path.parent.name),
            "name": frontmatter.get("name"),
            "description": frontmatter.get("description"),
            "origin": frontmatter.get("origin", "hypoc"),
            "tools": frontmatter.get("tools", []),
            "content": body,
            "path": str(path),
            "category": self.infer_category(path.parent.name)
        }
    
    def load_agents(self) -> List[Dict]:
        """Load all 50 agents"""
        agents = []
        
        for agent_file in self.agents_dir.glob("*.md"):
            agent = self.parse_agent(agent_file)
            agents.append(agent)
        
        return agents
    
    def parse_agent(self, path: Path) -> Dict:
        """Parse agent markdown definition"""
        # Similar to parse_skill
        pass
    
    def load_commands(self) -> List[Dict]:
        """Load all 34 commands"""
        commands = []
        
        for cmd_file in self.commands_dir.glob("*.md"):
            command = self.parse_command(cmd_file)
            commands.append(command)
        
        return commands
    
    def infer_category(self, skill_name: str) -> str:
        """Infer category from skill name"""
        categories = {
            "frontend": ["react", "vue", "angular", "nextjs"],
            "backend": ["fastapi", "django", "flask", "node"],
            "database": ["postgres", "mongo", "redis"],
            "devops": ["docker", "kubernetes", "aws", "terraform"],
            "security": ["security", "auth", "sso"],
            "testing": ["tdd", "e2e", "testing", "pytest"],
        }
        
        skill_lower = skill_name.lower()
        for category, keywords in categories.items():
            if any(kw in skill_lower for kw in keywords):
                return category
        
        return "general"
```

### 12.4 Docker Compose Integration

```yaml
# hypoc-face/infra/docker-compose.yml

version: '3.8'

services:
  hypoc-face-core:
    build: ../core
    volumes:
      # Mount Hypoc resources as read-only
      - ../../hypoc/skills:/shared/hypoc/skills:ro
      - ../../hypoc/agents:/shared/hypoc/agents:ro
      - ../../hypoc/.opencode:/shared/hypoc/.opencode:ro
      - ../../hypoc/scripts:/shared/hypoc/scripts:ro
      
      # Hypoc-Face-specific storage
      - ./data/workspaces:/workspaces:rw
    environment:
      - HYPOC_RESOURCES_PATH=/shared/hypoc
      - SKILLS_AUTO_INDEX=true
      - AGENTS_AUTO_REGISTER=true

  opencode-web:
    build: ../frontend
    volumes:
      # Skills available in UI
      - ../../hypoc/skills:/workspace/skills:ro
      - ../../hypoc/agents:/workspace/agents:ro
    environment:
      - HYPOC-FACE_API_URL=http://hypoc-face-core:8000
```

### 12.5 Initialization Flow

**On Hypoc-Face Startup:**

```python
# hypoc-face/core/app/main.py

from fastapi import FastAPI
from shared.adapters.hypoc_loader import HypocResourceLoader
from app.services.rag_service import RAGService
from app.services.agent_registry import AgentRegistry

app = FastAPI(title="Hypoc-Face Core API")

@app.on_event("startup")
async def startup():
    print("🚀 Hypoc-Face starting up...")
    
    # 1. Load Hypoc resources
    hypoc_root = Path("/shared/hypoc")
    loader = HypocResourceLoader(hypoc_root)
    
    print("📚 Loading Hypoc skills...")
    skills = loader.load_skills()
    print(f"   Loaded {len(skills)} skills")
    
    print("🤖 Loading Hypoc agents...")
    agents = loader.load_agents()
    print(f"   Loaded {len(agents)} agents")
    
    print("⚡ Loading Hypoc commands...")
    commands = loader.load_commands()
    print(f"   Loaded {len(commands)} commands")
    
    # 2. Index skills into RAG
    print("🔍 Indexing skills into RAG...")
    rag = RAGService.get_instance()
    await rag.index_skills(skills)
    print(f"   Indexed {len(skills)} skills")
    
    # 3. Register agents
    print("📝 Registering agents...")
    registry = AgentRegistry.get_instance()
    for agent in agents:
        registry.register(agent)
    print(f"   Registered {len(agents)} agents")
    
    # 4. Map commands
    print("🎯 Mapping commands...")
    # Command mapping logic
    
    print("✅ Hypoc-Face ready!")
```

### 12.6 Configuration Mapping

```yaml
# shared/config/hypoc-face-hypoc-map.yaml

# Maps Hypoc resources to Hypoc-Face features

skills:
  source: /shared/hypoc/skills
  index_strategy: on_startup_and_watch
  rag_collection: hypoc_skills
  rbac:
    default_access: all_users
    restricted: []  # Skills requiring higher role

agents:
  source: /shared/hypoc/agents
  registry_location: hypoc-face_core
  rbac:
    standard_user:
      - code-reviewer
      - build-error-resolver
      - tdd-guide
    power_user:
      - security-reviewer
      - architect
      - planner
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
    power_user:
      - "*"
    admin:
      - "*"

plugins:
  source: /shared/hypoc/.opencode/plugins
  sandboxed: true
  rbac:
    install: power_user
    use: standard_user
```

### 12.7 Benefits of This Integration

1. **Clean Separation:**
   - Hypoc = content library (skills, agents, commands)
   - Hypoc-Face = platform (auth, multi-tenancy, RAG, routing)

2. **Easy Updates:**
   - Update a skill in `hypoc/skills/` → Hypoc-Face auto-reindexes
   - Add new agent in `hypoc/agents/` → Hypoc-Face auto-registers
   - No Hypoc-Face code changes needed

3. **Versioning:**
   - Git tracks both Hypoc resources and Hypoc-Face code
   - Can rollback Hypoc resources independently
   - Clear history of what changed

4. **Testing:**
   - Test Hypoc resources independently (unit tests)
   - Test Hypoc-Face platform independently (integration tests)
   - Test integration with adapter layer

5. **Scalability:**
   - Hypoc resources read-only (safe to share across containers)
   - Hypoc-Face services stateless (scale horizontally)
   - Clear contract via adapter layer

---

## Next Steps

1. ✅ **Save this plan** to `${PROJECT_DIR}/docs/PROJECT_HYPOC-FACE_PLAN.md`
2. ✅ **Create integration docs** explaining Hypoc-Face ↔ Hypoc relationship
3. ✅ **Set up repository structure** (monorepo with `hypoc/` and `hypoc-face/` dirs)
4. ✅ **Build Hypoc Resource Adapter** as first component
5. ✅ **Phase 1 Implementation** - Start building Hypoc-Face Core API

---

**Ready to build! 🚀**
