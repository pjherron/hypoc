# ADR2 Implementation Test Plan

## Setup Complete ✅
- Plugin: `plugins/opencode-model-router` (vendored, registered in `.opencode/.hypoc.json`)
- Config: `plugins/opencode-model-router/tiers.json` — the single authoritative tier configuration
- Presets: anthropic, openai, github-copilot, google, hybrid, openrouter, ollama

## Terminology

- **preset** — a named binding of fast/medium/heavy → specific models (what `/preset` switches)
- **tier** — one of `fast`/`medium`/`heavy`, the task-cost bucket
- **provider** — the actual model service (Anthropic, OpenAI, Ollama…); a preset may span several
- **routing** — task→tier assignment via `taskPatterns`
- **fallback** — on provider failure, re-dispatch via another preset's chain

## Test Sequence

### Test 1: Plugin loads
```bash
cd hypoc/hypoc
opencode
/tiers
```
**Expected**: Lists active preset, tier models, and rules. If this errors, plugin registration failed.

### Test 2: Task→tier routing (fast)
```bash
/annotate-plan  # or simply ask a read-only question, e.g. "find where the auth middleware is defined"
```
**Expected**: Read-only/search tasks classify to the `fast` tier.

### Test 3: Task→tier routing (heavy)
```bash
"Design the request flow for a multi-tenant SaaS platform" 
```
**Expected**: Architecture/design tasks classify to the `heavy` tier.

### Test 4: Preset switching
```bash
/preset
/preset ollama
/preset openrouter
/preset anthropic
```
**Expected**: Lists presets; each switch updates the active preset (persisted in `~/.config/opencode/opencode-model-router.state.json`).

### Test 5: Budget modes
```bash
/budget
/budget budget
/budget normal
/budget quality
/budget deep
```
**Expected**: Lists modes; each switches routing mode.

### Test 6: Fallback
Kill a provider backing the active preset, then attempt a request.
**Expected**: Request re-dispatches via the preset's fallback chain rather than failing.

## Verification Checklist

- [ ] Test 1: `/tiers` responds (plugin loaded)
- [ ] Test 2: read-only tasks route to `fast`
- [ ] Test 3: design tasks route to `heavy`
- [ ] Test 4: `/preset` switches and persists
- [ ] Test 5: `/budget` switches modes
- [ ] Test 6: fallback re-dispatches on provider failure
- [ ] No errors in opencode logs

## Notes

- Runtime state (active preset/mode) lives in `~/.config/opencode/opencode-model-router.state.json`, separate from the versioned `tiers.json`.
- Cloud presets (openrouter, openai, anthropic, google) require API credentials configured in opencode; `ollama` requires a local Ollama server.
- The old 4-tier custom design (`.opencode/tiers.json`, `/tier-status`) was removed — the vendored plugin is the single source of truth.

---

**Status**: Ready for testing
**Last Updated**: 2026-08-10