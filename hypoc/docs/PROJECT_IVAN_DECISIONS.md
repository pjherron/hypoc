<!-- Configuration variables referenced in this document:
  AWS_REGION                AWS region for deployment (e.g. us-gov-west-1, us-east-1)  (e.g. us-gov-west-1)
  AWS_REGION_SECONDARY      Secondary AWS region  (e.g. us-gov-east-1)
-->

# Project Hypoc-Face - Strategic Decisions Log

**Date:** 2025-01-20  
**Branch:** `feature/hypoc-face`  
**Status:** ✅ Decisions Collected - Ready for Implementation  

---

## Decision Summary

### Timeline & Approach
- **Development Style:** MVP first, then enhance (iterative with demonstrated capabilities)
- **Timeline Philosophy:** "Time is considered a little weirdly here. I like iterating through demonstrated capabilities."
- **Team:** Single developer (you) but open to others joining
- **Interpretation:** Focus on delivering working increments quickly, not rigid phase timelines

### Deployment & Infrastructure
- **Local Development:** Start local (Docker Compose)
- **Production Target:** AWS EC2
- **Authentication:** AWS Cognito (not Keycloak/Auth0)
- **Monitoring:** AWS-native (CloudWatch, X-Ray) - not Prometheus/Grafana
- **Deployment Flow:** Local → EC2

### Compliance & Security
- **FedRAMP Required:** Yes (cloud security certification)
- **CUI Handling:** Yes (controlled unclassified information)
- **RBAC:** Complex (5+ roles) - need to define specific roles
- **Security Priority:** Gov-focused architecture from day 1

### AI Model Providers (Priority Order)

**⚠️ CRITICAL CONSTRAINT: NO FREE MODELS ALLOWED**  
All model access requires paid API keys or enterprise agreements.

1. **AWS Bedrock (Gov Cloud)** ⭐ PRIORITY (Paid enterprise access required)
2. **Azure OpenAI (Gov Cloud)** ⭐ PRIORITY (Paid enterprise access required)
3. **Anthropic** (Claude Opus, Sonnet, Haiku) - Paid API keys only
4. **OpenAI** (GPT-4, GPT-3.5) - Paid API keys only
5. **Local models (Ollama)** - Only for air-gapped scenarios with enterprise licenses

**Critical Notes:**
- Gov Cloud providers have different endpoint URLs, naming conventions, and authentication
- All model usage must be authenticated and billable
- No anonymous or free-tier model access permitted
- All API keys must be enterprise-grade with proper billing accounts

### Scale & Cost
- **Initial Users:** 100 users
- **Budget:** Not a concern ("budget? what? not following")
- **Cost Control:** Flexible per-user/per-group controls
  - Option 1: No hard limits (tracking only)
  - Option 2: Soft limits with warnings
  - Option 3: Hard quota enforcement
  - **All three available, configurable per user/group**

### RAG & Intelligence
- **Phase 2 Priority:** Include workspace indexing from the start
- **Scope:** Skills + agents + user codebase indexing
- **Advanced RAG:** Defer reranking, hybrid search to later phases

---

## Architecture Adjustments Based on Decisions

### ❌ Changes From Original Plan

#### Remove:
- Keycloak (replaced with AWS Cognito)
- Auth0 (not using)
- Prometheus + Grafana (replaced with CloudWatch)
- Loki + Promtail (replaced with CloudWatch Logs)
- On-prem deployment paths (AWS EC2 only)
- 16-week rigid timeline

#### Add:
- AWS Cognito integration
- AWS Bedrock Gov Cloud support
- Azure OpenAI Gov Cloud support
- CloudWatch dashboards
- X-Ray tracing
- Gov Cloud endpoint handling
- Flexible RBAC with 5+ roles

### ✅ Updated Technology Stack

| Component | Technology | Change |
|-----------|-----------|--------|
| **Auth** | AWS Cognito | Changed from Keycloak |
| **Backend** | FastAPI | ✅ No change |
| **Frontend** | OpenCode Web | ✅ No change |
| **Vector DB** | Qdrant | ✅ No change |
| **Database** | PostgreSQL | ✅ No change |
| **Cache** | Redis | ✅ No change |
| **Queue** | RabbitMQ | ✅ No change |
| **Monitoring** | CloudWatch + X-Ray | Changed from Prometheus/Grafana |
| **Logging** | CloudWatch Logs | Changed from Loki |
| **Primary Model** | AWS Bedrock (Gov) | Changed priority |
| **Secondary Model** | Azure OpenAI (Gov) | Changed priority |
| **Deployment** | AWS EC2 | Clarified |

---

## Updated Implementation Approach

### MVP 1: Local Authentication + Core API
**Goal:** Working auth + basic API locally  
**Duration:** 1-2 weeks  
**Demo:** User can log in (mock Cognito), call basic API endpoints

**Deliverables:**
- FastAPI skeleton with mock Cognito JWT validation
- PostgreSQL schema for users, roles, sessions
- Redis session storage
- Basic CRUD endpoints
- Docker Compose with postgres + redis + hypoc-face-core
- Health checks working

### MVP 2: RAG with Skills + Workspace Indexing
**Goal:** Semantic search working  
**Duration:** 1-2 weeks  
**Demo:** Query skills, agents, and a sample workspace via RAG

**Deliverables:**
- Qdrant setup with Docker Compose
- Skill indexing (187 skills)
- Agent indexing (50 agents)
- Workspace file indexing
- RAG query endpoint
- Integration with hypoc-face-core

### MVP 3: Model Routing with Gov Cloud
**Goal:** Call AWS Bedrock + Azure Gov models  
**Duration:** 1-2 weeks  
**Demo:** Chat request routed to Bedrock or Azure Gov based on logic

**Deliverables:**
- AWS Bedrock integration (Gov Cloud endpoints)
- Azure OpenAI integration (Gov Cloud endpoints)
- Anthropic + OpenAI fallbacks
- Basic routing logic (complexity-based)
- Cost tracking per request

### MVP 4: Real Cognito + EC2 Deployment
**Goal:** Deploy to AWS with real auth  
**Duration:** 1-2 weeks  
**Demo:** Working on EC2 with Cognito login

**Deliverables:**
- Cognito user pool setup
- Cognito client integration in hypoc-face-core
- EC2 instance setup
- Docker Compose on EC2
- HTTPS with ACM certificate
- CloudWatch logs integration

### MVP 5: Multi-Workspace Isolation
**Goal:** Per-user workspace containers  
**Duration:** 2-3 weeks  
**Demo:** Multiple users with isolated workspaces

**Deliverables:**
- Workspace service (hypoc-face-workspace)
- Docker-in-Docker for isolation
- EFS for persistent storage
- Resource limits per workspace
- User-specific workspace URLs

### MVP 6: Agent Orchestration
**Goal:** 50 agents working via queue  
**Duration:** 2-3 weeks  
**Demo:** Submit agent task, get result asynchronously

**Deliverables:**
- RabbitMQ setup
- Celery workers
- Agent registry from /agents/
- Task submission API
- Agent result retrieval

### MVP 7: Advanced RBAC + Cost Controls
**Goal:** 5+ roles with granular permissions  
**Duration:** 1-2 weeks  
**Demo:** Different users see different features based on role

**Deliverables:**
- Define 5+ roles (need user input)
- Permission system in PostgreSQL
- Enforce permissions in API
- Per-user/per-group cost controls
- Admin dashboard for cost monitoring

### MVP 8: Production Hardening
**Goal:** Production-ready with monitoring  
**Duration:** 2-3 weeks  
**Demo:** Full system with CloudWatch dashboards, alerts

**Deliverables:**
- CloudWatch dashboards
- X-Ray tracing
- Alarms for errors, latency, cost
- Backup strategy
- Disaster recovery plan
- Security audit pass

---

## Questions Still Needed

### RBAC Roles (Complex - 5+)
Need to define:
1. What are the 5+ roles?
2. What permissions does each role have?
3. What cost quotas for each role?

**Proposed Roles (for validation):**
- **Super Admin** - Full system access, all users, all costs
- **Admin** - Manage team, view costs, assign roles
- **Power User** - All models, high quotas, advanced features
- **Developer** - Code-focused, medium quotas, dev tools
- **Analyst** - Read-only, low quotas, report generation
- **Guest** - Limited trial access, very low quotas

### Model Provider Details
Need AWS account info:
- AWS Account ID for Bedrock Gov Cloud
- Azure Gov Cloud subscription ID
- Region preferences (${AWS_REGION_SECONDARY}, ${AWS_REGION})

### Initial Deployment Scale
- EC2 instance size?
- RDS or PostgreSQL on EC2?
- EFS or EBS for storage?
- Load bhypoccer needed?

---

## Updated Docker Compose Plan

### docker-compose.yml (Local Dev)
```yaml
services:
  # Phase 0 (working)
  opencode-web:
    ...
  
  # MVP 1 (next)
  postgres:
    ...
  redis:
    ...
  hypoc-face-core:
    environment:
      - AUTH_PROVIDER=cognito_mock  # Mock for local dev
    ...
  
  # MVP 2
  qdrant:
    ...
  hypoc-face-rag:
    volumes:
      - ./skills:/app/skills:ro
      - ./agents:/app/agents:ro
      - ./workspace-sample:/app/workspace:ro
    ...
  
  # MVP 3
  hypoc-face-router:
    environment:
      - AWS_BEDROCK_GOV_ENDPOINT=...
      - AZURE_OPENAI_GOV_ENDPOINT=...
    ...
  
  # MVP 6
  rabbitmq:
    ...
  hypoc-face-agent:
    ...
```

### docker-compose.prod.yml (EC2)
```yaml
services:
  hypoc-face-core:
    environment:
      - AUTH_PROVIDER=cognito
      - COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID}
      - COGNITO_REGION=${AWS_REGION}
      - CLOUDWATCH_ENABLED=true
    ...
```

---

## Next Immediate Steps

### 1. Define RBAC Roles (Need User Input)
What are the 5+ roles and their permissions?

### 2. Start MVP 1
- Create hypoc-face-core FastAPI skeleton
- PostgreSQL schema with Alembic
- Mock Cognito JWT validation
- Basic endpoints (health, user profile)

### 3. AWS Account Setup (Parallel)
- Cognito user pool creation
- Bedrock Gov Cloud access request
- Azure OpenAI Gov Cloud access request
- EC2 instance provisioning

---

**Decision Date:** 2025-01-20  
**Next Review:** After MVP 1 completion  
**Status:** ✅ Ready to begin MVP 1 implementation
