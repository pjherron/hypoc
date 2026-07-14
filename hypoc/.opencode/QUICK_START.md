<!-- Configuration variables referenced in this document:
  PROJECT_DIR               Local project root directory  (e.g. /Users/pherron6/dev/opencode)
  PROJECT_OWNER_HOME        Home directory of the project owner  (e.g. /Users/pherron6)
-->

# 🎯 Quick Start Guide

## What You Got

Three complementary systems for intelligent skill management:

### 1️⃣ Strategic Instructions (Option 4)
**5 core skills always loaded** (~20K tokens)
```
✓ coding-standards
✓ security-review  
✓ tdd-workflow
✓ eval-harness
✓ deep-research
```
**Where**: `~/.config/opencode/opencode.json`

### 2️⃣ Context-Aware Discovery (Option 2) ⭐ NEW
**Smart suggestions based on project + keywords**
```
Project detected: React + Next.js
  → Suggests: frontend-patterns, api-design

You type: "Add Docker"
  → Suggests: docker-patterns

You type: "E2E tests"
  → Suggests: e2e-testing
```
**Where**: `.opencode/plugins/skill-discovery.ts`

### 3️⃣ Agent Teams (Option 3)
**7 specialized agents with baked-in skills**
```
@research      → deep-research, eval-harness
@ml-engineer   → pytorch-patterns, python-patterns
@fullstack     → frontend-patterns, backend-patterns
@devops        → docker-patterns, verification-loop
@security      → security-review
@qa            → e2e-testing, tdd-workflow
```
**Where**: `.opencode/AGENT_TEAM.md`

---

## 🚀 Installation (2 minutes)

```bash
# 1. Compile the discovery plugin
cd ${PROJECT_DIR}/.opencode/plugins
./compile.sh

# 2. Register plugin (already done in .opencode.json)
# Just verify it's there:
grep "skill-discovery" ../../.opencode.json

# 3. Restart OpenCode
cd ${PROJECT_DIR}
opencode
```

---

## ✅ Verification

### Test 1: Session Start Detection
```bash
cd ${PROJECT_DIR}
opencode

# Expected console output:
[Skill Discovery] Detected project: web-fullstack
[Skill Discovery] Frameworks: react, next
```

### Test 2: Keyword Trigger
In OpenCode session, type:
```
"I need to add Docker support to this project"
```

Expected response includes:
```
[SKILL DISCOVERY]
Detected relevant skills:
- docker-patterns (~2800 tokens)

To load: Ask me "Load docker-patterns"
```

### Test 3: Agent Invocation (if configured)
```
@fullstack "Create a simple hello world component"
```

Expected: Agent launches with frontend/backend patterns already loaded.

---

## 📊 Token Economics

```
┌─────────────────────────────────────────┐
│  200K Token Budget                       │
├─────────────────────────────────────────┤
│  20K  Global skills (always on)          │
│  12K  Project skills (this project)      │
│  80K  Conversation + tool results        │
│  50K  Agent contexts (isolated)          │
│  38K  Available for on-demand skills     │
└─────────────────────────────────────────┘

Current usage: 92K / 200K (46%)
Remaining: 108K tokens
```

---

## 🎮 Usage Cheat Sheet

### Load Suggested Skill
```
Plugin suggests: e2e-testing
You: "Load e2e-testing"
Me: *Loads skill and proceeds*
```

### Invoke Agent
```
You: "@research What's the best embedding model?"
Agent: *Launches with research skills, returns report*
```

### Manual Skill Load (Superpowers)
```
You: "Use the golang-patterns skill"
Me: *Invokes skill tool, loads it*
```

### Check What's Loaded
```
You: "What skills are currently loaded?"
Me: *Lists active skills from instructions + loaded*
```

---

## 🐛 Troubleshooting

### Plugin not loading
```bash
# Check .opencode.json syntax
cat .opencode.json | jq .

# Check if compiled
ls -lh .opencode/plugins/skill-discovery.js

# View logs
opencode run --print-logs "test" 2>&1 | grep -i "skill\|plugin"
```

### No suggestions appearing
- Suggestions show in console.log (check terminal)
- System messages (not always visible in UI)
- Try: `export OPENCODE_PLUGIN_DEBUG=1`

### TypeScript compilation fails
```bash
# Install/update TypeScript
npm install -g typescript@latest

# Use skipLibCheck
tsc skill-discovery.ts --skipLibCheck
```

---

## 📚 Documentation

- **Setup Guide**: `.opencode/SETUP_COMPLETE.md`
- **Agent Teams**: `.opencode/AGENT_TEAM.md`
- **Plugin Docs**: `.opencode/plugins/README.md`
- **ECC Skills**: `/opt/homebrew/lib/node_modules/ecc-universal/skills/`

---

## 🎯 Your Workflow

### Morning Startup
```bash
cd ${PROJECT_OWNER_HOME}/dev/my-project
opencode

# Plugin automatically:
# ✓ Detects project type
# ✓ Suggests relevant skills
# ✓ Shows token cost
```

### During Development
```
You: "Let's add authentication"
Plugin: Suggests security-review (already loaded ✓)
Me: *Uses loaded security patterns*

You: "Need to deploy this to Docker"
Plugin: Suggests docker-patterns (~2800 tokens)
You: "Load it"
Me: *Loads + implements Docker setup*
```

### Complex Features
```
You: "@research Best practices for RAG systems"
Research Agent: *Returns 5-page report*

You: "@ml-engineer Implement the RAG pipeline"
ML Agent: *Builds training pipeline with tests*

You: "@qa Create E2E tests for RAG search"
QA Agent: *Playwright tests for user flows*
```

---

## 🚀 Next Actions

1. ✅ Run `./compile.sh` now
2. ✅ Test with `opencode` in this directory
3. ✅ Try keyword trigger: Type "I need Docker"
4. 📊 Monitor token usage over next week
5. 🔧 Adjust skill catalog based on your patterns
6. 🤝 Consider contributing back to ECC upstream

---

**Ready to go!** 🎉

Questions? Check the full guides:
- `SETUP_COMPLETE.md` — Complete documentation
- `AGENT_TEAM.md` — Agent orchestration patterns
- `plugins/README.md` — Plugin architecture details
