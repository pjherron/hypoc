#!/bin/bash
# Install hypoc skills into global opencode config
# This makes hypoc skills available from any project directory

set -e

HYPOC_DIR="$(cd "$(dirname "$0")/.." && pwd)"
GLOBAL_CONFIG="$HOME/.config/opencode/opencode.json"

echo "Hypoc directory: $HYPOC_DIR"
echo "Global config: $GLOBAL_CONFIG"

# Ensure global config directory exists
mkdir -p "$(dirname "$GLOBAL_CONFIG")"

# Create or update global config
if [ ! -f "$GLOBAL_CONFIG" ]; then
  echo '{"skills":{"paths":[]}}' > "$GLOBAL_CONFIG"
fi

# Add hypoc skills path if not already present
HYPERSKILLS_PATH="$HYPOC_DIR/skills"

if command -v jq &> /dev/null; then
  # Use jq if available
  if ! jq -e ".skills.paths | index(\"$HYPERSKILLS_PATH\")" "$GLOBAL_CONFIG" > /dev/null 2>&1; then
    jq --arg path "$HYPERSKILLS_PATH" '.skills.paths += [$path] | .skills.paths |= unique' "$GLOBAL_CONFIG" > "$GLOBAL_CONFIG.tmp"
    mv "$GLOBAL_CONFIG.tmp" "$GLOBAL_CONFIG"
    echo "Added $HYPERSKILLS_PATH to global config"
  else
    echo "Skills path already configured"
  fi
else
  # Fallback: use python if jq not available
  python3 -c "
import json
import sys

with open('$GLOBAL_CONFIG', 'r') as f:
    config = json.load(f)

if 'skills' not in config:
    config['skills'] = {'paths': []}
if 'paths' not in config['skills']:
    config['skills']['paths'] = []

if '$HYPERSKILLS_PATH' not in config['skills']['paths']:
    config['skills']['paths'].append('$HYPERSKILLS_PATH')
    with open('$GLOBAL_CONFIG', 'w') as f:
        json.dump(config, f, indent=2)
    print('Added $HYPERSKILLS_PATH to global config')
else:
    print('Skills path already configured')
"
fi

echo ""
echo "Installation complete!"
echo "Restart opencode to use hypoc skills from any directory."
echo ""
echo "Available grill skills:"
ls "$HYPOC_DIR/skills/" | grep grill || echo "  (none found)"
