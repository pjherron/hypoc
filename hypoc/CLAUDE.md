# Hypoc — OpenCode Environment Instructions

**Working directory:** `${REPO_ROOT}/`

Hypoc is the CLI environment for the Enterprise AI Developer Platform. Skills and agents live at `${REPO_ROOT}/skills/` and `${REPO_ROOT}/agents/` — shared across all surfaces (CLI, browser UI, plugin).

## First Session

Describe what you want to do in plain English. The bootstrap skill fires automatically, recruits relevant skills from your history, and asks before running anything. No skill names required.

## Workspace Discipline

- Test skill or config changes in your local workspace first
- Promote proven changes back to the shared `skills/` or `agents/` directories
- Commit knowledge artifacts (specs, ADRs, session summaries) to Git — they are the RAG corpus

## File Operations

- Archive before deleting: `tar -czf archive-YYYYMMDD.tar.gz [target] && ls -lh archive-*.tar.gz`
- Never delete without verifying the archive exists

## Session Management

Find past sessions:
```bash
sqlite3 ~/.local/share/opencode/opencode.db \
  "SELECT datetime(time_created/1000,'unixepoch','localtime'), id, title FROM session ORDER BY time_updated DESC LIMIT 20"
```

Resume a session:
```bash
opencode -s ses_[SESSION_ID]
```

## Task Tracking

Use TodoWrite (or `/to-tickets`) for any work with 3+ steps. Mark tasks completed immediately — don't batch updates.

## Key Scripts

Located in `scripts/`:
- `desktop/start.sh` — start the OpenCode container environment
- `desktop/stop.sh` — stop it
- `desktop/shell.sh` — shell into the running container
- `desktop/status.sh` — check status
- `monitoring/docker-stats.sh` — resource usage
- `security/security-audit.sh` — run security checks

## Configuration

`.opencode.json` loads four skills at startup (bootstrap, skill-invoke, session-recruitment, skill-recruitment) and uses `${REPO_ROOT}` as `workingDirectory` so the superpowers plugin discovers the shared skills/ and agents/ library.
