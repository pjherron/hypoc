# Hypoc-Face - Enterprise Multi-Tenant AI Platform

Enterprise-grade multi-tenant platform built on top of Hypoc (OpenCode configuration).

## Architecture

Hypoc-Face extends Hypoc's base configuration with:
- **hypoc-face-core**: FastAPI backend with PostgreSQL and multi-tenant RBAC
- **hypoc-face-workspace**: Docker-based isolated workspace management
- **hypoc-face-router**: Model routing and load bhypoccing
- **hypoc-face-agent**: Multi-agent coordination layer
- **hypoc-face-rag**: Qdrant-based RAG system

## Setup

### Prerequisites
- Docker and Docker Compose
- Python 3.12+
- PostgreSQL 15+
- Qdrant vector database

### Installation

1. **Clone with submodules:**
```bash
git clone <hypoc-face-repo-url>
cd hypoc-face
git submodule update --init --recursive
```

2. **Update Hypoc submodule:**
```bash
cd hypoc
git pull origin main
cd ..
```

3. **Configure environment:**
```bash
cp hypoc-face-core/.env.example hypoc-face-core/.env
# Edit hypoc-face-core/.env with your settings
```

4. **Start services:**
```bash
docker-compose up -d
```

## Hypoc Integration

Hypoc-Face uses Hypoc as a git submodule located at `./hypoc/`. This provides:
- Base OpenCode configuration
- 227+ skills library
- 50+ agent definitions
- Infrastructure patterns
- Development workflows

### Syncing with Hypoc

To update to the latest Hypoc changes:
```bash
cd hypoc
git pull origin main
cd ..
git add hypoc
git commit -m "chore: update Hypoc submodule"
```

See `docs/SYNCING_WITH_HYPOC.md` for detailed synchronization workflows.

## Components

### hypoc-face-core
FastAPI backend with:
- Multi-tenant RBAC (Organizations → Teams → Users)
- PostgreSQL with Alembic migrations
- JWT authentication
- Health checks and monitoring

### hypoc-face-workspace
Container management:
- Isolated development environments
- Resource limits and quotas
- Network isolation
- Volume persistence

### hypoc-face-router
Model routing:
- Multiple LLM providers (Bedrock, OpenAI, Anthropic)
- Load bhypoccing
- Fallback strategies
- Cost optimization

### hypoc-face-agent
Agent coordination:
- Multi-agent workflows
- Task distribution
- State management
- Result aggregation

### hypoc-face-rag
RAG system:
- Qdrant vector database
- Document ingestion pipeline
- Semantic search
- Context retrieval

## Development

### Running Tests
```bash
cd hypoc-face-core
pytest
```

### Database Migrations
```bash
cd hypoc-face-core
alembic upgrade head
```

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Documentation

- [Syncing with Hypoc](docs/SYNCING_WITH_HYPOC.md)
- [RBAC System](docs/RBAC.md) (from original docs/PROJECT_HYPOC-FACE_RBAC.md)
- [Integration Guide](docs/INTEGRATION.md) (from original docs/HYPOC-FACE_INTEGRATION_SUMMARY.md)
- [Architecture Decisions](docs/DECISIONS.md) (from original docs/PROJECT_HYPOC-FACE_DECISIONS.md)

## License

See Hypoc's LICENSE file for base configuration licensing.
