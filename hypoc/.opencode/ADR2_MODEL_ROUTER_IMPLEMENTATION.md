# ADR2 Implementation — Model Router

**Status**: Adopted (vendored `opencode-model-router` @ 1.3.0)  
**Date**: 2026-07-20 (initial) / 2026-08-10 (adoption)

## Overview

Model routing per ADR 0002 is implemented by adopting the third-party opencode plugin `opencode-model-router` (marco-jardim, GPL-3.0). It provides dynamic per-task routing (classifies each task against a taxonomy, delegates to a fast/medium/heavy tier, falls back across providers on failure). Vendored into `plugins/opencode-model-router/` so its `tiers.json` config is versioned with the repo rather than trapped inside node_modules.

> Note: earlier work in this file documented a custom 2-tier Ollama router with token/cost tracking. That was superseded by the vendored plugin, which already implements task→tier routing, multi-provider fallback, and cost-aware delegation.

## Adopted Configuration

The vendored plugin reads its config from `plugins/opencode-model-router/tiers.json` (plugin root; runtime state lives in `~/.config/opencode/opencode-model-router.state.json`).

### Presets — all providers

The stock `tiers.json` ships with `anthropic`, `openai`, `github-copilot`, `google`, and `hybrid` presets. Hypoc adds two:

- **`openrouter`** — `gpt-oss:20b` (fast) / `gpt-oss:120b-cloud` (medium) / `qwen3-coder:480b-cloud` (heavy), all cloud-hosted
- **`ollama`** — `llama3.1:8b` (fast) / `phi4:latest` (medium) / `llama3.3:70b-instruct-q4_K_M` (heavy), all local/free

Each preset maps three tiers (fast/medium/heavy) to a model, with cost ratio, step budget, and use-cases. Fallback chains for `openrouter` and `ollama` were added to the global fallback map.

### Routing Behavior

- **Tier classification** — `taskPatterns` map keywords to tiers (grep/read → `@fast`; impl/refactor/test → `@medium`; arch/debug/security → `@heavy`)
- **Cost-aware delegation** — cost ratios injected into the orchestrator prompt; cheapest adequate tier wins
- **Multi-phase split** — composite tasks split: explore `@fast` → execute `@medium`
- **Cross-provider fallback** — if a provider fails, the chain tries the next preset

### Usage Commands

```
/preset <name>        # switch provider tiers (anthropic|openai|github-copilot|google|hybrid|openrouter|ollama)
/budget <mode>        # normal|budget|quality|deep
/tiers                # show active tiers/models/rules
/annotate-plan [path] # tag plan steps with [tier:X]
```

## Earlier Custom Design (Superseded)

> Historical. The original 2-tier fallback chain and token tracking below were config-only, never executed by any runtime code, and have been replaced by the vendored plugin.

### Tier Configuration (historical)

#### Tier 1: Fast (Default)
- **Model**: `llama3.1:8b-instruct` (~4.7GB)
- **Provider**: Ollama (local)
- **Cost**: $0.00
- **Latency**: ~100ms
- **Max Context**: 8,000 tokens
- **Use cases**: Quick tasks, simple code, lightweight analysis

#### Tier 2: Capable (Fallback)
- **Model**: `phi4:latest` (~9GB)
- **Provider**: Ollama (local)
- **Cost**: $0.00
- **Latency**: ~200ms
- **Max Context**: 16,000 tokens
- **Use cases**: Complex reasoning, multi-step tasks, code generation, refactoring

## Fallback Chain (historical)

```
Request → Tier 1 (llama3.1:8b-instruct)
            ↓ (if unavailable)
          Tier 2 (phi4:latest)
            ↓ (if both Ollama unavailable)
          Tier 3 TBD (remote provider)
```

## Agent Tier Assignments (historical)

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

- `.opencode/.hypoc.json` — Added `plugins/opencode-model-router` to the `plugin` array; removed the `tier-status` command and repointed `model_router.tiers_config` at the vendored plugin
- `plugins/opencode-model-router/tiers.json` — Added `openrouter` + `ollama` presets and fallback chains; this file is now the **single authoritative** tier configuration
- `.opencode/tiers.json` — Removed (superseded by the vendored plugin's taxonomy)

## Terminology (see CONTEXT.md)

**preset** — a named binding of fast/medium/heavy → specific models (the only thing `/preset` switches). **tier** — one of `fast`/`medium`/`heavy`, the task-cost bucket. **provider** — the actual model service (Anthropic, OpenAI, Ollama…); a preset may span several. **routing** — task→tier assignment via `taskPatterns`. **fallback** — on provider failure, re-dispatch via another preset's chain.

## Next Steps

1. ✅ Adopt `opencode-model-router` (vendored into `plugins/`)
2. ✅ Add openrouter + ollama presets (all providers covered)
3. ✅ Register in `.hypoc.json` plugin array
4. ⏳ Verify plugin loads on restart (`/tiers` responds)
5. ⏳ Test `/preset` switching between providers
6. ⏳ Test fallback (kill a provider, confirm auto-switch)

## Related ADRs

- ADR 0002: Custom Model Router; No LiteLLM
- ADR 0003: Multi-Layer Knowledge Architecture (future)
- ADR 0004: Dual Operating Modes (tabled)
