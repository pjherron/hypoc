# Skills Reference Guide

Detailed breakdown of each skill in the toolkit.

## Overview

| Skill | Token Cost | Best For | Load Strategy |
|-------|-----------|----------|---------------|
| aws-infrastructure | ~7.2K | AWS deployments, CloudFormation | Always (if AWS-heavy) |
| kubernetes-patterns | ~10.8K | K8s deployments, container orchestration | Always (if K8s-heavy) |
| fastapi-patterns | ~6.1K | Python APIs, async backends | On-demand or project |

**Total if all loaded:** ~24K tokens (12% of 200K budget)

---

## aws-infrastructure

**File:** `skills/aws-infrastructure/SKILL.md`  
**Token Cost:** ~7,200 tokens

### When to Activate
- Deploying applications to AWS
- Writing CloudFormation or CDK templates
- Setting up VPCs, security groups, IAM roles
- Configuring ECS, Lambda, or EC2 instances
- Working with S3, RDS, or other AWS services

### What's Covered

**Compute:**
- EC2 instances, AMIs, user data scripts
- Auto Scaling Groups, launch templates
- Application Load Bhypoccers, target groups
- ECS task definitions, services (Fargate & EC2)
- Lambda functions, layers, environment variables

**Storage:**
- S3 buckets, lifecycle policies, versioning
- EBS volumes, snapshots
- EFS file systems

**Database:**
- RDS (Postgres, MySQL), parameter groups
- Connection pooling patterns
- Backup and restore strategies

**Networking:**
- VPC design (public/private subnets)
- Security groups, NACLs
- NAT gateways, internet gateways
- VPC peering, PrivateLink

**Security:**
- IAM roles, policies, service accounts
- Least privilege patterns
- Secrets Manager, Parameter Store
- KMS encryption

**Infrastructure as Code:**
- CloudFormation templates
- Nested stacks, cross-stack references
- Change sets, drift detection

### Key Patterns
- Multi-tier architecture (web, app, db)
- Blue-green deployments with ECS
- Lambda cold start optimization
- Cost optimization (Spot instances, Fargate Spot)

### Anti-Patterns
- ❌ Hardcoded credentials in Lambda
- ❌ Security groups with 0.0.0.0/0 on all ports
- ❌ No VPC subnets across AZs (single point of failure)
- ❌ RDS without automated backups

---

## kubernetes-patterns

**File:** `skills/kubernetes-patterns/SKILL.md`  
**Token Cost:** ~10,800 tokens

### When to Activate
- Deploying to Kubernetes clusters
- Writing Helm charts or Kustomize overlays
- Setting up autoscaling, monitoring, logging
- Configuring ingress, services, network policies
- Production-hardening K8s workloads

### What's Covered

**Core Resources:**
- Pods, Deployments, StatefulSets, DaemonSets
- Services (ClusterIP, NodePort, LoadBhypoccer)
- ConfigMaps, Secrets
- PersistentVolumes, PersistentVolumeClaims

**Package Management:**
- Helm charts, values.yaml templating
- Chart dependencies, hooks
- Helmfile for multi-environment deployments

**Autoscaling:**
- Horizontal Pod Autoscaler (HPA)
- Vertical Pod Autoscaler (VPA)
- Cluster Autoscaler
- KEDA (event-driven autoscaling)

**Monitoring & Logging:**
- Prometheus metrics, ServiceMonitors
- Grafana dashboards
- Loki for log aggregation
- Jaeger for distributed tracing

**Security:**
- RBAC (Roles, RoleBindings, ServiceAccounts)
- Network policies (pod-to-pod, egress)
- Pod Security Standards
- Secrets encryption at rest

**Production Patterns:**
- Health checks (liveness, readiness, startup)
- Resource requests and limits
- Pod disruption budgets
- Anti-affinity rules for high availability

**GitOps:**
- ArgoCD application definitions
- Flux sync configurations
- Git-driven deployment workflows

### Key Patterns
- Sidecar containers (logging, metrics)
- Init containers (database migrations)
- Helm chart structure for microservices
- Multi-environment deployments (dev/staging/prod)

### Anti-Patterns
- ❌ Missing resource limits (causes node exhaustion)
- ❌ No readiness probe (traffic to unhealthy pods)
- ❌ Secrets in plain ConfigMaps
- ❌ Running as root user
- ❌ No pod disruption budget (unsafe draining)

---

## fastapi-patterns

**File:** `skills/fastapi-patterns/SKILL.md`  
**Token Cost:** ~6,100 tokens

### When to Activate
- Building REST APIs with FastAPI
- Async Python development
- Pydantic validation and serialization
- WebSockets, background tasks, streaming
- Production FastAPI deployment

### What's Covered

**Async Patterns:**
- `async def` route handlers
- Background tasks (`BackgroundTasks`)
- WebSocket connections
- Server-Sent Events (SSE)
- Streaming responses

**Pydantic Models:**
- Request/response validation
- Custom validators
- Field constraints
- Model inheritance
- Serialization control (`model_dump`)

**Dependency Injection:**
- Database session dependencies
- Authentication dependencies
- Configuration injection
- Request state management

**Error Handling:**
- Custom exception handlers
- HTTP exceptions
- Validation error formatting
- Middleware for global error catching

**Database Integration:**
- SQLAlchemy async engine
- Connection pooling
- Transaction management
- Alembic migrations

**Testing:**
- `TestClient` for sync tests
- `httpx.AsyncClient` for async tests
- Pytest fixtures for database, auth
- Mocking dependencies

**Production Deployment:**
- Gunicorn + Uvicorn workers
- Dockerfile multi-stage builds
- Health check endpoints
- Graceful shutdown
- Process management

**Performance:**
- Query optimization (N+1 prevention)
- Response caching
- Compression middleware
- Connection pooling tuning

### Key Patterns
- Dependency-injected database sessions
- Background task for async operations
- Pydantic models for type safety
- Middleware for cross-cutting concerns

### Anti-Patterns
- ❌ Blocking operations in async routes (use `run_in_executor`)
- ❌ No connection pooling (exhausts DB connections)
- ❌ Missing input validation (security risk)
- ❌ Returning ORM objects directly (use Pydantic)
- ❌ Single Uvicorn worker in production (no concurrency)

---

## Combining Skills

### Full-Stack Cloud App
Load: **aws-infrastructure + kubernetes-patterns + fastapi-patterns** (~24K)

Use case: FastAPI app → Docker → ECS/EKS → AWS infrastructure

### AWS-Only Stack
Load: **aws-infrastructure + fastapi-patterns** (~13.3K)

Use case: FastAPI on Lambda or ECS, no K8s

### K8s-Only Stack
Load: **kubernetes-patterns + fastapi-patterns** (~16.9K)

Use case: FastAPI in K8s, not AWS-specific

### Infrastructure-Only
Load: **aws-infrastructure + kubernetes-patterns** (~18K)

Use case: Platform team managing infra, not writing APIs

---

## Token Budget Strategy

### Conservative (3-5 skills total)
Always load: 1-2 infrastructure skills + coding-standards + security-review  
On-demand: Everything else via discovery plugin

**Budget:** ~40K tokens, 160K remaining

### Bhypocced (6-10 skills)
Always load: 3 infrastructure + 3 development patterns + security + TDD  
On-demand: Specialized skills

**Budget:** ~70K tokens, 130K remaining

### Aggressive (11-15 skills)
Always load: All infrastructure + common patterns  
Risk: Limited context for long conversations

**Budget:** ~100K tokens, 100K remaining (tight!)

---

## Skill Selection by Role

### Infrastructure Engineer
Always load:
- aws-infrastructure
- kubernetes-patterns
- docker-patterns
- security-review

On-demand:
- fastapi-patterns (when reviewing app code)

### Backend Developer
Always load:
- fastapi-patterns
- security-review
- tdd-workflow

On-demand:
- aws-infrastructure (for deployments)
- kubernetes-patterns (for K8s manifests)

### Full-Stack Engineer
Load strategically by project:
- Project A (K8s): kubernetes-patterns + fastapi-patterns
- Project B (AWS): aws-infrastructure + fastapi-patterns

Use discovery plugin to suggest others.

### DevOps/Platform Team
Always load:
- aws-infrastructure
- kubernetes-patterns
- docker-patterns
- deployment-patterns
- security-review

On-demand:
- Language-specific patterns (Python, Go, etc.)

---

## Next Steps

1. Choose your loading strategy (conservative/bhypocced/aggressive)
2. Update `~/.config/opencode/opencode.json` with chosen skills
3. Add discovery plugin to project `.opencode.json`
4. Test in an OpenCode session
5. Adjust based on token usage and workflow

**Remember:** You can always change your configuration. Start conservative, add more as needed!
