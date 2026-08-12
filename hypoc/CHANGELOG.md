# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Memory module** (`hypoc/memory/`): mnemonic centerline implemented — distill → committed decision artifact (`source-session` link) → embed → screen → index → recall (ADR 0006)
  - `bin/sweep.js`: periodic consolidation over real opencode session history, state-tracked, distill-on-consolidate backstop, no double-distillation
  - `bin/recall.js` + `bin/distill-session.js`: `/recall` and `/distill` commands
  - `bin/warmstart.js` + `memory/plugin/`: auto warm-start on the first user message (chat.message + system.transform hooks)
  - `bin/reindex.js --recalibrate`: per-corpus energy-concentration screening masks; scheme-append breadth (content + lexical named vectors, ≤8-bit)
  - ADR 0006 documents the module architecture
- **Self-contained packaging**: `skills/` (61) and `agents/` (73) moved into the repo — a git clone now includes everything the workspace config references
- **Vendored ECC skills**: 7 skills (coding-standards, frontend-patterns, frontend-slides, backend-patterns, e2e-testing, strategic-compact, eval-harness) imported from the public everything-claude-code repo
- **project-tracking skill**: recreated (was referenced by config but lost)
- **AGENTS.md**: agent library documentation
- **CONTRIBUTING.md**: contribution guidelines
- **scripts/sync-ollama-models.sh**: now ships inside the repo

### Fixed
- All 18 `instructions` paths in `.opencode/opencode.json` now resolve (11 were previously broken/missing)
- `instructions/INSTRUCTIONS.md` path corrected to `.opencode/instructions/INSTRUCTIONS.md`
- **Sweep state persistence**: the existing-artifact backstop now persists sweep state, so confirmed-existing sessions aren't re-candidates on reruns

### Removed
- Repo-root `skills/` and `agents/` duplicates deleted — `hypoc/` is the canonical package; root `.opencode.json` repointed to `hypoc/skills/`

## [2.0.0] - 2026-07-15

### Removed
- **hypoc-face-ui**: Removed entirely — redundant with `opencode web` (built into opencode 1.18+)
- **Bedrock GovCloud**: All Amazon Bedrock GovCloud provider references removed from workspace config and codebase
- **Tool-incompatible models**: llama2, mistral, mixtral, deepseek-r1 excluded from opencode picker via sync script

### Added
- **scripts/sync-ollama-models.sh**: Auto-generates opencode global config provider.ollama.models from live Ollama API; shows file sizes in parens; skips tool-incompatible models entirely
- **Provider-agnostic design**: opencode.json workspace config no longer hardcodes any provider or model — model registration is user config

### Changed
- **opencode**: Upgraded to 1.18.1 (ARM64 native)
- **Workspace permissions**: Set to allow-all for autonomous agentic operation (no confirmation prompts)
- **docker-compose.yml**: Updated ports (postgres→5433, core→8002, router→8001); added `extra_hosts: host-gateway` for Ollama on host; removed hypoc-face-ui service
- **hypoc-face-core config.py**: Added `extra = "ignore"` to pydantic-settings v2 Config to fix ValidationError on unknown env vars

## [1.1.0] - 2026-05-15

### Added
- Bedrock prompt caching with 1-hour TTL (~90% cost reduction)

### Changed
- opencode updated to 1.15.0

## [1.0.0] - 2026-04-17

### Added
- Initial release: 14 always-loaded skills, discovery plugin, memory system, ECC skills integration
