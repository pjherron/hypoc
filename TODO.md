# TODO

Remaining work, in priority order. Updated 2026-07-16.

## Near-term

- [ ] **Register in-flight Ollama models** — `glm-4.7-flash:bf16` and `gemma4:e2b-mlx` were still pulling at last sync. When done: `./hypoc/scripts/sync-ollama-models.sh`
- [ ] **Connect opencode → hypoc-face-router** — opencode currently talks to Ollama directly (`127.0.0.1:11434`); routing through the router (port 8001) is what enables 4-tier cost-aware routing and cost tracking
- [ ] **Wire cloud tiers into the router** — Tier 3 (Claude Sonnet 4.6) and Tier 4 (Claude Fable 5) need Anthropic API credentials; Tier 2 (Gemini) needs Google credentials. Local-only mode works today without keys.

## Test coverage

- [ ] **TDD baseline** — hypoc-face-core and hypoc-face-router have no meaningful test suites; add pytest coverage for router tier-selection logic and core RBAC/cost endpoints
- [ ] **End-to-end agentic run verification** — confirm opencode completes a multi-step task fully autonomously (allow-all permissions are set; needs a scripted proof)

## Second pass

- [ ] **SAS migration domain overlay** — `hypoc/skills/sas-migration/SKILL.md` is a stub; flesh out for pharma QC use case
- [ ] **hypoc-face Phase 2** — hypoc-face-rag (RAG service, currently stub)
- [ ] **hypoc-face Phase 4** — hypoc-face-agent (coordination) and hypoc-face-workspace (isolation), both stubs

## Housekeeping

- [ ] **import/ tree dedup** — nested duplicate trees under `AI toolkit/import*` (outside this repo) still pending cleanup
- [ ] **enterprise-toolkit refresh** — package.json still references `ecc-universal >=1.10.0` peer dep and placeholder author/org fields
