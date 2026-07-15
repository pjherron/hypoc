#!/usr/bin/env bash
# sync-upstream.sh — check upstream sources for updates and surface diffs
# Usage: ./scripts/sync-upstream.sh [--apply]
#
# Without --apply: shows what has changed upstream since last sync (dry run)
# With --apply:    downloads latest and diffs against local; prompts per file

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCES="$REPO_ROOT/sources.json"
APPLY="${1:-}"

RED='\033[0;31m'; YELLOW='\033[1;33m'; GREEN='\033[0;32m'; NC='\033[0m'

if ! command -v jq &>/dev/null; then
  echo "jq required: brew install jq"; exit 1
fi

echo "=== hypoc upstream sync ==="
echo ""

# ── npm packages ──────────────────────────────────────────────────────────────
check_npm() {
  local key="$1"
  local pkg
  pkg=$(jq -r ".upstreams[\"$key\"].npm" "$SOURCES")
  local synced
  synced=$(jq -r ".upstreams[\"$key\"].synced_at" "$SOURCES")
  local latest
  latest=$(npm show "$pkg" version 2>/dev/null || echo "unknown")

  if [ "$latest" = "$synced" ]; then
    echo -e "${GREEN}✓${NC}  $pkg  $synced (up to date)"
  else
    echo -e "${YELLOW}↑${NC}  $pkg  $synced → $latest"
    if [ "$APPLY" = "--apply" ]; then
      echo "   Update $pkg to $latest in hypoc/.opencode/package.json, then run: npm install"
      echo "   Then set synced_at to \"$latest\" in sources.json"
    fi
  fi
}

check_npm "ecc-universal"
check_npm "opencode-plugin"

# ── git repos ─────────────────────────────────────────────────────────────────
check_git() {
  local key="$1"
  local repo
  repo=$(jq -r ".upstreams[\"$key\"].repo" "$SOURCES")
  echo -e "${YELLOW}?${NC}  $key  ($repo)"
  echo "   git: run manually — git ls-remote $repo HEAD"
}

check_git "superpowers"

echo ""
echo "=== local modifications ==="
# Find any skills/agents marked modified:true in sources.json
MODIFIED=$(jq -r '
  (.skills // {}) + (.agents // {}) |
  to_entries[] |
  select(.value.modified == true) |
  .key
' "$SOURCES")

if [ -z "$MODIFIED" ]; then
  echo "  none flagged (all modified:false)"
else
  echo "$MODIFIED" | while read -r key; do
    echo -e "  ${YELLOW}~${NC}  $key  (local modifications — review before syncing upstream)"
  done
fi

echo ""
echo "To flag a file you've modified: set \"modified\": true in sources.json"
echo "To update synced_at after a sync: edit the version in sources.json"
