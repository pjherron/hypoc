# hypoc-face-router — Custom Model Router

**Status:** Engineering spec — implementation pending
**Tech Stack:** FastAPI, Redis, openai SDK, anthropic SDK (no LiteLLM — see ADR 0002)

## Purpose

Four-tier cost routing. Cheapest capable model first. Cost tracked per session, surfaced in browser UI.

## Routing Tiers

| Priority | Tier | Provider | SDK |
|---|---|---|---|
| 1 | Local | Ollama | openai Python SDK (OpenAI-compatible endpoint) |
| 2 | Self-hosted | vLLM / llama.cpp / compatible | openai Python SDK |
| 3 | Copilot | GitHub Copilot | openai Python SDK |
| 4 | Premium | TBD (Anthropic Claude recommended) | anthropic Python SDK |

## Architecture

```
┌──────────────────┐
│   OpenCode Web   │
└────────┬─────────┘
         │
         v
┌──────────────────┐
│   hypoc-face-router    │
│    FastAPI       │
├──────────────────┤
│ Route Decision:  │
│ - Task analysis  │
│ - User quota     │
│ - Cost vs quality│
│ - Provider health│
└────────┬─────────┘
         │
    ┌────┴────┬────────┬────────┐
    v         v        v        v
┌────────┐┌────────┐┌────────┐┌────────┐
│OpenAI  ││Anthropic││AWS     ││Azure   │
│GPT-4o  ││Claude   ││Bedrock ││GPT-4   │
└────────┘└────────┘└────────┘└────────┘
```

## Routing Strategies

### 1. Complexity-Based Routing

```python
# Task complexity score (0-100)
def calculate_complexity(request):
    score = 0
    
    # Code generation: +30
    if "write" in prompt or "create" in prompt:
        score += 30
    
    # Large context: +20
    if context_size > 50000:
        score += 20
    
    # Multi-step reasoning: +25
    if "explain" in prompt or "analyze" in prompt:
        score += 25
    
    # Refactoring: +15
    if "refactor" in prompt or "optimize" in prompt:
        score += 15
    
    return score

# Route based on complexity
if complexity < 30:
    model = "gpt-4o-mini"  # $0.15/1M tokens
elif complexity < 60:
    model = "gpt-4o"       # $2.50/1M tokens
else:
    model = "claude-sonnet-4"  # $3.00/1M tokens
```

### 2. Cost-Constrained Routing

```python
# User quota remaining
user_quota = get_user_quota(user_id)

# Cost estimates
costs = {
    "gpt-4o-mini": estimate_cost(tokens, 0.15),
    "gpt-4o": estimate_cost(tokens, 2.50),
    "claude-sonnet-4": estimate_cost(tokens, 3.00)
}

# Pick most capable model within budget
for model, cost in sorted(costs.items(), key=lambda x: x[1], reverse=True):
    if cost <= user_quota:
        return model

# Fallback to cheapest
return "gpt-4o-mini"
```

### 3. Provider Health-Based Routing

```python
# Check provider health
providers = [
    {"name": "openai", "latency": 250, "error_rate": 0.01},
    {"name": "anthropic", "latency": 500, "error_rate": 0.05},
    {"name": "bedrock", "latency": 300, "error_rate": 0.02}
]

# Filter unhealthy providers
healthy = [p for p in providers if p["error_rate"] < 0.1]

# Pick lowest latency
best_provider = min(healthy, key=lambda p: p["latency"])
```

### 4. Specialized Model Routing

```python
# Route by task type
task_models = {
    "code_generation": "gpt-4o",
    "code_review": "claude-sonnet-4",
    "documentation": "gpt-4o-mini",
    "debugging": "claude-sonnet-4",
    "refactoring": "gpt-4o",
    "testing": "gpt-4o-mini"
}

detected_task = detect_task_type(prompt)
return task_models.get(detected_task, "gpt-4o")
```

## API Endpoints (Planned)

### Chat Completions
- `POST /api/v1/chat/completions` - OpenAI-compatible endpoint
- `POST /api/v1/chat/stream` - Streaming responses
- `POST /api/v1/chat/route` - Explicit routing with constraints

### Model Management
- `GET /api/v1/models` - List available models
- `GET /api/v1/models/{model}/health` - Model health status
- `GET /api/v1/models/{model}/pricing` - Model pricing info

### Routing Analytics
- `GET /api/v1/routing/stats` - Routing decision stats
- `GET /api/v1/routing/costs` - Cost breakdown by model
- `GET /api/v1/routing/user/{id}` - User routing history

### Provider Management
- `GET /api/v1/providers` - List providers
- `POST /api/v1/providers/{name}/toggle` - Enable/disable provider

## Request Flow

```
1. User sends chat request
   ↓
2. Extract context + analyze task
   ↓
3. Check user quota (Redis)
   ↓
4. Calculate complexity score
   ↓
5. Apply routing strategy
   ↓
6. Check provider health
   ↓
7. Select optimal model
   ↓
8. Forward to provider (LiteLLM)
   ↓
9. Track usage + cost
   ↓
10. Return response
```

## Model Registry

```python
MODELS = {
    "gpt-4o": {
        "provider": "openai",
        "cost_per_1m_input": 2.50,
        "cost_per_1m_output": 10.00,
        "context_window": 128000,
        "capabilities": ["code", "reasoning", "vision"],
        "quality_tier": "high"
    },
    "gpt-4o-mini": {
        "provider": "openai",
        "cost_per_1m_input": 0.15,
        "cost_per_1m_output": 0.60,
        "context_window": 128000,
        "capabilities": ["code", "reasoning"],
        "quality_tier": "medium"
    },
    "claude-sonnet-4": {
        "provider": "anthropic",
        "cost_per_1m_input": 3.00,
        "cost_per_1m_output": 15.00,
        "context_window": 200000,
        "capabilities": ["code", "reasoning", "analysis"],
        "quality_tier": "high"
    },
    "claude-haiku-4": {
        "provider": "anthropic",
        "cost_per_1m_input": 0.25,
        "cost_per_1m_output": 1.25,
        "context_window": 200000,
        "capabilities": ["code", "reasoning"],
        "quality_tier": "medium"
    }
}
```

## Quota Management

### User Quotas (Redis)

```python
# Set user quota
SET user:{user_id}:quota:monthly 100.00  # $100/month

# Track usage
HINCRBY user:{user_id}:usage:2025-01 tokens_input 5000
HINCRBY user:{user_id}:usage:2025-01 tokens_output 1500
HINCRBYFLOAT user:{user_id}:usage:2025-01 cost_usd 0.25

# Check remaining quota
GET user:{user_id}:quota:monthly
HGET user:{user_id}:usage:2025-01 cost_usd
```

### Rate Limiting

```python
# 100 requests per hour per user
INCR user:{user_id}:ratelimit:{hour}
EXPIRE user:{user_id}:ratelimit:{hour} 3600

# Check
count = GET user:{user_id}:ratelimit:{hour}
if count > 100:
    raise RateLimitExceeded
```

## Fallback Strategy

```python
# Primary model fails
try:
    response = call_model("gpt-4o", prompt)
except ProviderError:
    # Fallback to alternative
    try:
        response = call_model("claude-sonnet-4", prompt)
    except ProviderError:
        # Final fallback
        response = call_model("gpt-4o-mini", prompt)
```

## Environment Variables

```bash
# OpenAI
OPENAI_API_KEY=${OPENAI_API_KEY}
OPENAI_ORG_ID=${OPENAI_ORG_ID}

# Anthropic
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}

# AWS Bedrock
AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
AWS_REGION=us-east-1

# Azure OpenAI
AZURE_OPENAI_API_KEY=${AZURE_OPENAI_API_KEY}
AZURE_OPENAI_ENDPOINT=${AZURE_OPENAI_ENDPOINT}

# Redis
REDIS_URL=redis://redis:6379/2

# Routing
DEFAULT_MODEL=gpt-4o-mini
ENABLE_FALLBACK=true
MAX_RETRIES=3
TIMEOUT_SECONDS=30

# Application
LOG_LEVEL=info
```

## Development

```bash
# Install dependencies
cd hypoc-face-router
pip install -r requirements.txt

# Set API keys
export OPENAI_API_KEY=sk-...
export ANTHROPIC_API_KEY=sk-ant-...

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8002

# Test routing
curl -X POST http://localhost:8002/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Write a Python function"}],
    "user_id": "test-user"
  }'

# Run tests
pytest
```

## Phase 3 Implementation Tasks

- [ ] FastAPI project structure
- [ ] LiteLLM integration for multi-provider
- [ ] Complexity scoring logic
- [ ] Routing decision engine
- [ ] Provider health monitoring
- [ ] Quota management with Redis
- [ ] Rate limiting middleware
- [ ] Cost tracking and analytics
- [ ] Fallback and retry logic
- [ ] Streaming response support
- [ ] A/B testing framework
- [ ] Admin dashboard endpoints
- [ ] Unit tests and integration tests
- [ ] Load testing
- [ ] Dockerfile and docker-compose integration

## Dependencies (Phase 3)

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
litellm==1.28.0
redis==5.0.1
openai==1.10.0
anthropic==0.18.0
boto3==1.34.35  # For AWS Bedrock
tiktoken==0.6.0  # Token counting
pydantic==2.5.3
pytest==8.0.0
httpx==0.26.0
prometheus-client==0.19.0  # Metrics
```

## Cost Optimization Examples

### Example 1: Simple Query (Low Complexity)
```
User: "What is the capital of France?"
Complexity: 5
Model: gpt-4o-mini
Cost: $0.0002
```

### Example 2: Code Generation (Medium Complexity)
```
User: "Write a FastAPI endpoint for user authentication"
Complexity: 45
Model: gpt-4o
Cost: $0.05
```

### Example 3: Complex Refactoring (High Complexity)
```
User: "Refactor this 500-line class to follow SOLID principles"
Complexity: 85
Model: claude-sonnet-4
Cost: $0.12
```

### Monthly Savings Estimate
- Without routing: 100% GPT-4 = $15,000/month
- With routing: 60% mini, 30% 4o, 10% Claude = $6,500/month
- **Savings: $8,500/month (57%)**

---

**Next Steps:** Awaiting Phase 3 kickoff after Phase 2 completes.
