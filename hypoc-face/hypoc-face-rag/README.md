# Hypoc-Face RAG - Retrieval Augmented Generation Service

**Status:** 🚧 Coming in Phase 2  
**Tech Stack:** FastAPI, Qdrant, sentence-transformers, LangChain  

## Purpose

The **hypoc-face-rag** service provides intelligent context retrieval from:

- 📚 **187 ECC Skills** - Indexed and searchable via semantic search
- 🤖 **50 Agents** - Agent definitions and capabilities
- 📁 **User Codebases** - Per-workspace code indexing
- 📝 **Documentation** - Project docs, README files
- 💬 **Conversation History** - Previous chat context

## Architecture

```
┌──────────────────┐
│   OpenCode Web   │
└────────┬─────────┘
         │
         v
┌──────────────────┐
│   hypoc-face-router    │ ← Calls RAG for context
└────────┬─────────┘
         │
         v
┌──────────────────┐
│    hypoc-face-rag      │
│    FastAPI       │
├──────────────────┤
│ - Query endpoint │
│ - Index endpoint │
│ - Embedding gen  │
│ - Reranking      │
└────────┬─────────┘
         │
         v
┌──────────────────┐
│     Qdrant       │
│   Vector DB      │
├──────────────────┤
│ Collections:     │
│ - skills         │
│ - agents         │
│ - codebase       │
│ - conversations  │
└──────────────────┘
```

## API Endpoints (Planned)

### Query
- `POST /api/v1/rag/query` - Semantic search across all collections
- `POST /api/v1/rag/query/skills` - Search skills only
- `POST /api/v1/rag/query/code` - Search user's codebase
- `POST /api/v1/rag/query/history` - Search conversation history

### Indexing
- `POST /api/v1/rag/index/skills` - Index all skills (admin only)
- `POST /api/v1/rag/index/workspace/{id}` - Index user's workspace
- `DELETE /api/v1/rag/index/workspace/{id}` - Delete workspace index
- `GET /api/v1/rag/index/status` - Indexing job status

### Health
- `GET /api/v1/rag/health` - Service health check
- `GET /api/v1/rag/stats` - Collection stats (doc counts, sizes)

## Qdrant Collections

### Skills Collection
```python
{
    "collection_name": "skills",
    "vectors": {
        "size": 384,  # all-MiniLM-L6-v2
        "distance": "Cosine"
    },
    "payload_schema": {
        "skill_name": "str",
        "skill_path": "str",
        "origin": "str",  # ECC, Custom
        "description": "str",
        "content": "str",
        "chunk_index": "int",
        "total_chunks": "int",
        "indexed_at": "datetime"
    }
}
```

### Agents Collection
```python
{
    "collection_name": "agents",
    "vectors": {
        "size": 384,
        "distance": "Cosine"
    },
    "payload_schema": {
        "agent_name": "str",
        "agent_path": "str",
        "type": "str",  # coder, reviewer, researcher
        "capabilities": "list[str]",
        "description": "str",
        "content": "str"
    }
}
```

### Codebase Collection (per workspace)
```python
{
    "collection_name": "workspace_{workspace_id}",
    "vectors": {
        "size": 384,
        "distance": "Cosine"
    },
    "payload_schema": {
        "workspace_id": "str",
        "user_id": "str",
        "file_path": "str",
        "language": "str",
        "content": "str",
        "chunk_index": "int",
        "indexed_at": "datetime"
    }
}
```

## Query Flow

```python
# Example query request
POST /api/v1/rag/query
{
    "query": "How do I implement authentication in FastAPI?",
    "collections": ["skills", "codebase"],
    "workspace_id": "uuid",
    "top_k": 5,
    "min_score": 0.7,
    "rerank": true
}

# Response
{
    "results": [
        {
            "collection": "skills",
            "skill_name": "fastapi-patterns",
            "score": 0.92,
            "content": "...",
            "metadata": {...}
        },
        {
            "collection": "skills",
            "skill_name": "security-review",
            "score": 0.87,
            "content": "...",
            "metadata": {...}
        },
        ...
    ],
    "query_time_ms": 45
}
```

## Embedding Strategy

### Model: `sentence-transformers/all-MiniLM-L6-v2`
- **Size:** 384 dimensions
- **Speed:** ~3ms per embedding on CPU
- **Quality:** Good for general-purpose semantic search
- **Memory:** 90MB model size

### Why this model?
- Fast enough for real-time queries
- Small enough to run on CPU (no GPU needed)
- Good bhypocce of speed vs quality
- Widely used and battle-tested

### Alternatives (Phase 4)
- `all-mpnet-base-v2` - Higher quality (768 dims, slower)
- `OpenAI text-embedding-3-small` - Best quality ($$$, API call)

## Chunking Strategy

### Skills & Agents
- **Strategy:** Markdown section-based chunking
- **Max chunk size:** 1000 tokens (~750 words)
- **Overlap:** 100 tokens between chunks
- **Metadata:** Section headers as metadata

### Code Files
- **Strategy:** Function/class-level chunking
- **Max chunk size:** 500 tokens (code is dense)
- **Overlap:** 50 tokens
- **Metadata:** File path, language, function name

### Conversation History
- **Strategy:** Message-level (no chunking)
- **Max size:** Full message (truncated at 2000 tokens)
- **Metadata:** Timestamp, user, model used

## Indexing Pipeline

```
1. Scan source files (skills/, agents/, workspace/)
   ↓
2. Parse and chunk content
   ↓
3. Generate embeddings (batch of 32)
   ↓
4. Upsert to Qdrant with metadata
   ↓
5. Track indexing status in Redis
```

## Performance Targets

- **Query latency:** < 100ms (p95)
- **Index throughput:** 1000 docs/minute
- **Embedding generation:** 500 embeddings/second (batched)
- **Qdrant search:** < 50ms with HNSW index

## Environment Variables

```bash
# Qdrant
QDRANT_URL=http://qdrant:6333
QDRANT_API_KEY=${QDRANT_API_KEY}  # Optional

# Embeddings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
EMBEDDING_DEVICE=cpu  # or cuda if GPU available
EMBEDDING_BATCH_SIZE=32

# Indexing
MAX_CHUNK_SIZE=1000
CHUNK_OVERLAP=100
INDEX_SKILLS_ON_STARTUP=true

# Redis (for job tracking)
REDIS_URL=redis://redis:6379/1

# Application
LOG_LEVEL=info
```

## Development

```bash
# Install dependencies
cd hypoc-face-rag
pip install -r requirements.txt

# Download embedding model (first time)
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"

# Start Qdrant (local)
docker run -p 6333:6333 qdrant/qdrant

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8001

# Index skills (one-time)
curl -X POST http://localhost:8001/api/v1/rag/index/skills

# Test query
curl -X POST http://localhost:8001/api/v1/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query": "FastAPI authentication", "top_k": 3}'

# Run tests
pytest
```

## Phase 2 Implementation Tasks

- [ ] FastAPI project structure
- [ ] Qdrant client integration
- [ ] sentence-transformers model loading
- [ ] Markdown chunking logic
- [ ] Code file parsing (tree-sitter)
- [ ] Skills indexing script (187 skills)
- [ ] Agents indexing script (50 agents)
- [ ] Workspace indexing endpoint
- [ ] Query endpoint with reranking
- [ ] HNSW index optimization
- [ ] Caching layer (Redis)
- [ ] Background job queue for indexing
- [ ] Unit tests and integration tests
- [ ] Dockerfile and docker-compose integration

## Dependencies (Phase 2)

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
qdrant-client==1.7.3
sentence-transformers==2.3.1
langchain==0.1.4
langchain-community==0.0.16
redis==5.0.1
tree-sitter==0.20.4
tree-sitter-python==0.20.4
tree-sitter-javascript==0.20.3
markdown==3.5.2
pydantic==2.5.3
pytest==8.0.0
httpx==0.26.0
```

## Optimization Strategies (Phase 4)

1. **HNSW Parameters Tuning**
   - `m`: 16 (higher = more accurate, slower)
   - `ef_construct`: 100 (indexing time vs quality)
   - `ef`: 128 (search time vs quality)

2. **Caching**
   - Cache frequent queries in Redis (1 hour TTL)
   - Cache embeddings for common phrases

3. **Reranking**
   - Use cross-encoder for top 20 results
   - `ms-marco-MiniLM-L-6-v2` for reranking

4. **Quantization**
   - Reduce 384 dims to 128 with PCA (if needed)
   - 3x speed improvement, minimal quality loss

---

**Next Steps:** Awaiting Phase 2 kickoff after Phase 1 completes.
