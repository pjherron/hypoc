#!/usr/bin/env bash

# ─── Deployment Configuration ─────────────────────────────────────────────────
# Set these environment variables before running, or export them in your shell.
PROJECT_DIR="${PROJECT_DIR:-${HOME}}"  # e.g. /Users/pherron6/dev/opencode
# ─────────────────────────────────────────────────────────────────────────────
#
# Compile and test the skill discovery plugin
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$SCRIPT_DIR"

echo "🔧 Compiling skill-discovery plugin..."
cd "$PLUGIN_DIR"

# Check if TypeScript is installed
if ! command -v tsc &> /dev/null; then
    echo "⚠️  TypeScript not found. Installing..."
    npm install -g typescript
fi

# Compile the plugin
tsc skill-discovery.ts \
    --module esnext \
    --target es2020 \
    --moduleResolution node \
    --skipLibCheck \
    || {
        echo "❌ Compilation failed"
        exit 1
    }

echo "✅ Compiled successfully: skill-discovery.js"

# Verify output exists
if [ ! -f "skill-discovery.js" ]; then
    echo "❌ Output file not found"
    exit 1
fi

echo ""
echo "📊 Plugin stats:"
echo "  TypeScript: $(wc -l < skill-discovery.ts) lines"
echo "  JavaScript: $(wc -l < skill-discovery.js) lines"
echo "  Size: $(du -h skill-discovery.js | cut -f1)"

echo ""
echo "✅ Plugin ready!"
echo ""
echo "Next steps:"
echo "  1. Add to .opencode.json:"
echo "     \"plugin\": [\"./.opencode/plugins/skill-discovery.js\"]"
echo ""
echo "  2. Restart OpenCode:"
echo "     cd ${PROJECT_DIR} && opencode"
echo ""
echo "  3. Test triggers:"
echo "     - Session starts: See project detection in console"
echo "     - Type: 'I need Docker' → Expect docker-patterns suggestion"
echo "     - Type: 'Add E2E tests' → Expect e2e-testing suggestion"
echo ""
echo "  4. Check logs:"
echo "     opencode run --print-logs 'test' 2>&1 | grep 'Skill Discovery'"
