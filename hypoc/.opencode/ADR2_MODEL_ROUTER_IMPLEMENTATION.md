# ADR2 Implementation — Custom Model Router

**Status**: Configured (awaiting testing)  
**Date**: 2026-07-20

## Overview

Implemented 2-tier model routing with automatic failover and token/cost tracking per ADR 0002.

## Tier Configuration

### Tier 1: Fast (Default)
- **Model**: `llama3.1:8b-instruct` (~4.7GB)
- **Provider**: Ollama (local)
- **Cost**: $0.00
- **Latency**: ~100ms
- **Max Context**: 8,000 tokens
- **Use cases**: Quick tasks, simple code, lightweight analysis

### Tier 2: Capable (Fallback)
- **Model**: `phi4:latest` (~9GB)
- **Provider**: Ollama (local)
- **Cost**: $0.00
- **Latency**: ~200ms
- **Max Context**: 16,000 tokens
- **Use cases**: Complex reasoning, multi-step tasks, code generation, refactoring

## Fallback Chain

```
Request → Tier 1 (llama3.1:8b-instruct)
            ↓ (if unavailable)
          Tier 2 (phi4:latest)
            ↓ (if both Ollama unavailable)
          Tier 3 TBD (remote provider)
```

## Agent Tier Assignments

### Heavy-Lifting Agents (Tier 2: Capable)
- `build` — primary coding agent
- `planner` — implementation planning
- `architect` — system design
- `code-reviewer` — code quality review
- `security-reviewer` — security analysis
- `tdd-guide` — test generation and verification

### Analysis Agents (Tier 1: Fast)
- `go-reviewer`, `python-reviewer`, `rust-reviewer`, `java-reviewer`, `kotlin-reviewer`, `cpp-reviewer` — language-specific review
- `docs-lookup` — documentation retrieval
- Other read-only agents

## Token & Cost Tracking

### Configuration
```json
"model_router": {
  "enabled": true,
  "tiers_config": ".opencode/tiers.json",
  "token_tracking": true,
  "cost_tracking": true,
  "fallback_enabled": true,
  "log_routing_decisions": true
}
```

### Usage Commands

**Check tier status:**
```bash
opencode /tier-status
```

**View token usage:**
```bash
opencode /tokens
```

Both models are local (free), so costs will always display $0.00.

## Testing Failover

### Test 1: Normal operation
```bash
opencode "Write a function to validate email addresses"
# → Uses Tier 1 (llama3.1:8b-instruct)
```

### Test 2: Escalation to Tier 2
```bash
opencode "Design a multi-tenant SaaS architecture with PostgreSQL"
# → Routes to Tier 2 (phi4:latest) due to complexity
```

### Test 3: Ollama failure recovery
```bash
# Kill Ollama
killall ollama

# Try a request
opencode "Quick refactor"

# Expected: Falls back to Tier 3 (when configured)
```

## Files Modified

- `.opencode/.hypoc.json` — Added model_router config, updated agent tier assignments
- `.opencode/tiers.json` — New file defining tier configuration
- `.opencode/helpers/token-cost-tracker.sh` — New token tracking helper

## Next Steps

1. ✅ Configure 2-tier local routing
2. ⏳ Test normal operation (Tier 1 & 2)
3. ⏳ Test failover (kill Ollama)
4. ⏳ Add Tier 3 (remote provider) once identified
5. ⏳ Verify token counts surface in UI
6. ⏳ Verify cost tracking (even if $0)

## Related ADRs

- ADR 0002: Custom Model Router; No LiteLLM
- ADR 0003: Multi-Layer Knowledge Architecture (future)
- ADR 0004: Dual Operating Modes (tabled)
