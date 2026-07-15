# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
