<!-- Configuration variables referenced in this document:
  PROJECT_DIR               Local project root directory  (e.g. /Users/pherron6/dev/opencode)
-->

# Context-Aware Skill Discovery System

## Overview

Automatic skill discovery and suggestion system for OpenCode that analyzes:
- Project structure (package.json, go.mod, requirements.txt, etc.)
- User prompt keywords
- Session context

**Does NOT auto-inject** - only suggests relevant skills to keep token usage optimal.

## Installation

### 1. Plugin is already created at:
```
${PROJECT_DIR}/.opencode/plugins/skill-discovery.ts
```

### 2. Compile TypeScript to JavaScript:
```bash
cd ${PROJECT_DIR}/.opencode/plugins
npx tsc skill-discovery.ts --module esnext --target es2020 --moduleResolution node
```

### 3. Register plugin in `.opencode.json`:
```json
{
  "plugin": [
    "superpowers@git+https://github.com/obra/superpowers.git",
    "ecc-universal",
    "./.opencode/plugins/skill-discovery.js"
  ]
}
```

## How It Works

### Session Start Detection
When a new session starts, the plugin:
1. Scans project for key files (package.json, go.mod, Dockerfile, etc.)
2. Identifies frameworks and project type
3. Suggests 3 most relevant skills
4. Shows estimated token cost

### Keyword Matching
On each user message, the plugin:
1. Scans prompt for skill-trigger keywords
2. Matches against skill catalog
3. Suggests relevant skills not already loaded
4. Respects token budget (won't suggest if >80% used)

### Example Output

```
[SKILL DISCOVERY]
Detected relevant skills for this context:

- frontend-patterns (~4500 tokens)
- api-design (~3800 tokens)
- e2e-testing (~3500 tokens)

To load a skill:
  Use skill tool: `skill.load("frontend-patterns")`
  Or ask me: "Load the frontend-patterns skill"

Token impact: ~11,800 tokens total
```

## Skill Catalog

Current catalog (10 skills):

| Skill | Triggers | Tokens |
|-------|----------|--------|
| frontend-patterns | react, component, hook, *.tsx | 4500 |
| backend-patterns | api, database, cache, */api/* | 4200 |
| api-design | rest, endpoint, pagination | 3800 |
| e2e-testing | playwright, e2e, user flow | 3500 |
| python-patterns | *.py, pandas, numpy | 3200 |
| golang-patterns | *.go, goroutine, channel | 3400 |
| pytorch-patterns | pytorch, tensor, training | 4000 |
| docker-patterns | Dockerfile, container | 2800 |
| verification-loop | verify, build, test, lint | 2500 |
| strategic-compact | context, token, compact | 2200 |

### Adding More Skills

Edit `${PROJECT_DIR}/.opencode/plugins/skill-discovery.ts`:

```typescript
const SKILL_CATALOG: SkillMetadata[] = [
  // ... existing skills ...
  {
    name: "your-new-skill",
    path: "/path/to/skill/SKILL.md",
    triggers: {
      filePatterns: ["*.ext"],
      keywords: ["keyword1", "keyword2"],
      dependencies: ["framework-name"]
    },
    category: "backend",
    estimatedTokens: 3000
  }
]
```

Then recompile: `npx tsc skill-discovery.ts`

## Token Budget Management

The plugin tracks:
- Base context: ~80K tokens (instructions, system prompt)
- Skill budget: Remaining 120K tokens
- Per-skill cost: Shown in suggestions

**Smart limits:**
- Won't suggest skills if remaining budget < 20K
- Prioritizes by relevance + token efficiency
- Avoids re-suggesting already-loaded skills

## Session Memory

The plugin remembers:
- Skills already loaded in current session
- Project context (cached per workdir)
- Token budget status

## Future Enhancements

Ideas for v2:
- ML-based relevance scoring
- Learn from user accept/reject patterns
- Cross-session skill usage analytics
- Auto-compact suggestions when context full
- Integration with continuous-learning hooks

## Usage

Once installed, the plugin runs automatically:

1. **Start session** → See project-based suggestions
2. **Type prompt** → See keyword-based suggestions
3. **Load skill** → Skill marked as loaded, won't re-suggest
4. **Continue work** → Plugin monitors but stays quiet

**No manual activation needed.**

## Testing

Test the plugin:

```bash
# 1. Start OpenCode in a React project
cd /path/to/react-project
opencode

# Expected: Suggests frontend-patterns, api-design

# 2. Type: "I need to add E2E tests"
# Expected: Suggests e2e-testing

# 3. Type: "Load e2e-testing skill"
# Expected: Skill loads, future suggestions exclude it

# 4. Check console for debug output:
# [Skill Discovery] Detected project: web-fullstack
# [Skill Discovery] Frameworks: react, next
# [Skill Discovery] Loaded: e2e-testing
```

## Troubleshooting

### Plugin not loading
- Check `.opencode.json` syntax (valid JSON)
- Verify file path: `./.opencode/plugins/skill-discovery.js` (not .ts)
- Run: `opencode run --print-logs "test" 2>&1 | grep -i skill`

### No suggestions appearing
- Plugin runs silently by default
- Suggestions show in system messages (not chat)
- Check console.log output for debug info

### TypeScript errors
- Ensure tsc is installed: `npm install -g typescript`
- Use `--skipLibCheck` if module resolution fails
- Or convert to plain JavaScript (remove types)

## Architecture

```
User prompt
     ↓
OpenCode session.created or message.user event
     ↓
skill-discovery.ts plugin hook
     ↓
detectProjectContext() or matchSkillsByKeywords()
     ↓
matchSkillsByProject() / filter already-loaded
     ↓
generateSuggestion() with token cost
     ↓
Return metadata to OpenCode
     ↓
OpenCode displays suggestion to user
```

## Related

- **Strategic instructions** (Option 4): Core skills always loaded
- **Agent-based workflows** (Option 3): Agents with baked-in skills
- **ECC plugin**: Hooks for formatting, security, TypeScript checks
- **Superpowers**: Manual skill tool for on-demand loading
