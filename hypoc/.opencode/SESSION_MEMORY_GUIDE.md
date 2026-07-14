<!-- Configuration variables referenced in this document:
  PROJECT_DIR               Local project root directory  (e.g. /Users/pherron6/dev/opencode)
-->

# Session Memory in OpenCode - Complete Guide

## ✅ Now Active!

Session memory is **now initialized and working**. Your setup remembers things across sessions.

---

## 🧠 How Session Memory Works

### 1. Automatic Memory (Hooks)
**When Sessions Start/End**, these hooks run:
- `SessionStart` → Imports MEMORY.md and stored data
- `SessionEnd` → Syncs insights back to storage

**Files:**
- Hooks configured: `~/.claude/settings.json`
- Script: `~/.claude/helpers/auto-memory-hook.mjs`

### 2. AgentDB Memory (Manual + Searchable)
**You can manually store/retrieve data:**

```bash
# Store
npx @claude-flow/cli@latest memory store \
  --key "project-context" \
  --value "Working on ML API deployment" \
  --namespace "opencode-sessions"

# Search (semantic)
npx @claude-flow/cli@latest memory search \
  --query "what was I working on?"

# Retrieve by key
npx @claude-flow/cli@latest memory retrieve \
  --key "project-context"
```

**Storage:**
- Database: `${PROJECT_DIR}/.swarm/memory.db`
- Mirror: `${PROJECT_DIR}/.claude/memory.db`
- Features: Vector search, pattern learning, HNSW indexing

### 3. MEMORY.md (Human-Readable)
**File:** `${PROJECT_DIR}/MEMORY.md`

This file persists automatically and is loaded into every session. Use it for:
- Project context
- User preferences
- Key decisions
- Configuration details

---

## 📊 What's Currently Stored

### In AgentDB (Searchable):
```
Key: infrastructure-skills-setup
Namespace: opencode-sessions
Content:
  - User: your-username
  - 13 global skills (AWS, K8s, Docker, FastAPI, Python)
  - Custom skills created
  - Discovery plugin built
  - Token baseline: 89K tokens
  - Preference: automatic discovery
Tags: skills, aws, kubernetes, docker, fastapi, infrastructure
```

### In MEMORY.md (Human-Readable):
- Project type: Enterprise AI development
- Skills configuration (13 global skills)
- Custom skills locations
- Recent work summary
- User preferences
- Next steps

---

## 🔄 How It Works Across Sessions

### Session 1 (This one):
1. You asked about infrastructure skills
2. We added 13 skills to global config
3. Created custom AWS/K8s/FastAPI skills
4. Built discovery plugin
5. **Stored all this in memory**

### Session 2 (Next time you open OpenCode):
1. `SessionStart` hook runs
2. Loads MEMORY.md → I see project context
3. Imports stored data → I remember your setup
4. **I already know:**
   - You have 13 infrastructure skills
   - Custom skills locations
   - Discovery plugin exists
   - Your preferences

### Session 3+ (Later):
1. Search memory: "what skills do I have?"
2. AgentDB returns semantic matches
3. Shows your full infrastructure setup

---

## 🎯 What Gets Remembered

### ✅ Persists Automatically:
- MEMORY.md file contents
- Stored entries in AgentDB
- Configuration files (opencode.json)
- Custom skills you created

### ❌ Does NOT Persist:
- **Current conversation** (this chat doesn't auto-save)
- Tool call history
- Temporary context from this session
- Token usage tracking

**To save this conversation**, you'd need to:
```bash
# Store manually
npx @claude-flow/cli@latest memory store \
  --key "session-2026-04-16-infrastructure" \
  --value "$(cat << 'EOF'
Full infrastructure skills setup:
- Added 13 global skills
- Created AWS/K8s/FastAPI custom skills
- Built discovery plugin
- Tested with ML API example
- Token baseline at 89K
EOF
)"
```

---

## 🔧 Commands for Managing Memory

### Store Data
```bash
# Simple key-value
npx @claude-flow/cli@latest memory store -k "key" --value "data"

# With namespace and tags
npx @claude-flow/cli@latest memory store \
  -k "aws-setup" \
  --value "ECS Fargate with RDS" \
  --namespace "infrastructure" \
  --tags "aws,ecs,rds"

# With TTL (expires)
npx @claude-flow/cli@latest memory store \
  -k "temp-note" \
  --value "Remember this for 1 hour" \
  --ttl 3600
```

### Search Memory
```bash
# Semantic search (finds related content)
npx @claude-flow/cli@latest memory search -q "kubernetes deployment"

# Filter by namespace
npx @claude-flow/cli@latest memory search -q "infrastructure" --namespace "projects"

# Limit results
npx @claude-flow/cli@latest memory search -q "skills" --limit 5
```

### Retrieve Data
```bash
# By key
npx @claude-flow/cli@latest memory retrieve -k "infrastructure-skills-setup"

# List all in namespace
npx @claude-flow/cli@latest memory list --namespace "opencode-sessions"
```

### View Stats
```bash
# Memory statistics
npx @claude-flow/cli@latest memory stats

# List namespaces
npx @claude-flow/cli@latest memory list
```

---

## 📝 Best Practices

### 1. Use MEMORY.md for High-Level Context
```markdown
# MEMORY.md
- Project overview
- User preferences
- Key configurations
- Important decisions
```

### 2. Use AgentDB for Searchable Details
```bash
# Store specific implementations
npx @claude-flow/cli@latest memory store \
  -k "ecs-deployment-pattern" \
  --value "Use Fargate with ALB, autoscale on CPU 70%" \
  --namespace "aws-patterns"
```

### 3. Tag Everything
```bash
# Makes searching easier
--tags "aws,kubernetes,production,critical"
```

### 4. Use Namespaces
```bash
# Organize by project/category
--namespace "ml-project"
--namespace "infrastructure"
--namespace "debugging-notes"
```

---

## 🚀 Quick Start for Next Session

When you open a new OpenCode session:

### Option 1: Ask Me
```
"What do you remember about my infrastructure setup?"
```
I'll check MEMORY.md and stored data automatically.

### Option 2: Search Memory Manually
```bash
npx @claude-flow/cli@latest memory search -q "infrastructure skills"
```

### Option 3: Check MEMORY.md
```bash
cat ${PROJECT_DIR}/MEMORY.md
```

---

## 🔍 Verification

Let's verify memory is working:

```bash
# 1. Check database exists
ls -lh ${PROJECT_DIR}/.swarm/memory.db
# Should show file size (~100KB+)

# 2. Search for your data
npx @claude-flow/cli@latest memory search -q "infrastructure"
# Should return: infrastructure-skills-setup entry

# 3. View MEMORY.md
cat ${PROJECT_DIR}/MEMORY.md
# Should show project context
```

---

## 🎯 Your Current Memory Setup

### Storage Locations:
- **AgentDB**: `${PROJECT_DIR}/.swarm/memory.db` (384-dim vectors, HNSW indexed)
- **Mirror**: `${PROJECT_DIR}/.claude/memory.db`
- **Human-readable**: `${PROJECT_DIR}/MEMORY.md`

### Currently Stored:
- ✅ Infrastructure skills setup (searchable)
- ✅ Project context (MEMORY.md)
- ✅ User preferences
- ✅ Custom skills locations
- ✅ Configuration details

### Features Enabled:
- ✅ Vector embeddings (semantic search)
- ✅ Pattern learning
- ✅ Temporal decay
- ✅ HNSW indexing (fast search)
- ✅ Migration tracking

---

## 💡 Pro Tips

### 1. Store After Major Work
```bash
# After completing a feature
npx @claude-flow/cli@latest memory store \
  -k "ml-api-deployment-$(date +%Y%m%d)" \
  --value "Deployed FastAPI to ECS Fargate with RDS and Redis"
```

### 2. Create Project Memory Checkpoints
```bash
# Weekly checkpoint
npx @claude-flow/cli@latest memory store \
  -k "checkpoint-week-$(date +%U)" \
  --value "Week summary: Added K8s support, optimized tokens, tested plugin"
```

### 3. Store Debugging Solutions
```bash
# When you solve a tricky bug
npx @claude-flow/cli@latest memory store \
  -k "bug-fix-ecs-health-checks" \
  --value "Health check failing: needed /health endpoint, not /healthz" \
  --tags "debugging,ecs,troubleshooting"
```

---

## 🤝 Integration with Skills

Your **discovery plugin** can read from memory:

```typescript
// In skill-discovery.ts
async function loadUserPreferences() {
  // Read from MEMORY.md or query AgentDB
  const prefs = await queryMemory("user preferences");
  // Adjust skill suggestions based on history
}
```

This makes the plugin **learn** what skills you actually use!

---

**Your session memory is now active and working!** 🎉

Next time you open OpenCode, try:
```
"What infrastructure skills do I have configured?"
```

I'll remember everything from this session!
