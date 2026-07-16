<!-- Configuration variables referenced in this document:
  PROJECT_OWNER_HOME        Home directory of the project owner  (e.g. /Users/pherron6)
  WORKSPACE_DIR             Local workspace root directory  (e.g. /Users/pherron6/dev/code/opencode)
-->

---
name: skill-recruitment
description: Automatically discover and load relevant skills and past work patterns from session history and skill files. Use when starting similar work or when context from past implementations would be valuable.
origin: Hypoc
---

# Skill Recruitment

Automatically discover and load relevant skills, patterns, and past work from your OpenCode history.

## When to Use

- Starting work similar to past tasks
- User mentions "we did this before"
- Implementing a pattern you've used previously
- User asks "how did we handle X last time?"
- Building on previous implementations
- Seeking examples from past sessions

## Core Concept

OpenCode accumulates valuable context across sessions:
- **Skills** in `hypoc/skills/` (227 skills with patterns and examples)
- **Session history** in SQLite database (past conversations and decisions)
- **Session messages** containing implementation details
- **Git history** with actual code changes

**Skill recruitment connects current work to this accumulated knowledge.**

## Discovery Patterns

### Pattern 1: Find Relevant Skills

```bash
# Search skill names and descriptions
find ${WORKSPACE_DIR}/hypoc/skills -name "SKILL.md" -exec grep -l "authentication\|auth\|login" {} \;

# Search skill content for specific patterns
grep -r "JWT\|token validation\|session management" ${WORKSPACE_DIR}/hypoc/skills --include="SKILL.md"
```

### Pattern 2: Find Past Sessions with Similar Work

```bash
# Search session titles
sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "SELECT datetime(time_created/1000, 'unixepoch', 'localtime') || '  ' || id || '  ' || title FROM session WHERE title LIKE '%auth%' OR title LIKE '%login%' ORDER BY time_updated DESC LIMIT 10"

# Search session messages for implementation details
sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "SELECT s.id, s.title, sm.content FROM session s JOIN session_message sm ON s.id = sm.session_id WHERE sm.content LIKE '%authentication%' AND sm.role = 'user' LIMIT 10"
```

### Pattern 3: Find Code Patterns in Git History

```bash
# Search commit messages
git log --all --grep="authentication" --oneline | head -20

# Search for specific code patterns
git log -S"JWT" --all --source --oneline | head -20

# Find when a specific pattern was added
git log --all -p -S"validateToken" | head -50
```

## Skill Library Navigation

### Quick Skill Reference

**227 skills organized by domain:**

```bash
# List all skills with descriptions
find ${WORKSPACE_DIR}/hypoc/skills -name "SKILL.md" -exec sh -c 'echo "=== $(basename $(dirname {})) ==="; head -5 {} | grep "description:"' \;

# Count skills by category
ls ${WORKSPACE_DIR}/hypoc/skills | wc -l
```

### Key Skill Categories

| Category | Example Skills | Use When |
|----------|----------------|----------|
| **Core Development** | coding-standards, tdd-workflow, security-review | Every project |
| **Frontend** | frontend-patterns, frontend-slides, e2e-testing | UI/UX work |
| **Backend** | backend-patterns, api-design, python-patterns | Server-side |
| **DevOps** | docker-patterns, deployment-patterns, terminal-ops | Infrastructure |
| **Testing** | tdd-workflow, e2e-testing, verification-loop | Quality assurance |
| **Memory & Context** | agentdb-memory-patterns, session-recruitment, project-tracking | Stateful agents |
| **GitHub** | github-code-review, github-project-management, github-workflow-automation | Repository work |
| **Architecture** | sparc-methodology, v3-ddd-architecture, swarm-orchestration | System design |

### Loading a Skill

When you identify a relevant skill, use the Skill tool:

```javascript
// Load a specific skill
skill({name: "backend-patterns"})

// The skill content becomes available immediately
```

## Session Message Mining

Past sessions contain implementation decisions and code examples:

```bash
# Find sessions where you used a specific technology
sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "
SELECT DISTINCT s.id, s.title, 
       datetime(s.time_created/1000, 'unixepoch', 'localtime') as created
FROM session s 
JOIN session_message sm ON s.id = sm.session_id 
WHERE sm.content LIKE '%FastAPI%' 
  AND sm.role IN ('assistant', 'user')
ORDER BY s.time_updated DESC 
LIMIT 15"

# Find code examples from past conversations
sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "
SELECT sm.content 
FROM session_message sm 
JOIN session s ON sm.session_id = s.id 
WHERE sm.content LIKE '%```typescript%' 
  AND s.title LIKE '%authentication%'
LIMIT 5"
```

## Workflow: Starting Similar Work

### Step 1: Identify the Domain

**User says:** "I need to add authentication to the API"

**Think:** Authentication → security, backend, API design

### Step 2: Find Relevant Skills

```bash
find ${WORKSPACE_DIR}/hypoc/skills -name "SKILL.md" | xargs grep -l "authentication\|auth" | head -10
```

**Results:**
- `security-review/SKILL.md` - Authentication & authorization patterns
- `backend-patterns/SKILL.md` - API authentication examples
- `api-design/SKILL.md` - REST authentication conventions

### Step 3: Find Past Sessions

```bash
sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "SELECT id, title FROM session WHERE title LIKE '%auth%' OR title LIKE '%login%' ORDER BY time_updated DESC LIMIT 5"
```

**Results:**
- `ses_ABC123` - "Add JWT authentication to user API"
- `ses_DEF456` - "Fix session token validation bug"

### Step 4: Load Relevant Skills

```javascript
skill({name: "security-review"})
skill({name: "backend-patterns"})
```

### Step 5: Reference Past Work

"I can see from session `ses_ABC123` we implemented JWT authentication with refresh tokens. Let me apply the same pattern here."

## Integration with Other Skills

### Works With:

- **session-recruitment** - Find past sessions about similar topics
- **project-tracking** - Track skill usage in current session todos
- **tdd-workflow** - Find test patterns from past implementations
- **security-review** - Cross-reference security patterns
- **verification-loop** - Apply verification patterns from past work

## Helper: Skill Search Script

Create `~/.local/bin/oc-skill-search`:

```bash
#!/bin/bash
# Search OpenCode skills

SKILL_DIR="${WORKSPACE_DIR}/hypoc/skills"

case "$1" in
  find)
    find "$SKILL_DIR" -name "SKILL.md" | xargs grep -l "$2" | sed "s|$SKILL_DIR/||" | sed 's|/SKILL.md||'
    ;;
  show)
    cat "$SKILL_DIR/$2/SKILL.md"
    ;;
  list)
    ls "$SKILL_DIR" | sort
    ;;
  grep)
    grep -r "$2" "$SKILL_DIR" --include="SKILL.md" | head -20
    ;;
  *)
    echo "Usage: oc-skill-search {find|show|list|grep} [pattern]"
    ;;
esac
```

## Common Queries

### "How did we handle error responses last time?"

```bash
# Find API design patterns
grep -r "error response\|error handling" ${WORKSPACE_DIR}/hypoc/skills/api-design --include="SKILL.md"

# Find past sessions with error handling
sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "SELECT id, title FROM session WHERE title LIKE '%error%' OR title LIKE '%exception%' ORDER BY time_updated DESC LIMIT 10"
```

### "Show me examples of React hooks we've used"

```bash
# Find frontend patterns
grep -r "useEffect\|useState\|useCallback" ${WORKSPACE_DIR}/hypoc/skills/frontend-patterns --include="SKILL.md"

# Find sessions with React work
sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "SELECT id, title FROM session WHERE title LIKE '%React%' OR title LIKE '%component%' OR title LIKE '%hook%' ORDER BY time_updated DESC"
```

### "What testing patterns do we follow?"

```bash
# Load testing skills
cat ${WORKSPACE_DIR}/hypoc/skills/tdd-workflow/SKILL.md | head -100
cat ${WORKSPACE_DIR}/hypoc/skills/e2e-testing/SKILL.md | head -100

# Find test-related sessions
sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "SELECT id, title FROM session WHERE title LIKE '%test%' OR title LIKE '%coverage%' ORDER BY time_updated DESC LIMIT 10"
```

## Best Practices

1. **Search before implementing** - Don't reinvent patterns you've already solved
2. **Load relevant skills proactively** - Don't wait for the user to ask
3. **Reference past sessions** - Show continuity: "We solved this in session X"
4. **Extract reusable patterns** - If you solve something new, consider creating a skill
5. **Keep skill content updated** - As patterns evolve, update skill files
6. **Link related work** - Connect current session to past sessions in MEMORY.md

## Troubleshooting

**Can't find skill I know exists:**
- Skill names use kebab-case: `backend-patterns` not `Backend Patterns`
- Check exact directory name: `ls ${WORKSPACE_DIR}/hypoc/skills`

**Session search returns too many results:**
- Add date filters: `WHERE time_created >= strftime('%s', '2026-06-01') * 1000`
- Search session messages, not just titles
- Use multiple keywords: `WHERE title LIKE '%auth%' AND title LIKE '%API%'`

**Skill content seems outdated:**
- Skills are living documents - update them when patterns change
- Check git history to see when skill was last modified
- If pattern has evolved, update the skill file

---

**Remember:** Every session builds on past work. Skill recruitment makes that accumulated knowledge immediately accessible. You're never starting from zero.
