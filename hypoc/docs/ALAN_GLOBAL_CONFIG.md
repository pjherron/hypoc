<!-- Configuration variables referenced in this document:
  AWS_REGION                AWS region for deployment (e.g. us-gov-west-1, us-east-1)  (e.g. us-gov-west-1)
  PROJECT_DIR               Local project root directory  (e.g. /Users/pherron6/dev/opencode)
-->

# Hypoc (OpenCode Global Configuration)

**Repository**: Hypoc/Hypoc-Face Project  
**Location**: `~/.config/opencode/opencode.json`  
**Last Updated**: 2026-05-15  
**OpenCode Version**: 1.15.0

## Overview

This is the global OpenCode configuration for "Hypoc" - the base OpenCode instance used across all projects outside of the Hypoc-Face workspace.

## Current Configuration

### Model Provider
- **Provider**: AWS Bedrock GovCloud
- **Region**: ${AWS_REGION}
- **Model**: Claude Sonnet 4.5 (us-gov.anthropic.claude-sonnet-4-5-20250929-v1:0)
- **Prompt Caching**: Enabled (1-hour TTL)

### Plugins
1. **superpowers** - Advanced OpenCode capabilities
2. **ecc-universal** - Everything Claude Code universal skills

### Always-Loaded Skills (13)
1. coding-standards
2. security-review
3. tdd-workflow
4. eval-harness
5. deep-research
6. docker-patterns
7. python-patterns
8. mcp-server-patterns
9. deployment-patterns
10. terminal-ops
11. aws-infrastructure (custom)
12. kubernetes-patterns (custom)
13. fastapi-patterns (custom)

### Safety Rules
- **Bash Safety**: Never use `rm -rf` or any flag combination
- **Interactive Deletion**: Always use `rm -i` for confirmation
- **Production Protection**: Delete one item at a time with confirmation

## Recent Updates

### 2026-05-15: Bedrock Prompt Caching
- ✅ Enabled prompt caching with 1-hour TTL
- ✅ ~90% cost reduction on cached input tokens
- ✅ Configuration validated and tested
- ✅ Backup created before changes

## Cost Optimization

With prompt caching enabled:
- **Skills Cache**: ~89K tokens cached (13 always-loaded skills)
- **Cache Duration**: 1 hour (maximum for Claude Sonnet 4.5)
- **Cost Savings**: ~90% on cached content
- **Benefit**: Particularly effective for:
  - Long coding sessions
  - Repeated skill usage
  - Large context windows

## Configuration File

**Location**: `~/.config/opencode/opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "amazon-bedrock": {
      "prompt_caching": true,
      "cache_point_ttl": "1h",
      "options": {
        "region": "${AWS_REGION}",
        "baseURL": "https://bedrock-runtime.${AWS_REGION}.amazonaws.com"
      },
      "models": {
        "claude-4.5-gov": {
          "id": "us-gov.anthropic.claude-sonnet-4-5-20250929-v1:0"
        }
      }
    }
  },
  "model": "amazon-bedrock/claude-4.5-gov",
  "plugin": [
    "superpowers@git+https://github.com/obra/superpowers.git",
    "ecc-universal"
  ],
  "instructions": [
    "/opt/homebrew/lib/node_modules/ecc-universal/skills/coding-standards/SKILL.md",
    "/opt/homebrew/lib/node_modules/ecc-universal/skills/security-review/SKILL.md",
    "/opt/homebrew/lib/node_modules/ecc-universal/skills/tdd-workflow/SKILL.md",
    "/opt/homebrew/lib/node_modules/ecc-universal/skills/eval-harness/SKILL.md",
    "/opt/homebrew/lib/node_modules/ecc-universal/skills/deep-research/SKILL.md",
    "/opt/homebrew/lib/node_modules/ecc-universal/skills/docker-patterns/SKILL.md",
    "/opt/homebrew/lib/node_modules/ecc-universal/skills/python-patterns/SKILL.md",
    "/opt/homebrew/lib/node_modules/ecc-universal/skills/mcp-server-patterns/SKILL.md",
    "/opt/homebrew/lib/node_modules/ecc-universal/skills/deployment-patterns/SKILL.md",
    "/opt/homebrew/lib/node_modules/ecc-universal/skills/terminal-ops/SKILL.md",
    "${PROJECT_DIR}/skills/aws-infrastructure/SKILL.md",
    "${PROJECT_DIR}/skills/kubernetes-patterns/SKILL.md",
    "${PROJECT_DIR}/skills/fastapi-patterns/SKILL.md",
    "bash safety: NEVER use 'rm -rf' (or any flag combination like -fr).",
    "bash safety: ALWAYS use 'rm -i' for interactive deletion.",
    "bash safety: Production paths are sacred - delete one item at a time with confirmation."
  ]
}
```

## Backup History

- `opencode.json.backup-20260515-143356` - Before caching enablement
- `opencode.json.old` - Previous configuration (2026-04-29)

## Usage

This configuration applies to **all OpenCode sessions** outside of specific project directories that have their own `.opencode/opencode.json`.

### When It's Used
- Running `opencode` in any directory without a project config
- Default skills and model for general development work
- Foundation for all non-Hypoc-Face OpenCode usage

### When It's NOT Used
- Inside `~/dev/code/opencode` (Hypoc-Face project has its own config)
- Any project with `.opencode/opencode.json` (project config overrides)

## Related Configurations

- **Hypoc-Face Project Config**: `~/dev/code/opencode/.opencode/opencode.json`
- **ECC Universal Skills**: `/opt/homebrew/lib/node_modules/ecc-universal/skills/`
- **Custom Skills**: `~/dev/opencode/skills/`

## Maintenance

### Updating Skills
```bash
# Update ECC universal skills
npm update -g ecc-universal

# Update superpowers
cd ~/.config/opencode/node_modules/superpowers
git pull
```

### Verifying Configuration
```bash
# Validate JSON syntax
cat ~/.config/opencode/opencode.json | python3 -m json.tool

# Check OpenCode version
opencode --version

# Test configuration
opencode --help
```

## Support

For issues with the global configuration:
- **Internal**: [Org] ESD GenAI team
- **OpenCode**: https://opencode.ai/docs
- **AWS Bedrock**: AWS Support Portal

## Change History

| Date | Change | Author |
|------|--------|--------|
| 2026-05-15 | Enabled Bedrock prompt caching (1h TTL) | your-username |
| 2026-04-29 | Updated model configuration | your-username |
| 2026-04-17 | Initial configuration with 13 skills | your-username |
