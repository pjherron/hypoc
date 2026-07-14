# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-05-15

### Added
- **Bedrock Prompt Caching**: Enabled prompt caching with 1-hour TTL for ~90% cost reduction
- **Documentation**: New `docs/BEDROCK_CACHING_UPDATE.md` with complete caching configuration guide
- **Cost Optimization**: Automatic caching of skills, instructions, and conversation context

### Changed
- **OpenCode Version**: Updated from 1.14.48 to 1.15.0
- **Global Config**: Added `provider.amazon-bedrock.prompt_caching` and `cache_point_ttl` settings
- **Project Config**: Added `provider.amazon-bedrock` section with caching configuration
- **README**: Updated to reflect caching capabilities and benefits
- **Last Updated**: Changed from 2026-04-17 to 2026-05-15

### Fixed
- Configuration syntax validated for both global and project configs
- Backups created before all configuration changes

## [1.0.0] - 2026-04-17

### Added
- Initial release of OpenCode Enterprise AI Setup
- 13 always-loaded infrastructure skills (AWS, K8s, Docker, FastAPI, Python)
- 3 custom skills (aws-infrastructure, kubernetes-patterns, fastapi-patterns)
- Context-aware discovery plugin
- Dated memory system with timeline tracking
- 183 ECC skills integration
- Complete documentation suite

### Infrastructure Skills
- coding-standards
- security-review
- tdd-workflow
- eval-harness
- deep-research
- docker-patterns
- deployment-patterns
- terminal-ops
- python-patterns
- fastapi-patterns
- mcp-server-patterns
- aws-infrastructure (custom)
- kubernetes-patterns (custom)

### Features
- Memory capture system with timeline
- Skill discovery plugin
- Token budget optimization
- Multi-agent support via ECC
- AWS Bedrock GovCloud integration

[Unreleased]: https://git.example.edu/gtri-esd/gtri-esd-dev/esd-genai/hypoc/-/compare/v1.1.0...feature/hypoc-face
[1.1.0]: https://git.example.edu/gtri-esd/gtri-esd-dev/esd-genai/hypoc/-/compare/v1.0.0...v1.1.0
[1.0.0]: https://git.example.edu/gtri-esd/gtri-esd-dev/esd-genai/hypoc/-/tags/v1.0.0
