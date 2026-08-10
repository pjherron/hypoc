# ADR2 Implementation Test Plan

## Setup Complete ✅
- Config: `.opencode/.hypoc.json` (symlinked as `opencode.json`)
- Tiers: `.opencode/tiers.json`
- Models: All 4 tiers configured and available

## 4-Tier Configuration

| Tier | Model | Provider | Cost | Latency | Status |
|------|-------|----------|------|---------|--------|
| 1 | llama3.1:8b | Ollama | $0 | 100ms | ✅ Installed |
| 2 | phi4:latest | Ollama | $0 | 200ms | ✅ Installed |
| 3 | gpt-oss:120b-cloud | OpenRouter | $0 | 500ms | ⏳ Free tier |
| 4 | qwen3-coder:480b-cloud | OpenRouter | $0 | 600ms | ⏳ Free tier |

## Test Sequence

### Test 1: Tier 1 (Fast) - Simple Task
```bash
cd hypoc/hypoc
opencode "Validate this email regex: ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$"
```
**Expected**: Routes to tier 1 (llama3.1:8b)  
**Check**: Token count displayed, latency ~100ms

### Test 2: Tier 2 (Capable) - Complex Task
```bash
opencode "Design a distributed cache layer for a microservices architecture handling 1M requests/sec"
```
**Expected**: Routes to tier 2 (phi4:latest)  
**Check**: Token count displayed, latency ~200ms

### Test 3: Ollama Failover
```bash
# Kill Ollama
killall ollama

# Try a request
opencode "Quick function validation"
```
**Expected**: Falls back to tier 3 (gpt-oss:120b-cloud)  
**Check**: Request succeeds via cloud fallback

### Test 4: Token & Cost Tracking
After any test above:
```bash
opencode /tokens
```
**Expected**: Shows token usage per tier, total cost ($0.00)

### Test 5: Tier Status Check
```bash
opencode /tier-status
```
**Expected**: Lists all 4 tiers with model details

## Verification Checklist

- [ ] Test 1: Tier 1 responds correctly
- [ ] Test 2: Tier 2 escalates for complex tasks
- [ ] Test 3: Cloud fallback works when Ollama down
- [ ] Test 4: Token counts displayed accurately
- [ ] Test 5: Tier status command works
- [ ] Cost tracking shows $0.00 for all local tiers
- [ ] No errors in opencode logs

## Logs to Check

```bash
# OpenCode session database
sqlite3 ~/.local/share/opencode/opencode.db \
  "SELECT datetime(time_created/1000,'unixepoch','localtime'), id, title FROM session ORDER BY time_updated DESC LIMIT 5"

# Token usage (if tracked)
grep -i "token\|cost" ~/.local/share/opencode/opencode.db
```

## Next Steps After Verification

1. ✅ Implement ADR1 (implicit skill invocation)
2. ✅ Implement ADR2 (model router) - IN PROGRESS
3. ⏳ Implement ADR3 (knowledge layers) - use opencode-personal-knowledge + database plugin
4. ⏳ Clarify ADR4 (dual modes) - currently tabled

## Notes

- Tier 3 & 4 require OpenRouter API access (free tier)
- If OpenRouter free tier fails, Ollama will be used as fallback
- Tier 4 (qwen3-coder) is rate-limited to 20 req/min on free tier
- All token counts should surface in session metadata

---

**Status**: Ready for testing  
**Last Updated**: 2026-07-20
