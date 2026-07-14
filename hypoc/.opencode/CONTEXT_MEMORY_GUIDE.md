<!-- Configuration variables referenced in this document:
  PROJECT_DIR               Local project root directory  (e.g. /Users/pherron6/dev/opencode)
-->

# Context-Driven Memory System

## ✅ What You Have Now

**Dated, context-aware memory** that captures important work automatically!

### Features:
- ✅ **Timeline organization** - All entries have date/time
- ✅ **Auto-detection** - Knows what type of work happened
- ✅ **Context tagging** - deployment, debugging, configuration, etc.
- ✅ **Searchable** - Find past work by keyword or date
- ✅ **Manual capture** - For important decisions/milestones

---

## 📝 How It Works

### Automatic Capture (Coming Soon)
When you make significant changes, memory captures automatically:
- **File edits** → Detects from git changes
- **Git commits** → Extracts commit message
- **Deployments** → When you deploy code
- **Bug fixes** → When debugging completes

### Manual Capture (Now)
For important events you want to remember:

```bash
# Capture custom event
node .opencode/helpers/memory-manager.mjs capture "Your summary here"

# Record milestone
node .opencode/helpers/memory-manager.mjs milestone "Completed v1.0 feature set"

# Record deployment
node .opencode/helpers/memory-manager.mjs deployment "Deployed ML API to ECS Fargate"

# Record bug fix
node .opencode/helpers/memory-manager.mjs debug "Fixed ECS health check timeout"

# Record skill addition
node .opencode/helpers/memory-manager.mjs skill-added "Added OpenWebUI deployment skill"
```

---

## 🔍 Searching Memory

### Search by keyword
```bash
node .opencode/helpers/memory-manager.mjs search "kubernetes"
node .opencode/helpers/memory-manager.mjs search "deployment"
node .opencode/helpers/memory-manager.mjs search "2026-04-16"
```

### Show recent entries
```bash
# Last 5 entries
node .opencode/helpers/memory-manager.mjs recent

# Last 10 entries
node .opencode/helpers/memory-manager.mjs recent 10
```

---

## 📊 MEMORY.md Structure

```markdown
# Project Memory

## Project Context
[Static info about the project]

## User Preferences  
[Your working style and preferences]

## Skills Configuration
[What skills are loaded]

## Key Files
[Important file locations]

## Timeline
[Dated entries - most recent at bottom]

### 2026-04-16 18:30
**Type:** configuration
**Summary:** Added infrastructure skills
**Details:** ...
**Tags:** skills, infrastructure

### 2026-04-16 19:15
**Type:** development
**Summary:** Built discovery plugin
**Details:** ...
**Tags:** plugin, automation

### 2026-04-17 11:30
**Type:** milestone
**Summary:** Completed memory system
**Details:** ...
**Tags:** memory, milestone

## Next Steps
[TODO items]
```

---

## 🎯 Example Workflow

### During Development:
```bash
# You: Working on K8s deployment
# [make changes to files]

# Capture what you did
node .opencode/helpers/memory-manager.mjs capture "Implemented K8s autoscaling with HPA"

# Continue working...

# Deploy to production
node .opencode/helpers/memory-manager.mjs deployment "Deployed app to K8s cluster with 3 replicas"
```

### Next Week:
```bash
# What did I do with K8s?
node .opencode/helpers/memory-manager.mjs search "kubernetes"

# Shows:
# ### 2026-04-17 14:30
# **Type:** development
# **Summary:** Implemented K8s autoscaling with HPA
# 
# ### 2026-04-17 15:45
# **Type:** deployment
# **Summary:** Deployed app to K8s cluster with 3 replicas
```

### Or Just Ask Me:
```
"What K8s work did we do recently?"
```

I'll read MEMORY.md timeline and tell you!

---

## 📅 Entry Types

The system auto-detects these types:

| Type | When | Example |
|------|------|---------|
| **manual** | Explicit capture | Important decisions, notes |
| **milestone** | Major achievement | Feature complete, v1.0 shipped |
| **commit** | Git commit | Auto-extracts from commit message |
| **development** | Files changed | Inferred from git diff |
| **configuration** | Config changes | Skills added, settings updated |
| **deployment** | Code deployed | Pushed to production |
| **debugging** | Bug fixed | Problem solved |

---

## 🔧 Making Shortcuts

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
# Memory shortcuts
alias mem-capture='node .opencode/helpers/memory-manager.mjs capture'
alias mem-milestone='node .opencode/helpers/memory-manager.mjs milestone'
alias mem-deploy='node .opencode/helpers/memory-manager.mjs deployment'
alias mem-debug='node .opencode/helpers/memory-manager.mjs debug'
alias mem-search='node .opencode/helpers/memory-manager.mjs search'
alias mem-recent='node .opencode/helpers/memory-manager.mjs recent'

# Usage:
# mem-capture "Added new feature"
# mem-search "kubernetes"
# mem-recent 10
```

---

## 🎯 Current Timeline (Your Session)

Looking at MEMORY.md timeline, you have:

1. **2026-04-16 18:30** - Added 13 infrastructure skills
2. **2026-04-16 19:15** - Built discovery plugin
3. **2026-04-16 19:45** - Created ML API example
4. **2026-04-17 11:00** - Initialized AgentDB memory
5. **2026-04-17 11:30** - Built context-driven memory manager
6. **2026-04-17 10:44** - Implemented memory system

---

## 💡 Pro Tips

### 1. Capture Decisions
```bash
mem-capture "Decided to keep 13 skills loaded globally - user switches contexts frequently"
```

### 2. Record Problems & Solutions
```bash
mem-debug "ECS tasks failing health checks - needed /health endpoint, not /healthz"
```

### 3. Document Architecture Choices
```bash
mem-milestone "Chose ECS Fargate over EKS - simpler ops, sufficient for current scale"
```

### 4. Track Deployments
```bash
mem-deploy "Deployed v1.2.0 to production - includes autoscaling fixes"
```

### 5. Note Performance Wins
```bash
mem-capture "Optimized K8s HPA settings - reduced scale-up time from 5min to 30sec"
```

---

## 🔄 What Happens Next Session

When you open OpenCode again:

1. **SessionStart hook** loads MEMORY.md
2. **I see the full timeline** with dates
3. **I know what you've been working on**
4. **I can reference past work**

Example conversation:
```
You: "How did we set up the K8s autoscaling?"

Me: "Looking at MEMORY.md timeline from 2026-04-17 14:30, 
     you implemented K8s HPA with CPU target at 70%..."
```

---

## 📂 Files Created

- **MEMORY.md** - Main memory file with timeline
- **.opencode/helpers/memory-manager.mjs** - Capture tool
- **.opencode/helpers/auto-memory.sh** - Auto-capture hook
- **.opencode/CONTEXT_MEMORY_GUIDE.md** - This guide

---

## ✅ What Makes This Great

**Before:**
- No memory between sessions
- Had to explain context every time
- Lost track of past decisions

**After:**
- Dated timeline of all important work
- Searchable by keyword or date
- Context carries across sessions
- You and I both know what happened when

---

## 🎯 Try It Now

```bash
# Capture this moment
cd ${PROJECT_DIR}
node .opencode/helpers/memory-manager.mjs milestone "Implemented context-driven memory system with dated timeline!"

# See your timeline
node .opencode/helpers/memory-manager.mjs recent 10

# Search for something
node .opencode/helpers/memory-manager.mjs search "infrastructure"
```

---

**Your memory system is ready!** 🎉

Every important moment is captured with dates, context, and tags.
