<!-- Configuration variables referenced in this document:
  PROJECT_DIR               Local project root directory  (e.g. /Users/pherron6/dev/opencode)
-->

# Project Structure

```
${PROJECT_DIR}/
├── .opencode/
│   ├── opencode.json                    # Project config (frontend/backend skills)
│   ├── QUICK_START.md                   # ⭐ Start here!
│   ├── SETUP_COMPLETE.md                # Complete documentation
│   ├── AGENT_TEAM.md                    # Agent orchestration guide
│   ├── FILE_STRUCTURE.md                # This file
│   └── plugins/
│       ├── skill-discovery.ts           # ⭐ NEW: Context-aware discovery
│       ├── skill-discovery.js           # Compiled plugin (generated)
│       ├── package.json                 # Plugin metadata
│       ├── README.md                    # Plugin documentation
│       └── compile.sh                   # Build script
│
├── skills/                               # Local ECC skills (183 skills)
│   ├── tdd-workflow/
│   ├── security-review/
│   ├── coding-standards/
│   ├── frontend-patterns/
│   ├── backend-patterns/
│   └── ... (178 more)
│
└── [your project files]

~/.config/opencode/
└── opencode.json                        # Global config (core 5 skills)

~/.cache/opencode/node_modules/
├── superpowers/                         # Superpowers package
│   └── skills/                          # (14 skills)
│       ├── brainstorming/
│       ├── systematic-debugging/
│       └── ... (12 more)
│
└── [other packages]

/opt/homebrew/lib/node_modules/
└── ecc-universal/                       # ECC package (installed globally)
    ├── skills/                          # (156 skills)
    │   ├── tdd-workflow/
    │   ├── security-review/
    │   ├── deep-research/
    │   ├── pytorch-patterns/
    │   └── ... (152 more)
    │
    └── .opencode/                       # OpenCode integration
        ├── plugins/                     # ECC hooks plugin
        ├── agents/                      # Pre-built agent configs
        └── commands/                    # Slash commands
```

## Configuration Hierarchy

```
1. Global (~/.config/opencode/opencode.json)
   ├── 5 core skills (always loaded)
   ├── AWS Bedrock provider
   ├── superpowers plugin
   └── ecc-universal plugin

2. Project (${PROJECT_DIR}/.opencode.json)
   ├── Inherits global config
   ├── Adds 3 project skills
   ├── Adds skill-discovery plugin
   └── Sets workingDirectory

3. Session Runtime
   ├── Loads global + project skills (~32K tokens)
   ├── Runs skill-discovery plugin hooks
   ├── Suggests context-aware skills
   └── Tracks loaded skills
```

## Skill Sources

| Source | Count | Location | Usage |
|--------|-------|----------|-------|
| Superpowers | 14 | `~/.cache/opencode/node_modules/superpowers/skills/` | Manual via `skill` tool |
| ECC (local) | 183 | `${PROJECT_DIR}/skills/` | Via instructions or skill tool |
| ECC (npm) | 156 | `/opt/homebrew/lib/node_modules/ecc-universal/skills/` | ⭐ Used by discovery plugin |

## Plugin Flow

```
Session Start
     ↓
OpenCode loads global config
     ↓
Merges with project config
     ↓
Loads all instructions[] files → Context (~32K tokens)
     ↓
Loads plugins:
  - superpowers (14 skills available)
  - ecc-universal (hooks + tools)
  - skill-discovery.js (NEW!)
     ↓
skill-discovery.js runs:
  - session.created hook → Detects project type
  - Scans for package.json, go.mod, etc.
  - Identifies frameworks
  - Logs to console
     ↓
User types message
     ↓
skill-discovery.js runs:
  - message.user hook → Scans for keywords
  - Matches against catalog
  - Filters already-loaded
  - Checks token budget
  - Returns suggestion metadata
     ↓
OpenCode displays suggestion (if any)
     ↓
User: "Load docker-patterns"
     ↓
Skill loads via skill tool
     ↓
skill-discovery.js runs:
  - skill.loaded hook → Marks as loaded
  - Won't suggest again this session
```

## File Size Reference

| File | Size | Purpose |
|------|------|---------|
| skill-discovery.ts | ~10KB | Plugin source code |
| skill-discovery.js | ~8KB | Compiled plugin |
| SETUP_COMPLETE.md | ~12KB | Complete documentation |
| QUICK_START.md | ~5KB | Quick reference |
| AGENT_TEAM.md | ~9KB | Agent orchestration guide |
| plugins/README.md | ~7KB | Plugin architecture docs |

## Important Paths

```bash
# Global config
~/.config/opencode/opencode.json

# Project config
${PROJECT_DIR}/.opencode.json

# Discovery plugin source
${PROJECT_DIR}/.opencode/plugins/skill-discovery.ts

# Discovery plugin compiled
${PROJECT_DIR}/.opencode/plugins/skill-discovery.js

# ECC skills (discovery catalog)
/opt/homebrew/lib/node_modules/ecc-universal/skills/

# Local skills (if needed)
${PROJECT_DIR}/skills/

# Compile script
${PROJECT_DIR}/.opencode/plugins/compile.sh
```

## Quick Commands

```bash
# Compile plugin
cd ${PROJECT_DIR}/.opencode/plugins
./compile.sh

# Test plugin
cd ${PROJECT_DIR}
opencode

# View logs
opencode run --print-logs "test" 2>&1 | grep -i "skill"

# Check global config
cat ~/.config/opencode/opencode.json | jq .

# Check project config
cat ${PROJECT_DIR}/.opencode.json | jq .

# List ECC skills
ls /opt/homebrew/lib/node_modules/ecc-universal/skills/

# List local skills
ls ${PROJECT_DIR}/skills/
```

## Token Budget Breakdown

```
200,000 total tokens
├── 15,000  Global skills (5 always-on)
├── 12,000  Project skills (3 context-specific)
├── 80,000  Conversation history + tool results
├── 50,000  Agent contexts (isolated, parallel)
└── 43,000  Available for on-demand skills

Current baseline: 107K used (54%)
Remaining: 93K tokens (46%)
```

## Maintenance Tasks

### Weekly
- Monitor which skills are actually used
- Adjust discovery catalog based on patterns
- Review token usage trends

### Monthly
- Update ECC package: `npm update -g ecc-universal`
- Review and prune unused skills from instructions
- Add new skills to discovery catalog as needed

### Quarterly
- Evaluate agent effectiveness
- Consider contributing improvements upstream
- Optimize token usage based on analytics

## Related Documentation

- **Getting Started**: `QUICK_START.md` ← Start here
- **Complete Setup**: `SETUP_COMPLETE.md`
- **Agent Teams**: `AGENT_TEAM.md`
- **Plugin Details**: `plugins/README.md`
- **ECC Docs**: https://github.com/affaan-m/everything-claude-code
- **Superpowers**: https://github.com/obra/superpowers
- **OpenCode**: https://opencode.ai
