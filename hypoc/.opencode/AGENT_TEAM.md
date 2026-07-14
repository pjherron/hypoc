# Enterprise AI Agent Team Configuration

This configuration defines specialized agents for enterprise AI development,
each with relevant skills baked into their context.

## Agent Roster

### 1. Research Agent
**Purpose**: Deep research, competitive analysis, technology evaluation
**Skills**: deep-research, strategic-compact, eval-harness
**Model**: claude-opus-4-5

### 2. ML Engineer Agent
**Purpose**: Model development, training pipelines, experiments
**Skills**: pytorch-patterns, python-patterns, eval-harness, tdd-workflow
**Model**: claude-opus-4-5

### 3. Backend Architect Agent
**Purpose**: API design, database optimization, service architecture
**Skills**: backend-patterns, api-design, security-review, coding-standards
**Model**: claude-opus-4-5

### 4. Full-Stack Agent
**Purpose**: End-to-end feature development
**Skills**: frontend-patterns, backend-patterns, api-design, tdd-workflow
**Model**: claude-sonnet-4-5 (fast, cost-efficient)

### 5. DevOps Agent
**Purpose**: Deployment, infrastructure, CI/CD
**Skills**: docker-patterns, verification-loop, security-review
**Model**: claude-sonnet-4-5

### 6. Security Auditor Agent
**Purpose**: Security review, vulnerability scanning
**Skills**: security-review, verification-loop
**Model**: claude-opus-4-5

### 7. QA Engineer Agent
**Purpose**: Testing strategy, E2E tests, quality gates
**Skills**: e2e-testing, tdd-workflow, verification-loop
**Model**: claude-sonnet-4-5

## Usage Patterns

### Pattern 1: Research → Design → Build → Test

```bash
# 1. Research Phase
@research "What's the current state of vector databases for RAG?"

# 2. Design Phase  
@backend-architect "Design an API for semantic search with pgvector"

# 3. Build Phase
@fullstack "Implement the search API with Next.js frontend"

# 4. Test Phase
@qa "Create E2E tests for the search flow"

# 5. Security Phase
@security "Review the implementation for vulnerabilities"
```

### Pattern 2: Parallel Workstreams

```bash
# Launch 3 agents in parallel
@ml-engineer "Optimize the embedding model" &
@backend-architect "Add Redis caching layer" &
@devops "Set up staging environment"

# Wait for all to complete
wait
```

### Pattern 3: Iterative Refinement

```bash
# Agent conversation
@fullstack "Build user dashboard"
# → Creates initial implementation

@security "Review the dashboard code"
# → Finds 3 security issues

@fullstack "Fix the security issues identified"
# → Implements fixes

@qa "Verify the fixes with tests"
# → Confirms resolution
```

## Agent Configuration File

Add to `~/.config/opencode/opencode.json`:

```json
{
  "agent": {
    "research": {
      "description": "Deep research, competitive analysis, technology evaluation",
      "mode": "subagent",
      "model": "anthropic/claude-opus-4-5",
      "instructions": [
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/deep-research/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/strategic-compact/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/eval-harness/SKILL.md"
      ],
      "tools": {
        "read": true,
        "bash": true,
        "web_search": true,
        "firecrawl": true
      }
    },
    
    "ml-engineer": {
      "description": "Model development, training pipelines, experiments",
      "mode": "subagent",
      "model": "anthropic/claude-opus-4-5",
      "instructions": [
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/pytorch-patterns/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/python-patterns/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/eval-harness/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/tdd-workflow/SKILL.md"
      ],
      "tools": {
        "read": true,
        "write": true,
        "edit": true,
        "bash": true
      }
    },
    
    "backend-architect": {
      "description": "API design, database optimization, service architecture",
      "mode": "subagent",
      "model": "anthropic/claude-opus-4-5",
      "instructions": [
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/backend-patterns/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/api-design/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/security-review/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/coding-standards/SKILL.md"
      ],
      "tools": {
        "read": true,
        "write": true,
        "edit": true,
        "bash": true
      }
    },
    
    "fullstack": {
      "description": "End-to-end feature development (frontend + backend)",
      "mode": "subagent",
      "model": "amazon-bedrock/claude-4.5-gov",
      "instructions": [
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/frontend-patterns/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/backend-patterns/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/api-design/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/tdd-workflow/SKILL.md"
      ],
      "tools": {
        "read": true,
        "write": true,
        "edit": true,
        "bash": true
      }
    },
    
    "devops": {
      "description": "Deployment, infrastructure, CI/CD",
      "mode": "subagent",
      "model": "amazon-bedrock/claude-4.5-gov",
      "instructions": [
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/docker-patterns/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/verification-loop/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/security-review/SKILL.md"
      ],
      "tools": {
        "read": true,
        "write": true,
        "edit": true,
        "bash": true
      }
    },
    
    "security": {
      "description": "Security review and vulnerability scanning",
      "mode": "subagent",
      "model": "anthropic/claude-opus-4-5",
      "instructions": [
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/security-review/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/verification-loop/SKILL.md"
      ],
      "tools": {
        "read": true,
        "bash": true,
        "security-audit": true
      }
    },
    
    "qa": {
      "description": "Testing strategy, E2E tests, quality gates",
      "mode": "subagent",
      "model": "amazon-bedrock/claude-4.5-gov",
      "instructions": [
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/e2e-testing/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/tdd-workflow/SKILL.md",
        "/opt/homebrew/lib/node_modules/ecc-universal/skills/verification-loop/SKILL.md"
      ],
      "tools": {
        "read": true,
        "write": true,
        "edit": true,
        "bash": true,
        "run-tests": true
      }
    }
  }
}
```

## Token Economics

### Per-Agent Token Costs

| Agent | Skills | Est. Tokens | Model | Cost/1M tokens |
|-------|--------|-------------|-------|----------------|
| research | 3 skills | ~8,700 | Opus 4.5 | $15 |
| ml-engineer | 4 skills | ~14,900 | Opus 4.5 | $15 |
| backend-architect | 4 skills | ~16,200 | Opus 4.5 | $15 |
| fullstack | 4 skills | ~16,500 | Sonnet 4.5 | $3 |
| devops | 3 skills | ~8,000 | Sonnet 4.5 | $3 |
| security | 2 skills | ~6,000 | Opus 4.5 | $15 |
| qa | 3 skills | ~9,000 | Sonnet 4.5 | $3 |

### Cost Optimization Tips

1. **Use Sonnet for routine work** (fullstack, devops, qa)
2. **Use Opus for critical decisions** (research, ml-engineer, security, backend-architect)
3. **Agent = isolated context** — skills only load once per agent
4. **Parallel agents** — total cost = sum of all agents running simultaneously

### Example Cost Calculation

**Scenario**: Build a new RAG feature end-to-end

```
1. @research "Best vector DB for RAG" 
   → 10K tokens input + 8.7K context = 18.7K → $0.28

2. @backend-architect "Design the API"
   → 5K input + 16.2K context = 21.2K → $0.32

3. @fullstack "Implement the feature" 
   → 15K input + 16.5K context = 31.5K → $0.09

4. @qa "E2E tests for RAG search"
   → 8K input + 9K context = 17K → $0.05

Total: $0.74 for complete feature with agent orchestration
```

## Best Practices

### 1. Right-size Agent Context
- Don't load all skills into every agent
- Match skills to agent specialty
- Keep token count under 20K per agent

### 2. Agent Composition Over Monoliths
- Small, focused agents > one giant agent
- Easier to parallelize
- Better token efficiency

### 3. State Management
- Agents don't share context automatically
- Use files or memory for handoffs
- Document decisions in markdown

### 4. Verification Loops
- Always end with QA or security agent
- Build → Review → Fix → Verify
- Automate quality gates

## Next Steps

1. **Test agents individually** before orchestration
2. **Create agent command shortcuts** (see commands/ directory)
3. **Monitor token usage** per agent
4. **Iterate on skill assignments** based on actual usage

## Related

- Context-aware discovery plugin (Option 2)
- Strategic instructions setup (Option 4)
- ECC agent catalog: `/opt/homebrew/lib/node_modules/ecc-universal/.opencode/opencode.json`
