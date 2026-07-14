#!/bin/bash
# OpenCode Desktop - Stop Script

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$PROJECT_ROOT"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🛑 Stopping OpenCode Desktop...${NC}"
echo ""

docker-compose down

echo ""
echo -e "${GREEN}✓ OpenCode Desktop stopped${NC}"
echo ""
echo "To start again: bash scripts/desktop/start.sh"
