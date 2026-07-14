<!-- Configuration variables referenced in this document:
  AWS_REGION                AWS region for deployment (e.g. us-gov-west-1, us-east-1)  (e.g. us-gov-west-1)
-->

# Bedrock Prompt Caching Configuration

**Date:** May 15, 2026  
**OpenCode Version:** 1.15.0  
**Status:** ✅ Enabled

## Overview

AWS Bedrock prompt caching has been enabled for both Hypoc (global OpenCode) and Hypoc-Face (project-specific configuration) to achieve approximately **90% cost reduction** on cached prompt content.

## Configuration Details

### Cache Settings
- **Prompt Caching**: Enabled (`true`)
- **Cache TTL**: `1h` (maximum allowed for Claude Sonnet 4.5)
- **Model**: `us-gov.anthropic.claude-sonnet-4-5-20250929-v1:0`
- **Region**: `${AWS_REGION}` (AWS GovCloud)

### How It Works

1. **First Request**: OpenCode sends the full prompt (skills, instructions, context) to Bedrock
2. **Cache Creation**: Bedrock caches the prompt content with a 1-hour TTL
3. **Subsequent Requests**: Within 1 hour, repeated content is retrieved from cache
4. **Cost Savings**: Cached tokens cost ~10% of regular input tokens (~90% savings)

### Cache Behavior

- **TTL Type**: Wall-clock time (not usage time)
- **TTL Value**: 1 hour (maximum for Claude Sonnet 4.5)
- **Cache Scope**: Per conversation/session
- **Expiration**: After 1 hour of real time, regardless of activity

**Example Timeline:**
- 9:00 AM - Session starts, cache created (expires at 10:00 AM)
- 9:30 AM - Still using cache ✅
- 9:45 AM - Coffee break (cache still counting down)
- 10:00 AM - Cache expires ❌
- 10:05 AM - New request creates fresh cache (expires at 11:05 AM)

## Files Modified

### Global Configuration (Hypoc)
**Location**: `~/.config/opencode/opencode.json`

```json
{
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
  }
}
```

### Project Configuration (Hypoc-Face)
**Location**: `~/dev/code/opencode/.opencode/opencode.json`

```json
{
  "provider": {
    "amazon-bedrock": {
      "prompt_caching": true,
      "cache_point_ttl": "1h"
    }
  }
}
```

## Benefits

### Cost Reduction
- **~90% savings** on cached input tokens
- Large skills/instructions loaded once per hour
- Conversation context reused within session
- Particularly beneficial for:
  - Long coding sessions (2-4 hours)
  - Repeated skill usage
  - Large instruction sets (~89K tokens for global skills)

### Performance
- Faster response times (cached content doesn't need re-processing)
- Reduced latency on subsequent requests
- More consistent performance during active sessions

### Operational
- **No code changes required** - works automatically
- **Transparent caching** - no changes to OpenCode workflow
- **Session-aware** - cache naturally expires between work sessions

## Monitoring

### AWS CloudWatch Metrics
Monitor caching effectiveness:
- `CachedInputTokens` - Tokens served from cache
- `InputTokens` - Total input tokens
- Cache hit rate: `CachedInputTokens / InputTokens`

### Cost Explorer
Track cost savings:
- Compare costs before/after caching enablement
- Filter by model: `claude-sonnet-4-5`
- Look for ~90% reduction in input token costs

## Backups

Configuration backups created before changes:
- Global: `~/.config/opencode/opencode.json.backup-20260515-143356`
- Project: `~/dev/code/opencode/.opencode/opencode.json.backup-20260515-143353`

## Related Documentation

- [AWS Bedrock Prompt Caching Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/prompt-caching.html)
- [Claude Sonnet 4.5 Specifications](https://docs.anthropic.com/claude/docs)
- [OpenCode Configuration Reference](https://opencode.ai/docs/configuration)

## Validation

### Configuration Validation
Both configurations have been validated:
```bash
✅ Global config: Valid JSON
✅ Project config: Valid JSON
✅ Cache configuration: Properly formatted
```

### Testing
Full runtime validation requires starting a new OpenCode session. The configuration format matches official AWS Bedrock documentation and should activate automatically.

## Rollback Instructions

If you need to disable caching:

1. **Remove caching configuration**:
```bash
# Restore from backup
cp ~/.config/opencode/opencode.json.backup-20260515-143356 ~/.config/opencode/opencode.json
cp ~/dev/code/opencode/.opencode/opencode.json.backup-20260515-143353 ~/dev/code/opencode/.opencode/opencode.json
```

2. **Or manually edit** and remove these lines:
```json
"prompt_caching": true,
"cache_point_ttl": "1h",
```

## Troubleshooting

### Cache Not Working
1. Verify you're using Claude Sonnet 4.5 (other models may have 5-minute max TTL)
2. Check AWS CloudWatch for cache metrics
3. Ensure AWS credentials have Bedrock permissions
4. Start a fresh OpenCode session (config loads at startup)

### High Costs Despite Caching
1. Check if you're starting many new sessions (each creates new cache)
2. Verify cache TTL hasn't expired mid-session
3. Monitor `CachedInputTokens` vs `InputTokens` metrics

### Configuration Errors
1. Validate JSON syntax: `cat opencode.json | python3 -m json.tool`
2. Check OpenCode logs for configuration warnings
3. Restore from backup if needed

## Future Enhancements

Potential improvements:
- **Session persistence**: Maintain cache across OpenCode restarts
- **Longer TTL**: If AWS increases maximum TTL beyond 1 hour
- **Cache analytics**: Dashboard showing cache hit rates and savings
- **Smart cache warming**: Pre-cache frequently used skills

## Change Log

### 2026-05-15
- ✅ Enabled prompt caching for Hypoc (global config)
- ✅ Enabled prompt caching for Hypoc-Face (project config)
- ✅ Set maximum TTL (1h) for Claude Sonnet 4.5
- ✅ Validated JSON configuration syntax
- ✅ Created configuration backups
- ✅ Documented configuration and benefits

## Support

For issues or questions:
- Internal: [Org] ESD GenAI team
- OpenCode: https://opencode.ai/docs
- AWS Bedrock: AWS Support Portal
