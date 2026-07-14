<!-- Configuration variables referenced in this document:
  PROJECT_DIR               Local project root directory  (e.g. /Users/pherron6/dev/opencode)
-->

# Infrastructure Skills - Complete Setup

## ✅ What Changed

### Global Skills (Always Loaded) - Updated from 5 → 13 skills

**Core Enterprise AI (unchanged):**
1. coding-standards (~3.8K tokens)
2. security-review (~4.2K tokens)
3. tdd-workflow (~5.1K tokens)
4. eval-harness (~2.8K tokens)
5. deep-research (~4.0K tokens)

**Infrastructure & DevOps (NEW):**
6. docker-patterns (~5K tokens) - Dockerfiles, compose, multi-stage builds
7. python-patterns (~11K tokens) - Pythonic idioms, FastAPI integration
8. mcp-server-patterns (~1K tokens) - MCP server development
9. deployment-patterns (~6K tokens) - CI/CD, blue-green, canary deployments
10. terminal-ops (~1K tokens) - Linux shell, bash scripting

**Cloud & Orchestration (CUSTOM - NEW):**
11. **aws-infrastructure (~15K tokens)** - EC2, ECS, Lambda, S3, RDS, VPC, IAM
12. **kubernetes-patterns (~18K tokens)** - K8s manifests, Helm, autoscaling, monitoring
13. **fastapi-patterns (~12K tokens)** - FastAPI async patterns, WebSockets, Pydantic

**Total baseline: ~89K tokens (45% of 200K budget)**

---

## 📊 Token Budget Impact

### Before (8 skills):
```
200K total
├─ 32K  Always-loaded skills
├─ 80K  Conversation + tools
└─ 88K  Available (44%)
```

### After (13 skills):
```
200K total
├─ 89K  Always-loaded skills
├─ 80K  Conversation + tools  
└─ 31K  Available (16%)
```

**Trade-off**: Less room for on-demand skills, but you have infrastructure patterns **instantly available** without thinking about loading them.

---

## 🎯 What You Can Do Now

### AWS Infrastructure
```
You: "Deploy this FastAPI app to ECS Fargate"
Me: *Knows ECS task definitions, Fargate, CloudWatch Logs*
    *Provides production-ready manifest*

You: "Set up S3 bucket with encryption and lifecycle"
Me: *Applies AWS security best practices automatically*
```

### Kubernetes
```
You: "Create K8s deployment with HPA"
Me: *Knows deployment manifests, autoscaling, health checks*
    *Provides production-ready YAML*

You: "Add ingress with TLS"
Me: *Knows ingress controller, cert-manager patterns*
```

### FastAPI
```
You: "Build a FastAPI endpoint with WebSocket support"
Me: *Knows async patterns, Pydantic validation, dependency injection*
    *Implements production-ready async code*
```

### Docker + CI/CD
```
You: "Dockerize this Python app"
Me: *Knows multi-stage builds, security best practices*

You: "Set up GitHub Actions for deployment"
Me: *Knows deployment patterns, rollback strategies*
```

---

## 📁 Custom Skills Created

### 1. AWS Infrastructure (`${PROJECT_DIR}/skills/aws-infrastructure/SKILL.md`)

**Coverage:**
- EC2, ECS Fargate, Lambda
- S3, RDS, VPC, Security Groups
- IAM policies and roles
- CloudFormation, CDK
- Cost optimization
- Multi-region architecture
- Monitoring with CloudWatch, X-Ray

**Key Patterns:**
- Serverless architecture (Lambda + API Gateway)
- Container orchestration (ECS Fargate)
- Infrastructure as Code (CloudFormation/CDK)
- Security best practices (encryption, IAM)

### 2. Kubernetes Patterns (`${PROJECT_DIR}/skills/kubernetes-patterns/SKILL.md`)

**Coverage:**
- Core concepts: Pods, Deployments, Services, Ingress
- Autoscaling: HPA, VPA
- Storage: PersistentVolumes, StatefulSets
- Jobs & CronJobs
- Security: NetworkPolicies, Pod Security Standards
- Helm charts
- Monitoring & logging
- Troubleshooting

**Key Patterns:**
- Rolling updates with zero downtime
- Horizontal pod autoscaling
- Health checks (liveness/readiness)
- Secrets management
- Production deployment best practices

### 3. FastAPI Patterns (`${PROJECT_DIR}/skills/fastapi-patterns/SKILL.md`)

**Coverage:**
- Async endpoints and database operations
- Pydantic models for validation
- Dependency injection
- WebSockets and streaming
- Background tasks
- Authentication/authorization
- File uploads
- Error handling
- Testing with TestClient
- Production deployment (Gunicorn + Uvicorn)

**Key Patterns:**
- Async everything for I/O
- Type-safe validation with Pydantic
- Reusable dependencies
- Streaming responses
- Background task processing

---

## 🔧 Configuration Files Updated

### Global Config
**File**: `~/.config/opencode/opencode.json`
- Added 8 new infrastructure skills
- All projects now have these patterns available

### Project Config  
**File**: `${PROJECT_DIR}/.opencode.json`
- Still has 3 frontend/backend skills
- Plus discovery plugin

---

## ⚡ Performance Considerations

### Token Budget

**89K tokens is high but manageable** for your use case:

✅ **Pros:**
- Instant access to all infrastructure patterns
- No context switching or skill loading
- Faster development (no "load X skill" step)

⚠️ **Cons:**
- Less room for conversation history (~80K baseline vs ~30K before)
- Fewer on-demand skills can fit
- Larger prompts = slightly higher costs

### When to Reduce

If you find conversations getting cut short:

**Option 1: Move some to project-level**
```json
// Move AWS/K8s to project .opencode.json instead of global
// Keep global lean (~40K tokens)
```

**Option 2: Use discovery plugin more**
```
// Load FastAPI/K8s only when needed via plugin suggestion
// Keep global at ~50K tokens
```

**Option 3: Create project-specific configs**
```
~/dev/ml-project/.opencode.json     → pytorch-patterns, eval-harness
~/dev/api-project/.opencode.json    → fastapi-patterns, api-design
~/dev/infra-project/.opencode.json  → aws, kubernetes, docker
```

---

## 🧪 Testing Your Setup

### Test 1: AWS Knowledge
```
You: "How do I deploy a FastAPI app to ECS Fargate?"
Expected: Detailed ECS task definition + deployment steps
```

### Test 2: Kubernetes Knowledge
```
You: "Create a K8s deployment with 3 replicas and HPA"
Expected: Complete YAML manifest with autoscaling
```

### Test 3: FastAPI Knowledge
```
You: "Build a FastAPI endpoint with WebSocket support"
Expected: Async WebSocket implementation with connection manager
```

### Test 4: Combined Knowledge
```
You: "Containerize a FastAPI app and deploy to ECS with auto-scaling"
Expected: Dockerfile + ECS manifest + autoscaling config
```

---

## 📚 Quick Reference

### All Your Always-Loaded Skills (13 total)

| Category | Skills | Tokens |
|----------|--------|--------|
| **Core** | coding-standards, security-review, tdd-workflow, eval-harness, deep-research | ~20K |
| **DevOps** | docker-patterns, deployment-patterns, terminal-ops | ~12K |
| **Backend** | python-patterns, fastapi-patterns, mcp-server-patterns | ~24K |
| **Cloud** | aws-infrastructure, kubernetes-patterns | ~33K |
| **TOTAL** | 13 skills | **~89K** |

### Skill Locations

**ECC (npm):**
- `/opt/homebrew/lib/node_modules/ecc-universal/skills/`

**Custom (local):**
- `${PROJECT_DIR}/skills/aws-infrastructure/`
- `${PROJECT_DIR}/skills/kubernetes-patterns/`
- `${PROJECT_DIR}/skills/fastapi-patterns/`

---

## 🔄 Optional: Add OpenWebUI Skill

You mentioned OpenWebUI but I didn't create that skill yet. Would you like me to add:

1. **open-webui-deployment** - Deploying Open WebUI on K8s/Docker
2. **open-webui-customization** - Customizing Open WebUI UI/features
3. **open-webui-integration** - Integrating LLMs with Open WebUI

Let me know and I'll create it!

---

## 💡 Recommendations

### For Your Workflow (Enterprise AI)

**Keep current 13-skill setup IF:**
- You switch between AWS/K8s/FastAPI frequently (every session)
- Token budget isn't constraining conversations
- You value instant access over token efficiency

**Optimize to ~50K baseline IF:**
- Conversations are getting cut short
- You specialize more (e.g., mostly AWS, rarely K8s)
- You want more room for exploration

### Suggested Optimization

Move cloud-specific to project configs:

**~/.config/opencode/opencode.json** (40K tokens):
```json
{
  "instructions": [
    "coding-standards",
    "security-review",
    "tdd-workflow",
    "eval-harness",
    "deep-research",
    "docker-patterns",
    "python-patterns",
    "fastapi-patterns"
  ]
}
```

**~/dev/aws-project/.opencode.json**:
```json
{
  "instructions": ["aws-infrastructure", "deployment-patterns"]
}
```

**~/dev/k8s-project/.opencode.json**:
```json
{
  "instructions": ["kubernetes-patterns", "deployment-patterns"]
}
```

---

## ✅ Ready to Use

Your setup is complete! All 13 skills are loaded and ready.

**Try it now:**
```
"Deploy a FastAPI app to AWS ECS with autoscaling and monitoring"
```

I'll use all the relevant patterns automatically! 🚀

---

**Files Created:**
- `${PROJECT_DIR}/skills/aws-infrastructure/SKILL.md`
- `${PROJECT_DIR}/skills/kubernetes-patterns/SKILL.md`
- `${PROJECT_DIR}/skills/fastapi-patterns/SKILL.md`

**Config Updated:**
- `~/.config/opencode/opencode.json` - 13 global skills
