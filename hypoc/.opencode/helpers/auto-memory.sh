#!/bin/bash

# ─── Deployment Configuration ─────────────────────────────────────────────────
# Set these environment variables before running, or export them in your shell.
PROJECT_DIR="${PROJECT_DIR:-${HOME}}"  # e.g. /Users/pherron6/dev/opencode
# ─────────────────────────────────────────────────────────────────────────────
#
# Auto-Memory Hook
# Captures important events automatically to MEMORY.md
#
# Called by PostToolUse hooks when significant changes occur
#

MEMORY_MANAGER="${PROJECT_DIR}/.opencode/helpers/memory-manager.mjs"
PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"

# Only run in opencode project
if [ ! -f "$PROJECT_DIR/MEMORY.md" ]; then
  exit 0
fi

# Detect what changed
TOOL_NAME="${OPENCODE_TOOL_NAME:-unknown}"
FILES_CHANGED=$(git -C "$PROJECT_DIR" diff --name-only 2>/dev/null | wc -l | tr -d ' ')

# Capture based on context
case "$TOOL_NAME" in
  Write|Edit|MultiEdit)
    if [ "$FILES_CHANGED" -gt 0 ]; then
      # Significant file changes - auto-capture
      node "$MEMORY_MANAGER" files-changed 2>&1 > /dev/null
    fi
    ;;
    
  Bash)
    # Check if it was a git commit
    if echo "$OPENCODE_TOOL_ARGS" | grep -q "git commit"; then
      node "$MEMORY_MANAGER" commit 2>&1 > /dev/null
    fi
    ;;
esac

# Always exit success to not block the tool
exit 0
