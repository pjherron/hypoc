<!-- Configuration variables referenced in this document:
  PROJECT_OWNER_HOME        Home directory of the project owner  (e.g. /Users/pherron6)
-->

---
name: session-recruitment
description: Automatically discover and recruit past OpenCode sessions. Use when user asks about previous work, wants to continue past sessions, or needs context from earlier conversations.
origin: Hypoc
---

# Session Recruitment

Automatically discover, list, and load context from past OpenCode sessions.

## When to Use

- User asks "what did we work on before?"
- User mentions wanting to continue previous work
- User asks for a list of past sessions
- Starting work that might relate to previous sessions
- User references a past conversation or decision

## Core Capability

OpenCode stores all session history in a SQLite database at:
```
${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db
```

## Essential Queries

### List Recent Sessions

```bash
sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "SELECT datetime(time_created/1000, 'unixepoch', 'localtime') || '  ' || id || '  ' || title || '  opencode -s ' || id FROM session ORDER BY time_updated DESC LIMIT 30"
```

**Output format:**
```
2026-06-19 11:37  ses_[SESSION_ID]  Session title  opencode -s ses_[SESSION_ID]
```

### Search Sessions by Title

```bash
sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "SELECT datetime(time_created/1000, 'unixepoch', 'localtime') || '  ' || id || '  ' || title || '  opencode -s ' || id FROM session WHERE title LIKE '%keyword%' ORDER BY time_updated DESC"
```

### Get Session Details

```bash
sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "SELECT id, title, datetime(time_created/1000, 'unixepoch', 'localtime') as created, datetime(time_updated/1000, 'unixepoch', 'localtime') as updated, directory, cost, tokens_input, tokens_output FROM session WHERE id = 'ses_XXXXX'"
```

### Sessions by Date Range

```bash
sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "SELECT datetime(time_created/1000, 'unixepoch', 'localtime') || '  ' || id || '  ' || title FROM session WHERE time_created >= strftime('%s', '2026-06-01') * 1000 ORDER BY time_created DESC"
```

### Sessions by Directory/Project

```bash
sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "SELECT datetime(time_created/1000, 'unixepoch', 'localtime') || '  ' || id || '  ' || title FROM session WHERE directory LIKE '%project-name%' ORDER BY time_updated DESC"
```

## Reopening Sessions

To continue any past session:
```bash
opencode -s ses_[SESSION_ID]
```

To fork a session (create independent copy):
```bash
opencode -s ses_[SESSION_ID] --fork
```

## Helper Script

For convenience, create `~/.local/bin/oc-sessions`:

```bash
#!/bin/bash
# OpenCode session manager

DB="${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db"

case "$1" in
  list|ls)
    sqlite3 "$DB" "SELECT datetime(time_created/1000, 'unixepoch', 'localtime') || '  ' || id || '  ' || title FROM session ORDER BY time_updated DESC LIMIT ${2:-20}"
    ;;
  search)
    sqlite3 "$DB" "SELECT datetime(time_created/1000, 'unixepoch', 'localtime') || '  ' || id || '  ' || title FROM session WHERE title LIKE '%$2%' ORDER BY time_updated DESC"
    ;;
  today)
    sqlite3 "$DB" "SELECT datetime(time_created/1000, 'unixepoch', 'localtime') || '  ' || id || '  ' || title FROM session WHERE date(time_created/1000, 'unixepoch', 'localtime') = date('now', 'localtime') ORDER BY time_created DESC"
    ;;
  info)
    sqlite3 "$DB" "SELECT 'ID: ' || id || '\nTitle: ' || title || '\nCreated: ' || datetime(time_created/1000, 'unixepoch', 'localtime') || '\nUpdated: ' || datetime(time_updated/1000, 'unixepoch', 'localtime') || '\nDirectory: ' || directory || '\nCost: $' || printf('%.4f', cost) || '\nTokens In: ' || tokens_input || '\nTokens Out: ' || tokens_output FROM session WHERE id = '$2'"
    ;;
  open)
    opencode -s "$2"
    ;;
  *)
    echo "Usage: oc-sessions {list|search|today|info|open} [args]"
    ;;
esac
```

## Database Schema Reference

**session table key columns:**
- `id` (TEXT) - Session ID (ses_XXXXX format)
- `title` (TEXT) - Session title/description
- `time_created` (INTEGER) - Creation timestamp (milliseconds)
- `time_updated` (INTEGER) - Last update timestamp (milliseconds)
- `directory` (TEXT) - Working directory path
- `project_id` (TEXT) - Associated project
- `parent_id` (TEXT) - Parent session if forked
- `cost` (REAL) - Session cost in dollars
- `tokens_input` (INTEGER) - Total input tokens
- `tokens_output` (INTEGER) - Total output tokens
- `tokens_cache_read` (INTEGER) - Cached tokens read
- `tokens_cache_write` (INTEGER) - Cached tokens written

## Best Practices

1. **Always format output for readability** - Use the formatted queries above, not raw SQL dumps
2. **Include reopen commands** - Show users how to continue sessions immediately
3. **Search by topic, not just title** - Session titles may not capture all content
4. **Check related sessions** - Same directory or project often indicates related work
5. **Consider session cost** - High-cost sessions may contain valuable complex work
6. **Use date filters** - Recent sessions are usually most relevant

## Integration with Other Skills

**Works with:**
- **project-tracking** - Load past todos from previous sessions
- **skill-recruitment** - Find sessions where specific skills were used
- **memory-ops** - Cross-reference session data with MEMORY.md entries

## Common Workflows

### "What did we work on yesterday?"

```bash
sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "SELECT datetime(time_created/1000, 'unixepoch', 'localtime') || '  ' || id || '  ' || title FROM session WHERE date(time_created/1000, 'unixepoch', 'localtime') = date('now', '-1 day', 'localtime') ORDER BY time_created DESC"
```

### "Show me all sessions about authentication"

```bash
sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "SELECT datetime(time_created/1000, 'unixepoch', 'localtime') || '  ' || id || '  ' || title FROM session WHERE title LIKE '%auth%' OR title LIKE '%login%' OR title LIKE '%session%' ORDER BY time_updated DESC"
```

### "Continue the most recent session"

```bash
LAST_SESSION=$(sqlite3 ${PROJECT_OWNER_HOME}/.local/share/opencode/opencode.db "SELECT id FROM session ORDER BY time_updated DESC LIMIT 1")
opencode -s "$LAST_SESSION"
```

## Troubleshooting

**Database not found:**
- Check if OpenCode is installed: `which opencode`
- Verify database path: `opencode db path`

**No sessions listed:**
- Database may be new/empty
- Check for legacy JSON session files (pre-SQLite migration)
- Run: `opencode db migrate` to import old sessions

**Slow queries:**
- Database is SQLite - queries should be instant
- If slow, check disk I/O or run `VACUUM` on database

---

**Remember:** Session recruitment is about continuity. Every conversation builds on past work. Make it trivial to find and resume previous sessions.
