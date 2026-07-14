<!-- Configuration variables referenced in this document:
  PROJECT_DIR               Local project root directory  (e.g. /Users/pherron6/dev/opencode)
-->

# Testing the Skill Discovery Plugin

## ✅ Compilation Complete

```
TypeScript source: 329 lines
JavaScript output: 289 lines
File size: 12K
Location: .opencode/plugins/skill-discovery.js
```

## 🔧 Configuration Updated

`.opencode.json` now includes:
```json
{
  "plugin": [
    "superpowers@git+https://github.com/obra/superpowers.git",
    "ecc-universal",
    "./.opencode/plugins/skill-discovery.js"  ← NEW!
  ]
}
```

## 🧪 How to Test

### Test 1: Start OpenCode and Check Console
```bash
cd ${PROJECT_DIR}
opencode
```

**Expected console output:**
```
[Skill Discovery] Detected project: web-fullstack
[Skill Discovery] Frameworks: react, next
```

### Test 2: Trigger by Keyword
In the OpenCode session, type:
```
"I need to add Docker support to this project"
```

**Expected response includes:**
```
[SKILL DISCOVERY]
Detected relevant skills for this context:

- docker-patterns (~2800 tokens)

To load a skill:
  Use skill tool: `skill.load("docker-patterns")`
  Or ask me: "Load the docker-patterns skill"

Token impact: ~2,800 tokens total
```

### Test 3: Load a Suggested Skill
```
"Load the docker-patterns skill"
```

**Expected:**
- Skill loads into context
- Plugin logs: `[Skill Discovery] Loaded: docker-patterns`
- Future suggestions will skip docker-patterns (already loaded)

### Test 4: Another Keyword Trigger
```
"Let's add E2E tests with Playwright"
```

**Expected suggestion:**
```
[SKILL DISCOVERY]
Detected relevant skills:

- e2e-testing (~3500 tokens)
```

## 🔍 What's Happening Under the Hood

### When Session Starts:
1. OpenCode loads your config
2. Loads global skills (5 from `~/.config/opencode/opencode.json`)
3. Loads project skills (3 from this `.opencode.json`)
4. Initializes plugins:
   - superpowers
   - ecc-universal
   - **skill-discovery.js** ← Your new plugin!
5. Plugin runs `session.created` hook:
   - Scans for package.json → Found ✓
   - Detects React, Next.js → web-fullstack
   - Prepares suggestions for later

### When You Type a Message:
1. Plugin runs `message.user` hook
2. Scans your text for keywords:
   - "docker" → matches docker-patterns
   - "test", "e2e" → matches e2e-testing
   - "python", "pandas" → matches python-patterns
   - "go", "goroutine" → matches golang-patterns
3. Filters out already-loaded skills
4. Checks token budget
5. Returns suggestion metadata
6. OpenCode shows it to you

### Skill Catalog (10 skills monitored):
- frontend-patterns (react, component, hook)
- backend-patterns (api, database, cache)
- api-design (rest, endpoint, pagination)
- e2e-testing (playwright, e2e)
- python-patterns (python, pandas)
- golang-patterns (go, goroutine)
- pytorch-patterns (pytorch, training)
- docker-patterns (docker, container)
- verification-loop (verify, build, test)
- strategic-compact (context, token)

## 📊 Current Token Budget

```
200K total
├─ 15K  Global skills (coding-standards, security-review, tdd-workflow, eval-harness, deep-research)
├─ 12K  Project skills (frontend-patterns, backend-patterns, api-design)
├─ 80K  Conversation + tool results
└─ 93K  Available (47% remaining)
```

## 🐛 If Something Goes Wrong

### Plugin doesn't load
```bash
# Check syntax
cat .opencode.json | jq .

# Check file exists
ls -lh .opencode/plugins/skill-discovery.js

# View OpenCode logs
opencode run --print-logs "test" 2>&1 | grep -i "skill\|plugin\|error"
```

### No suggestions appearing
- Plugin runs silently by default
- Suggestions appear as system messages (may not show in UI)
- Check console for `[Skill Discovery]` logs
- Try: `export OPENCODE_PLUGIN_DEBUG=1` before starting

### TypeScript errors on recompile
```bash
cd .opencode/plugins
npx tsc skill-discovery.ts --module esnext --target es2020 --moduleResolution node --skipLibCheck --declaration false
```

## ✨ Next Steps After Testing

1. **Use it for a week** - See which skills you actually need
2. **Add more skills** - Edit the catalog in `skill-discovery.ts`
3. **Adjust suggestions** - Tune keywords and file patterns
4. **Monitor tokens** - See if baseline is too high/low
5. **Consider agents** - Add agent configs from `AGENT_TEAM.md`

## 🎯 Success Criteria

✅ Plugin compiles without errors
✅ OpenCode starts without errors
✅ Console shows project detection
✅ Keyword triggers work
✅ Suggestions show token cost
✅ Loading a skill marks it as loaded

**You're ready to test!** 🚀

---

**Quick test command:**
```bash
cd ${PROJECT_DIR} && opencode
```

Then type: **"I need Docker"**
