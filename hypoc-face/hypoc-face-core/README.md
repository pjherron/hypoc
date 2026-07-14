<!-- Configuration variables referenced in this document:
  AWS_REGION                AWS region for deployment (e.g. us-gov-west-1, us-east-1)  (e.g. us-gov-west-1)
-->

# Hypoc-Face Core - Backend API Service

**Status:** ✅ MVP 1 Complete - Basic auth + RBAC operational  
**Port:** 8000  
**Stack:** FastAPI + SQLAlchemy + Alembic + PostgreSQL + Redis

---

## ⚠️ CRITICAL: No Free Models Policy

**ALL AI model access requires paid enterprise credentials.**

- ❌ No free-tier API usage
- ❌ No anonymous model requests
- ❌ No unauthenticated access
- ✅ Enterprise API keys only
- ✅ Full cost tracking and quota enforcement
- ✅ Audit logging for all model usage

**Never commit API keys to git. Always use environment variables.**

---

## Quick Start

### 1. Configure Environment

```bash
# Copy template
cp .env.example .env

# Edit .env and add your PAID enterprise API keys
nano .env
```

**Required for production:**
- AWS Bedrock GovCloud credentials (priority #1)
- OR Azure OpenAI Government Cloud credentials (priority #2)
- Database and Redis connection strings
- JWT secret for authentication

### 2. Start with Docker Compose

```bash
# From project root
docker compose --profile phase1 up -d

# Check status
docker compose --profile phase1 ps

# View logs
docker logs -f hypoc-face-core
```

### 3. Verify Deployment

```bash
# Health check
curl http://localhost:8000/api/v1/health

# List roles
curl http://localhost:8000/api/v1/roles | jq .

# List users (requires auth when AUTH_PROVIDER != none)
curl http://localhost:8000/api/v1/users
```

---

## API Endpoints

### Health
- `GET /api/v1/health` - Detailed health status

### Users (CRUD)
- `GET /api/v1/users` - List all users
- `GET /api/v1/users/{id}` - Get user by ID
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Roles (CRUD)
- `GET /api/v1/roles` - List all roles
- `GET /api/v1/roles/{id}` - Get role with permissions
- `POST /api/v1/roles` - Create custom role (admin only)
- `PUT /api/v1/roles/{id}` - Update role (admin only)
- `DELETE /api/v1/roles/{id}` - Delete role (admin only)

**API Docs:** http://localhost:8000/docs (development mode only)

---

## Default Roles

| Role | Quota | Permissions | Description |
|------|-------|-------------|-------------|
| **super_admin** | Unlimited | 70/70 | Full system access |
| **admin** | $5,000/mo | 69/70 | Organization management |
| **power_user** | $2,000/mo | 35/70 | All models + features |
| **developer** | $500/mo | 17/70 | Code-focused workflows |
| **analyst** | $200/mo | 10/70 | Read-focused access |
| **guest** | $50/mo | 7/70 | Limited trial access |

---

## AI Model Configuration

### AWS Bedrock (GovCloud) - Priority #1

```bash
AWS_BEDROCK_REGION=${AWS_REGION}
AWS_BEDROCK_ACCESS_KEY_ID=AKIA...  # Paid enterprise account
AWS_BEDROCK_SECRET_ACCESS_KEY=...  # Never commit
AWS_BEDROCK_ENABLED=true
```

### Azure OpenAI (Government) - Priority #2

```bash
AZURE_OPENAI_ENDPOINT=https://YOUR-RESOURCE.openai.azure.us/
AZURE_OPENAI_API_KEY=...  # Paid enterprise key
AZURE_OPENAI_ENABLED=true
```

**⚠️ ALL providers require paid enterprise accounts. No free tiers allowed.**

---

## Development

```bash
# Run tests
docker compose exec hypoc-face-core pytest

# Database shell
docker compose exec postgres psql -U hypoc-face -d hypoc-face

# Redis CLI
docker compose exec redis redis-cli
```

---

## Security Notes

### ⚠️ Never Commit These
- `.env` files (contains secrets)
- API keys or tokens
- Database passwords

### ✅ Always Do This
- Use environment variables for secrets
- Rotate API keys regularly
- Review audit logs weekly

---

## Next: MVP 2 (RAG Integration)

See `docs/PROJECT_HYPOC-FACE_PLAN.md` for full roadmap.
