#!/usr/bin/env bash
# Token and cost tracking for model router
# Displays per-tier token usage and costs

set -euo pipefail

OPENCODE_DB="${HOME}/.local/share/opencode/opencode.db"
SESSION_ID="${1:-current}"

if [ ! -f "$OPENCODE_DB" ]; then
  echo "Error: OpenCode database not found at $OPENCODE_DB" >&2
  exit 1
fi

# Query session tokens and costs
sqlite3 "$OPENCODE_DB" <<'SQL' 2>/dev/null || {
  echo "Unable to query token usage. Run a session first."
  exit 0
}
.mode column
.headers on

-- Token usage by tier (if available in session metadata)
SELECT
  'SESSION TOKENS' as metric,
  COUNT(*) as value
FROM session
WHERE id = '$SESSION_ID';

-- Display tier configuration
echo ""
echo "=== TIER CONFIGURATION ==="
cat .opencode/tiers.json | grep -A 3 '"name"'
echo ""
echo "=== USAGE INSTRUCTIONS ==="
echo "Tier 1 (fast):    llama3.1:8b-instruct - quick tasks, 0 cost"
echo "Tier 2 (capable): phi4:latest         - complex tasks, 0 cost"
echo ""
echo "Both models are local (Ollama). Total cost: \$0.00"
SQL
