# Hypoc-Face Agent - Agent Orchestration & Registry

**Status:** 🚧 Coming in Phase 4  
**Tech Stack:** FastAPI, RabbitMQ, Celery, Redis  

## Purpose

The **hypoc-face-agent** service orchestrates AI agent workflows and manages the agent registry:

- 🤖 **Agent Registry** - Catalog of 50+ pre-built agents (coder, reviewer, researcher, etc.)
- 🔄 **Task Orchestration** - Coordinate multi-agent workflows
- 📊 **Agent Analytics** - Track agent performance, success rates, costs
- 🎯 **Agent Selection** - Auto-select best agent for task
- 🔁 **Agent Chaining** - Chain agents for complex workflows
- 📝 **Agent Templates** - User-defined custom agents

## Architecture

```
┌──────────────────┐
│   OpenCode Web   │
└────────┬─────────┘
         │
         v
┌──────────────────┐
│   hypoc-face-agent     │
│    FastAPI       │
├──────────────────┤
│ - Agent registry │
│ - Task queue     │
│ - Orchestration  │
│ - Analytics      │
└────────┬─────────┘
         │
    ┌────┴────┐
    v         v
┌────────┐ ┌──────────┐
│RabbitMQ│ │Celery    │
│Queue   │ │Workers   │
└────────┘ └──────────┘
         │
         v
┌──────────────────┐
│   hypoc-face-router    │ ← Calls model
└──────────────────┘
```

## Agent Registry

### 50+ Pre-Built Agents (From `/agents/`)

```python
AGENT_REGISTRY = {
    "coder": {
        "name": "Code Generator",
        "description": "Writes production-ready code",
        "capabilities": ["code_generation", "refactoring"],
        "best_for": ["feature implementation", "bug fixes"],
        "avg_cost": 0.05,
        "success_rate": 0.92
    },
    "reviewer": {
        "name": "Code Reviewer",
        "description": "Reviews code for quality and security",
        "capabilities": ["code_review", "security_audit"],
        "best_for": ["PR review", "security scan"],
        "avg_cost": 0.03,
        "success_rate": 0.95
    },
    "researcher": {
        "name": "Research Agent",
        "description": "Conducts deep research with citations",
        "capabilities": ["web_search", "synthesis"],
        "best_for": ["tech evaluation", "market research"],
        "avg_cost": 0.10,
        "success_rate": 0.88
    },
    "tester": {
        "name": "Test Generator",
        "description": "Generates comprehensive test suites",
        "capabilities": ["unit_tests", "integration_tests", "e2e_tests"],
        "best_for": ["TDD", "test coverage"],
        "avg_cost": 0.04,
        "success_rate": 0.90
    },
    "debugger": {
        "name": "Debug Specialist",
        "description": "Systematically debugs issues",
        "capabilities": ["error_analysis", "root_cause", "fix"],
        "best_for": ["bugs", "failures", "exceptions"],
        "avg_cost": 0.06,
        "success_rate": 0.85
    }
    # ... 45 more agents
}
```

## API Endpoints (Planned)

### Agent Registry
- `GET /api/v1/agents` - List all available agents
- `GET /api/v1/agents/{id}` - Get agent details
- `POST /api/v1/agents` - Create custom agent (user-defined)
- `PATCH /api/v1/agents/{id}` - Update custom agent
- `DELETE /api/v1/agents/{id}` - Delete custom agent

### Task Orchestration
- `POST /api/v1/tasks` - Submit task for agent execution
- `GET /api/v1/tasks/{id}` - Get task status
- `GET /api/v1/tasks/{id}/result` - Get task result
- `POST /api/v1/tasks/{id}/cancel` - Cancel running task
- `GET /api/v1/tasks` - List user's tasks

### Agent Selection
- `POST /api/v1/agents/recommend` - Get recommended agent for task
- `POST /api/v1/agents/match` - Match task to best agent

### Agent Analytics
- `GET /api/v1/agents/{id}/stats` - Agent performance stats
- `GET /api/v1/agents/{id}/history` - Agent execution history
- `GET /api/v1/analytics/costs` - Cost breakdown by agent

## Task Orchestration Flow

```
1. User submits task
   ↓
2. Agent service receives task
   ↓
3. Analyze task requirements
   ↓
4. Recommend best agent(s)
   ↓
5. User confirms or overrides
   ↓
6. Queue task in RabbitMQ
   ↓
7. Celery worker picks up task
   ↓
8. Load agent definition
   ↓
9. Call hypoc-face-router for context (RAG)
   ↓
10. Call hypoc-face-router for model completion
    ↓
11. Post-process agent output
    ↓
12. Store result in database
    ↓
13. Notify user (WebSocket or polling)
```

## Agent Definition Format

```yaml
# agents/coder.yaml
name: Code Generator
description: Writes production-ready code following best practices
version: 1.0.0

capabilities:
  - code_generation
  - refactoring
  - documentation

prompts:
  system: |
    You are an expert software engineer. Write clean, maintainable,
    production-ready code following best practices. Always include:
    - Type hints
    - Error handling
    - Documentation
    - Unit tests
  
  user_template: |
    Task: {task_description}
    Context: {rag_context}
    
    Requirements:
    - Language: {language}
    - Framework: {framework}
    - Style: {code_style}
    
    Please implement this feature.

models:
  primary: gpt-4o
  fallback: claude-sonnet-4

settings:
  temperature: 0.2
  max_tokens: 4000
  top_p: 0.9

post_processing:
  - validate_syntax
  - format_code
  - generate_tests

success_criteria:
  - code_compiles: true
  - tests_pass: true
  - style_compliant: true
```

## Agent Chaining (Multi-Agent Workflows)

```python
# Example: Code review workflow
workflow = {
    "name": "code_review_workflow",
    "steps": [
        {
            "agent": "coder",
            "task": "Implement feature X",
            "output": "code"
        },
        {
            "agent": "tester",
            "task": "Generate tests for code",
            "input": "{steps[0].output}",
            "output": "tests"
        },
        {
            "agent": "reviewer",
            "task": "Review code and tests",
            "input": "{steps[0].output} + {steps[1].output}",
            "output": "review"
        },
        {
            "agent": "coder",
            "task": "Apply review suggestions",
            "input": "{steps[0].output} + {steps[2].output}",
            "output": "final_code"
        }
    ]
}

# Execute workflow
result = await execute_workflow(workflow)
```

## Agent Selection Logic

```python
def recommend_agent(task: str, context: dict) -> list[str]:
    """Recommend best agent(s) for task."""
    
    # Extract task type
    task_type = classify_task(task)
    
    # Match to agent capabilities
    candidates = []
    for agent_id, agent in AGENT_REGISTRY.items():
        if task_type in agent["best_for"]:
            candidates.append({
                "agent_id": agent_id,
                "score": calculate_match_score(task, agent),
                "cost": agent["avg_cost"],
                "success_rate": agent["success_rate"]
            })
    
    # Sort by score * success_rate / cost
    candidates.sort(
        key=lambda x: (x["score"] * x["success_rate"]) / x["cost"],
        reverse=True
    )
    
    return candidates[:3]  # Top 3 recommendations
```

## RabbitMQ Queue Structure

```python
# Task queues (by priority)
QUEUES = {
    "high_priority": {
        "routing_key": "tasks.high",
        "max_concurrent": 10
    },
    "normal_priority": {
        "routing_key": "tasks.normal",
        "max_concurrent": 50
    },
    "low_priority": {
        "routing_key": "tasks.low",
        "max_concurrent": 100
    }
}

# Agent-specific queues
AGENT_QUEUES = {
    "coder": "agents.coder",
    "reviewer": "agents.reviewer",
    "researcher": "agents.researcher",
    # ...
}
```

## Celery Tasks

```python
from celery import Celery

celery = Celery(
    "hypoc-face-agent",
    broker="pyamqp://rabbitmq:5672",
    backend="redis://redis:6379/3"
)

@celery.task(bind=True, max_retries=3)
def execute_agent_task(self, task_id: str, agent_id: str, prompt: str):
    """Execute agent task asynchronously."""
    try:
        # Load agent definition
        agent = load_agent(agent_id)
        
        # Get RAG context
        context = get_rag_context(prompt)
        
        # Build full prompt
        full_prompt = agent.render_prompt(prompt, context)
        
        # Call model via router
        response = call_router(
            model=agent.primary_model,
            prompt=full_prompt,
            settings=agent.settings
        )
        
        # Post-process
        result = agent.post_process(response)
        
        # Validate
        if not agent.validate(result):
            raise AgentValidationError()
        
        # Store result
        store_result(task_id, result)
        
        return result
    
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
```

## Agent Analytics

```python
# Track agent performance
AGENT_METRICS = {
    "coder": {
        "total_tasks": 1523,
        "successful": 1401,
        "failed": 122,
        "success_rate": 0.92,
        "avg_cost": 0.047,
        "avg_duration": 8.3,  # seconds
        "user_satisfaction": 4.2  # out of 5
    }
}

# Cost breakdown
COST_ANALYTICS = {
    "by_agent": {
        "coder": 71.53,
        "reviewer": 41.20,
        "researcher": 152.30,
        # ...
    },
    "by_user": {
        "user1": 35.20,
        "user2": 87.50,
        # ...
    },
    "total": 265.03
}
```

## Environment Variables

```bash
# RabbitMQ
RABBITMQ_URL=amqp://rabbitmq:5672
RABBITMQ_USER=hypoc-face
RABBITMQ_PASSWORD=${RABBITMQ_PASSWORD}

# Celery
CELERY_BROKER=pyamqp://rabbitmq:5672
CELERY_BACKEND=redis://redis:6379/3
CELERY_WORKERS=10

# Redis
REDIS_URL=redis://redis:6379/3

# Agent Registry
AGENT_REGISTRY_PATH=/app/agents
ALLOW_CUSTOM_AGENTS=true

# Application
LOG_LEVEL=info
```

## Development

```bash
# Install dependencies
cd hypoc-face-agent
pip install -r requirements.txt

# Start RabbitMQ (local)
docker run -d -p 5672:5672 rabbitmq:3-management

# Start Celery worker
celery -A tasks worker --loglevel=info --concurrency=4

# Start development server
uvicorn main:app --reload --host 0.0.0.0 --port 8004

# Submit task
curl -X POST http://localhost:8004/api/v1/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "agent_id": "coder",
    "prompt": "Write a FastAPI endpoint for user login",
    "user_id": "test-user"
  }'

# Check task status
curl http://localhost:8004/api/v1/tasks/{task_id}

# Run tests
pytest
```

## Phase 4 Implementation Tasks

- [ ] FastAPI project structure
- [ ] Agent registry loader (50+ agents from `/agents/`)
- [ ] RabbitMQ integration for task queue
- [ ] Celery worker configuration
- [ ] Task orchestration engine
- [ ] Agent selection/recommendation logic
- [ ] Agent chaining (multi-agent workflows)
- [ ] Custom agent creation endpoints
- [ ] Agent analytics tracking
- [ ] Cost tracking per agent
- [ ] User satisfaction feedback
- [ ] WebSocket notifications
- [ ] Unit tests and integration tests
- [ ] Load testing (1000+ concurrent tasks)
- [ ] Dockerfile and docker-compose integration

## Dependencies (Phase 4)

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
celery==5.3.6
redis==5.0.1
pika==1.3.2  # RabbitMQ client
sqlalchemy==2.0.25
pydantic==2.5.3
pyyaml==6.0.1  # Agent definition parsing
jinja2==3.1.3  # Prompt templating
pytest==8.0.0
httpx==0.26.0
prometheus-client==0.19.0
```

## Performance Targets

- **Task submission:** < 100ms
- **Agent selection:** < 200ms
- **Queue throughput:** 1000+ tasks/minute
- **Concurrent tasks:** 500+
- **Task result latency:** < 15 seconds (p95)

## Monitoring Metrics

```python
# Prometheus metrics
agent_task_duration_seconds{agent="coder"}
agent_task_success_total{agent="coder"}
agent_task_failure_total{agent="coder"}
agent_cost_usd{agent="coder"}
queue_depth{queue="tasks.normal"}
worker_active_tasks
```

---

**Next Steps:** Awaiting Phase 4 kickoff after Phase 3 completes.
