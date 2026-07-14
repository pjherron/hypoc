# Enterprise AI Developer Stack

One-command install for a team-ready AI developer platform.

## What's Included

| Component | Role |
|---|---|
| `hypoc` | OpenCode CLI environment with curated skills and agents |
| `hypoc-face` | Browser UI with cost dashboard, session viewer, model router |
| `skills/` | ~60 curated skills: planning pipeline, developer productivity, stack infrastructure |
| `agents/` | Focused agent library: planning, review, triage, ops |

## Quick Start

```bash
git clone <repo>
cd enterprise-toolkit
npm install -g .
enterprise-toolkit install
```

The installer:
1. Configures `hypoc` as the OpenCode environment
2. Starts `hypoc-face` services (FastAPI backend + browser UI)
3. Sets up the four-tier model router (local → self-hosted → Copilot → premium)
4. Initializes PostgreSQL schema (shadow profiles, model usage tracking)
5. Runs `workspace-surface-audit` to verify the environment

## First Session

Open the terminal and describe what you want to do in plain English. The platform detects intent, suggests the right skill, and asks before running anything.

Or open the browser UI at `http://localhost:8080` for the visual interface.

## Model Routing

Cost tracked per session, visible in the browser UI. Cheapest capable model first:

1. Local (Ollama) — free
2. Self-hosted LLM — free at point of use
3. GitHub Copilot — from your allocation
4. Premium hosted — TBD

No LiteLLM. See [ADR 0002](../docs/adr/0002-model-router-no-litellm.md).

## What's Included

### 🎯 Custom Skills (3)

**Infrastructure & Cloud:**
- `aws-infrastructure` - EC2, ECS, Lambda, S3, RDS, VPC, IAM, CloudFormation patterns
- `kubernetes-patterns` - Manifests, Helm, autoscaling, monitoring, security best practices
- `fastapi-patterns` - Async patterns, Pydantic validation, WebSockets, production deployment

**Token Cost:** ~24K tokens (12% of 200K budget)

### 🧠 Context-Aware Discovery Plugin

Automatically suggests relevant skills based on:
- Project type detection (package.json, go.mod, Dockerfile, etc.)
- Keyword matching in your prompts
- Session memory (doesn't re-suggest)
- Token cost preview before loading

**Example:**
```
User: "Deploy this FastAPI app to ECS"
Plugin: "💡 Suggested: fastapi-patterns (6.1K), aws-infrastructure (7.2K) - Load? (13.3K total)"
```

### 📚 Production Examples

- `ml-api/` - Complete ML API deployment example
  - FastAPI application with ML inference
  - Dockerfile with multi-stage builds
  - ECS task definition and service config
  - CloudFormation infrastructure templates
  - Health checks and monitoring

## Installation

### Option 1: Global Install (Recommended)

```bash
# From GitLab (after you push)
npm install -g git+https://git.example.edu/pjherron/opencode-enterprise-toolkit.git

# From local directory (for testing)
cd enterprise-toolkit
npm install -g .
```

Skills will be available at:
```
/opt/homebrew/lib/node_modules/@your-org/opencode-enterprise-toolkit/skills/
```

### Option 2: Local Project Install

```bash
npm install git+https://git.example.edu/pjherron/opencode-enterprise-toolkit.git
```

## Usage

### Always-Loaded Skills (Global Config)

Add to `~/.config/opencode/opencode.json`:

```json
{
  "instructions": [
    "file:///opt/homebrew/lib/node_modules/@your-org/opencode-enterprise-toolkit/skills/aws-infrastructure/SKILL.md",
    "file:///opt/homebrew/lib/node_modules/@your-org/opencode-enterprise-toolkit/skills/kubernetes-patterns/SKILL.md",
    "file:///opt/homebrew/lib/node_modules/@your-org/opencode-enterprise-toolkit/skills/fastapi-patterns/SKILL.md"
  ]
}
```

**Note:** Always-loaded skills consume tokens on every message. Choose wisely based on your typical workflow.

### On-Demand Skills (Project Config)

Add to project `.opencode.json`:

```json
{
  "instructions": [
    "file://./node_modules/@your-org/opencode-enterprise-toolkit/skills/aws-infrastructure/SKILL.md"
  ]
}
```

### Discovery Plugin (Recommended)

Add to project `.opencode.json`:

```json
{
  "plugins": [
    {
      "name": "skill-discovery",
      "path": "./node_modules/@your-org/opencode-enterprise-toolkit/plugins/skill-discovery.js",
      "enabled": true
    }
  ]
}
```

The plugin will automatically suggest skills when relevant.

## Skills Reference

### aws-infrastructure

**When to use:** Working with AWS services, infrastructure as code, cloud deployments

**Covers:**
- EC2: Instances, Auto Scaling Groups, Load Bhypoccers
- ECS: Task definitions, services, Fargate vs EC2 launch types
- Lambda: Functions, layers, event sources, cold starts
- S3: Buckets, lifecycle policies, CORS, presigned URLs
- RDS: Postgres, MySQL, connection pooling, backups
- VPC: Subnets, security groups, NAT gateways, peering
- IAM: Roles, policies, least privilege, service accounts
- CloudFormation: Stacks, nested stacks, change sets

**Token cost:** ~7.2K

### kubernetes-patterns

**When to use:** Deploying to Kubernetes, container orchestration, microservices

**Covers:**
- Manifests: Pods, Deployments, Services, ConfigMaps, Secrets
- Helm: Charts, values, templating, dependencies
- Autoscaling: HPA, VPA, cluster autoscaler
- Monitoring: Prometheus, Grafana, logging patterns
- Security: RBAC, network policies, pod security
- Production: Health checks, resource limits, anti-affinity
- GitOps: ArgoCD, Flux patterns

**Token cost:** ~10.8K

### fastapi-patterns

**When to use:** Building APIs with FastAPI, async Python, high-performance backends

**Covers:**
- Async patterns: Background tasks, WebSockets, streaming
- Pydantic: Validation, serialization, custom validators
- Dependency injection: Auth, database, configuration
- Error handling: Custom exceptions, middleware
- Testing: pytest, TestClient, async fixtures
- Production: Gunicorn, uvicorn, Docker, health checks
- Database: SQLAlchemy async, connection pooling

**Token cost:** ~6.1K

## Examples

### ML API Deployment

See `examples/ml-api/` for a complete example:

```bash
# Run locally
cd examples/ml-api
pip install -r requirements.txt
uvicorn main:app --reload

# Build and test Docker image
docker build -t ml-api .
docker run -p 8000:8000 ml-api

# Deploy to ECS
aws cloudformation create-stack \
  --stack-name ml-api-infra \
  --template-body file://cloudformation/infrastructure.yaml

aws ecs create-service \
  --cluster ml-cluster \
  --service-name ml-api \
  --cli-input-json file://ecs/service.json
```

## Development

### Adding New Skills

1. Create skill directory: `skills/my-skill/`
2. Add `SKILL.md` with YAML frontmatter:
```yaml
---
name: my-skill
description: Brief description
origin: ECC
---
```
3. Document patterns, examples, anti-patterns
4. Add tests if applicable

### Testing Skills

```bash
# Test in local OpenCode session
opencode --config test-config.json

# Check token count
wc -w skills/my-skill/SKILL.md
# Multiply by ~1.3 for token estimate
```

### Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature/my-skill`
3. Commit changes: `git commit -am 'Add my-skill'`
4. Push: `git push origin feature/my-skill`
5. Create merge request

## Token Budget Guidelines

| Total Skills | Baseline Cost | Remaining (200K) | Use Case |
|--------------|---------------|------------------|----------|
| 0-5 skills | ~30K tokens | 170K | Focused sessions |
| 6-10 skills | ~60K tokens | 140K | Bhypocced setup |
| 11-15 skills | ~90K tokens | 110K | Full-stack work |
| 16+ skills | 100K+ tokens | <100K | Risky - use discovery plugin |

**Recommendation:** Load 3-5 always-on skills for your core stack, use discovery plugin for the rest.

## Architecture

```
enterprise-toolkit/
├── skills/                    # Skill modules
│   ├── aws-infrastructure/
│   │   └── SKILL.md
│   ├── kubernetes-patterns/
│   │   └── SKILL.md
│   └── fastapi-patterns/
│       └── SKILL.md
├── plugins/                   # Discovery and tooling
│   ├── skill-discovery.ts     # TypeScript source
│   ├── skill-discovery.js     # Compiled plugin
│   └── README.md
├── examples/                  # Reference implementations
│   └── ml-api/
├── docs/                      # Additional documentation
├── package.json
└── README.md
```

## FAQ

**Q: How do I know which skills to load always vs on-demand?**

Load always: Skills you use every day (e.g., if you're primarily AWS infra, load `aws-infrastructure`)
Load on-demand: Skills you use occasionally (use discovery plugin or manual skill tool)

**Q: Can I contribute skills back to ECC upstream?**

Yes! These skills are designed to be upstreamed. Submit PRs to the main ECC repo.

**Q: What's the difference between this and ECC?**

- ECC: 183+ general-purpose skills for all frameworks
- This toolkit: Enterprise-focused infrastructure skills + smart discovery
- Use both together: ECC for breadth, this for depth

**Q: How do I update to the latest version?**

```bash
npm update -g @your-org/opencode-enterprise-toolkit
```

## License

MIT

## Support

- Issues: https://git.example.edu/pjherron/opencode-enterprise-toolkit/-/issues
- Internal [Org] wiki: [Link to internal docs]
- Contact: author@example.edu

---

**Built with ❤️ for enterprise AI infrastructure work**
